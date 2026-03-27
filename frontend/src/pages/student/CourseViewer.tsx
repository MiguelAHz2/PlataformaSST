import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { BACKEND_URL } from '../../lib/api';
import { Course, Module, Lesson } from '../../lib/types';
import {
  ArrowLeft, CheckCircle2, Circle, BookOpen,
  ChevronDown, ChevronRight, Play,
  Download, FileText, Film, Table, File,
  Loader2, AlertTriangle,
} from 'lucide-react';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  PDF:          <FileText className="w-4 h-4 text-red-500" />,
  WORD:         <FileText className="w-4 h-4 text-blue-600" />,
  EXCEL:        <Table className="w-4 h-4 text-green-600" />,
  PRESENTATION: <File className="w-4 h-4 text-orange-500" />,
  VIDEO:        <Film className="w-4 h-4 text-purple-500" />,
  TEXT:         <FileText className="w-4 h-4 text-slate-400" />,
  FILE:         <File className="w-4 h-4 text-slate-400" />,
};

const TYPE_LABELS: Record<string, string> = {
  PDF: 'PDF', WORD: 'Word', EXCEL: 'Excel',
  PRESENTATION: 'PowerPoint', VIDEO: 'Video',
  IMAGE: 'Imagen', TEXT: 'Texto', FILE: 'Archivo',
};

interface PreviewData {
  type: string;
  html?: string;
  sheets?: Record<string, string>;
  sheetNames?: string[];
}

