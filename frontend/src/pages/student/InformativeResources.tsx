import { useState, useEffect, useMemo } from 'react';
import api, { BACKEND_URL } from '../../lib/api';
import { GeneralResource } from '../../lib/types';
import {
  getVideoEmbedUrl,
  isLikelyPdfUrl,
  isDirectVideoFileUrl,
} from '../../lib/embedVideo';
import {
  Newspaper,
  FileText,
  Link2,
  Video,
  ExternalLink,
  Download,
  Loader2,
  File,
  Table,
  AlertTriangle,
  Film,
} from 'lucide-react';

const KIND_LABELS: Record<string, string> = {
  FILE: 'Documento',
  EXTERNAL_LINK: 'Enlace',
  VIDEO_EMBED: 'Video',
};

interface PreviewData {
  html?: string;
  sheets?: Record<string, string>;
  sheetNames?: string[];
}

function fileUrlFull(r: GeneralResource): string {
  return `${BACKEND_URL}${r.fileUrl || ''}`;
}

/** Visor para archivos subidos (PDF, Office, video, imagen, etc.) */
function FileResourceViewer({ r }: { r: GeneralResource }) {
  const fk = r.fileKind || 'FILE';
  const treatAsPdf =
    fk === 'PDF' || (fk === 'FILE' && /\.pdf$/i.test(r.originalName || ''));

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [activeSheet, setActiveSheet] = useState('');

  const needsApiPreview = fk === 'WORD' || fk === 'EXCEL';

  useEffect(() => {
    if (!needsApiPreview || !r.id) return;
    setPreview(null);
    setPreviewLoading(true);
    api
      .get(`/general-resources/${r.id}/preview`)
      .then((res) => {
        setPreview(res.data);
        if (res.data.sheetNames?.length) setActiveSheet(res.data.sheetNames[0]);
      })
      .catch(() => setPreview(null))
      .finally(() => setPreviewLoading(false));
  }, [r.id, needsApiPreview]);

  const src = fileUrlFull(r);

  return (
    <div className="mt-4 space-y-3">
      {/* PDF */}
      {treatAsPdf && r.fileUrl && (
        <div
          className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
          style={{ height: 'min(70vh, 560px)' }}
        >
          <iframe src={src} className="w-full h-full" title={r.title} />
        </div>
      )}

      {/* Video archivo */}
      {fk === 'VIDEO' && r.fileUrl && (
        <div className="rounded-xl overflow-hidden bg-black">
          <video
            controls
            className="w-full max-h-[480px]"
            src={src}
            onError={(e) => {
              const url = src;
              (e.currentTarget.parentElement!).innerHTML = `
                <div class="p-6 text-center text-slate-400 text-sm">
                  <p class="mb-2">No se puede reproducir en el navegador.</p>
                  <a href="${url}" download class="text-teal-500 underline">Descargar video</a>
                </div>`;
            }}
          >
            Tu navegador no soporta este video.
          </video>
        </div>
      )}

      {/* Imagen */}
      {fk === 'IMAGE' && r.fileUrl && (
        <div className="rounded-xl overflow-hidden border border-slate-200 bg-white flex justify-center">
          <img src={src} alt={r.title} className="max-w-full object-contain max-h-[560px]" />
        </div>
      )}

      {/* Word */}
      {fk === 'WORD' && (
        <div>
          {previewLoading ? (
            <div className="flex items-center justify-center py-16 bg-slate-50 rounded-xl border border-slate-100">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="text-slate-500 text-sm">Cargando documento…</span>
            </div>
          ) : preview?.html ? (
            <div
              className="border border-slate-200 rounded-xl overflow-auto bg-white"
              style={{ maxHeight: 'min(70vh, 560px)' }}
            >
              <div
                className="p-6 prose prose-slate max-w-none lesson-content"
                dangerouslySetInnerHTML={{ __html: preview.html }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              No se pudo mostrar el Word aquí. Descarga el archivo.
            </div>
          )}
        </div>
      )}

      {/* Excel */}
      {fk === 'EXCEL' && (
        <div>
          {previewLoading ? (
            <div className="flex items-center justify-center py-16 bg-slate-50 rounded-xl border border-slate-100">
              <Loader2 className="w-6 h-6 animate-spin text-green-600 mr-2" />
              <span className="text-slate-500 text-sm">Cargando hoja de cálculo…</span>
            </div>
          ) : preview?.sheets ? (
            <div>
              {(preview.sheetNames?.length ?? 0) > 1 && (
                <div className="flex gap-1 mb-2 flex-wrap">
                  {preview.sheetNames?.map((name) => (
                    <button
                      key={name}
                      type="button"
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
                style={{ maxHeight: 'min(70vh, 560px)' }}
              >
                <div
                  className="excel-preview p-2"
                  dangerouslySetInnerHTML={{ __html: preview.sheets[activeSheet] || '' }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              No se pudo mostrar el Excel aquí. Descarga el archivo.
            </div>
          )}
        </div>
      )}

      {/* PowerPoint */}
      {fk === 'PRESENTATION' && r.fileUrl && (
        <div className="p-5 bg-orange-50 border border-orange-100 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <File className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="font-semibold text-orange-800">{r.originalName || 'Presentación'}</p>
              <p className="text-sm text-orange-700 mt-1">
                PowerPoint no se puede previsualizar en el navegador. Descárgala para abrirla.
              </p>
              <a
                href={src}
                download={r.originalName || undefined}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg"
              >
                <Download className="w-4 h-4" />
                Descargar
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Genérico / texto */}
      {fk === 'FILE' && !treatAsPdf && r.fileUrl && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-3">
          <File className="w-8 h-8 text-slate-400 flex-shrink-0" />
          <p className="text-sm text-slate-600 flex-1 min-w-0">{r.originalName || 'Archivo'}</p>
          <a
            href={src}
            download={r.originalName || undefined}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-lg"
          >
            <Download className="w-4 h-4" />
            Descargar
          </a>
        </div>
      )}

      {/* Descarga secundaria cuando hay vista */}
      {r.fileUrl &&
        (treatAsPdf || fk === 'VIDEO' || fk === 'IMAGE' || fk === 'WORD' || fk === 'EXCEL') && (
          <div className="pt-1 border-t border-slate-100">
            <a
              href={src}
              download={r.originalName || undefined}
              className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-teal-600"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar {r.originalName || 'archivo'}
            </a>
          </div>
        )}
    </div>
  );
}

/** Enlaces externos: YouTube, PDF público, video directo, iframe genérico */
function ExternalLinkViewer({ url, title }: { url: string; title: string }) {
  const embed = useMemo(() => getVideoEmbedUrl(url), [url]);
  const directVideo = useMemo(() => isDirectVideoFileUrl(url), [url]);
  const pdfRemote = useMemo(() => isLikelyPdfUrl(url), [url]);

  if (embed) {
    return (
      <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
        <iframe
          src={embed}
          title={title}
          className="w-full h-full min-h-[220px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (directVideo) {
    return (
      <div className="mt-4 rounded-xl overflow-hidden bg-black">
        <video controls className="w-full max-h-[480px]" src={url}>
          Tu navegador no soporta video HTML5.
        </video>
      </div>
    );
  }

  if (pdfRemote) {
    const gview = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    return (
      <div className="mt-4 space-y-2">
        <p className="text-xs text-slate-500">
          Visor de PDF (enlace público). Si no carga, usa el botón de abajo.
        </p>
        <div
          className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
          style={{ height: 'min(70vh, 560px)' }}
        >
          <iframe src={gview} className="w-full h-full" title={title} />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir PDF en nueva pestaña
        </a>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <div
        className="rounded-xl overflow-hidden border border-slate-200 bg-white"
        style={{ height: 'min(65vh, 520px)' }}
      >
        <iframe
          src={url}
          title={title}
          className="w-full h-full"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-popups-to-escape-sandbox"
        />
      </div>
      <p className="text-xs text-slate-500">
        Muchos sitios no permiten mostrarse dentro de la plataforma. Si ves la página en blanco, abre el
        enlace aparte.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-xl"
      >
        <ExternalLink className="w-4 h-4" />
        Abrir en nueva pestaña
      </a>
    </div>
  );
}

function VideoEmbedBlock({ url, title }: { url: string; title: string }) {
  const embed = getVideoEmbedUrl(url);
  if (embed) {
    return (
      <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
        <iframe
          src={embed}
          title={title}
          className="w-full h-full min-h-[220px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  if (isDirectVideoFileUrl(url)) {
    return (
      <div className="mt-4 rounded-xl overflow-hidden bg-black">
        <video controls className="w-full max-h-[480px]" src={url} />
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl w-full sm:w-auto"
    >
      <Video className="w-4 h-4" />
      Ver enlace de video
    </a>
  );
}

export default function InformativeResources() {
  const [items, setItems] = useState<GeneralResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/general-resources')
      .then((res) => setItems(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center">
            <Newspaper className="w-6 h-6 text-teal-700" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Recursos SST</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Material general: documentos, enlaces y videos con vista integrada cuando el formato lo permite.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        </div>
      ) : items.length === 0 ? (
        <div className="card text-center py-16">
          <Newspaper className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Aún no hay recursos publicados</p>
          <p className="text-slate-400 text-sm mt-1 max-w-md mx-auto">
            Si tu instructor ya subió material en borrador, debe publicarlo para que aparezca aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-10 max-w-5xl">
          {items.map((r) => (
            <article key={r.id} className="card overflow-hidden">
              <div className="flex items-start gap-3 mb-1">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {r.kind === 'FILE' &&
                    (r.fileKind === 'EXCEL' ? (
                      <Table className="w-5 h-5 text-green-600" />
                    ) : r.fileKind === 'VIDEO' ? (
                      <Film className="w-5 h-5 text-purple-600" />
                    ) : (
                      <FileText className="w-5 h-5 text-slate-600" />
                    ))}
                  {r.kind === 'EXTERNAL_LINK' && <Link2 className="w-5 h-5 text-slate-600" />}
                  {r.kind === 'VIDEO_EMBED' && <Video className="w-5 h-5 text-slate-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-lg text-slate-800 leading-snug">{r.title}</h2>
                  <span className="inline-block text-[11px] font-medium uppercase tracking-wide text-teal-700 bg-teal-50 px-2 py-0.5 rounded mt-1">
                    {KIND_LABELS[r.kind] || r.kind}
                    {r.kind === 'FILE' && r.fileKind ? ` · ${r.fileKind}` : ''}
                  </span>
                </div>
              </div>

              {r.description && <p className="text-slate-600 text-sm mb-2">{r.description}</p>}

              {r.kind === 'FILE' && r.fileUrl && <FileResourceViewer r={r} />}

              {r.kind === 'EXTERNAL_LINK' && r.externalUrl && (
                <ExternalLinkViewer url={r.externalUrl} title={r.title} />
              )}

              {r.kind === 'VIDEO_EMBED' && r.externalUrl && (
                <VideoEmbedBlock url={r.externalUrl} title={r.title} />
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
