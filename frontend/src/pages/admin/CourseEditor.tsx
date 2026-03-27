import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Course, Module, Lesson } from '../../lib/types';
import {
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight,
  GripVertical, X, Save, Upload, FileText, Film,
  File, Table, Presentation, Image,
} from 'lucide-react';

const FILE_ICONS: Record<string, React.ReactNode> = {
  PDF:          <FileText className="w-4 h-4 text-red-500" />,
  WORD:         <FileText className="w-4 h-4 text-blue-600" />,
  EXCEL:        <Table className="w-4 h-4 text-green-600" />,
  PRESENTATION: <Presentation className="w-4 h-4 text-orange-500" />,
  VIDEO:        <Film className="w-4 h-4 text-purple-500" />,
  IMAGE:        <Image className="w-4 h-4 text-pink-500" />,
  TEXT:         <FileText className="w-4 h-4 text-slate-500" />,
  FILE:         <File className="w-4 h-4 text-slate-500" />,
};

const TYPE_LABELS: Record<string, string> = {
  PDF: 'PDF', WORD: 'Word', EXCEL: 'Excel',
  PRESENTATION: 'PowerPoint', VIDEO: 'Video',
  IMAGE: 'Imagen', TEXT: 'Texto', FILE: 'Archivo',
};

function detectType(filename: string): string {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  const map: Record<string, string> = {
    pdf: 'PDF', doc: 'WORD', docx: 'WORD',
    xls: 'EXCEL', xlsx: 'EXCEL', ppt: 'PRESENTATION', pptx: 'PRESENTATION',
    txt: 'TEXT', jpg: 'IMAGE', jpeg: 'IMAGE', png: 'IMAGE', gif: 'IMAGE', webp: 'IMAGE',
    mp4: 'VIDEO', avi: 'VIDEO', mov: 'VIDEO', webm: 'VIDEO',
  };
  return map[ext] || 'FILE';
}

