import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Evaluation, Question, Option } from '../../lib/types';
import { ArrowLeft, Plus, Trash2, X, Save, CheckCircle2 } from 'lucide-react';

interface QuestionForm {
  text: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  points: number;
  options: { text: string; isCorrect: boolean }[];
}

const defaultMCOptions = [
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
  { text: '', isCorrect: false },
];

const defaultTFOptions = [
  { text: 'Verdadero', isCorrect: true },
  { text: 'Falso', isCorrect: false },
];

export default function EvaluationEditor() {
  const { id } = useParams<{ id: string }>();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState<{ question?: Question } | null>(null);
  const [saving, setSaving] = useState(false);
  const [qForm, setQForm] = useState<QuestionForm>({
    text: '',
    type: 'MULTIPLE_CHOICE',
    points: 1,
    options: defaultMCOptions,
  });

  const fetchEvaluation = () => {
    if (!id) return;
    api
      .get(`/evaluations/${id}`)
      .then((res) => setEvaluation(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvaluation();
  }, [id]);

  const openAddQuestion = () => {
    setQForm({ text: '', type: 'MULTIPLE_CHOICE', points: 1, options: defaultMCOptions.map(o => ({ ...o })) });
    setShowModal({});
  };

  const openEditQuestion = (q: Question) => {
    setQForm({
      text: q.text,
      type: q.type,
      points: q.points,
      options: q.options.map((o: Option) => ({ text: o.text, isCorrect: o.isCorrect || false })),
    });
    setShowModal({ question: q });
  };

  const handleTypeChange = (type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE') => {
    setQForm({
      ...qForm,
      type,
      options: type === 'TRUE_FALSE'
        ? defaultTFOptions.map(o => ({ ...o }))
        : defaultMCOptions.map(o => ({ ...o })),
    });
  };

  const updateOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newOptions = [...qForm.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    if (field === 'isCorrect' && value === true) {
      newOptions.forEach((_, i) => {
        if (i !== index) newOptions[i] = { ...newOptions[i], isCorrect: false };
      });
    }
    setQForm({ ...qForm, options: newOptions });
  };

  const saveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation) return;

    const hasCorrect = qForm.options.some(o => o.isCorrect);
    if (!hasCorrect) {
      alert('Debes marcar al menos una opción como correcta');
      return;
    }

    setSaving(true);
    try {
      const data = {
        ...qForm,
        order: (evaluation.questions?.length || 0) + 1,
      };

      if (showModal?.question) {
        await api.put(`/evaluations/questions/${showModal.question.id}`, data);
      } else {
        await api.post(`/evaluations/${evaluation.id}/questions`, data);
      }
      setShowModal(null);
      fetchEvaluation();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('¿Eliminar esta pregunta?')) return;
    try {
      await api.delete(`/evaluations/questions/${questionId}`);
      fetchEvaluation();
    } catch (err) {
      console.error(err);
    }
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
        <Link to="/admin/evaluations" className="btn-primary mt-4 inline-block">Volver</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/evaluations" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{evaluation.title}</h1>
          <p className="text-slate-500 text-sm">{evaluation.course?.title} • {evaluation.questions?.length ?? 0} preguntas</p>
        </div>
        <div className="ml-auto">
          <button onClick={openAddQuestion} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Agregar Pregunta
          </button>
        </div>
      </div>

      {evaluation.questions?.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-slate-400 mb-4">Esta evaluación no tiene preguntas aún</p>
          <button onClick={openAddQuestion} className="btn-primary">
            Agregar primera pregunta
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluation.questions?.map((q: Question, index: number) => (
            <div key={q.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 text-violet-700 font-bold text-sm">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-medium text-slate-800">{q.text}</p>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span className="badge-slate">{q.points} pt{q.points !== 1 ? 's' : ''}</span>
                      <button
                        onClick={() => openEditQuestion(q)}
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                    {q.options.map((opt: Option) => (
                      <div
                        key={opt.id}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                          opt.isCorrect
                            ? 'bg-green-50 border border-green-200 text-green-800'
                            : 'bg-slate-50 border border-slate-100 text-slate-600'
                        }`}
                      >
                        {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />}
                        {opt.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal pregunta */}
      {showModal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">
                {showModal.question ? 'Editar Pregunta' : 'Nueva Pregunta'}
              </h2>
              <button onClick={() => setShowModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveQuestion} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Pregunta *</label>
                <textarea
                  value={qForm.text}
                  onChange={(e) => setQForm({ ...qForm, text: e.target.value })}
                  className="input-field resize-none"
                  rows={3}
                  required
                  placeholder="Escribe la pregunta aquí..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo</label>
                  <select
                    value={qForm.type}
                    onChange={(e) => handleTypeChange(e.target.value as 'MULTIPLE_CHOICE' | 'TRUE_FALSE')}
                    className="input-field"
                  >
                    <option value="MULTIPLE_CHOICE">Opción múltiple</option>
                    <option value="TRUE_FALSE">Verdadero/Falso</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Puntos</label>
                  <input
                    type="number"
                    value={qForm.points}
                    onChange={(e) => setQForm({ ...qForm, points: parseInt(e.target.value) || 1 })}
                    className="input-field"
                    min="1"
                    max="10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Opciones <span className="text-slate-400 font-normal">(marca la respuesta correcta)</span>
                </label>
                <div className="space-y-2">
                  {qForm.options.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateOption(i, 'isCorrect', true)}
                        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
                          opt.isCorrect
                            ? 'border-green-500 bg-green-500'
                            : 'border-slate-300 hover:border-green-400'
                        }`}
                      >
                        {opt.isCorrect && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                      {qForm.type === 'TRUE_FALSE' ? (
                        <span className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700">
                          {opt.text}
                        </span>
                      ) : (
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => updateOption(i, 'text', e.target.value)}
                          className="input-field flex-1 py-2"
                          placeholder={`Opción ${i + 1}`}
                          required
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">Haz clic en el círculo para marcar la respuesta correcta</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(null)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Guardar pregunta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
