import { Router, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { uploadGeneralResource, detectFileType } from '../middleware/upload';

const router = Router();

function handleRouteError(res: Response, error: unknown, fallback: string): void {
  console.error('[general-resources]', error);
  const msg = error instanceof Error ? error.message : String(error);
  if (/GeneralResource|general_resource/i.test(msg) && /does not exist|relation|no existe/i.test(msg)) {
    res.status(503).json({
      message: 'Esquema de base de datos pendiente. Reinicia el servicio en Railway (el arranque ejecuta prisma db push).',
    });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    res.status(400).json({ message: msg.length > 200 ? fallback : msg });
    return;
  }
  res.status(500).json({
    message: fallback,
    detail: msg.length > 400 ? `${msg.slice(0, 400)}…` : msg,
  });
}

function deleteFileIfExists(fileUrl: string | null | undefined) {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return;
  const abs = path.join(process.cwd(), fileUrl.replace(/^\//, ''));
  if (fs.existsSync(abs)) {
    try {
      fs.unlinkSync(abs);
    } catch {
      /* ignore */
    }
  }
}

router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';

    const items = await prisma.generalResource.findMany({
      where: isAdmin ? {} : { isPublished: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(items);
  } catch (error) {
    handleRouteError(res, error, 'Error al listar recursos');
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'ADMIN';

    const item = await prisma.generalResource.findFirst({
      where: {
        id,
        ...(isAdmin ? {} : { isPublished: true }),
      },
    });

    if (!item) {
      res.status(404).json({ message: 'Recurso no encontrado' });
      return;
    }

    res.json(item);
  } catch (error) {
    handleRouteError(res, error, 'Error al obtener recurso');
  }
});

router.post(
  '/',
  authenticate,
  requireAdmin,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    uploadGeneralResource.single('file')(req, res, (err: unknown) => {
      if (err) next(err);
      else next();
    });
  },
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, description, kind, externalUrl, order, isPublished } = req.body;

      if (!title?.trim()) {
        res.status(400).json({ message: 'El título es requerido' });
        return;
      }

      const k = (kind || 'FILE').toUpperCase();
      if (k === 'FILE') {
        if (!req.file) {
          res.status(400).json({ message: 'Debes adjuntar un archivo' });
          return;
        }
        const fileUrl = `/uploads/general-resources/${req.file.filename}`;
        const originalName = req.file.originalname;
        const fileKind = detectFileType(originalName);

        const created = await prisma.generalResource.create({
          data: {
            title: title.trim(),
            description: description?.trim() || null,
            kind: 'FILE',
            fileUrl,
            originalName,
            fileKind,
            externalUrl: null,
            order: order !== undefined && order !== '' ? parseInt(String(order), 10) || 0 : 0,
            isPublished: isPublished === 'true' || isPublished === true,
          },
        });
        res.status(201).json(created);
        return;
      }

      if (k === 'EXTERNAL_LINK' || k === 'VIDEO_EMBED') {
        const url = (externalUrl || '').trim();
        if (!url) {
          res.status(400).json({ message: 'La URL es requerida' });
          return;
        }
        const created = await prisma.generalResource.create({
          data: {
            title: title.trim(),
            description: description?.trim() || null,
            kind: k,
            fileUrl: null,
            originalName: null,
            fileKind: null,
            externalUrl: url,
            order: order !== undefined && order !== '' ? parseInt(String(order), 10) || 0 : 0,
            isPublished: isPublished === 'true' || isPublished === true,
          },
        });
        res.status(201).json(created);
        return;
      }

      res.status(400).json({ message: 'Tipo de recurso no válido' });
    } catch (error) {
      handleRouteError(res, error, 'Error al crear recurso');
    }
  }
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  (req: AuthRequest, res: Response, next: NextFunction) => {
    uploadGeneralResource.single('file')(req, res, (err: unknown) => {
      if (err) next(err);
      else next();
    });
  },
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await prisma.generalResource.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: 'Recurso no encontrado' });
        return;
      }

      const { title, description, order, isPublished, externalUrl } = req.body;

      const data: {
        title?: string;
        description?: string | null;
        order?: number;
        isPublished?: boolean;
        fileUrl?: string;
        originalName?: string;
        fileKind?: string;
        externalUrl?: string;
      } = {};

      if (title !== undefined) data.title = String(title).trim();
      if (description !== undefined) data.description = description?.trim() || null;
      if (order !== undefined) data.order = parseInt(String(order), 10) || 0;
      if (isPublished !== undefined) data.isPublished = isPublished === 'true' || isPublished === true;

      if (existing.kind === 'FILE' && req.file) {
        deleteFileIfExists(existing.fileUrl);
        data.fileUrl = `/uploads/general-resources/${req.file.filename}`;
        data.originalName = req.file.originalname;
        data.fileKind = detectFileType(req.file.originalname);
      }

      if ((existing.kind === 'EXTERNAL_LINK' || existing.kind === 'VIDEO_EMBED') && externalUrl !== undefined) {
        const url = String(externalUrl).trim();
        if (!url) {
          res.status(400).json({ message: 'La URL no puede estar vacía' });
          return;
        }
        data.externalUrl = url;
      }

      const updated = await prisma.generalResource.update({
        where: { id },
        data,
      });

      res.json(updated);
    } catch (error) {
      handleRouteError(res, error, 'Error al actualizar recurso');
    }
  }
);

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const existing = await prisma.generalResource.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Recurso no encontrado' });
      return;
    }
    deleteFileIfExists(existing.fileUrl);
    await prisma.generalResource.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    handleRouteError(res, error, 'Error al eliminar recurso');
  }
});

router.use((err: unknown, _req: AuthRequest, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ message: 'El archivo supera el tamaño máximo (100 MB).' });
      return;
    }
    res.status(400).json({ message: err.message });
    return;
  }
  if (err instanceof Error && err.message.includes('Tipo de archivo no permitido')) {
    res.status(400).json({ message: err.message });
    return;
  }
  handleRouteError(res, err, 'Error al procesar la solicitud');
});

export default router;
