import multer from 'multer';
import path from 'path';
import fs from 'fs';

const ALLOWED_EXTENSIONS = new Set([
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'txt', 'jpg', 'jpeg', 'png', 'gif', 'webp',
  'mp4', 'avi', 'mov', 'webm', 'zip', 'rar',
]);

export function detectFileType(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    pdf: 'PDF',
    doc: 'WORD', docx: 'WORD',
    xls: 'EXCEL', xlsx: 'EXCEL',
    ppt: 'PRESENTATION', pptx: 'PRESENTATION',
    txt: 'TEXT',
    jpg: 'IMAGE', jpeg: 'IMAGE', png: 'IMAGE', gif: 'IMAGE', webp: 'IMAGE',
    mp4: 'VIDEO', avi: 'VIDEO', mov: 'VIDEO', webm: 'VIDEO',
    zip: 'FILE', rar: 'FILE',
  };
  return map[ext] || 'FILE';
}

const createStorage = (folder: string) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => {
      const dir = path.join(process.cwd(), 'uploads', folder);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${unique}${ext}`);
    },
  });

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = (file.originalname.split('.').pop() || '').toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: .${ext}`));
  }
};

export const uploadLesson = multer({
  storage: createStorage('lessons'),
  limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
  fileFilter,
});

export const uploadWorkshop = multer({
  storage: createStorage('workshops'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter,
});
