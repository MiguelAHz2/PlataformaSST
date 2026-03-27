import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Listar evaluaciones
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';

    const userOrgId = req.user?.orgId ?? null;

    const evaluations = await prisma.evaluation.findMany({
      where: isAdmin
        ? {}
        : {
            isPublished: true,
            OR: [{ orgId: null }, { orgId: userOrgId }],
          },
      include: {
        course: { select: { id: true, title: true } },
        org: isAdmin ? { select: { id: true, name: true } } : false,
        _count: { select: { questions: true, submissions: true } },
        submissions: isAdmin
          ? false
          : { where: { userId: req.user!.id }, select: { score: true, passed: true, completedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(evaluations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener evaluaciones' });
  }
});

// Crear evaluación (admin)
router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, courseId, timeLimit, passingScore, dueDate } = req.body;

    if (!title || !courseId) {
      res.status(400).json({ message: 'Título y curso son requeridos' });
      return;
    }

    // Heredar empresa del curso automáticamente
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { orgId: true } });

    const evaluation = await prisma.evaluation.create({
      data: {
        title,
        description,
        courseId,
        timeLimit: timeLimit ? parseInt(timeLimit) : null,
        passingScore: passingScore ? parseInt(passingScore) : 70,
        dueDate: dueDate ? new Date(dueDate) : null,
        orgId: course?.orgId ?? null,
      },
      include: { course: { select: { id: true, title: true } }, _count: { select: { questions: true } } },
    });

    res.status(201).json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear evaluación' });
  }
});

// Obtener evaluación por ID
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const isAdmin = req.user?.role === 'ADMIN';

    const evaluation = await prisma.evaluation.findFirst({
      where: { id: req.params.id, ...(isAdmin ? {} : { isPublished: true }) },
      include: {
        course: { select: { id: true, title: true } },
        questions: {
          orderBy: { order: 'asc' },
          include: {
            options: isAdmin
              ? true
              : { select: { id: true, text: true } },
          },
        },
        submissions: isAdmin
          ? { include: { user: { select: { id: true, name: true, email: true } }, answers: true } }
          : { where: { userId: req.user!.id } },
      },
    });

    if (!evaluation) {
      res.status(404).json({ message: 'Evaluación no encontrada' });
      return;
    }

    res.json(evaluation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener evaluación' });
  }
});

// Actualizar evaluación (admin)
router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, timeLimit, passingScore, isPublished, dueDate } = req.body;

    const evaluation = await prisma.evaluation.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        timeLimit: timeLimit !== undefined ? parseInt(timeLimit) : undefined,
        passingScore: passingScore !== undefined ? parseInt(passingScore) : undefined,
        isPublished,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    res.json(evaluation);
  } catch {
    res.status(500).json({ message: 'Error al actualizar evaluación' });
  }
});

// Eliminar evaluación (admin)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.evaluation.delete({ where: { id: req.params.id } });
    res.json({ message: 'Evaluación eliminada' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar evaluación' });
  }
});

// Agregar pregunta a evaluación
router.post('/:id/questions', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, type, points, order, options } = req.body;

    const question = await prisma.question.create({
      data: {
        text,
        type: type || 'MULTIPLE_CHOICE',
        points: points || 1,
        order: order || 0,
        evaluationId: req.params.id,
        options: {
          create: (options || []).map((opt: { text: string; isCorrect: boolean }) => ({
            text: opt.text,
            isCorrect: opt.isCorrect || false,
          })),
        },
      },
      include: { options: true },
    });

    res.status(201).json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear pregunta' });
  }
});

// Actualizar pregunta
router.put('/questions/:questionId', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, type, points, order, options } = req.body;

    await prisma.option.deleteMany({ where: { questionId: req.params.questionId } });

    const question = await prisma.question.update({
      where: { id: req.params.questionId },
      data: {
        text,
        type,
        points,
        order,
        options: {
          create: (options || []).map((opt: { text: string; isCorrect: boolean }) => ({
            text: opt.text,
            isCorrect: opt.isCorrect || false,
          })),
        },
      },
      include: { options: true },
    });

    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar pregunta' });
  }
});

// Eliminar pregunta
router.delete('/questions/:questionId', authenticate, requireAdmin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.question.delete({ where: { id: req.params.questionId } });
    res.json({ message: 'Pregunta eliminada' });
  } catch {
    res.status(500).json({ message: 'Error al eliminar pregunta' });
  }
});

// Enviar respuestas de evaluación (estudiante)
router.post('/:id/submit', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { answers } = req.body as { answers: { questionId: string; optionId: string }[] };
    const evaluationId = req.params.id;

    const existing = await prisma.submission.findUnique({
      where: { userId_evaluationId: { userId: req.user!.id, evaluationId } },
    });

    if (existing?.completedAt) {
      res.status(400).json({ message: 'Ya completaste esta evaluación' });
      return;
    }

    const evaluation = await prisma.evaluation.findUnique({
      where: { id: evaluationId },
      include: { questions: { include: { options: true } } },
    });

    if (!evaluation) {
      res.status(404).json({ message: 'Evaluación no encontrada' });
      return;
    }

    let totalPoints = 0;
    let earnedPoints = 0;

    const answersWithCorrect = answers.map((answer) => {
      const question = evaluation.questions.find((q) => q.id === answer.questionId);
      if (!question) return { ...answer, isCorrect: false };

      totalPoints += question.points;
      const selectedOption = question.options.find((o) => o.id === answer.optionId);
      const isCorrect = selectedOption?.isCorrect || false;

      if (isCorrect) earnedPoints += question.points;

      return { ...answer, isCorrect };
    });

    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
    const passed = score >= evaluation.passingScore;

    let submission;
    if (existing) {
      submission = await prisma.submission.update({
        where: { id: existing.id },
        data: { score, passed, completedAt: new Date() },
      });
    } else {
      submission = await prisma.submission.create({
        data: {
          userId: req.user!.id,
          evaluationId,
          score,
          passed,
          completedAt: new Date(),
          answers: {
            create: answersWithCorrect.map((a) => ({
              questionId: a.questionId,
              optionId: a.optionId,
              isCorrect: a.isCorrect,
            })),
          },
        },
      });
    }

    res.json({ submission, score, passed, earnedPoints, totalPoints });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al enviar respuestas' });
  }
});

// Obtener resultados del estudiante
router.get('/:id/my-result', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submission = await prisma.submission.findUnique({
      where: { userId_evaluationId: { userId: req.user!.id, evaluationId: req.params.id } },
      include: {
        answers: {
          include: {
            question: { include: { options: true } },
            option: true,
          },
        },
      },
    });

    res.json(submission);
  } catch {
    res.status(500).json({ message: 'Error al obtener resultado' });
  }
});

export default router;
