import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Course, Company } from '../../lib/types';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Users,
  X,
  AlertCircle,
  Building2,
} from 'lucide-react';

const LEVEL_LABELS = { BEGINNER: 'Básico', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado' };
const LEVEL_COLORS = {
  BEGINNER: 'badge-green',
  INTERMEDIATE: 'badge-yellow',
  ADVANCED: 'badge-red',
};

export default function CoursesAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    category: 'SST General',
    duration: '',
    level: 'BEGINNER' as Course['level'],
    orgId: '',
  });

  const fetchCourses = () => {
    setLoading(true);
    Promise.all([api.get('/courses'), api.get('/companies')])
      .then(([coursesRes, companiesRes]) => {
        setCourses(coursesRes.data);
        setCompanies(companiesRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const openCreate = () => {
    setEditingCourse(null);
    setForm({ title: '', description: '', image: '', category: 'SST General', duration: '', level: 'BEGINNER', orgId: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      description: course.description,
      image: course.image || '',
      category: course.category,
      duration: course.duration || '',
      level: course.level,
      orgId: course.orgId || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}`, form);
      } else {
        await api.post('/courses', form);
      }
      setShowModal(false);
      fetchCourses();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (course: Course) => {
    try {
      await api.put(`/courses/${course.id}`, { ...course, isPublished: !course.isPublished });
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este curso? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cursos</h1>
          <p className="text-slate-500 mt-1">{courses.length} curso{courses.length !== 1 ? 's' : ''} creado{courses.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Curso
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-40 bg-slate-100 rounded-lg mb-4" />
              <div className="h-5 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No hay cursos creados</p>
          <p className="text-slate-400 text-sm mt-1">Crea tu primer curso SST</p>
          <button onClick={openCreate} className="btn-primary mt-4">
            Crear Curso
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {courses.map((course) => (
            <div key={course.id} className="card hover:shadow-md transition-shadow duration-200 flex flex-col">
              {/* Imagen */}
              <div className="relative mb-4 rounded-lg overflow-hidden h-36 bg-gradient-to-br from-blue-100 to-blue-200">
                {course.image ? (
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-blue-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <span className={`badge ${course.isPublished ? 'badge-green' : 'badge-slate'}`}>
                    {course.isPublished ? '● Publicado' : '○ Borrador'}
                  </span>
                </div>
                {course.org && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-purple-900/80 to-transparent px-3 py-2">
                    <span className="text-white text-xs font-medium flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {course.org.name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                {/* Empresa */}
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg mb-3 w-fit text-sm font-medium ${
                  course.org
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-slate-50 text-slate-400 border border-slate-200'
                }`}>
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate max-w-[180px]">
                    {course.org ? course.org.name : 'Todas las empresas'}
                  </span>
                </div>

                <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{course.title}</h3>
                <p className="text-slate-500 text-sm line-clamp-2 mb-3">{course.description}</p>

                <div className="flex flex-wrap items-start gap-2 mb-2">
                  <span className={LEVEL_COLORS[course.level]}>{LEVEL_LABELS[course.level]}</span>
                  <span className="badge-blue">{course.category}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {course._count?.modules ?? 0} módulos
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {course._count?.enrollments ?? 0} inscritos
                  </span>
                  {course.duration && <span>⏱ {course.duration}</span>}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <Link
                  to={`/admin/courses/${course.id}`}
                  className="flex-1 py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors text-center"
                >
                  Editar contenido
                </Link>
                <button
                  onClick={() => openEdit(course)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                  title="Editar info"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => togglePublish(course)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    course.isPublished
                      ? 'text-amber-500 hover:bg-amber-50'
                      : 'text-green-500 hover:bg-green-50'
                  }`}
                  title={course.isPublished ? 'Despublicar' : 'Publicar'}
                >
                  {course.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => deleteCourse(course.id)}
                  className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
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
                {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
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
                  placeholder="Ej: Inducción SST"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="input-field min-h-[80px] resize-none"
                  placeholder="Describe el contenido del curso..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="input-field"
                    placeholder="SST General"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Duración</label>
                  <input
                    type="text"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className="input-field"
                    placeholder="Ej: 8 horas"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nivel</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm({ ...form, level: e.target.value as Course['level'] })}
                    className="input-field"
                  >
                    <option value="BEGINNER">Básico</option>
                    <option value="INTERMEDIATE">Intermedio</option>
                    <option value="ADVANCED">Avanzado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">URL Imagen</label>
                  <input
                    type="url"
                    value={form.image}
                    onChange={(e) => setForm({ ...form, image: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Empresa <span className="text-slate-400 font-normal">(opcional — dejar vacío para todas)</span>
                </label>
                <select
                  value={form.orgId}
                  onChange={(e) => setForm({ ...form, orgId: e.target.value })}
                  className="input-field"
                >
                  <option value="">Todas las empresas</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : null}
                  {editingCourse ? 'Guardar cambios' : 'Crear curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
