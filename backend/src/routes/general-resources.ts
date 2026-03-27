import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { uploadGeneralResource, detectFileType } from '../middleware/upload';

const router = Router();

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
    const userOrgId = req.user?.orgId ?? null;

    const items = await prisma.generalResource.findMany({
      where: isAdmin
        ? {}
        : {
            isPublished: true,
            OR: [{ orgId: null }, { orgId: userOrgId }],
          },
      include: {
        org: isAdmin ? { select: { id: true, name: true } } : false,
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al listar recursos' });
  }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const isAdmin = req.user?.role === 'ADMIN';
    const userOrgId = req.user?.orgId ?? null;

    const item = await prisma.generalResource.findFirst({
      where: {
        id,
        ...(isAdmin
          ? {}
          : {
              isPublished: true,
              OR: [{ orgId: null }, { orgId: userOrgId }],
            }),
      },
      include: { org: isAdmin ? { select: { id: true, name: true } } : false },
    });

    if (!item) {
      res.status(404).json({ message: 'Recurso no encontrado' });
      return;
    }

    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener recurso' });
  }
});

router.post(
  '/',
  authenticate,
  requireAdmin,
  uploadGeneralResource.single('file'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { title, description, kind, orgId, externalUrl, order, isPublished } = req.body;

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
            order: order ? parseInt(String(order), 10) || 0 : 0,
            isPublished: isPublished === 'true' || isPublished === true,
            orgId: orgId && String(orgId).trim() ? String(orgId) : null,
          },
          include: { org: { select: { id: true, name: true } } },
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
            order: order ? parseInt(String(order), 10) || 0 : 0,
            isPublished: isPublished === 'true' || isPublished === true,
            orgId: orgId && String(orgId).trim() ? String(orgId) : null,
          },
          include: { org: { select: { id: true, name: true } } },
        });
        res.status(201).json(created);
        return;
      }

      res.status(400).json({ message: 'Tipo de recurso no válido' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al crear recurso' });
    }
  }
);

router.put(
  '/:id',
  authenticate,
  requireAdmin,
  uploadGeneralResource.single('file'),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await prisma.generalResource.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ message: 'Recurso no encontrado' });
        return;
      }

      const { title, description, orgId, order, isPublished, externalUrl } = req.body;

      const data: {
        title?: string;
        description?: string | null;
        order?: number;
        isPublished?: boolean;
        orgId?: string | null;
        fileUrl?: string;
        originalName?: string;
        fileKind?: string;
        externalUrl?: string;
      } = {};

      if (title !== undefined) data.title = String(title).trim();
      if (description !== undefined) data.description = description?.trim() || null;
      if (order !== undefined) data.order = parseInt(String(order), 10) || 0;
      if (isPublished !== undefined) data.isPublished = isPublished === 'true' || isPublished === true;
      if (orgId !== undefined) data.orgId = orgId && String(orgId).trim() ? String(orgId) : null;

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
        include: { org: { select: { id: true, name: true } } },
      });

      res.json(updated);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al actualizar recurso' });
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
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar recurso' });
  }
});

export default router;
