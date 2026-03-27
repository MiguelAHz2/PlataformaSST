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
