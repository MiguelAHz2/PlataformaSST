import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Estadísticas generales (admin)
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [totalUsers, totalCourses, totalEvaluations, totalSubmissions, totalWorkshops, totalWorkshopSubmissions] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.course.count(),
      prisma.evaluation.count(),
      prisma.submission.count({ where: { completedAt: { not: null } } }),
      prisma.workshop.count(),
      prisma.workshopSubmission.count(),
    ]);

    const recentUsers = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, company: true, createdAt: true },
    });

    const recentSubmissions = await prisma.submission.findMany({
      where: { completedAt: { not: null } },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true } },
        evaluation: { select: { title: true } },
      },
    });

    res.json({ totalUsers, totalCourses, totalEvaluations, totalSubmissions, totalWorkshops, totalWorkshopSubmissions, recentUsers, recentSubmissions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
});

// Listar todos los usuarios (admin)
router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        position: true,
        phone: true,
        isActive: true,
        createdAt: true,
        _count: { select: { enrollments: true, submissions: true, certificates: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch {
    res.status(500).json({ message: 'Error al obtener usuarios' });
  }
});

// Obtener usuario específico (admin)
router.get('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        company: true,
        position: true,
        phone: true,
        isActive: true,
        createdAt: true,
        enrollments: {
          include: { course: { select: { id: true, title: true } } },
        },
        submissions: {
          include: {
            evaluation: { select: { id: true, title: true } },
          },
          orderBy: { completedAt: 'desc' },
        },
        certificates: true,
        _count: { select: { enrollments: true, submissions: true, certificates: true } },
      },
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

// Crear trabajador (solo admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, company, position, phone } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Nombre, email y contraseña son requeridos' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(400).json({ message: 'Este correo ya está registrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, company, position, phone, role: 'STUDENT' },
      select: {
        id: true, name: true, email: true, role: true,
        company: true, position: true, phone: true, isActive: true, createdAt: true,
        _count: { select: { enrollments: true, submissions: true, certificates: true } },
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear trabajador' });
  }
});

// Activar/desactivar usuario (admin)
router.patch('/:id/toggle-active', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});

// Calificaciones del estudiante actual
router.get('/my/grades', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submissions = await prisma.submission.findMany({
      where: { userId: req.user!.id, completedAt: { not: null } },
      include: {
        evaluation: {
          include: { course: { select: { id: true, title: true } } },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user!.id },
      include: { course: { select: { id: true, title: true, category: true } } },
    });

    res.json({ submissions, enrollments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener calificaciones' });
  }
});

export default router;
