import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Evaluation, Course } from '../../lib/types';
import {
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  Clock,
  Award,
  Building2,
} from 'lucide-react';

export default function EvaluationsAdmin() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEval, setEditingEval] = useState<Evaluation | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    courseId: '',
    timeLimit: '',
    passingScore: '70',
    dueDate: '',
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/evaluations'), api.get('/courses')])
      .then(([evalRes, courseRes]) => {
        setEvaluations(evalRes.data);
        setCourses(courseRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditingEval(null);
    setForm({ title: '', description: '', courseId: courses[0]?.id || '', timeLimit: '', passingScore: '70', dueDate: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (ev: Evaluation) => {
    setEditingEval(ev);
    setForm({
      title: ev.title,
      description: ev.description || '',
      courseId: ev.courseId,
      timeLimit: ev.timeLimit?.toString() || '',
      passingScore: ev.passingScore.toString(),
      dueDate: ev.dueDate ? new Date(ev.dueDate).toISOString().split('T')[0] : '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingEval) {
        await api.put(`/evaluations/${editingEval.id}`, form);
      } else {
        await api.post('/evaluations', form);
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (ev: Evaluation) => {
    try {
      await api.put(`/evaluations/${ev.id}`, { isPublished: !ev.isPublished });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteEval = async (id: string) => {
    if (!confirm('¿Eliminar esta evaluación?')) return;
    try {
      await api.delete(`/evaluations/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Evaluaciones</h1>
          <p className="text-slate-500 mt-1">{evaluations.length} evaluación{evaluations.length !== 1 ? 'es' : ''} creada{evaluations.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Evaluación
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse" />
          ))}
        </div>
      ) : evaluations.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No hay evaluaciones creadas</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            Crear Evaluación
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map((ev) => (
            <div key={ev.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-violet-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{ev.title}</h3>
                      <p className="text-slate-500 text-sm mt-0.5">{ev.course?.title}</p>
                      {ev.org ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-1.5 py-0.5 mt-1">
                          <Building2 className="w-3 h-3" />{ev.org.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Building2 className="w-3 h-3" />Todas las empresas
                        </span>
                      )}
                    </div>
                    <span className={`badge flex-shrink-0 ${ev.isPublished ? 'badge-green' : 'badge-slate'}`}>
                      {ev.isPublished ? 'Publicada' : 'Borrador'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      {ev._count?.questions ?? 0} pregunta{(ev._count?.questions ?? 0) !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5" />
                      {ev._count?.submissions ?? 0} entrega{(ev._count?.submissions ?? 0) !== 1 ? 's' : ''}
                    </span>
                    {ev.timeLimit && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {ev.timeLimit} min
                      </span>
                    )}
                    <span className="font-medium text-violet-600">
                      Aprobación: {ev.passingScore}%
                    </span>
                    {ev.dueDate && (
                      <span className="text-amber-600">
                        Vence: {new Date(ev.dueDate).toLocaleDateString('es-CO')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    to={`/admin/evaluations/${ev.id}`}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar preguntas"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => openEdit(ev)}
                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Editar info"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => togglePublish(ev)}
                    className={`p-2 rounded-lg transition-colors ${
                      ev.isPublished ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'
                    }`}
                  >
                    {ev.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteEval(ev.id)}
                    className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">
                {editingEval ? 'Editar Evaluación' : 'Nueva Evaluación'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Título *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field"
                  required
                  placeholder="Ej: Evaluación Final SST"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Curso *</label>
                <select
                  value={form.courseId}
                  onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Selecciona un curso</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}{c.org ? ` — ${c.org.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Instrucciones para el estudiante..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tiempo límite (min)</label>
                  <input
                    type="number"
                    value={form.timeLimit}
                    onChange={(e) => setForm({ ...form, timeLimit: e.target.value })}
                    className="input-field"
                    placeholder="Sin límite"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Puntaje aprobatorio (%)</label>
                  <input
                    type="number"
                    value={form.passingScore}
                    onChange={(e) => setForm({ ...form, passingScore: e.target.value })}
                    className="input-field"
                    min="1"
                    max="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha límite</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editingEval ? 'Guardar cambios' : 'Crear evaluación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
