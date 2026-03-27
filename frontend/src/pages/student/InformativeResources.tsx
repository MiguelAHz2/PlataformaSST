import { useState, useEffect } from 'react';
import api, { BACKEND_URL } from '../../lib/api';
import { GeneralResource } from '../../lib/types';
import { getVideoEmbedUrl } from '../../lib/embedVideo';
import {
  Newspaper, FileText, Link2, Video, ExternalLink, Download, Loader2,
} from 'lucide-react';

const KIND_LABELS: Record<string, string> = {
  FILE: 'Documento',
  EXTERNAL_LINK: 'Enlace',
  VIDEO_EMBED: 'Video',
};

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
              Material general para todos los trabajadores (aparte de los cursos por empresa)
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
          <p className="text-slate-400 text-sm mt-1">Tu instructor irá añadiendo material aquí.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {items.map((r) => (
            <article key={r.id} className="card overflow-hidden flex flex-col">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                  {r.kind === 'FILE' && <FileText className="w-5 h-5 text-slate-600" />}
                  {r.kind === 'EXTERNAL_LINK' && <Link2 className="w-5 h-5 text-slate-600" />}
                  {r.kind === 'VIDEO_EMBED' && <Video className="w-5 h-5 text-slate-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-slate-800 leading-snug">{r.title}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[11px] font-medium uppercase tracking-wide text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {KIND_LABELS[r.kind] || r.kind}
                    </span>
                  </div>
                </div>
              </div>

              {r.description && <p className="text-slate-600 text-sm mb-4 flex-1">{r.description}</p>}

              {r.kind === 'FILE' && r.fileUrl && (
                <a
                  href={`${BACKEND_URL}${r.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition-colors mt-auto"
                >
                  <Download className="w-4 h-4" />
                  {r.originalName ? `Abrir / descargar` : 'Descargar archivo'}
                </a>
              )}

              {r.kind === 'EXTERNAL_LINK' && r.externalUrl && (
                <a
                  href={r.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium rounded-xl transition-colors mt-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir enlace
                </a>
              )}

              {r.kind === 'VIDEO_EMBED' && r.externalUrl && (
                <div className="mt-auto space-y-3">
                  {(() => {
                    const embed = getVideoEmbedUrl(r.externalUrl);
                    if (embed) {
                      return (
                        <div className="rounded-xl overflow-hidden border border-slate-200 bg-black aspect-video">
                          <iframe
                            src={embed}
                            title={r.title}
                            className="w-full h-full min-h-[200px]"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      );
                    }
                    return (
                      <a
                        href={r.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors w-full"
                      >
                        <Video className="w-4 h-4" />
                        Ver video (enlace)
                      </a>
                    );
                  })()}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
