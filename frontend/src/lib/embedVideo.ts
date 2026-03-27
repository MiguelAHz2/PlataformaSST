/** Devuelve URL de embed de YouTube o null. */
export function youtubeEmbedFromUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname === 'youtu.be' || u.hostname.endsWith('.youtu.be')) {
      const id = u.pathname.replace(/^\//, '').split('/')[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v');
      if (v) return `https://www.youtube.com/embed/${v}`;
      const m = u.pathname.match(/\/embed\/([^/?]+)/);
      if (m) return `https://www.youtube.com/embed/${m[1]}`;
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/** Devuelve URL de embed de Vimeo o null. */
export function vimeoEmbedFromUrl(url: string): string | null {
  const m = url.trim().match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : null;
}

export function getVideoEmbedUrl(url: string): string | null {
  return youtubeEmbedFromUrl(url) || vimeoEmbedFromUrl(url);
}

/** URL que parece un PDF público (para visor de Google). */
export function isLikelyPdfUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return /\.pdf$/i.test(u.pathname) || /[./]pdf(\?|$)/i.test(u.pathname + u.search);
  } catch {
    return /\.pdf(\?|$)/i.test(url);
  }
}

/** Archivo de video directo (mp4, webm, etc.). */
export function isDirectVideoFileUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?|#|$)/i.test(url.trim());
}
