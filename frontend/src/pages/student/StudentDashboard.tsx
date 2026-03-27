import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { Course, Evaluation, Enrollment } from '../../lib/types';
import {
  BookOpen,
  ClipboardList,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Newspaper,
} from 'lucide-react';

interface DashboardData {
  enrollments: (Enrollment & { course: Course })[];
  pendingEvaluations: Evaluation[];
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/evaluations'),
    ])
      .then(([coursesRes, evalsRes]) => {
        const allCourses: Course[] = coursesRes.data;
        const allEvals: Evaluation[] = evalsRes.data;

        const myEnrollments = allCourses
          .filter((c) => c.enrollments && c.enrollments.length > 0)
          .map((c) => ({ ...c.enrollments![0], course: c } as Enrollment & { course: Course }));

        const pending = allEvals.filter(
          (ev) => !ev.submissions || ev.submissions.length === 0 || !ev.submissions[0].completedAt
        );

        setData({ enrollments: myEnrollments, pendingEvaluations: pending });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const completedCourses = data?.enrollments.filter((e) => e.completedAt).length ?? 0;
  const inProgressCourses = data?.enrollments.filter((e) => !e.completedAt).length ?? 0;

  return (
    <div>
      {/* Bienvenida */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">
              ¡Hola, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-200 mt-1 text-sm">
              {user?.company ? `${user.company} • ` : ''}{user?.position || 'Estudiante'}
            </p>
            <p className="text-blue-100 mt-3 text-sm">
              Continúa con tu formación en Seguridad y Salud en el Trabajo
            </p>
          </div>
          <div className="hidden sm:block">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🛡️</span>
            </div>
          </div>
        </div>
      </div>

      <Link
        to="/student/resources"
        className="flex items-center gap-4 p-4 sm:p-5 mb-8 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-teal-200 hover:shadow-md transition-all group"
      >
        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 group-hover:bg-teal-100 transition-colors">
          <Newspaper className="w-6 h-6 text-teal-700" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-slate-800">Recursos informativos SST</p>
          <p className="text-sm text-slate-500 mt-0.5">
            Documentos, videos y enlaces generales aparte de tus cursos
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-teal-600 flex-shrink-0 transition-colors" />
      </Link>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Cursos Inscritos',
            value: data?.enrollments.length ?? 0,
            icon: BookOpen,
            color: 'bg-blue-50 text-blue-600',
            loading,
          },
          {
            label: 'Cursos Completados',
            value: completedCourses,
            icon: CheckCircle2,
            color: 'bg-green-50 text-green-600',
            loading,
          },
          {
            label: 'Evaluaciones Pendientes',
            value: data?.pendingEvaluations.length ?? 0,
            icon: AlertCircle,
            color: 'bg-amber-50 text-amber-600',
            loading,
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            {loading ? (
              <div className="h-7 w-12 bg-slate-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-800">{value}</p>
            )}
            <p className="text-slate-500 text-sm">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Cursos en progreso */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-800">Mis Cursos</h2>
            </div>
            <Link to="/student/courses" className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
              Ver todos <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : inProgressCourses === 0 && completedCourses === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-3">Aún no estás inscrito en ningún curso</p>
              <Link to="/student/courses" className="btn-primary text-sm">
                Explorar cursos
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.enrollments.slice(0, 4).map((enrollment) => (
                <Link
                  key={enrollment.id ?? enrollment.courseId ?? enrollment.course.id}
                  to={`/student/courses/${enrollment.courseId ?? enrollment.course.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{enrollment.course.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 flex-shrink-0">{enrollment.progress}%</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Evaluaciones pendientes */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-violet-600" />
              <h2 className="font-semibold text-slate-800">Evaluaciones Pendientes</h2>
            </div>
            <Link to="/student/evaluations" className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1">
              Ver todas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (data?.pendingEvaluations.length ?? 0) === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">¡Al día con todas las evaluaciones!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.pendingEvaluations.slice(0, 4).map((ev) => (
                <Link
                  key={ev.id}
                  to={`/student/evaluations/${ev.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <ClipboardList className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{ev.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{ev.course?.title}</span>
                      {ev.timeLimit && (
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {ev.timeLimit} min
                        </span>
                      )}
                    </div>
                  </div>
                  {ev.dueDate && (
                    <span className={`text-xs flex-shrink-0 font-medium ${
                      new Date(ev.dueDate) < new Date() ? 'text-red-500' : 'text-amber-600'
                    }`}>
                      {new Date(ev.dueDate) < new Date() ? '⚠ Vencida' : `Vence ${new Date(ev.dueDate).toLocaleDateString('es-CO')}`}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Logros */}
      {!loading && (user?._count?.certificates ?? 0) > 0 && (
        <div className="card mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-green-600" />
            <div>
              <p className="font-semibold text-green-800">
                ¡Tienes {user?._count?.certificates} certificado{(user?._count?.certificates ?? 0) > 1 ? 's' : ''}!
              </p>
              <p className="text-green-600 text-sm">Sigue adelante con tu formación SST</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
