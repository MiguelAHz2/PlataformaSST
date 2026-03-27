import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Company, User } from '../../lib/types';
import {
  Building2, Plus, Pencil, Trash2, UserPlus, Eye, EyeOff,
  Users, X, ChevronRight, Phone, Hash, MapPin, UserCheck,
  AlertCircle, ToggleLeft, ToggleRight, ArrowLeft,
} from 'lucide-react';

type ViewState = 'list' | 'detail';

interface WorkerForm {
  name: string;
  email: string;
  password: string;
  position: string;
  phone: string;
}

const EMPTY_WORKER: WorkerForm = { name: '', email: '', password: '', position: '', phone: '' };

export default function CompaniesAdmin() {
  const [view, setView] = useState<ViewState>('list');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // Company modal
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyForm, setCompanyForm] = useState({ name: '', nit: '', contact: '', phone: '', address: '' });
  const [companySaving, setCompanySaving] = useState(false);
  const [companyError, setCompanyError] = useState('');

  // Worker modal
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState<User | null>(null);
  const [workerForm, setWorkerForm] = useState<WorkerForm>(EMPTY_WORKER);
  const [workerSaving, setWorkerSaving] = useState(false);
  const [workerError, setWorkerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'company' | 'worker'; id: string; name: string } | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await api.get('/companies');
      setCompanies(res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const openCompanyDetail = async (company: Company) => {
    setView('detail');
    setDetailLoading(true);
    try {
      const res = await api.get(`/companies/${company.id}`);
      setSelectedCompany(res.data);
    } catch {
      setSelectedCompany(company);
    } finally {
      setDetailLoading(false);
    }
  };

  // --- Company CRUD ---
  const openCreateCompany = () => {
    setEditingCompany(null);
    setCompanyForm({ name: '', nit: '', contact: '', phone: '', address: '' });
    setCompanyError('');
    setShowCompanyModal(true);
  };

  const openEditCompany = (c: Company, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCompany(c);
    setCompanyForm({ name: c.name, nit: c.nit || '', contact: c.contact || '', phone: c.phone || '', address: c.address || '' });
    setCompanyError('');
    setShowCompanyModal(true);
  };

  const handleSaveCompany = async () => {
    if (!companyForm.name.trim()) {
      setCompanyError('El nombre es requerido');
      return;
    }
    setCompanySaving(true);
    setCompanyError('');
    try {
      if (editingCompany) {
        await api.put(`/companies/${editingCompany.id}`, companyForm);
      } else {
        await api.post('/companies', companyForm);
      }
      setShowCompanyModal(false);
      await fetchCompanies();
      if (selectedCompany && editingCompany?.id === selectedCompany.id) {
        await openCompanyDetail(selectedCompany);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setCompanyError(e.response?.data?.message || 'Error al guardar empresa');
    } finally {
      setCompanySaving(false);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    try {
      await api.delete(`/companies/${id}`);
      setDeleteConfirm(null);
      setView('list');
      setSelectedCompany(null);
      await fetchCompanies();
    } catch {
      // silent
    }
  };

  // --- Worker CRUD ---
  const openCreateWorker = () => {
    setEditingWorker(null);
    setWorkerForm(EMPTY_WORKER);
    setWorkerError('');
    setShowPassword(false);
    setShowWorkerModal(true);
  };

  const openEditWorker = (w: User) => {
    setEditingWorker(w);
    setWorkerForm({ name: w.name, email: w.email, password: '', position: w.position || '', phone: w.phone || '' });
    setWorkerError('');
    setShowPassword(false);
    setShowWorkerModal(true);
  };

  const handleSaveWorker = async () => {
    if (!workerForm.name || !workerForm.email) {
      setWorkerError('Nombre y correo son requeridos');
      return;
    }
    if (!editingWorker && !workerForm.password) {
      setWorkerError('La contraseña es requerida para nuevos trabajadores');
      return;
    }
    setWorkerSaving(true);
    setWorkerError('');
    try {
      if (editingWorker) {
        const payload: Record<string, string> = {
          name: workerForm.name,
          email: workerForm.email,
          position: workerForm.position,
          phone: workerForm.phone,
        };
        if (workerForm.password) payload.password = workerForm.password;
        await api.put(`/companies/users/${editingWorker.id}`, payload);
      } else {
        await api.post(`/companies/${selectedCompany!.id}/users`, workerForm);
      }
      setShowWorkerModal(false);
      await openCompanyDetail(selectedCompany!);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setWorkerError(e.response?.data?.message || 'Error al guardar trabajador');
    } finally {
      setWorkerSaving(false);
    }
  };

  const handleDeleteWorker = async (id: string) => {
    try {
      await api.delete(`/companies/users/${id}`);
      setDeleteConfirm(null);
      await openCompanyDetail(selectedCompany!);
    } catch {
      // silent
    }
  };

  const handleToggleActive = async (userId: string) => {
    try {
      await api.patch(`/companies/users/${userId}/toggle-active`);
      await openCompanyDetail(selectedCompany!);
    } catch {
      // silent
    }
  };

  // ---- RENDER ----
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {view === 'detail' && (
            <button onClick={() => setView('list')} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {view === 'detail' ? selectedCompany?.name : 'Empresas'}
            </h1>
            <p className="text-slate-500 text-sm">
              {view === 'detail'
                ? `${selectedCompany?.users?.length ?? 0} trabajadores`
                : `${companies.length} empresa${companies.length !== 1 ? 's' : ''} registrada${companies.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <button
          onClick={view === 'list' ? openCreateCompany : openCreateWorker}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {view === 'list' ? 'Nueva Empresa' : 'Agregar Trabajador'}
        </button>
      </div>

      {/* LIST VIEW */}
      {view === 'list' && (
        <>
          {companies.length === 0 ? (
            <div className="card text-center py-16">
              <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No hay empresas registradas</p>
              <p className="text-slate-400 text-sm mt-1">Crea la primera empresa para organizar tus trabajadores</p>
              <button onClick={openCreateCompany} className="btn-primary mt-4 inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Nueva Empresa
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {companies.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openCompanyDetail(c)}
                  className="card cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => openEditCompany(c, e)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'company', id: c.id, name: c.name }); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-semibold text-slate-800 mb-1">{c.name}</h3>
                  {c.nit && <p className="text-xs text-slate-400 mb-3">NIT: {c.nit}</p>}

                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-slate-800">{c._count?.users ?? 0}</p>
                      <p className="text-xs text-slate-500">Trabajadores</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-slate-800">
                        {(c._count?.courses ?? 0) + (c._count?.workshops ?? 0) + (c._count?.evaluations ?? 0)}
                      </p>
                      <p className="text-xs text-slate-500">Contenidos</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-3 text-blue-600 text-xs font-medium">
                    Ver detalles <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* DETAIL VIEW */}
      {view === 'detail' && selectedCompany && (
        <div>
          {/* Company info card */}
          <div className="card mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{selectedCompany.name}</h2>
                  <div className="flex flex-wrap gap-3 mt-1">
                    {selectedCompany.nit && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Hash className="w-3 h-3" /> NIT: {selectedCompany.nit}
                      </span>
                    )}
                    {selectedCompany.phone && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Phone className="w-3 h-3" /> {selectedCompany.phone}
                      </span>
                    )}
                    {selectedCompany.contact && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <UserCheck className="w-3 h-3" /> {selectedCompany.contact}
                      </span>
                    )}
                    {selectedCompany.address && (
                      <span className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" /> {selectedCompany.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => openEditCompany(selectedCompany, e)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Pencil className="w-4 h-4" /> Editar empresa
              </button>
            </div>
          </div>

          {/* Workers list */}
          <div className="card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-800">
                  Trabajadores ({selectedCompany.users?.length ?? 0})
                </h3>
              </div>
            </div>

            {detailLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (selectedCompany.users?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No hay trabajadores en esta empresa</p>
                <button onClick={openCreateWorker} className="btn-primary mt-3 inline-flex items-center gap-2 text-sm">
                  <UserPlus className="w-4 h-4" /> Agregar trabajador
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedCompany.users?.map((w) => (
                  <div
                    key={w.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                      w.isActive ? 'border-slate-100 bg-white hover:bg-slate-50' : 'border-slate-100 bg-slate-50 opacity-60'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-sm">
                        {w.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{w.name}</p>
                      <p className="text-xs text-slate-400 truncate">{w.email}</p>
                      {w.position && <p className="text-xs text-slate-400">{w.position}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-3 mr-2">
                        <span className="text-xs text-slate-400">{w._count?.enrollments ?? 0} cursos</span>
                        <span className="text-xs text-slate-400">{w._count?.submissions ?? 0} eval.</span>
                      </div>
                      <button
                        onClick={() => handleToggleActive(w.id)}
                        className={`p-1.5 rounded-lg transition-colors ${w.isActive ? 'text-green-600 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
                        title={w.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {w.isActive ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openEditWorker(w)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'worker', id: w.id, name: w.name })}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Crear/Editar Empresa */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}
              </h3>
              <button onClick={() => setShowCompanyModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {companyError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {companyError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre de la empresa *</label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="input-field"
                  placeholder="Ej: L'Oreal Colombia S.A.S"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">NIT</label>
                <input
                  type="text"
                  value={companyForm.nit}
                  onChange={(e) => setCompanyForm({ ...companyForm, nit: e.target.value })}
                  className="input-field"
                  placeholder="900.123.456-7"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Persona de contacto</label>
                <input
                  type="text"
                  value={companyForm.contact}
                  onChange={(e) => setCompanyForm({ ...companyForm, contact: e.target.value })}
                  className="input-field"
                  placeholder="Nombre del responsable de SST"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="input-field"
                    placeholder="3001234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
                  <input
                    type="text"
                    value={companyForm.address}
                    onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                    className="input-field"
                    placeholder="Ciudad"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowCompanyModal(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button onClick={handleSaveCompany} disabled={companySaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {companySaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {editingCompany ? 'Guardar cambios' : 'Crear empresa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Crear/Editar Trabajador */}
      {showWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingWorker ? 'Editar Trabajador' : `Agregar Trabajador — ${selectedCompany?.name}`}
              </h3>
              <button onClick={() => setShowWorkerModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {workerError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {workerError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nombre completo *</label>
                <input
                  type="text"
                  value={workerForm.name}
                  onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })}
                  className="input-field"
                  placeholder="Nombre Apellido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Correo electrónico *</label>
                <input
                  type="email"
                  value={workerForm.email}
                  onChange={(e) => setWorkerForm({ ...workerForm, email: e.target.value })}
                  className="input-field"
                  placeholder="trabajador@empresa.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Contraseña {editingWorker ? '(dejar en blanco para no cambiar)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={workerForm.password}
                    onChange={(e) => setWorkerForm({ ...workerForm, password: e.target.value })}
                    className="input-field pr-10"
                    placeholder={editingWorker ? '••••••••' : 'Mínimo 6 caracteres'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cargo / Posición</label>
                  <input
                    type="text"
                    value={workerForm.position}
                    onChange={(e) => setWorkerForm({ ...workerForm, position: e.target.value })}
                    className="input-field"
                    placeholder="Operario, Supervisor..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Teléfono</label>
                  <input
                    type="tel"
                    value={workerForm.phone}
                    onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })}
                    className="input-field"
                    placeholder="3001234567"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setShowWorkerModal(false)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button onClick={handleSaveWorker} disabled={workerSaving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {workerSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                {editingWorker ? 'Guardar cambios' : 'Crear trabajador'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirmar eliminación */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-center font-bold text-slate-800 mb-2">
              Eliminar {deleteConfirm.type === 'company' ? 'empresa' : 'trabajador'}
            </h3>
            <p className="text-center text-slate-500 text-sm mb-6">
              ¿Estás segura de que deseas eliminar <strong>{deleteConfirm.name}</strong>?
              {deleteConfirm.type === 'company' && ' Esto también desvinculará a todos sus trabajadores.'}
              {' '}Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">
                Cancelar
              </button>
              <button
                onClick={() =>
                  deleteConfirm.type === 'company'
                    ? handleDeleteCompany(deleteConfirm.id)
                    : handleDeleteWorker(deleteConfirm.id)
                }
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium text-sm transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
