# 🛡️ SST Plataforma Educativa

Plataforma de capacitación en Seguridad y Salud en el Trabajo (SST) para ingenieros prestadores de servicios.

## Características

- **Roles:** Administrador y Estudiante
- **Cursos:** Creación y gestión de cursos con módulos y lecciones
- **Evaluaciones:** Cuestionarios con corrección automática
- **Calificaciones:** Historial de resultados por estudiante
- **Certificados:** Generación al completar cursos
- **Dashboard:** Panel de control para cada rol

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Estilos | Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Base de Datos | SQLite (via Prisma ORM) |
| Autenticación | JWT + bcrypt |

## Estructura del Proyecto

```
sst-plataforma/
├── backend/          # API REST con Express
│   ├── prisma/       # Esquema y migraciones
│   └── src/          # Código fuente
└── frontend/         # Aplicación React
    └── src/          # Código fuente
```

## Instalación y Ejecución

### Pre-requisitos
- Node.js 18+
- npm 9+

### Backend

```bash
cd backend
npm install
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev
```

El backend corre en `http://localhost:3001`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend corre en `http://localhost:5173`

## Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|-----------|
| Administrador | admin@sst.com | admin123 |
| Estudiante | carlos@empresa.com | student123 |
| Estudiante | maria@empresa.com | student123 |

## Funcionalidades por Rol

### Administrador
- Crear, editar y eliminar cursos
- Gestionar módulos y lecciones de cada curso
- Crear evaluaciones con preguntas de opción múltiple
- Ver todos los usuarios registrados
- Consultar calificaciones y progreso de estudiantes
- Publicar/despublicar cursos y evaluaciones

### Estudiante
- Ver catálogo de cursos disponibles
- Inscribirse en cursos
- Ver contenido de lecciones
- Rendir evaluaciones
- Ver calificaciones y resultados
- Ver tareas y evaluaciones pendientes
