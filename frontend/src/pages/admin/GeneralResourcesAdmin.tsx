import { useState, useEffect, useRef } from 'react';
import api, { BACKEND_URL } from '../../lib/api';
import { GeneralResource, GeneralResourceKind, Company } from '../../lib/types';
import {
  Newspaper, Plus, Trash2, Eye, EyeOff, X, Building2, FileText, Link2, Video,
  AlertCircle, Edit2,
} from 'lucide-react';

const KIND_LABELS: Record<GeneralResourceKind, string> = {
  FILE: 'Archivo',
  EXTERNAL_LINK: 'Enlace',
  VIDEO_EMBED: 'Video (YouTube / Vimeo)',
};

const FILE_KIND_COLOR: Record<string, string> = {
  PDF: 'text-red-500 bg-red-50',
  WORD: 'text-blue-600 bg-blue-50',
  EXCEL: 'text-green-600 bg-green-50',
  PRESENTATION: 'text-orange-500 bg-orange-50',
  IMAGE: 'text-pink-500 bg-pink-50',
  VIDEO: 'text-purple-500 bg-purple-50',
  FILE: 'text-slate-500 bg-slate-50',
};

export default function GeneralResourcesAdmin() {
  const [items, setItems] = useState<GeneralResource[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GeneralResource | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    kind: 'FILE' as GeneralResourceKind,
    externalUrl: '',
    orgId: '',
    order: '0',
    isPublished: true,
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get('/general-resources'), api.get('/companies')])
      .then(([r, c]) => {
        setItems(r.data);
        setCompanies(c.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      kind: 'FILE',
      externalUrl: '',
      orgId: '',
      order: '0',
      isPublished: true,
    });
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
    setShowModal(true);
  };

  const openEdit = (r: GeneralResource) => {
    setEditing(r);
    setForm({
      title: r.title,
      description: r.description || '',
      kind: r.kind,
      externalUrl: r.externalUrl || '',
      orgId: r.orgId || '',
      order: String(r.order),
      isPublished: r.isPublished,
    });
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editing) {
        if (file && editing.kind === 'FILE') {
          const fd = new FormData();
          fd.append('title', form.title);
          fd.append('description', form.description);
          fd.append('order', form.order);
          fd.append('isPublished', String(form.isPublished));
          fd.append('orgId', form.orgId);
          fd.append('file', file);
          await api.put(`/general-resources/${editing.id}`, fd);
        } else {
          await api.put(`/general-resources/${editing.id}`, {
            title: form.title,
            description: form.description || null,
            order: parseInt(form.order, 10) || 0,
            isPublished: form.isPublished,
            orgId: form.orgId || null,
            ...(editing.kind !== 'FILE' ? { externalUrl: form.externalUrl.trim() } : {}),
          });
        }
      } else {
        const fd = new FormData();
        fd.append('title', form.title.trim());
        fd.append('description', form.description.trim());
        fd.append('kind', form.kind);
        fd.append('order', form.order);
        fd.append('isPublished', String(form.isPublished));
        fd.append('orgId', form.orgId);
        if (form.kind === 'FILE') {
          if (!file) {
            setError('Selecciona un archivo');
            setSaving(false);
            return;
          }
          fd.append('file', file);
        } else {
          fd.append('externalUrl', form.externalUrl.trim());
        }
        await api.post('/general-resources', fd);
      }
      setShowModal(false);
      fetchData();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (r: GeneralResource) => {
    try {
      await api.put(`/general-resources/${r.id}`, { isPublished: !r.isPublished });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este recurso?')) return;
    try {
      await api.delete(`/general-resources/${id}`);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Recursos informativos</h1>
          <p className="text-slate-500 mt-1">
            Documentación, videos y enlaces para estudiantes (aparte de los cursos)
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo recurso
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aún no hay recursos informativos</p>
          <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
            Sube PDFs, enlaces a normativa o videos de YouTube/Vimeo. Los estudiantes los verán en &quot;Recursos SST&quot;.
          </p>
          <button type="button" onClick={openCreate} className="btn-primary mt-4">
            Crear el primero
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((r) => (
            <div key={r.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  {r.kind === 'FILE' && <FileText className="w-5 h-5 text-teal-700" />}
                  {r.kind === 'EXTERNAL_LINK' && <Link2 className="w-5 h-5 text-teal-700" />}
                  {r.kind === 'VIDEO_EMBED' && <Video className="w-5 h-5 text-teal-700" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-slate-800">{r.title}</h3>
                      <span className="inline-block text-xs font-medium text-teal-700 bg-teal-50 rounded px-2 py-0.5 mt-1">
                        {KIND_LABELS[r.kind]}
                      </span>
                      {r.kind === 'FILE' && r.fileKind && (
                        <span className={`inline-block text-xs font-medium rounded px-2 py-0.5 mt-1 ml-1 ${FILE_KIND_COLOR[r.fileKind] || FILE_KIND_COLOR.FILE}`}>
                          {r.fileKind}
                        </span>
                      )}
                      {r.org ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-1.5 py-0.5 mt-1 ml-1">
                          <Building2 className="w-3 h-3" />
                          {r.org.name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 mt-1 ml-1">
                          <Building2 className="w-3 h-3" />
                          Todas las empresas
                        </span>
                      )}
                    </div>
                    <span className={`badge flex-shrink-0 ${r.isPublished ? 'badge-green' : 'badge-slate'}`}>
                      {r.isPublished ? 'Publicado' : 'Borrador'}
                    </span>
                  </div>
                  {r.description && <p className="text-slate-500 text-sm mt-2 line-clamp-2">{r.description}</p>}
                  <div className="mt-2 text-xs text-slate-400 truncate">
                    {r.kind === 'FILE' && r.fileUrl && (
                      <a
                        href={`${BACKEND_URL}${r.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {r.originalName || 'Descargar archivo'}
                      </a>
                    )}
                    {(r.kind === 'EXTERNAL_LINK' || r.kind === 'VIDEO_EMBED') && r.externalUrl && (
                      <span className="truncate block">{r.externalUrl}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => togglePublish(r)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                    title={r.isPublished ? 'Ocultar' : 'Publicar'}
                  >
                    {r.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(r)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                    title="Editar"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(r.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">
                {editing ? 'Editar recurso' : 'Nuevo recurso informativo'}
              </h2>
              <button type="button" onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input
                  className="input-field"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción (opcional)</label>
                <textarea
                  className="input-field min-h-[80px]"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
                <select
                  className="input-field"
                  value={form.orgId}
                  onChange={(e) => setForm({ ...form, orgId: e.target.value })}
                >
                  <option value="">Todas las empresas</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Orden</label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-700">Publicado</span>
                  </label>
                </div>
              </div>

              {!editing && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de contenido</label>
                  <div className="space-y-2">
                    {(['FILE', 'EXTERNAL_LINK', 'VIDEO_EMBED'] as GeneralResourceKind[]).map((k) => (
                      <label key={k} className="flex items-center gap-2 cursor-pointer text-sm">
                        <input
                          type="radio"
                          name="kind"
                          checked={form.kind === k}
                          onChange={() => setForm({ ...form, kind: k })}
                        />
                        {KIND_LABELS[k]}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {editing && (
                <p className="text-xs text-slate-500">
                  Tipo actual: <strong>{KIND_LABELS[editing.kind]}</strong> (no se puede cambiar; crea otro recurso si necesitas otro tipo)
                </p>
              )}

              {!editing && form.kind === 'FILE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Archivo</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="block w-full text-sm text-slate-600"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-slate-400 mt-1">PDF, Office, imágenes, video, etc.</p>
                </div>
              )}

              {editing?.kind === 'FILE' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Reemplazar archivo (opcional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="block w-full text-sm text-slate-600"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}

              {((!editing && form.kind !== 'FILE') || (editing && editing.kind !== 'FILE')) && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {editing?.kind === 'VIDEO_EMBED' || (!editing && form.kind === 'VIDEO_EMBED')
                      ? 'URL del video (YouTube o Vimeo)'
                      : 'URL del enlace'}
                  </label>
                  <input
                    className="input-field"
                    type="url"
                    value={form.externalUrl}
                    onChange={(e) => setForm({ ...form, externalUrl: e.target.value })}
                    required={!editing || editing.kind !== 'FILE'}
                    placeholder="https://..."
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  Cancelar
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Guardando…' : editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
