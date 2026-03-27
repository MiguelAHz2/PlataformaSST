import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { uploadWorkshop, detectFileType } from '../middleware/upload';

const router = Router();

// Listar talleres
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';

    const userOrgId = req.user?.orgId ?? null;

    const workshops = await prisma.workshop.findMany({
      where: isAdmin
        ? {}
        : {
            isPublished: true,
            OR: [{ orgId: null }, { orgId: userOrgId }],
          },
      include: {
        course: { select: { id: true, title: true } },
        org: isAdmin ? { select: { id: true, name: true } } : false,
        _count: { select: { submissions: true } },
        submissions: isAdmin
          ? false
          : { where: { userId: req.user!.id } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(workshops);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener talleres' });
  }
});

// Crear taller (admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, courseId, dueDate } = req.body;

    if (!title || !courseId || !description) {
      res.status(400).json({ message: 'Título, descripción y curso son requeridos' });
      return;
    }

    // Heredar empresa del curso automáticamente
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { orgId: true } });

    const workshop = await prisma.workshop.create({
      data: {
        title,
        description,
        courseId,
        dueDate: dueDate ? new Date(dueDate) : null,
        orgId: course?.orgId ?? null,
      },
      include: { course: { select: { id: true, title: true } } },
    });

    res.status(201).json(workshop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear taller' });
  }
});

// Obtener taller por ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';

    const workshop = await prisma.workshop.findFirst({
      where: { id: req.params.id, ...(isAdmin ? {} : { isPublished: true }) },
      include: {
        course: { select: { id: true, title: true } },
        submissions: isAdmin
          ? {
              include: {
                user: { select: { id: true, name: true, email: true, company: true } },
              },
              orderBy: { submittedAt: 'desc' },
            }
          : { where: { userId: req.user!.id } },
      },
    });

    if (!workshop) {
      res.status(404).json({ message: 'Taller no encontrado' });
      return;
    }

    res.json(workshop);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener taller' });
  }
});

// Actualizar taller (admin)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, dueDate, isPublished } = req.body;

    const workshop = await prisma.workshop.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        isPublished,
      },
    });

    res.json(workshop);
  } catch {
    res.status(500).json({ message: 'Error al actualizar taller' });
  }
});

// Eliminar taller (admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.workshop.delete({ where: { id: req.params.id } });
    res.json({ message: 'Taller eliminado' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar taller' });
  }
});

// Enviar o actualizar entregable (estudiante - máx. 3 intentos antes de fecha límite)
router.post(
  '/:id/submit',
  authenticate,
  uploadWorkshop.single('file'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { comment } = req.body;

      if (!req.file) {
        res.status(400).json({ message: 'Debes adjuntar un archivo' });
        return;
      }

      const workshop = await prisma.workshop.findFirst({
        where: { id: req.params.id, isPublished: true },
      });

      if (!workshop) {
        res.status(404).json({ message: 'Taller no encontrado' });
        return;
      }

      // Verificar fecha límite
      if (workshop.dueDate && new Date() > workshop.dueDate) {
        res.status(400).json({ message: 'La fecha límite de entrega ya venció' });
        return;
      }

      const existing = await prisma.workshopSubmission.findUnique({
        where: { userId_workshopId: { userId: req.user!.id, workshopId: req.params.id } },
      });

      const MAX_ATTEMPTS = 3;

      if (existing) {
        if (existing.attemptCount >= MAX_ATTEMPTS) {
          res.status(400).json({
            message: `Ya usaste los ${MAX_ATTEMPTS} intentos disponibles para este taller`,
          });
          return;
        }

        // Actualizar entrega existente
        const fileUrl = `/uploads/workshops/${req.file.filename}`;
        const fileType = detectFileType(req.file.originalname);

        const updated = await prisma.workshopSubmission.update({
          where: { id: existing.id },
          data: {
            fileUrl,
            fileName: req.file.originalname,
            fileType,
            comment: comment || existing.comment,
            attemptCount: existing.attemptCount + 1,
            submittedAt: new Date(),
            grade: null,
            feedback: null,
            gradedAt: null,
          },
        });

        res.json({ ...updated, isUpdate: true });
        return;
      }

      // Primera entrega
      const fileUrl = `/uploads/workshops/${req.file.filename}`;
      const fileType = detectFileType(req.file.originalname);

      const submission = await prisma.workshopSubmission.create({
        data: {
          userId: req.user!.id,
          workshopId: req.params.id,
          fileUrl,
          fileName: req.file.originalname,
          fileType,
          comment: comment || null,
          attemptCount: 1,
        },
      });

      res.status(201).json({ ...submission, isUpdate: false });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al enviar entregable' });
    }
  }
);

// Calificar entregable (admin)
router.patch('/submissions/:submissionId/grade', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { grade, feedback } = req.body;

    const submission = await prisma.workshopSubmission.update({
      where: { id: req.params.submissionId },
      data: {
        grade: grade !== undefined ? parseFloat(grade) : null,
        feedback: feedback || null,
        gradedAt: new Date(),
      },
      include: {
        user: { select: { name: true, email: true } },
        workshop: { select: { title: true } },
      },
    });

    res.json(submission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al calificar entregable' });
  }
});

export default router;
