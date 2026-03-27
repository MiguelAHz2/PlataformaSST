import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../lib/api';
import { AdminStats } from '../../lib/types';
import {
  Users,
  BookOpen,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  UserPlus,
  Award,
  FolderOpen,
  Send,
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/users/stats')
      .then((res) => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'Trabajadores',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      bgLight: 'bg-blue-50',
      textColor: 'text-blue-600',
      link: '/admin/companies',
    },
    {
      label: 'Cursos',
      value: stats?.totalCourses ?? 0,
      icon: BookOpen,
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      link: '/admin/courses',
    },
    {
      label: 'Evaluaciones',
      value: stats?.totalEvaluations ?? 0,
      icon: ClipboardList,
      bgLight: 'bg-violet-50',
      textColor: 'text-violet-600',
      link: '/admin/evaluations',
    },
    {
      label: 'Eval. Completadas',
      value: stats?.totalSubmissions ?? 0,
      icon: CheckCircle2,
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      link: '/admin/evaluations',
    },
    {
      label: 'Talleres',
      value: stats?.totalWorkshops ?? 0,
      icon: FolderOpen,
      bgLight: 'bg-orange-50',
      textColor: 'text-orange-600',
      link: '/admin/workshops',
    },
    {
      label: 'Talleres Entregados',
      value: stats?.totalWorkshopSubmissions ?? 0,
      icon: Send,
      bgLight: 'bg-pink-50',
      textColor: 'text-pink-600',
      link: '/admin/workshops',
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Bienvenida, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Panel de administración •{' '}
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, bgLight, textColor, link }) => (
          <Link
            key={label}
            to={link}
            className="card hover:shadow-md transition-shadow duration-200 group p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 ${bgLight} rounded-xl flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${textColor}`} />
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            {loading ? (
              <div className="h-7 w-12 bg-slate-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold text-slate-800">{value}</p>
            )}
            <p className="text-slate-500 text-xs mt-1 leading-tight">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Últimos trabajadores registrados */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600" />
              <h2 className="font-semibold text-slate-800">Últimos Registros</h2>
            </div>
            <Link
              to="/admin/companies"
              className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
            >
              Ver empresas <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-12 bg-slate-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (stats?.recentUsers.length ?? 0) === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">No hay trabajadores registrados</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentUsers.map((u) => (
                <Link
                  key={u.id}
                  to="/admin/companies"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-semibold text-sm">
                      {u.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400 truncate">{u.company || u.email}</p>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(u.createdAt!).toLocaleDateString('es-CO')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Últimas evaluaciones completadas */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-violet-600" />
              <h2 className="font-semibold text-slate-800">Actividad Reciente</h2>
            </div>
            <Link
              to="/admin/evaluations"
              className="text-blue-600 text-sm font-medium hover:text-blue-700 flex items-center gap-1"
            >
              Ver todo <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-50 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (stats?.recentSubmissions.length ?? 0) === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">Sin actividad reciente</p>
          ) : (
            <div className="space-y-2">
              {stats?.recentSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      sub.passed ? 'bg-green-100' : 'bg-red-100'
                    }`}
                  >
                    <TrendingUp className={`w-4 h-4 ${sub.passed ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-700 truncate">{sub.user.name}</p>
                    <p className="text-xs text-slate-400 truncate">{sub.evaluation.title}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${sub.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {sub.score?.toFixed(0)}%
                    </p>
                    <p className={`text-xs ${sub.passed ? 'text-green-500' : 'text-red-500'}`}>
                      {sub.passed ? 'Aprobó' : 'Reprobó'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
