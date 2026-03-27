import { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import { Workshop, WorkshopSubmission } from '../../lib/types';
import {
  FolderOpen, Upload, Clock, CheckCircle2, AlertCircle,
  X, Download, Star, Send, RefreshCw, Lock,
} from 'lucide-react';

const MAX_ATTEMPTS = 3;

const FILE_TYPE_COLOR: Record<string, string> = {
  PDF: 'text-red-500 bg-red-50',
  WORD: 'text-blue-600 bg-blue-50',
  EXCEL: 'text-green-600 bg-green-50',
  PRESENTATION: 'text-orange-500 bg-orange-50',
  IMAGE: 'text-pink-500 bg-pink-50',
  VIDEO: 'text-purple-500 bg-purple-50',
  FILE: 'text-slate-500 bg-slate-50',
};

function detectType(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    pdf: 'PDF', doc: 'WORD', docx: 'WORD', xls: 'EXCEL', xlsx: 'EXCEL',
    ppt: 'PRESENTATION', pptx: 'PRESENTATION', txt: 'TEXT',
    jpg: 'IMAGE', jpeg: 'IMAGE', png: 'IMAGE', gif: 'IMAGE', webp: 'IMAGE',
    mp4: 'VIDEO', avi: 'VIDEO', mov: 'VIDEO',
  };
  return map[ext] || 'FILE';
}

function canResubmit(ws: Workshop, submission: WorkshopSubmission | undefined): boolean {
  if (!submission) return true;
  if (submission.attemptCount >= MAX_ATTEMPTS) return false;
  if (ws.dueDate && new Date() > new Date(ws.dueDate)) return false;
  return true;
}

function isDueDatePassed(ws: Workshop): boolean {
  return !!(ws.dueDate && new Date() > new Date(ws.dueDate));
}

