import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Workshop, WorkshopSubmission, Course } from '../../lib/types';
import { BACKEND_URL } from '../../lib/api';
import {
  FolderOpen, Plus, Trash2, Eye, EyeOff, X,
  Download, Star, MessageSquare, Clock, User,
  CheckCircle2, AlertCircle, Building2,
} from 'lucide-react';

const FILE_TYPE_COLOR: Record<string, string> = {
  PDF: 'text-red-500 bg-red-50',
  WORD: 'text-blue-600 bg-blue-50',
  EXCEL: 'text-green-600 bg-green-50',
  PRESENTATION: 'text-orange-500 bg-orange-50',
  IMAGE: 'text-pink-500 bg-pink-50',
  VIDEO: 'text-purple-500 bg-purple-50',
  FILE: 'text-slate-500 bg-slate-50',
};

export default function WorkshopsAdmin() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingWs, setEditingWs] = useState<Workshop | null>(null);
  const [detailWs, setDetailWs] = useState<(Workshop & { submissions: WorkshopSubmission[] }) | null>(null);
  const [gradingSubmission, setGradingSubmission] = useState<WorkshopSubmission | null>(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', courseId: '', dueDate: '' });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/workshops'), api.get('/courses')])
      .then(([wsRes, cRes]) => {
        setWorkshops(wsRes.data);
        setCourses(cRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditingWs(null);
    setForm({ title: '', description: '', courseId: courses[0]?.id || '', dueDate: '' });
    setShowModal(true);
  };

  const openEdit = (ws: Workshop) => {
    setEditingWs(ws);
    setForm({
      title: ws.title,
      description: ws.description,
      courseId: ws.courseId,
      dueDate: ws.dueDate ? new Date(ws.dueDate).toISOString().split('T')[0] : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingWs) {
        await api.put(`/workshops/${editingWs.id}`, form);
      } else {
        await api.post('/workshops', form);
      }
      setShowModal(false);
      fetchData();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const togglePublish = async (ws: Workshop) => {
    try {
      await api.put(`/workshops/${ws.id}`, { isPublished: !ws.isPublished });
      fetchData();
    } catch (err) { console.error(err); }
  };

  const deleteWs = async (id: string) => {
    if (!confirm('¿Eliminar este taller?')) return;
    try {
      await api.delete(`/workshops/${id}`);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const viewDetail = async (ws: Workshop) => {
    try {
      const res = await api.get(`/workshops/${ws.id}`);
      setDetailWs(res.data);
    } catch (err) { console.error(err); }
  };

  const saveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;
    setSaving(true);
    try {
      await api.patch(`/workshops/submissions/${gradingSubmission.id}/grade`, gradeForm);
      setGradingSubmission(null);
      if (detailWs) viewDetail(detailWs);
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Talleres y Entregables</h1>
          <p className="text-slate-500 mt-1">{workshops.length} taller{workshops.length !== 1 ? 'es' : ''} creado{workshops.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Taller
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
      ) : workshops.length === 0 ? (
        <div className="card text-center py-16">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No hay talleres creados</p>
          <button onClick={openCreate} className="btn-primary mt-4">Crear Taller</button>
        </div>
      ) : (
        <div className="space-y-3">
          {workshops.map((ws) => (
            <div key={ws.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{ws.title}</h3>
                      <p className="text-slate-500 text-sm mt-0.5">{ws.course?.title}</p>
                      {ws.org ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-1.5 py-0.5 mt-1">
                          <Building2 className="w-3 h-3" />{ws.org.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1">
                          <Building2 className="w-3 h-3" />Todas las empresas
                        </span>
                      )}
                    </div>
                    <span className={`badge flex-shrink-0 ${ws.isPublished ? 'badge-green' : 'badge-slate'}`}>
                      {ws.isPublished ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  <p className="text-slate-500 text-sm mt-1 line-clamp-2">{ws.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {ws._count?.submissions ?? 0} entrega{(ws._count?.submissions ?? 0) !== 1 ? 's' : ''}
                    </span>
                    {ws.dueDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Vence: {new Date(ws.dueDate).toLocaleDateString('es-CO')}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => viewDetail(ws)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Ver entregas"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEdit(ws)}
                    className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => togglePublish(ws)}
                    className={`p-2 rounded-lg transition-colors ${ws.isPublished ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                  >
                    {ws.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteWs(ws.id)}
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

      {/* Modal crear/editar taller */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">
                {editingWs ? 'Editar Taller' : 'Nuevo Taller'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Título *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input-field" required placeholder="Ej: Taller de Identificación de Riesgos" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Instrucciones / Descripción *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field min-h-[100px] resize-none" required
                  placeholder="Describe qué debe hacer el estudiante, qué entregar, cómo hacerlo..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Curso *</label>
                <select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                  className="input-field" required>
                  <option value="">Selecciona un curso</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}{c.org ? ` — ${c.org.name}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha límite de entrega</label>
                <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="input-field" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancelar</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  {editingWs ? 'Guardar' : 'Crear taller'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Panel de entregas del taller */}
      {detailWs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="w-full max-w-2xl h-full bg-white overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">{detailWs.title}</h2>
                <p className="text-slate-500 text-sm">{detailWs.submissions?.length ?? 0} entrega{(detailWs.submissions?.length ?? 0) !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setDetailWs(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl mb-6">
                <p className="text-sm font-medium text-amber-800 mb-1">Instrucciones del taller:</p>
                <p className="text-sm text-amber-700">{detailWs.description}</p>
              </div>

              {(detailWs.submissions?.length ?? 0) === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400">Aún no hay entregas</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {detailWs.submissions?.map((sub) => (
                    <div key={sub.id} className="border border-slate-100 rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-sm">{sub.user?.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{sub.user?.name}</p>
                            <p className="text-xs text-slate-400">{sub.user?.company}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {sub.grade !== null && sub.grade !== undefined ? (
                            <div>
                              <span className={`text-lg font-bold ${sub.grade >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                                {sub.grade}/100
                              </span>
                              <div className="flex items-center gap-1 justify-end">
                                <CheckCircle2 className="w-3 h-3 text-green-500" />
                                <span className="text-xs text-green-600">Calificado</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                              <span className="text-xs text-amber-600">Sin calificar</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${FILE_TYPE_COLOR[sub.fileType] || FILE_TYPE_COLOR['FILE']}`}>
                          {sub.fileType}
                        </span>
                        <span className="text-sm text-slate-600 truncate">{sub.fileName}</span>
                        <a
                          href={`${BACKEND_URL}${sub.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          download={sub.fileName}
                          className="ml-auto p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg flex-shrink-0"
                          title="Descargar"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>

                      <div className="flex items-center gap-1 mb-2">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className={`w-2 h-2 rounded-full ${i < (sub.attemptCount ?? 1) ? 'bg-blue-500' : 'bg-slate-200'}`} />
                        ))}
                        <span className="text-xs text-slate-400 ml-1">{sub.attemptCount ?? 1}/3 intentos</span>
                      </div>

                      {sub.comment && (
                        <div className="p-2 bg-slate-50 rounded-lg text-sm text-slate-600 mb-3">
                          <span className="font-medium">Comentario: </span>{sub.comment}
                        </div>
                      )}

                      {sub.feedback && (
                        <div className="p-2 bg-green-50 rounded-lg text-sm text-green-700 mb-3">
                          <span className="font-medium">Retroalimentación: </span>{sub.feedback}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">
                          Entregado: {new Date(sub.submittedAt).toLocaleDateString('es-CO')}
                        </span>
                        <button
                          onClick={() => { setGradingSubmission(sub); setGradeForm({ grade: sub.grade?.toString() || '', feedback: sub.feedback || '' }); }}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          <Star className="w-3.5 h-3.5" />
                          {sub.grade !== undefined && sub.grade !== null ? 'Editar calificación' : 'Calificar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal calificación */}
      {gradingSubmission && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">Calificar entrega</h3>
              <button onClick={() => setGradingSubmission(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={saveGrade} className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                Estudiante: <strong>{gradingSubmission.user?.name}</strong>
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Calificación (0 - 100)
                </label>
                <input
                  type="number"
                  value={gradeForm.grade}
                  onChange={(e) => setGradeForm({ ...gradeForm, grade: e.target.value })}
                  className="input-field"
                  min="0" max="100"
                  placeholder="Ej: 85"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Retroalimentación
                </label>
                <textarea
                  value={gradeForm.feedback}
                  onChange={(e) => setGradeForm({ ...gradeForm, feedback: e.target.value })}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Comentarios para el estudiante..."
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setGradingSubmission(null)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Guardar calificación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
