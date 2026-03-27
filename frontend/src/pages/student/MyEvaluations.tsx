import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import { Evaluation } from '../../lib/types';
import { ClipboardList, Clock, CheckCircle2, XCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function MyEvaluations() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  useEffect(() => {
    api
      .get('/evaluations')
      .then((res) => setEvaluations(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const getStatus = (ev: Evaluation) => {
    const sub = ev.submissions?.[0];
    if (!sub || !sub.completedAt) return 'pending';
    return sub.passed ? 'passed' : 'failed';
  };

  const filtered = evaluations.filter((ev) => {
    const status = getStatus(ev);
    if (filter === 'pending') return status === 'pending';
    if (filter === 'completed') return status !== 'pending';
    return true;
  });

  const pendingCount = evaluations.filter((ev) => getStatus(ev) === 'pending').length;
  const passedCount = evaluations.filter((ev) => getStatus(ev) === 'passed').length;
  const failedCount = evaluations.filter((ev) => getStatus(ev) === 'failed').length;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Evaluaciones</h1>
        <p className="text-slate-500 mt-1">{evaluations.length} evaluación{evaluations.length !== 1 ? 'es' : ''} disponible{evaluations.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pendientes', value: pendingCount, color: 'text-amber-600 bg-amber-50', icon: AlertCircle },
          { label: 'Aprobadas', value: passedCount, color: 'text-green-600 bg-green-50', icon: CheckCircle2 },
          { label: 'Reprobadas', value: failedCount, color: 'text-red-600 bg-red-50', icon: XCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card text-center py-4">
            <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
            <p className="text-slate-500 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-5">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'completed', label: 'Completadas' },
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
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No hay evaluaciones en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ev) => {
            const status = getStatus(ev);
            const sub = ev.submissions?.[0];
            const isOverdue = ev.dueDate && new Date(ev.dueDate) < new Date() && status === 'pending';

            return (
              <div key={ev.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      status === 'passed'
                        ? 'bg-green-100'
                        : status === 'failed'
                        ? 'bg-red-100'
                        : 'bg-violet-100'
                    }`}
                  >
                    {status === 'passed' ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : status === 'failed' ? (
                      <XCircle className="w-6 h-6 text-red-600" />
                    ) : (
                      <ClipboardList className="w-6 h-6 text-violet-600" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-slate-800">{ev.title}</h3>
                        <p className="text-slate-500 text-sm mt-0.5">{ev.course?.title}</p>
                      </div>
                      {status !== 'pending' && sub && (
                        <div className="text-right flex-shrink-0">
                          <p
                            className={`text-xl font-bold ${
                              sub.passed ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {sub.score?.toFixed(0)}%
                          </p>
                          <p
                            className={`text-xs font-medium ${
                              sub.passed ? 'text-green-500' : 'text-red-500'
                            }`}
                          >
                            {sub.passed ? '✓ Aprobado' : '✗ Reprobado'}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      {ev.timeLimit && (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          {ev.timeLimit} minutos
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        Aprobación: {ev.passingScore}%
                      </span>
                      {ev.dueDate && (
                        <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : 'text-amber-600'}`}>
                          {isOverdue ? '⚠ Vencida' : `Fecha límite: ${new Date(ev.dueDate).toLocaleDateString('es-CO')}`}
                        </span>
                      )}
                      {sub?.completedAt && (
                        <span className="text-xs text-slate-400">
                          Completada: {new Date(sub.completedAt).toLocaleDateString('es-CO')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0">
                    {status === 'pending' ? (
                      <Link
                        to={`/student/evaluations/${ev.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Comenzar
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        to={`/student/evaluations/${ev.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
                      >
                        Ver resultado
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