export default function CourseEditor() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showLessonModal, setShowLessonModal] = useState<{ moduleId: string; lesson?: Lesson } | null>(null);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    duration: '',
  });

  const fetchCourse = () => {
    if (!id) return;
    api.get(`/courses/${id}`)
      .then((res) => {
        setCourse(res.data);
        if (res.data.modules?.length > 0) {
          setExpandedModules(new Set([res.data.modules[0].id]));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourse(); }, [id]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  const addModule = async () => {
    if (!newModuleTitle.trim() || !course) return;
    setSaving(true);
    try {
      await api.post(`/courses/${course.id}/modules`, {
        title: newModuleTitle,
        order: (course.modules?.length || 0) + 1,
      });
      setNewModuleTitle('');
      setShowModuleForm(false);
      fetchCourse();
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const deleteModule = async (moduleId: string) => {
    if (!confirm('¿Eliminar este módulo y todas sus lecciones?')) return;
    try {
      await api.delete(`/courses/modules/${moduleId}`);
      fetchCourse();
    } catch (err) { console.error(err); }
  };

  const openLessonModal = (moduleId: string, lesson?: Lesson) => {
    setShowLessonModal({ moduleId, lesson });
    setSelectedFile(null);
    if (lesson) {
      setLessonForm({ title: lesson.title, duration: lesson.duration?.toString() || '' });
    } else {
      setLessonForm({ title: '', duration: '' });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const saveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showLessonModal) return;
    if (!selectedFile && !showLessonModal.lesson) {
      alert('Debes seleccionar un archivo para la lección');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('title', lessonForm.title);
    if (lessonForm.duration) formData.append('duration', lessonForm.duration);
    if (selectedFile) formData.append('file', selectedFile);

    try {
      if (showLessonModal.lesson) {
        await api.put(`/courses/lessons/${showLessonModal.lesson.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post(`/courses/modules/${showLessonModal.moduleId}/lessons`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      setShowLessonModal(null);
      fetchCourse();
    } catch (err) { console.error(err); }
    finally { setUploading(false); }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('¿Eliminar esta lección?')) return;
    try {
      await api.delete(`/courses/lessons/${lessonId}`);
      fetchCourse();
    } catch (err) { console.error(err); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="card text-center py-12">
        <p className="text-slate-500">Curso no encontrado</p>
        <Link to="/admin/courses" className="btn-primary mt-4 inline-block">Volver</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/courses" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-800">{course.title}</h1>
          <p className="text-slate-500 text-sm">{course._count?.modules ?? 0} módulos • {course.category}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-3">
          {course.modules?.map((module: Module) => (
            <div key={module.id} className="card p-0 overflow-hidden">
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleModule(module.id)}
              >
                <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{module.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {module.lessons.length} lección{module.lessons.length !== 1 ? 'es' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); openLessonModal(module.id); }}
                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Agregar lección"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteModule(module.id); }}
                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedModules.has(module.id)
                    ? <ChevronDown className="w-4 h-4 text-slate-400" />
                    : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {expandedModules.has(module.id) && (
                <div className="border-t border-slate-100">
                  {module.lessons.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-slate-400 text-sm">Sin lecciones</p>
                      <button
                        onClick={() => openLessonModal(module.id)}
                        className="text-blue-600 text-sm font-medium mt-1 hover:text-blue-700"
                      >
                        + Agregar primera lección
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-50">
                      {module.lessons.map((lesson: Lesson) => (
                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 group">
                          <div className="flex-shrink-0">
                            {FILE_ICONS[lesson.type] || FILE_ICONS['FILE']}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-700 truncate">{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-slate-400">
                                {TYPE_LABELS[lesson.type] || lesson.type}
                              </span>
                              {lesson.originalName && (
                                <span className="text-xs text-slate-400 truncate max-w-[180px]">
                                  • {lesson.originalName}
                                </span>
                              )}
                              {lesson.duration && (
                                <span className="text-xs text-slate-400">• {lesson.duration} min</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openLessonModal(module.id, lesson)}
                              className="p-1 text-blue-400 hover:text-blue-600 rounded"
                              title="Editar"
                            >
                              <Save className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteLesson(lesson.id)}
                              className="p-1 text-red-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {showModuleForm ? (
            <div className="card">
              <p className="font-medium text-slate-700 mb-3">Nuevo módulo</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder="Título del módulo"
                  className="input-field flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && addModule()}
                  autoFocus
                />
                <button onClick={addModule} disabled={saving} className="btn-primary px-4">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => setShowModuleForm(false)} className="btn-secondary px-4">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowModuleForm(true)}
              className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar módulo
            </button>
          )}
        </div>

        {/* Info del curso */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-slate-800 mb-3">Información</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Estado</span>
                <span className={`badge ${course.isPublished ? 'badge-green' : 'badge-slate'}`}>
                  {course.isPublished ? 'Publicado' : 'Borrador'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Inscritos</span>
                <span className="text-slate-700">{course._count?.enrollments ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Módulos</span>
                <span className="text-slate-700">{course.modules?.length ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="card bg-blue-50 border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-2">Formatos soportados</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                ['PDF', 'text-red-500'], ['Word', 'text-blue-600'],
                ['Excel', 'text-green-600'], ['PowerPoint', 'text-orange-500'],
                ['Video', 'text-purple-500'], ['Imagen', 'text-pink-500'],
              ].map(([label, color]) => (
                <span key={label} className={`text-xs font-medium ${color} flex items-center gap-1`}>
                  • {label}
                </span>
              ))}
            </div>
          </div>

          <Link to="/admin/courses" className="btn-secondary w-full flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Volver a cursos
          </Link>
        </div>
      </div>

      {/* Modal lección */}
      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">
                {showLessonModal.lesson ? 'Editar Lección' : 'Nueva Lección'}
              </h2>
              <button onClick={() => setShowLessonModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveLesson} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Título de la lección *
                </label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="input-field"
                  required
                  placeholder="Ej: Introducción al SG-SST"
                />
              </div>

              {/* Upload de archivo */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Archivo de la lección {!showLessonModal.lesson && <span className="text-red-500">*</span>}
                </label>

                {showLessonModal.lesson && !selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 mb-2">
                    <div className="flex-shrink-0">
                      {FILE_ICONS[showLessonModal.lesson.type] || FILE_ICONS['FILE']}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-slate-700 font-medium truncate">
                        {showLessonModal.lesson.originalName || 'Archivo actual'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {TYPE_LABELS[showLessonModal.lesson.type] || showLessonModal.lesson.type}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 ml-auto flex-shrink-0">Archivo actual</span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.webm"
                />

                {selectedFile ? (
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex-shrink-0">
                      {FILE_ICONS[detectType(selectedFile.name)] || FILE_ICONS['FILE']}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-800 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-blue-600">
                        {TYPE_LABELS[detectType(selectedFile.name)]} •{' '}
                        {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-blue-400 hover:text-blue-600"
                    >
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
                    <span className="text-sm font-medium">Haz clic para subir el archivo</span>
                    <span className="text-xs">PDF, Word, Excel, PowerPoint, Video, Imagen (máx. 100 MB)</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Duración estimada (minutos)
                </label>
                <input
                  type="number"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                  className="input-field"
                  placeholder="Ej: 30"
                  min="1"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowLessonModal(null)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={uploading || saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Guardar lección
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
