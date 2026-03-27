import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Evaluation, Question } from '../../lib/types';
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertCircle, Send } from 'lucide-react';

export default function EvaluationTaker() {
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; passed: boolean; earnedPoints: number; totalPoints: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/evaluations/${id}`)
      .then((res) => {
        setEvaluation(res.data);
        const sub = res.data.submissions?.[0];
        if (sub?.completedAt) {
          setResult({ score: sub.score, passed: sub.passed, earnedPoints: 0, totalPoints: 0 });
        }
        if (res.data.timeLimit) {
          setTimeLeft(res.data.timeLimit * 60);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (!evaluation) return;
    setSubmitting(true);

    const answersArray = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
    }));

    try {
      const res = await api.post(`/evaluations/${evaluation.id}/submit`, { answers: answersArray });
      setResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }, [evaluation, answers]);

  // Timer
  useEffect(() => {
    if (!started || timeLeft === null || result) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setTimeout(() => setTimeLeft((t) => (t !== null ? t - 1 : null)), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, started, result, handleSubmit]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-500">Evaluación no encontrada</p>
        <Link to="/student/evaluations" className="btn-primary mt-4 inline-block">Volver</Link>
      </div>
    );
  }

  // Pantalla de resultado
  if (result) {
    const alreadyDone = evaluation.submissions?.[0]?.completedAt && !submitting;
    const submission = evaluation.submissions?.[0];

    return (
      <div className="max-w-lg mx-auto">
        <div className="card text-center">
          <div
            className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
              result.passed ? 'bg-green-100' : 'bg-red-100'
            }`}
          >
            {result.passed ? (
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            ) : (
              <XCircle className="w-10 h-10 text-red-600" />
            )}
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">
            {result.passed ? '¡Aprobado!' : 'No aprobado'}
          </h2>
          <p className="text-slate-500 mb-6">{evaluation.title}</p>

          <div
            className={`text-5xl font-bold mb-2 ${result.passed ? 'text-green-600' : 'text-red-600'}`}
          >
            {result.score?.toFixed(0)}%
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Puntaje mínimo requerido: {evaluation.passingScore}%
          </p>

          {!alreadyDone && result.totalPoints > 0 && (
            <p className="text-slate-500 text-sm mb-6">
              {result.earnedPoints} de {result.totalPoints} puntos correctos
            </p>
          )}

          {alreadyDone && submission?.completedAt && (
            <p className="text-slate-400 text-sm mb-6">
              Completada el {new Date(submission.completedAt).toLocaleDateString('es-CO')}
            </p>
          )}

          <div
            className={`p-4 rounded-xl mb-6 ${
              result.passed
                ? 'bg-green-50 border border-green-100'
                : 'bg-amber-50 border border-amber-100'
            }`}
          >
            <p
              className={`text-sm font-medium ${result.passed ? 'text-green-700' : 'text-amber-700'}`}
            >
              {result.passed
                ? '✅ Felicitaciones, has completado exitosamente esta evaluación SST.'
                : '📚 Te recomendamos repasar el material del curso antes de intentarlo nuevamente.'}
            </p>
          </div>

          <div className="flex gap-3">
            <Link to="/student/evaluations" className="btn-secondary flex-1">
              Volver
            </Link>
            <Link to={`/student/courses/${evaluation.courseId}`} className="btn-primary flex-1">
              Ver curso
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Pantalla de inicio
  if (!started) {
    return (
      <div className="max-w-lg mx-auto">
        <Link to="/student/evaluations" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Volver a evaluaciones
        </Link>

        <div className="card text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-violet-600" />
          </div>

          <h1 className="text-xl font-bold text-slate-800 mb-1">{evaluation.title}</h1>
          <p className="text-slate-500 text-sm mb-6">{evaluation.course?.title}</p>

          {evaluation.description && (
            <p className="text-slate-600 text-sm mb-6 p-4 bg-slate-50 rounded-xl text-left">
              {evaluation.description}
            </p>
          )}

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-lg font-bold text-slate-800">{evaluation.questions?.length ?? 0}</p>
              <p className="text-xs text-slate-400">Preguntas</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-lg font-bold text-slate-800">
                {evaluation.timeLimit ? `${evaluation.timeLimit} min` : '∞'}
              </p>
              <p className="text-xs text-slate-400">Tiempo</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-lg font-bold text-violet-600">{evaluation.passingScore}%</p>
              <p className="text-xs text-slate-400">Para aprobar</p>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl mb-6 text-sm text-amber-700 text-left">
            ⚠️ Una vez iniciada la evaluación{evaluation.timeLimit ? `, tendrás ${evaluation.timeLimit} minutos para completarla.` : ', debes completarla para ver tus resultados.'}
            {' '}Solo puedes realizarla una vez.
          </div>

          <button
            onClick={() => setStarted(true)}
            className="btn-primary w-full py-3"
          >
            Iniciar evaluación
          </button>
        </div>
      </div>
    );
  }

  // Evaluación en curso
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = evaluation.questions?.length ?? 0;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header sticky */}
      <div className="sticky top-0 z-10 bg-slate-50 pb-4 pt-1">
        <div className="card py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">{evaluation.title}</p>
            <p className="text-xs text-slate-400">{answeredCount}/{totalQuestions} respondidas</p>
          </div>
          <div className="flex items-center gap-4">
            {timeLeft !== null && (
              <div
                className={`flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1.5 rounded-lg ${
                  timeLeft < 300
                    ? 'bg-red-100 text-red-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {formatTime(timeLeft)}
              </div>
            )}
            {/* Progress bar */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${(answeredCount / totalQuestions) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preguntas */}
      <div className="space-y-4 mb-6">
        {evaluation.questions?.map((q: Question, index: number) => (
          <div key={q.id} className={`card transition-all ${answers[q.id] ? 'border-blue-100' : ''}`}>
            <div className="flex items-start gap-3 mb-4">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                  answers[q.id]
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {index + 1}
              </div>
              <p className="font-medium text-slate-800 mt-0.5">{q.text}</p>
            </div>

            <div className="space-y-2 ml-11">
              {q.options.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAnswers({ ...answers, [q.id]: opt.id })}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                    answers[q.id] === opt.id
                      ? 'border-blue-500 bg-blue-50 text-blue-800 font-medium'
                      : 'border-slate-100 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`inline-flex w-5 h-5 rounded-full border-2 mr-3 items-center justify-center flex-shrink-0 align-middle transition-all ${
                      answers[q.id] === opt.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-300'
                    }`}
                  >
                    {answers[q.id] === opt.id && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </span>
                  {opt.text}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Botón enviar */}
      <div className="card sticky bottom-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-700">
              {answeredCount < totalQuestions
                ? `Faltan ${totalQuestions - answeredCount} pregunta${totalQuestions - answeredCount !== 1 ? 's' : ''} por responder`
                : '✅ Todas las preguntas respondidas'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {answeredCount}/{totalQuestions} completadas
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || answeredCount === 0}
            className="btn-primary flex items-center gap-2 px-6"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Enviar respuestas
          </button>
        </div>
      </div>
    </div>
  );
}
