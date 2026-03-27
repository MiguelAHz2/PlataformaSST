import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { User } from '../../lib/types';
import {
  Users, Search, ToggleLeft, ToggleRight, Eye, X,
  Building2, Briefcase, Phone, Mail, BookOpen, Award,
  UserPlus, AlertCircle, Eye as EyeIcon, EyeOff,
} from 'lucide-react';

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<(User & { enrollments?: unknown[]; submissions?: unknown[] }) | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createForm, setCreateForm] = useState({
    name: '', email: '', password: '', company: '', position: '', phone: '',
  });

  const fetchUsers = () => {
    setLoading(true);
    api
      .get('/users')
      .then((res) => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleActive = async (userId: string) => {
    try {
      await api.patch(`/users/${userId}/toggle-active`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await api.post('/users', createForm);
      setShowCreateModal(false);
      setCreateForm({ name: '', email: '', password: '', company: '', position: '', phone: '' });
      fetchUsers();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setCreateError(axiosErr.response?.data?.message || 'Error al crear trabajador');
    } finally {
      setCreating(false);
    }
  };

  const viewUser = async (userId: string) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/users/${userId}`);
      setSelectedUser(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.company || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Trabajadores</h1>
          <p className="text-slate-500 mt-1">{users.length} trabajador{users.length !== 1 ? 'es' : ''} registrado{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowCreateModal(true); setCreateError(''); setShowPassword(false); }}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Agregar Trabajador
        </button>
      </div>

      {/* Búsqueda */}
      <div className="card mb-5 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o empresa..."
            className="input-field pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">
            {search ? 'No se encontraron usuarios' : 'No hay trabajadores registrados'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Trabajador</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3 hidden md:table-cell">Empresa / Cargo</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3 hidden lg:table-cell">Cursos</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3 hidden lg:table-cell">Evaluaciones</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-semibold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{u.name}</p>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <p className="text-sm text-slate-700">{u.company || '—'}</p>
                    <p className="text-xs text-slate-400">{u.position || '—'}</p>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="badge-blue">{u._count?.enrollments ?? 0}</span>
                  </td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <span className="badge-slate">{u._count?.submissions ?? 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => viewUser(u.id)}
                        className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleActive(u.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.isActive
                            ? 'text-green-500 hover:bg-green-50'
                            : 'text-slate-400 hover:bg-slate-100'
                        }`}
                        title={u.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {u.isActive ? (
                          <ToggleRight className="w-4 h-4" />
                        ) : (
                          <ToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal crear trabajador */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">Agregar Trabajador</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {createError}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo *</label>
                  <input type="text" value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="input-field" required placeholder="Carlos Rodríguez" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico *</label>
                  <input type="email" value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="input-field" required placeholder="trabajador@empresa.com" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      className="input-field pr-10" required placeholder="Mínimo 6 caracteres"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Empresa</label>
                  <input type="text" value={createForm.company}
                    onChange={(e) => setCreateForm({ ...createForm, company: e.target.value })}
                    className="input-field" placeholder="Constructora XYZ" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo</label>
                  <input type="text" value={createForm.position}
                    onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                    className="input-field" placeholder="Operario" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                  <input type="tel" value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="input-field" placeholder="3001234567" />
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                💡 El trabajador usará este correo y contraseña para iniciar sesión en la plataforma.
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={creating} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {creating && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Crear trabajador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Panel detalle usuario */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50">
          <div className="w-full max-w-md h-full bg-white overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="font-bold text-slate-800 text-lg">Perfil del Trabajador</h2>
              <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="p-6 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="p-6">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-2xl">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{selectedUser.name}</h3>
                    <span className={`badge ${selectedUser.isActive ? 'badge-green' : 'badge-red'}`}>
                      {selectedUser.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-slate-600">{selectedUser.email}</span>
                  </div>
                  {selectedUser.company && (
                    <div className="flex items-center gap-3 text-sm">
                      <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600">{selectedUser.company}</span>
                    </div>
                  )}
                  {selectedUser.position && (
                    <div className="flex items-center gap-3 text-sm">
                      <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600">{selectedUser.position}</span>
                    </div>
                  )}
                  {selectedUser.phone && (
                    <div className="flex items-center gap-3 text-sm">
                      <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <span className="text-slate-600">{selectedUser.phone}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Cursos', value: selectedUser._count?.enrollments ?? 0, icon: BookOpen, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Evaluaciones', value: selectedUser._count?.submissions ?? 0, icon: Award, color: 'text-violet-600 bg-violet-50' },
                    { label: 'Certificados', value: selectedUser._count?.certificates ?? 0, icon: Award, color: 'text-green-600 bg-green-50' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="text-center p-3 rounded-xl bg-slate-50">
                      <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mx-auto mb-1.5`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="font-bold text-slate-800">{value}</p>
                      <p className="text-xs text-slate-400">{label}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-slate-400 text-center">
                  Registrado: {new Date(selectedUser.createdAt!).toLocaleDateString('es-CO')}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
