// URL classification helpers shared by engines (no DOM access).

/** Last path segment, lowercased: `/foo/details.php` -> `details.php`. */
export function pageName(url: URL): string {
    return (url.pathname || '').split('/').pop()?.toLowerCase() || '';
}

/** True when the URL's last path segment is one of `names` (case-insensitive). */
export function isPage(url: URL, ...names: string[]): boolean {
    const current = pageName(url);
    return names.some((name) => name.toLowerCase() === current);
}

/** `?id=123` style detail query. Matches `torrentid=` too, like the legacy checks. */
export function hasIdQuery(url: URL): boolean {
    return /id=\d+/i.test(url.search || '');
}

export function hasTorrentIdQuery(url: URL): boolean {
    return /torrentid=\d+/i.test(url.search || '');
}

/**
 * Generic single-torrent detail pages: NexusPHP `details.php?id=`, Unit3D `/torrents/123`,
 * MTeam `/detail/123`. Forum threads (`/forums/topics/…`) and other pages without a torrent
 * must not match, or the forward UI is injected where there is nothing to forward.
 */
export function isGenericDetailPage(url: URL): boolean {
    const path = url.pathname || '';
    return (
        (isPage(url, 'details.php', 'detail.php') && hasIdQuery(url)) ||
        /\/torrents\/\d+(?:\/|$)/i.test(path) ||
        /\/detail\/\d+(?:\/|$)/i.test(path)
    );
}

/** Upload / offer / create pages where a forwarded fill may happen. */
export function isUploadLikeUrl(url: string): boolean {
    return /upload|offer|torrents\/create|torrents\/upload|torrent\/upload|torrents\/add|upload\.php|p_torrent\/video_upload|#\/torrent\/add|\/torrent\/add/i.test(url);
}
