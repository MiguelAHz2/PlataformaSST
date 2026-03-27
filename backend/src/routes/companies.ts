import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Listar todas las empresas con conteo de trabajadores
router.get('/', authenticate, requireAdmin, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const companies = await prisma.company.findMany({
      include: {
        _count: { select: { users: true, courses: true, workshops: true, evaluations: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener empresas' });
  }
});

// Obtener empresa por ID con sus trabajadores
router.get('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: {
        users: {
          where: { role: 'STUDENT' },
          select: {
            id: true, name: true, email: true, position: true, phone: true,
            isActive: true, createdAt: true,
            _count: { select: { enrollments: true, submissions: true, certificates: true } },
          },
          orderBy: { name: 'asc' },
        },
        _count: { select: { users: true, courses: true, workshops: true, evaluations: true } },
      },
    });

    if (!company) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }

    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener empresa' });
  }
});

// Crear empresa
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, nit, contact, phone, address } = req.body;

    if (!name) {
      res.status(400).json({ message: 'El nombre de la empresa es requerido' });
      return;
    }

    const existing = await prisma.company.findUnique({ where: { name } });
    if (existing) {
      res.status(400).json({ message: 'Ya existe una empresa con ese nombre' });
      return;
    }

    const company = await prisma.company.create({
      data: { name, nit, contact, phone, address },
      include: { _count: { select: { users: true, courses: true, workshops: true, evaluations: true } } },
    });

    res.status(201).json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear empresa' });
  }
});

// Actualizar empresa
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, nit, contact, phone, address } = req.body;

    const company = await prisma.company.update({
      where: { id: req.params.id },
      data: { name, nit, contact, phone, address },
    });

    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar empresa' });
  }
});

// Eliminar empresa
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.company.delete({ where: { id: req.params.id } });
    res.json({ message: 'Empresa eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar empresa' });
  }
});

// Crear trabajador dentro de una empresa
router.post('/:id/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, position, phone } = req.body;

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

    const company = await prisma.company.findUnique({ where: { id: req.params.id } });
    if (!company) {
      res.status(404).json({ message: 'Empresa no encontrada' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        position,
        phone,
        role: 'STUDENT',
        orgId: req.params.id,
        company: company.name,
      },
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

// Editar trabajador
router.put('/users/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, position, phone, password, isActive } = req.body;

    const updateData: Record<string, unknown> = { name, email, position, phone, isActive };

    if (password) {
      if (password.length < 6) {
        res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        return;
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: req.params.userId },
      data: updateData,
      select: {
        id: true, name: true, email: true, role: true,
        company: true, position: true, phone: true, isActive: true, createdAt: true,
        _count: { select: { enrollments: true, submissions: true, certificates: true } },
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar trabajador' });
  }
});

// Eliminar trabajador
router.delete('/users/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.params.userId } });
    res.json({ message: 'Trabajador eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar trabajador' });
  }
});

// Toggle activo/inactivo de trabajador
router.patch('/users/:userId/toggle-active', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.params.userId },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, isActive: true },
    });

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar estado' });
  }
});

export default router;