export default function CourseViewer() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completing, setCompleting] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string>('');

  const fetchCourse = () => {
    if (!id) return;
    api.get(`/courses/${id}`)
      .then((res) => {
        setCourse(res.data);
        const firstModule = res.data.modules?.[0];
        if (firstModule) {
          setExpandedModules(new Set([firstModule.id]));
          if (firstModule.lessons?.length > 0) {
            setActiveLesson(firstModule.lessons[0]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourse(); }, [id]);

  // Cargar preview cuando cambia la lección activa
  useEffect(() => {
    if (!activeLesson) return;
    setPreview(null);

    if (activeLesson.type === 'WORD' || activeLesson.type === 'EXCEL') {
      setPreviewLoading(true);
      api.get(`/courses/lessons/${activeLesson.id}/preview`)
        .then((res) => {
          setPreview(res.data);
          if (res.data.sheetNames?.length > 0) {
            setActiveSheet(res.data.sheetNames[0]);
          }
        })
        .catch(console.error)
        .finally(() => setPreviewLoading(false));
    }
  }, [activeLesson?.id]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  const isCompleted = (lesson: Lesson) => lesson.completions && lesson.completions.length > 0;

  const completeLesson = async (lesson: Lesson) => {
    if (isCompleted(lesson) || completing) return;
    setCompleting(true);
    try {
      await api.post(`/courses/lessons/${lesson.id}/complete`);
      fetchCourse();
    } catch (err) { console.error(err); }
    finally { setCompleting(false); }
  };

  const enrollment = course?.enrollments?.[0];
  const totalLessons = course?.modules?.reduce((acc, m) => acc + m.lessons.length, 0) ?? 0;
  const completedLessons = course?.modules?.reduce(
    (acc, m) => acc + m.lessons.filter((l) => isCompleted(l)).length, 0
  ) ?? 0;

  const getYoutubeEmbed = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
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
        <Link to="/student/courses" className="btn-primary mt-4 inline-block">Volver</Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/student/courses" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800 truncate">{course.title}</h1>
          {enrollment && (
            <div className="flex items-center gap-3 mt-1">
              <div className="flex-1 max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${enrollment.progress}%` }} />
              </div>
              <span className="text-xs text-slate-500">{completedLessons}/{totalLessons} lecciones</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Contenido activo */}
        <div className="xl:col-span-2">
          {activeLesson ? (
            <div className="card">
              {/* Título y botón completar */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {TYPE_ICONS[activeLesson.type] || TYPE_ICONS['FILE']}
                  <div>
                    <h2 className="font-bold text-slate-800 text-lg leading-tight">{activeLesson.title}</h2>
                    <span className="text-xs text-slate-400">{TYPE_LABELS[activeLesson.type] || activeLesson.type}</span>
                  </div>
                </div>
                {!isCompleted(activeLesson) ? (
                  <button
                    onClick={() => completeLesson(activeLesson)}
                    disabled={completing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                  >
                    {completing
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Marcar completada
                  </button>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg flex-shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Completada
                  </span>
                )}
              </div>

              {/* ── VISOR DE ARCHIVO ── */}

              {/* VIDEO YOUTUBE */}
              {activeLesson.type === 'VIDEO' && activeLesson.videoUrl && getYoutubeEmbed(activeLesson.videoUrl) && (
                <div className="rounded-xl overflow-hidden bg-black aspect-video mb-4">
                  <iframe
                    src={getYoutubeEmbed(activeLesson.videoUrl)!}
                    className="w-full h-full"
                    allowFullScreen
                    title={activeLesson.title}
                  />
                </div>
              )}

              {/* VIDEO ARCHIVO LOCAL */}
              {activeLesson.type === 'VIDEO' && activeLesson.fileUrl && (
                <div className="rounded-xl overflow-hidden bg-black mb-4">
                  <video
                    controls
                    className="w-full max-h-[500px]"
                    src={`${BACKEND_URL}${activeLesson.fileUrl}`}
                    onError={(e) => {
                      const url = `${BACKEND_URL}${activeLesson.fileUrl}`;
                      (e.currentTarget.parentElement!).innerHTML =
                        `<div class="p-6 text-center text-slate-400 text-sm">
                           <p class="mb-2">⚠️ Este formato de video no puede reproducirse en el navegador.</p>
                           <a href="${url}" download class="text-blue-500 underline">Descargar video</a>
                         </div>`;
                    }}
                  >
                    Tu navegador no soporta este video.
                  </video>
                </div>
              )}

              {/* PDF */}
              {activeLesson.type === 'PDF' && activeLesson.fileUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-200 mb-4" style={{ height: '650px' }}>
                  <iframe
                    src={`${BACKEND_URL}${activeLesson.fileUrl}`}
                    className="w-full h-full"
                    title={activeLesson.title}
                  />
                </div>
              )}

              {/* IMAGEN */}
              {activeLesson.type === 'IMAGE' && activeLesson.fileUrl && (
                <div className="mb-4 rounded-xl overflow-hidden border border-slate-100">
                  <img
                    src={`${BACKEND_URL}${activeLesson.fileUrl}`}
                    alt={activeLesson.title}
                    className="w-full object-contain max-h-[600px]"
                  />
                </div>
              )}

              {/* WORD - convertido a HTML */}
              {activeLesson.type === 'WORD' && (
                <div className="mb-4">
                  {previewLoading ? (
                    <div className="flex items-center justify-center py-16 bg-slate-50 rounded-xl">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
                      <span className="text-slate-500 text-sm">Cargando documento...</span>
                    </div>
                  ) : preview?.html ? (
                    <div className="border border-slate-200 rounded-xl overflow-auto bg-white" style={{ maxHeight: '700px' }}>
                      <div
                        className="p-6 prose prose-slate max-w-none lesson-content"
                        dangerouslySetInnerHTML={{ __html: preview.html }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      No se pudo previsualizar el documento.
                    </div>
                  )}
                </div>
              )}

              {/* EXCEL - convertido a tabla HTML */}
              {activeLesson.type === 'EXCEL' && (
                <div className="mb-4">
                  {previewLoading ? (
                    <div className="flex items-center justify-center py-16 bg-slate-50 rounded-xl">
                      <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
                      <span className="text-slate-500 text-sm">Cargando hoja de cálculo...</span>
                    </div>
                  ) : preview?.sheets ? (
                    <div>
                      {/* Pestañas de hojas */}
                      {(preview.sheetNames?.length ?? 0) > 1 && (
                        <div className="flex gap-1 mb-2 flex-wrap">
                          {preview.sheetNames?.map((name) => (
                            <button
                              key={name}
                              onClick={() => setActiveSheet(name)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                activeSheet === name
                                  ? 'bg-green-600 text-white'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      )}
                      <div
                        className="border border-slate-200 rounded-xl overflow-auto bg-white"
                        style={{ maxHeight: '600px' }}
                      >
                        <div
                          className="excel-preview p-2"
                          dangerouslySetInnerHTML={{ __html: preview.sheets[activeSheet] || '' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      No se pudo previsualizar la hoja de cálculo.
                    </div>
                  )}
                </div>
              )}

              {/* POWERPOINT - no tiene preview, solo descarga */}
              {activeLesson.type === 'PRESENTATION' && activeLesson.fileUrl && (
                <div className="mb-4 p-5 bg-orange-50 border border-orange-100 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <File className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-orange-800">{activeLesson.originalName || 'Presentación PowerPoint'}</p>
                      <p className="text-sm text-orange-600 mt-1">
                        Las presentaciones de PowerPoint no se pueden previsualizar en el navegador.
                        Descárgala para verla con PowerPoint o Google Slides.
                      </p>
                      <a
                        href={`${BACKEND_URL}${activeLesson.fileUrl}`}
                        download={activeLesson.originalName}
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Descargar presentación
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Archivos genéricos */}
              {activeLesson.type === 'FILE' && activeLesson.fileUrl && (
                <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <File className="w-8 h-8 text-slate-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {activeLesson.originalName || 'Archivo adjunto'}
                    </p>
                  </div>
                  <a
                    href={`${BACKEND_URL}${activeLesson.fileUrl}`}
                    download={activeLesson.originalName}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </a>
                </div>
              )}

              {/* Botón de descarga adicional para formatos que tienen preview */}
              {activeLesson.fileUrl &&
                ['WORD', 'EXCEL', 'PDF', 'IMAGE', 'VIDEO'].includes(activeLesson.type) && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <a
                      href={`${BACKEND_URL}${activeLesson.fileUrl}`}
                      download={activeLesson.originalName}
                      className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Descargar {activeLesson.originalName || 'archivo'}
                    </a>
                  </div>
                )}

              {/* Texto adicional de la lección */}
              {activeLesson.content && (
                <div
                  className="lesson-content mt-4 pt-4 border-t border-slate-100"
                  dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                />
              )}
            </div>
          ) : (
            <div className="card text-center py-16">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Selecciona una lección para comenzar</p>
            </div>
          )}
        </div>

        {/* Índice del curso */}
        <div className="space-y-3">
          {course.modules?.map((module: Module) => (
            <div key={module.id} className="card p-0 overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => toggleModule(module.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{module.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {module.lessons.filter((l) => isCompleted(l)).length}/{module.lessons.length} completadas
                  </p>
                </div>
                {expandedModules.has(module.id)
                  ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>

              {expandedModules.has(module.id) && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {module.lessons.map((lesson: Lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                        activeLesson?.id === lesson.id ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        {isCompleted(lesson) ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : activeLesson?.id === lesson.id ? (
                          <Play className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-slate-300" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm truncate ${
                          activeLesson?.id === lesson.id ? 'text-blue-700 font-medium' : 'text-slate-600'
                        }`}>
                          {lesson.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {TYPE_ICONS[lesson.type] && (
                            <span className="scale-75 opacity-60">{TYPE_ICONS[lesson.type]}</span>
                          )}
                          <span className="text-xs text-slate-400">{TYPE_LABELS[lesson.type] || lesson.type}</span>
                          {lesson.duration && <span className="text-xs text-slate-400">• {lesson.duration} min</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Evaluaciones del curso */}
          {course.evaluations && course.evaluations.length > 0 && (
            <div className="card bg-violet-50 border-violet-100">
              <p className="text-sm font-semibold text-violet-800 mb-3">Evaluaciones</p>
              <div className="space-y-2">
                {course.evaluations.map((ev) => {
                  const submitted = ev.submissions && ev.submissions.length > 0;
                  return (
                    <Link key={ev.id} to={`/student/evaluations/${ev.id}`}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-violet-100 transition-colors"
                    >
                      {submitted
                        ? <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                        : <Circle className="w-4 h-4 text-violet-400 flex-shrink-0" />}
                      <span className="text-sm text-violet-800 flex-1 truncate">{ev.title}</span>
                      {submitted && (
                        <span className={`text-xs font-bold ${ev.submissions![0].passed ? 'text-green-600' : 'text-red-600'}`}>
                          {ev.submissions![0].score?.toFixed(0)}%
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
