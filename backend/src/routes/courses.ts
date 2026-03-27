import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import mammoth from 'mammoth';
import * as XLSX from 'xlsx';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { uploadLesson, detectFileType } from '../middleware/upload';

const router = Router();

// Listar todos los cursos
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';

    const userOrgId = req.user?.orgId ?? null;

    const courses = await prisma.course.findMany({
      where: isAdmin
        ? {}
        : {
            isPublished: true,
            OR: [{ orgId: null }, { orgId: userOrgId }],
          },
      include: {
        _count: { select: { modules: true, enrollments: true, evaluations: true } },
        org: isAdmin ? { select: { id: true, name: true } } : false,
        enrollments: isAdmin
          ? false
          : { where: { userId: req.user!.id }, select: { id: true, courseId: true, progress: true, enrolledAt: true, completedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener cursos' });
  }
});

// Crear curso (admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, image, category, duration, level, orgId } = req.body;

    if (!title || !description) {
      res.status(400).json({ message: 'Título y descripción son requeridos' });
      return;
    }

    const course = await prisma.course.create({
      data: {
        title, description, image,
        category: category || 'General',
        duration,
        level: level || 'BEGINNER',
        orgId: orgId || null,
      },
    });

    res.status(201).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear curso' });
  }
});

// Obtener curso por ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'ADMIN';

    const course = await prisma.course.findFirst({
      where: { id, ...(isAdmin ? {} : { isPublished: true }) },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                completions: isAdmin
                  ? false
                  : { where: { userId: req.user!.id } },
              },
            },
          },
        },
        evaluations: {
          where: isAdmin ? {} : { isPublished: true },
          include: {
            _count: { select: { questions: true, submissions: true } },
            submissions: isAdmin
              ? false
              : { where: { userId: req.user!.id }, select: { score: true, passed: true, completedAt: true } },
          },
        },
        enrollments: isAdmin
          ? { include: { user: { select: { id: true, name: true, email: true } } } }
          : { where: { userId: req.user!.id } },
        _count: { select: { enrollments: true } },
      },
    });

    if (!course) {
      res.status(404).json({ message: 'Curso no encontrado' });
      return;
    }

    res.json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener curso' });
  }
});

// Actualizar curso (admin)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, image, category, duration, level, isPublished, orgId } = req.body;

    const course = await prisma.course.update({
      where: { id },
      data: { title, description, image, category, duration, level, isPublished, orgId: orgId ?? undefined },
    });

    res.json(course);
  } catch {
    res.status(500).json({ message: 'Error al actualizar curso' });
  }
});

// Eliminar curso (admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ message: 'Curso eliminado' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar curso' });
  }
});

// Inscribirse en un curso
router.post('/:id/enroll', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findFirst({ where: { id, isPublished: true } });
    if (!course) {
      res.status(404).json({ message: 'Curso no encontrado' });
      return;
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: req.user!.id, courseId: id } },
    });

    if (existingEnrollment) {
      res.status(400).json({ message: 'Ya estás inscrito en este curso' });
      return;
    }

    const enrollment = await prisma.enrollment.create({
      data: { userId: req.user!.id, courseId: id },
    });

    res.status(201).json(enrollment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al inscribirse en el curso' });
  }
});

// Agregar módulo a curso (admin)
router.post('/:id/modules', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, order } = req.body;

    const module = await prisma.module.create({
      data: { title, order: order || 0, courseId: id },
      include: { lessons: true },
    });

    res.status(201).json(module);
  } catch {
    res.status(500).json({ message: 'Error al crear módulo' });
  }
});

// Actualizar módulo
router.put('/modules/:moduleId', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const module = await prisma.module.update({
      where: { id: req.params.moduleId },
      data: { title: req.body.title, order: req.body.order },
    });
    res.json(module);
  } catch {
    res.status(500).json({ message: 'Error al actualizar módulo' });
  }
});

// Eliminar módulo
router.delete('/modules/:moduleId', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.module.delete({ where: { id: req.params.moduleId } });
    res.json({ message: 'Módulo eliminado' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar módulo' });
  }
});

