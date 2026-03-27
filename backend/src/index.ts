import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import courseRoutes from './routes/courses';
import evaluationRoutes from './routes/evaluations';
import userRoutes from './routes/users';
import workshopRoutes from './routes/workshops';
import companyRoutes from './routes/companies';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some((o) => origin.startsWith(o))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workshops', workshopRoutes);
app.use('/api/companies', companyRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Plataforma SST API', timestamp: new Date().toISOString() });
});

app.get('/', (_req, res) => {
  res.send(`
    <html>
      <head><title>SST Plataforma - API</title></head>
      <body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center">
        <h1>🛡️ SST Plataforma — API</h1>
        <p>El servidor API está corriendo correctamente.</p>
        <p>Para acceder a la plataforma, abre el <strong>frontend</strong>:</p>
        <a href="http://localhost:5173" style="display:inline-block;margin-top:16px;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:bold">
          Abrir Plataforma → localhost:5173
        </a>
        <p style="margin-top:32px;color:#94a3b8;font-size:13px">API disponible en /api/*</p>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`\n🛡️  Plataforma SST - Servidor iniciado`);
  console.log(`🚀 Corriendo en http://localhost:${PORT}`);
  console.log(`📊 Panel admin: http://localhost:5173\n`);
});
