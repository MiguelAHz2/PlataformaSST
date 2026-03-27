import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Course } from '../../lib/types';
import { BookOpen, Clock, Users, CheckCircle2, Lock } from 'lucide-react';

const LEVEL_LABELS = { BEGINNER: 'Básico', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado' };
const LEVEL_COLORS = { BEGINNER: 'badge-green', INTERMEDIATE: 'badge-yellow', ADVANCED: 'badge-red' };

export default function MyCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'enrolled' | 'available'>('all');

  const fetchCourses = () => {
    setLoading(true);
    api
      .get('/courses')
      .then((res) => setCourses(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const enroll = async (courseId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setEnrolling(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      fetchCourses();
    } catch (err) {
      console.error(err);
    } finally {
      setEnrolling(null);
    }
  };

  const isEnrolled = (course: Course) => course.enrollments && course.enrollments.length > 0;

  const filtered = courses.filter((c) => {
    if (filter === 'enrolled') return isEnrolled(c);
    if (filter === 'available') return !isEnrolled(c);
    return true;
  });

  const enrolledCount = courses.filter(isEnrolled).length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Catálogo de Cursos</h1>
        <p className="text-slate-500 mt-1">{courses.length} cursos disponibles • {enrolledCount} inscritos</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'Todos' },
          { key: 'enrolled', label: 'Mis cursos' },
          { key: 'available', label: 'Disponibles' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
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
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {filter === 'enrolled' ? 'No estás inscrito en ningún curso' : 'No hay cursos disponibles'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((course) => {
            const enrolled = isEnrolled(course);
            const enrollment = course.enrollments?.[0];

            return (
              <div key={course.id} className="card hover:shadow-md transition-shadow flex flex-col">
                {/* Imagen */}
                <div className="relative mb-4 rounded-lg overflow-hidden h-40 bg-gradient-to-br from-blue-100 to-blue-200">
                  {course.image ? (
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-10 h-10 text-blue-400" />
                    </div>
                  )}
                  {enrolled && (
                    <div className="absolute inset-0 bg-black/20 flex items-end p-3">
                      <div className="w-full bg-white/30 rounded-full h-1.5">
                        <div
                          className="bg-white h-full rounded-full"
                          style={{ width: `${enrollment?.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {enrolled && enrollment?.completedAt && (
                    <div className="absolute top-2 left-2">
                      <div className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Completado
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={LEVEL_COLORS[course.level]}>{LEVEL_LABELS[course.level]}</span>
                    <span className="badge-blue">{course.category}</span>
                  </div>
                  <h3 className="font-semibold text-slate-800 mb-1 line-clamp-2">{course.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-2 mb-3">{course.description}</p>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {course._count?.enrollments ?? 0} inscritos
                    </span>
                  </div>

                  {enrolled && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-500 mb-1">
                        <span>Progreso</span>
                        <span>{enrollment?.progress ?? 0}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${enrollment?.progress ?? 0}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {enrolled ? (
                  <Link
                    to={`/student/courses/${course.id}`}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg text-center transition-colors"
                  >
                    {enrollment?.completedAt ? 'Revisar curso' : 'Continuar'}
                  </Link>
                ) : (
                  <button
                    onClick={(e) => enroll(course.id, e)}
                    disabled={enrolling === course.id}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-sm font-medium rounded-lg text-center transition-all flex items-center justify-center gap-2"
                  >
                    {enrolling === course.id ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                    Inscribirse
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