export default function MyWorkshops() {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [activeWs, setActiveWs] = useState<Workshop | null>(null);
  const [isResubmit, setIsResubmit] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [comment, setComment] = useState('');
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchWorkshops = () => {
    setLoading(true);
    api.get('/workshops')
      .then((res) => setWorkshops(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWorkshops(); }, []);

  const getSubmission = (ws: Workshop): WorkshopSubmission | undefined => ws.submissions?.[0];

  const openModal = (ws: Workshop, resubmit = false) => {
    setActiveWs(ws);
    setIsResubmit(resubmit);
    setSelectedFile(null);
    setComment('');
    setSubmitError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWs || !selectedFile) return;
    setSubmitError('');
    setSubmitting(activeWs.id);

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (comment) formData.append('comment', comment);

    try {
      await api.post(`/workshops/${activeWs.id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setActiveWs(null);
      fetchWorkshops();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setSubmitError(axiosErr.response?.data?.message || 'Error al enviar');
    } finally {
      setSubmitting(null);
    }
  };

  const pendingCount = workshops.filter((ws) => !getSubmission(ws)).length;
  const submittedCount = workshops.filter((ws) => !!getSubmission(ws)).length;
  const gradedCount = workshops.filter((ws) => {
    const sub = getSubmission(ws);
    return sub?.grade !== null && sub?.grade !== undefined;
  }).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Talleres y Entregables</h1>
        <p className="text-slate-500 mt-1">{workshops.length} taller{workshops.length !== 1 ? 'es' : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pendientes', value: pendingCount, icon: AlertCircle, color: 'text-amber-600 bg-amber-50' },
          { label: 'Entregados', value: submittedCount, icon: CheckCircle2, color: 'text-blue-600 bg-blue-50' },
          { label: 'Calificados', value: gradedCount, icon: Star, color: 'text-green-600 bg-green-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card text-center py-4">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white rounded-xl animate-pulse border border-slate-100" />)}</div>
      ) : workshops.length === 0 ? (
        <div className="card text-center py-16">
          <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No hay talleres asignados aún</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workshops.map((ws) => {
            const submission = getSubmission(ws);
            const overdue = isDueDatePassed(ws);
            const attempts = submission?.attemptCount ?? 0;
            const canRetry = canResubmit(ws, submission);

            return (
              <div key={ws.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    submission ? 'bg-green-100' : overdue ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    {submission
                      ? <CheckCircle2 className="w-6 h-6 text-green-600" />
                      : overdue
                      ? <Lock className="w-6 h-6 text-red-500" />
                      : <FolderOpen className="w-6 h-6 text-amber-600" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{ws.title}</h3>
                        <p className="text-slate-500 text-sm">{ws.course?.title}</p>
                      </div>
                      {submission?.grade !== null && submission?.grade !== undefined && (
                        <div className="text-right flex-shrink-0">
                          <span className={`text-xl font-bold ${submission.grade >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                            {submission.grade}/100
                          </span>
                          <p className="text-xs text-slate-400">Calificación</p>
                        </div>
                      )}
                    </div>

                    <p className="text-slate-600 text-sm mt-1.5 line-clamp-2">{ws.description}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                      {ws.dueDate && (
                        <span className={`flex items-center gap-1 ${overdue && !submission ? 'text-red-500 font-medium' : 'text-slate-400'}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {overdue && !submission ? '⚠ Venció: ' : 'Vence: '}
                          {new Date(ws.dueDate).toLocaleDateString('es-CO')}
                        </span>
                      )}

                      {/* Indicador de intentos */}
                      {submission && (
                        <div className="flex items-center gap-1">
                          {[...Array(MAX_ATTEMPTS)].map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${
                                i < attempts ? 'bg-blue-500' : 'bg-slate-200'
                              }`}
                            />
                          ))}
                          <span className="text-slate-400 ml-1">{attempts}/{MAX_ATTEMPTS} intentos</span>
                        </div>
                      )}

                      {submission && (
                        <span className="text-green-600">
                          Último envío: {new Date(submission.submittedAt).toLocaleDateString('es-CO')}
                        </span>
                      )}
                    </div>

                    {/* Archivo actual */}
                    {submission && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${FILE_TYPE_COLOR[submission.fileType] || FILE_TYPE_COLOR['FILE']}`}>
                            {submission.fileType}
                          </span>
                          <span className="text-sm text-slate-700 truncate flex-1">{submission.fileName}</span>
                          <a
                            href={submission.fileUrl}
                            download={submission.fileName}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded flex-shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {submission.comment && (
                          <p className="text-xs text-slate-500 mt-1">💬 {submission.comment}</p>
                        )}
                        {submission.feedback && (
                          <div className="mt-2 p-2 bg-green-50 rounded-lg">
                            <p className="text-xs font-medium text-green-700">Retroalimentación del instructor:</p>
                            <p className="text-xs text-green-600 mt-0.5">{submission.feedback}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Mensaje si venció sin entregar */}
                    {!submission && overdue && (
                      <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                        La fecha límite venció sin entrega.
                      </div>
                    )}

                    {/* Mensaje si agotó intentos */}
                    {submission && attempts >= MAX_ATTEMPTS && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Intentos agotados — no se puede modificar
                      </p>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex-shrink-0">
                    {!submission && !overdue && (
                      <button
                        onClick={() => openModal(ws, false)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        Entregar
                      </button>
                    )}
                    {submission && canRetry && (
                      <button
                        onClick={() => openModal(ws, true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium rounded-lg transition-colors border border-amber-200"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Actualizar ({attempts}/{MAX_ATTEMPTS})
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal entregar / actualizar */}
      {activeWs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-800 text-lg">
                  {isResubmit ? 'Actualizar entrega' : 'Entregar taller'}
                </h2>
                <p className="text-slate-500 text-sm">{activeWs.title}</p>
              </div>
              <button onClick={() => setActiveWs(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-4">
              <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
                <p className="font-medium mb-1">Instrucciones:</p>
                <p>{activeWs.description}</p>
              </div>

              {isResubmit && (() => {
                const sub = getSubmission(activeWs);
                const remaining = MAX_ATTEMPTS - (sub?.attemptCount ?? 0);
                return (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 flex-shrink-0" />
                      <span>
                        Intento {(sub?.attemptCount ?? 0) + 1} de {MAX_ATTEMPTS}.{' '}
                        <strong>Te quedan {remaining - 1} modificación{remaining - 1 !== 1 ? 'es' : ''} después de esta.</strong>
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {submitError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {submitError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {isResubmit ? 'Nuevo archivo *' : 'Archivo a entregar *'}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.zip"
                />
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-800 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-blue-600">
                        {detectType(selectedFile.name)} • {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <button type="button" onClick={() => setSelectedFile(null)} className="text-blue-400 hover:text-blue-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 text-slate-400 hover:text-blue-500"
                  >
                    <Upload className="w-7 h-7" />
                    <span className="text-sm font-medium">Seleccionar archivo</span>
                    <span className="text-xs">PDF, Word, Excel, PowerPoint, Imagen (máx. 50 MB)</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Comentario para el instructor (opcional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input-field resize-none"
                  rows={2}
                  placeholder="Agrega una nota..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setActiveWs(null)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || submitting !== null}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {submitting === activeWs.id
                    ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send className="w-4 h-4" />}
                  {isResubmit ? 'Actualizar entrega' : 'Enviar entrega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
