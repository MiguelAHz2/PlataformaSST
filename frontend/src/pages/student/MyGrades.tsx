import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Submission, Enrollment } from '../../lib/types';
import { Award, CheckCircle2, XCircle, BookOpen, TrendingUp } from 'lucide-react';

interface GradesData {
  submissions: (Submission & { evaluation: { title: string; passingScore: number; course: { id: string; title: string } } })[];
  enrollments: (Enrollment & { course: { id: string; title: string; category: string } })[];
}

export default function MyGrades() {
  const [data, setData] = useState<GradesData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/users/my/grades')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const passedCount = data?.submissions.filter((s) => s.passed).length ?? 0;
  const failedCount = data?.submissions.filter((s) => !s.passed).length ?? 0;
  const avgScore =
    data?.submissions.length
      ? (data.submissions.reduce((acc, s) => acc + (s.score ?? 0), 0) / data.submissions.length).toFixed(1)
      : '—';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Mis Calificaciones</h1>
        <p className="text-slate-500 mt-1">Historial de evaluaciones completadas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Evaluaciones', value: data?.submissions.length ?? 0, icon: Award, color: 'bg-violet-50 text-violet-600' },
          { label: 'Aprobadas', value: passedCount, icon: CheckCircle2, color: 'bg-green-50 text-green-600' },
          { label: 'Reprobadas', value: failedCount, icon: XCircle, color: 'bg-red-50 text-red-600' },
          { label: 'Promedio', value: `${avgScore}%`, icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            {loading ? (
              <div className="h-7 w-12 bg-slate-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-800">{value}</p>
            )}
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabla de calificaciones */}
        <div className="xl:col-span-2">
          <h2 className="font-semibold text-slate-800 mb-4">Historial de Evaluaciones</h2>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : (data?.submissions.length ?? 0) === 0 ? (
            <div className="card text-center py-12">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-sm">No has completado evaluaciones aún</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Evaluación</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 hidden sm:table-cell">Curso</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3">Calificación</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-5 py-3 hidden md:table-cell">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {sub.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-slate-700 line-clamp-1">
                            {sub.evaluation.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden sm:table-cell">
                        <span className="text-sm text-slate-500 line-clamp-1">
                          {sub.evaluation.course.title}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`text-lg font-bold ${
                              sub.passed ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {sub.score?.toFixed(0)}%
                          </span>
                          <span
                            className={`text-xs ${
                              sub.passed ? 'badge-green' : 'badge-red'
                            } mt-0.5`}
                          >
                            {sub.passed ? 'Aprobado' : 'Reprobado'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 hidden md:table-cell">
                        <span className="text-xs text-slate-400">
                          {sub.completedAt
                            ? new Date(sub.completedAt).toLocaleDateString('es-CO')
                            : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Progreso de cursos */}
        <div>
          <h2 className="font-semibold text-slate-800 mb-4">Progreso en Cursos</h2>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-slate-100" />
              ))}
            </div>
          ) : (data?.enrollments.length ?? 0) === 0 ? (
            <div className="card text-center py-8">
              <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Sin cursos inscritos</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {enrollment.course.title}
                      </p>
                      <p className="text-xs text-slate-400">{enrollment.course.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          enrollment.progress === 100 ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 flex-shrink-0">
                      {enrollment.progress}%
                    </span>
                  </div>
                  {enrollment.completedAt && (
                    <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Completado {new Date(enrollment.completedAt).toLocaleDateString('es-CO')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
