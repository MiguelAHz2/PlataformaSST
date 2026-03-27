import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
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

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'Este email ya está registrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, company, position, phone },
      select: { id: true, name: true, email: true, role: true, company: true, position: true },
    });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al registrar usuario' });
  }
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email y contraseña son requeridos' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(401).json({ message: 'Credenciales inválidas' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    const { password: _pwd, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al iniciar sesión' });
  }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        company: true,
        position: true,
        phone: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            enrollments: true,
            submissions: true,
            certificates: true,
          },
        },
      },
    });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Error al obtener usuario' });
  }
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, company, position, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, company, position, phone },
      select: { id: true, name: true, email: true, role: true, company: true, position: true, phone: true },
    });

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Error al actualizar perfil' });
  }
});

export default router;