// Agregar lección a módulo (con archivo opcional)
router.post(
  '/modules/:moduleId/lessons',
  authenticate,
  requireAdmin,
  uploadLesson.single('file'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, content, videoUrl, duration, order } = req.body;

      let fileUrl: string | undefined;
      let originalName: string | undefined;
      let type = req.body.type || 'TEXT';

      if (req.file) {
        fileUrl = `/uploads/lessons/${req.file.filename}`;
        originalName = req.file.originalname;
        type = detectFileType(req.file.originalname);
      }

      const lesson = await prisma.lesson.create({
        data: {
          title,
          content: content || null,
          type,
          fileUrl: fileUrl || null,
          originalName: originalName || null,
          videoUrl: videoUrl || null,
          duration: duration ? parseInt(duration) : null,
          order: order ? parseInt(order) : 0,
          moduleId: req.params.moduleId,
        },
      });

      res.status(201).json(lesson);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al crear lección' });
    }
  }
);

// Actualizar lección (con archivo opcional)
router.put(
  '/lessons/:lessonId',
  authenticate,
  requireAdmin,
  uploadLesson.single('file'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, content, videoUrl, duration, order } = req.body;

      let updateData: Record<string, unknown> = { title, content, videoUrl, order };
      if (duration) updateData.duration = parseInt(duration as string);

      if (req.file) {
        updateData.fileUrl = `/uploads/lessons/${req.file.filename}`;
        updateData.originalName = req.file.originalname;
        updateData.type = detectFileType(req.file.originalname);
      }

      const lesson = await prisma.lesson.update({
        where: { id: req.params.lessonId },
        data: updateData,
      });
      res.json(lesson);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar lección' });
    }
  }
);

// Eliminar lección
router.delete('/lessons/:lessonId', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.lessonId } });
    res.json({ message: 'Lección eliminada' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar lección' });
  }
});

// Marcar lección como completada
router.post('/lessons/:lessonId/complete', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const completion = await prisma.lessonCompletion.upsert({
      where: { userId_lessonId: { userId: req.user!.id, lessonId: req.params.lessonId } },
      update: {},
      create: { userId: req.user!.id, lessonId: req.params.lessonId },
    });

    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.lessonId },
      include: { module: { include: { course: { include: { modules: { include: { lessons: true } } } } } } },
    });

    if (lesson) {
      const course = lesson.module.course;
      const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
      const completedLessons = await prisma.lessonCompletion.count({
        where: {
          userId: req.user!.id,
          lesson: { module: { courseId: course.id } },
        },
      });

      const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

      await prisma.enrollment.updateMany({
        where: { userId: req.user!.id, courseId: course.id },
        data: { progress, completedAt: progress === 100 ? new Date() : null },
      });
    }

    res.json(completion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al marcar lección' });
  }
});

// Previsualizar archivo de lección (Word, Excel)
router.get('/lessons/:lessonId/preview', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });

    if (!lesson?.fileUrl) {
      res.status(404).json({ message: 'Archivo no encontrado' });
      return;
    }

    const filePath = path.join(process.cwd(), lesson.fileUrl.replace(/^\//, ''));

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'El archivo no existe en el servidor' });
      return;
    }

    if (lesson.type === 'WORD') {
      const result = await mammoth.convertToHtml({ path: filePath });
      res.json({ html: result.value, type: 'WORD' });
      return;
    }

    if (lesson.type === 'EXCEL') {
      const workbook = XLSX.readFile(filePath);
      const sheets: Record<string, string> = {};
      workbook.SheetNames.forEach((name) => {
        sheets[name] = XLSX.utils.sheet_to_html(workbook.Sheets[name], { editable: false });
      });
      res.json({ sheets, sheetNames: workbook.SheetNames, type: 'EXCEL' });
      return;
    }

    res.status(400).json({ message: 'Tipo de archivo no soportado para previsualización' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al generar previsualización' });
  }
});

export default router;
