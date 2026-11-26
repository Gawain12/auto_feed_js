import $ from 'jquery';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { htmlToBBCode } from '../utils/htmlToBBCode';
import { extractImdbId, matchLink } from '../common/rules/links';
import { fetchGazelleRipLogs } from './musicRipLogs';

export interface MusicMetaPayload {
    musicName: string;
    musicAuthor: string;
    artists: string[];
    year: string;
    releaseType: string;
    musicType: string[];
    editionYear: string;
    editionTitle: string;
    recordLabel: string;
    catalogueNumber: string;
    media: string;
    format: string;
    bitrate: string;
    sampleRate: string;
    albumDesc: string;
    releaseDesc: string;
}

const RELEASE_TYPE_PATTERNS: Array<[RegExp, string]> = [
    [/\bSoundtrack\b|原声/i, 'Soundtrack'],
    [/\bAnthology\b|精选/i, 'Anthology'],
    [/\bCompilation\b|合辑/i, 'Compilation'],
    [/\bSingle\b|单曲/i, 'Single'],
    [/\bEP\b/i, 'EP'],
    [/\bLive\s*album\b|现场专辑/i, 'Live album'],
    [/\bConcert\s*Recording\b|音乐会录音/i, 'Concert Recording'],
    [/\bRemix\b|重混/i, 'Remix'],
    [/\bBootleg\b|私录/i, 'Bootleg'],
    [/\bInterview\b|访谈/i, 'Interview'],
    [/\bMixtape\b|私制合辑/i, 'Mixtape'],
    [/\bDemo\b|录音样带/i, 'Demo'],
    [/\bDJ\s*Mix\b|DJ\s*混音/i, 'DJ Mix'],
    [/\bAlbum\b|专辑/i, 'Album']
];

export function unwrapOpsImageCacheUrl(raw: string): string {
    let url = String(raw || '').trim();
    if (!url) return '';
    const decodeB64Url = (token: string): string => {
        try {
            const norm = token.replace(/-/g, '+').replace(/_/g, '/');
            const padded = norm + '='.repeat((4 - (norm.length % 4)) % 4);
            if (typeof atob === 'function') return atob(padded);
            return Buffer.from(padded, 'base64').toString('utf8');
        } catch {
            return '';
        }
    };
    const m = url.match(/^https?:\/\/imgcache\.opsfet\.ch\/[a-z]+\/[^/]+\/[^/]+\/([A-Za-z0-9_-]+)/i);
    if (m?.[1]) {
        const decoded = decodeB64Url(m[1]).trim();
        if (/^https?:\/\//i.test(decoded)) url = decoded;
    }
    try {
        const parsed = new URL(url);
        if (/orpheus\.network$/i.test(parsed.hostname) && /\/view\.php$/i.test(parsed.pathname)) {
            const inner = parsed.searchParams.get('u') || '';
            if (/^https?:\/\//i.test(inner)) {
                url = inner;
            } else if (inner) {
                const decodedInner = decodeB64Url(inner).trim();
                if (/^https?:\/\//i.test(decodedInner)) url = decodedInner;
            }
        }
    } catch {}
    return url;
}

const unwrapOpsCacheInText = (text: string): string =>
    String(text || '').replace(/https?:\/\/imgcache\.opsfet\.ch\/[^\s\]"'<>]+/gi, (hit) => unwrapOpsImageCacheUrl(hit));

export function normalizeMusicReleaseType(text: string): string {
    for (const [re, canonical] of RELEASE_TYPE_PATTERNS) {
        if (re.test(text)) return canonical;
    }
    return '';
}

export function parseEditionLine(editionText: string): {
    editionYear: string;
    recordLabel: string;
    catalogueNumber: string;
    editionTitle: string;
    media: string;
} {
    const cleaned = (editionText || '')
        .replace(/^[−–\-+]+\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (!cleaned) {
        return { editionYear: '', recordLabel: '', catalogueNumber: '', editionTitle: '', media: '' };
    }

    const mediaMatch = cleaned.match(/\b(CD|WEB|Vinyl|SACD|DVD|Blu[- ]?Ray|BD|Soundboard|DAT|Cassette|LaserDisc)\b/i);
    const media = mediaMatch ? mediaMatch[1] : '';

    const yearMatch = cleaned.match(/^((?:19|20)\d{2})\b/);
    const editionYear = yearMatch?.[1] || '';

    // Strip leading year and trailing media token to parse Label / CatNo / Edition Title.
    let rest = cleaned
        .replace(/^((?:19|20)\d{2})\s*[-–\/]?\s*/, '')
        .replace(/\s*\/\s*(CD|WEB|Vinyl|SACD|DVD|Blu[- ]?Ray|BD|Soundboard|DAT|Cassette|LaserDisc)\s*$/i, '')
        .trim();

    const parts = rest.split(/\s*\/\s*/).map((p) => p.trim()).filter(Boolean);
    let recordLabel = '';
    let catalogueNumber = '';
    let editionTitle = '';

    if (parts.length === 1) {
        if (!/^Original Release$/i.test(parts[0])) recordLabel = parts[0];
    } else if (parts.length === 2) {
        recordLabel = parts[0];
        catalogueNumber = parts[1];
    } else if (parts.length >= 3) {
        recordLabel = parts[0];
        catalogueNumber = parts[1];
        editionTitle = parts.slice(2).join(' / ');
    }

    return { editionYear, recordLabel, catalogueNumber, editionTitle, media };
}

export function parseFormatLine(formatText: string): {
    format: string;
    bitrate: string;
    media: string;
    sampleRate: string;
} {
    const t = (formatText || '').replace(/[▶»→\[\]]/g, ' ').replace(/\s+/g, ' ').trim();
    let format = '';
    if (/\bFLAC\b/i.test(t)) format = 'FLAC';
    else if (/\bDSD\b/i.test(t)) format = 'DSD';
    else if (/\bMP3\b/i.test(t)) format = 'MP3';
    else if (/\bAAC\b/i.test(t)) format = 'AAC';
    else if (/\bOgg\s*Vorbis\b|\bVorbis\b/i.test(t)) format = 'Ogg Vorbis';
    else if (/\bAC3\b/i.test(t)) format = 'AC3';
    else if (/\bDTS\b/i.test(t)) format = 'DTS';

    let bitrate = '';
    if (/24bit\s*Lossless/i.test(t)) bitrate = '24bit Lossless';
    else if (/\bLossless\b/i.test(t)) bitrate = 'Lossless';
    else if (/DSD(?:64|128|256|512)/i.test(t)) bitrate = t.match(/DSD(?:64|128|256|512)/i)![0].toUpperCase();
    else if (/V0\s*\(VBR\)|\bV0\b/i.test(t)) bitrate = 'V0 (VBR)';
    else if (/V1\s*\(VBR\)|\bV1\b/i.test(t)) bitrate = 'V1 (VBR)';
    else if (/V2\s*\(VBR\)|\bV2\b/i.test(t)) bitrate = 'V2 (VBR)';
    else if (/\b(320|256|192|160|128|96|64)\b/.test(t)) bitrate = t.match(/\b(320|256|192|160|128|96|64)\b/)![1];

    let media = '';
    const mediaMatch = t.match(/\b(WEB|CD|Vinyl|SACD|DVD|Blu[- ]?Ray|BD|Soundboard|DAT|Cassette|LaserDisc)\b/i);
    if (mediaMatch) media = mediaMatch[1];

    const srMatch = t.match(/\b(44\.1|48|88\.2|96|176\.4|192)\s*kHz\b/i);
    const sampleRate = srMatch ? `${srMatch[1]}kHz` : '';

    return { format, bitrate, media, sampleRate };
}

export async function parseMusicGazelle(config: SiteConfig, currentUrl: string): Promise<TorrentMeta> {
    const abs = (href: string) => {
        try { return new URL(href, currentUrl).href; } catch { return href; }
    };
    const torrentId = currentUrl.match(/torrentid=(\d+)/)?.[1] || '';

    const h2 = (document.querySelector('.header h2') || document.querySelector('h2')) as HTMLElement | null;
    const titleEn = (document.querySelector('#title_en')?.textContent || '').replace(/\s+/g, ' ').trim();
    const rawH2 = (titleEn || h2?.textContent || '').replace(/\s+/g, ' ').trim();

    let artists = Array.from(h2?.querySelectorAll('a[href*="artist.php"], a[href*="artist"]') || [])
        .map((a) => (a.textContent || '').trim())
        .filter(Boolean);
    // jpop uses `V.A.` in h2 and lists individual artists inside the sidebar artist box.
    if (artists.length === 1 && /^V\.A\.$/i.test(artists[0])) {
        const boxArtists = Array.from(document.querySelectorAll('.box_artists li a:first-child, .sidebar .box:nth-of-type(3) li a:first-child'))
            .map((a) => (a.textContent || '').trim())
            .filter(Boolean);
        if (boxArtists.length) artists = boxArtists;
    }
    const musicAuthor = artists.join(' & ');

    const yearMatch = rawH2.match(/\[((?:19|20)\d{2})(?:[.\-\/\s][^\]]*)?\]/);
    const year = yearMatch?.[1] || '';
    const brackets = Array.from(rawH2.matchAll(/\[([^\]]+)\]/g)).map((m) => m[1]);
    let releaseType = brackets.map(normalizeMusicReleaseType).find(Boolean) || 'Album';

    // Extract clean album title (prefer span[dir="ltr"] on RED/DIC/SugoiMusic, else strip artists & [year]/[type] brackets).
    let musicName = (h2?.querySelector('span[dir="ltr"]')?.textContent || '').trim();
    if (!musicName && rawH2) {
        let stripped = rawH2.replace(/\s*\[[^\]]+\]\s*/g, ' ').replace(/\s+/g, ' ').trim();
        const lastArtist = artists[artists.length - 1];
        if (lastArtist && stripped.includes(lastArtist)) {
            const after = stripped.slice(stripped.lastIndexOf(lastArtist) + lastArtist.length);
            musicName = after.replace(/^\s*[-–—]\s*/, '').trim();
        }
        if (!musicName) {
            const parts = stripped.split(/\s+[-–—]\s+/);
            musicName = parts.length > 1 ? parts.slice(1).join(' - ').trim() : stripped;
        }
    }

    // Cover image (prefer lightbox full URL from onclick, else img src; strip jpop `.th` thumbnail suffix; ignore UI/BBCode icons)
    let cover = '';
    const isUiIcon = (src: string) => /\/(?:bbc|icons?|smileys?|flags?|symbols)\//i.test(src) || /\.gif(?:[?#]|$)/i.test(src);
    const primaryCover = document.querySelector('#cover_div_0 img, .box_image img, p.thumbnail-container img') as HTMLImageElement | null;
    const fallbackCover = Array.from(document.querySelectorAll('.sidebar .box img, .box img')).find((img) => {
        const s = (img.getAttribute('src') || '').trim();
        const oc = (img.getAttribute('onclick') || '').trim();
        return (!!oc && /https?:\/\//i.test(oc)) || (!!s && !isUiIcon(s));
    }) as HTMLImageElement | undefined;
    const coverImg = primaryCover || fallbackCover || null;
    if (coverImg) {
        const onclick = coverImg.getAttribute('onclick') || '';
        const lightboxUrl =
            onclick.match(/https?:\/\/[^'")\s]+/i)?.[0] ||
            onclick.match(/'(\/[^']+)'/)?.[1] ||
            '';
        cover = lightboxUrl || coverImg.getAttribute('src') || coverImg.src || '';
        if (cover && !isUiIcon(cover)) {
            cover = abs(cover).replace(/\.th(?=\.(?:jpg|jpeg|png|webp|gif)(?:[?#]|$))/i, '');
        } else {
            cover = '';
        }
    }

    // Album description (preserve BBCode formatting instead of flattening with textContent)
    let infoBody: HTMLElement | null =
        (document.querySelector('.torrent_description .body') as HTMLElement | null) ||
        (document.querySelector('.torrent_description div:nth-child(2)') as HTMLElement | null) ||
        (document.querySelector('.box_torrent_description .pad') as HTMLElement | null);
    if (!infoBody) {
        // lztr: box containing `<strong>Info</strong>` -> `.body`
        const strongs = Array.from(document.querySelectorAll('div strong'));
        const infoStrong = strongs.reverse().find((s) => /Info/i.test(s.textContent || ''));
        infoBody = (infoStrong?.closest('.box, div')?.querySelector('div.body') as HTMLElement | null) || null;
    }
    if (!infoBody) {
        // jpop fallback: 3rd `.body` container
        const bodies = document.querySelectorAll('.body');
        infoBody = (bodies[2] as HTMLElement | null) || (bodies[bodies.length - 1] as HTMLElement | null) || null;
    }
    let albumDesc = '';
    let tracklist = '';
    if (infoBody) {
        albumDesc = htmlToBBCode(infoBody).trim();
        tracklist = (infoBody.textContent || '').trim();
    }

    // Format row + Edition row (semantic matching — handles text links AND lztr icon images like FLAC.png / Lossless.png)
    const downloadAnchor = torrentId
        ? (document.querySelector(
              `a[href*="action=download"][href*="id=${torrentId}"], a[href*="download&id=${torrentId}"]`
          ) as HTMLAnchorElement | null)
        : null;
    const rowEl =
        (torrentId ? document.getElementById(`torrent${torrentId}`) : null) ||
        (downloadAnchor?.closest('tr') as HTMLElement | null) ||
        null;
    let formatText = '';
    if (rowEl) {
        const links = Array.from(rowEl.querySelectorAll('a'));
        const formatLink =
            links.find((a) =>
                /\b(FLAC|MP3|AAC|AC3|DTS|DSD|Vorbis|Lossless|320|256|192|V0|V2)\b/i.test(a.textContent || '')
            ) ||
            links.find((a) =>
                Array.from(a.querySelectorAll('img')).some((im) =>
                    /(?:FLAC|MP3|AAC|DSD|Lossless|320|V0|V2)/i.test((im.getAttribute('src') || '') + ' ' + (im.getAttribute('alt') || ''))
                )
            );
        if (formatLink) {
            const imgTokens = Array.from(formatLink.querySelectorAll('img'))
                .map((im) => {
                    const src = im.getAttribute('src') || '';
                    const file = src.split('/').pop()?.replace(/\.[a-z0-9]+$/i, '') || '';
                    return decodeURIComponent(file).replace(/[_-]+/g, ' ').trim();
                })
                .filter(Boolean);
            const rawLinkText = (formatLink.textContent || '').replace(/^[▶»→]\s*/, '').replace(/\s+/g, ' ').trim();
            formatText = imgTokens.length ? `${imgTokens.join(' / ')} ${rawLinkText}`.replace(/\s+/g, ' ').trim() : rawLinkText;
        }
    }

    let editionText = '';
    if (rowEl) {
        let prev = rowEl.previousElementSibling;
        let steps = 0;
        while (prev && steps < 30) {
            const cls = (prev.className || '').toLowerCase();
            const txt = (prev.textContent || '').replace(/\s+/g, ' ').trim();
            if (
                cls.includes('edition') ||
                /^[−–\-+]?\s*(?:(?:19|20)\d{2}\b|Original Release\b)/i.test(txt) ||
                /^[−–]\s/.test(txt)
            ) {
                editionText = txt;
                break;
            }
            prev = prev.previousElementSibling;
            steps++;
        }
    }

    const parsedEdition = parseEditionLine(editionText);
    const parsedFormat = parseFormatLine(formatText);

    // Best-effort Gazelle AJAX enrichment (especially useful on lztr where format icons omit bitrate/release details)
    let ajaxData: any = null;
    if (torrentId && (config.name === 'lztr' || (!parsedFormat.format && typeof fetch === 'function'))) {
        try {
            const ajaxUrl = abs(`ajax.php?action=torrent&id=${torrentId}`);
            const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
            const timer = controller ? window.setTimeout(() => controller.abort(), 3500) : null;
            const res = await fetch(ajaxUrl, { credentials: 'include', signal: controller?.signal });
            if (timer) window.clearTimeout(timer);
            if (res.ok) {
                const json = await res.json();
                if (json?.status === 'success' && json?.response) ajaxData = json.response;
            }
        } catch {}
    }

    const ajaxGroup = ajaxData?.group;
    const ajaxTorrent = ajaxData?.torrent;
    if (ajaxGroup) {
        if (!cover && ajaxGroup.wikiImage) cover = abs(String(ajaxGroup.wikiImage));
        if (!albumDesc && ajaxGroup.wikiBBcode) albumDesc = String(ajaxGroup.wikiBBcode).trim();
        if (ajaxGroup.releaseName) releaseType = normalizeMusicReleaseType(String(ajaxGroup.releaseName)) || releaseType;
        if (!artists.length && Array.isArray(ajaxGroup.musicInfo?.artists)) {
            artists = ajaxGroup.musicInfo.artists.map((a: any) => String(a?.name || '').trim()).filter(Boolean);
        }
    }

    const finalFormat = String(ajaxTorrent?.format || parsedFormat.format || '');
    const finalBitrate = String(ajaxTorrent?.encoding || parsedFormat.bitrate || '');
    const media = String(ajaxTorrent?.media || parsedFormat.media || parsedEdition.media || '');
    const finalEditionYear = String(ajaxTorrent?.remasterYear || parsedEdition.editionYear || '');
    const finalEditionTitle = String(ajaxTorrent?.remasterTitle || parsedEdition.editionTitle || '');
    const finalRecordLabel = String(ajaxTorrent?.remasterRecordLabel || parsedEdition.recordLabel || ajaxGroup?.recordLabel || '');
    const finalCatNo = String(ajaxTorrent?.remasterCatalogueNumber || parsedEdition.catalogueNumber || ajaxGroup?.catalogueNumber || '');
    const sampleRate =
        parsedFormat.sampleRate ||
        (albumDesc.match(/\b(44\.1|48|88\.2|96|176\.4|192)\s*kHz\b/i)?.[1]
            ? `${albumDesc.match(/\b(44\.1|48|88\.2|96|176\.4|192)\s*kHz\b/i)![1]}kHz`
            : '');

    // Torrent-specific release description (skip uploader metadata blockquote!)
    let releaseDesc = '';
    const detailRow = torrentId ? document.getElementById(`torrent_${torrentId}`) : null;
    if (detailRow) {
        const bqs = Array.from(detailRow.querySelectorAll('blockquote'));
        const realBqs = bqs.filter((bq) => {
            const t = (bq.textContent || '').replace(/\s+/g, ' ').trim();
            if (!t) return false;
            if (/^(?:Uploaded\s+by|由\s*\S+\s*发布于)/i.test(t)) return false;
            return true;
        });
        if (realBqs.length) {
            releaseDesc = htmlToBBCode(realBqs[realBqs.length - 1]).trim();
        }
    }

    let tags = Array.from(document.querySelectorAll('.box_tags a[href*="taglist"], .tags a'))
        .map((a) => (a.textContent || '').trim())
        .filter(Boolean);
    if (!tags.length) {
        const tagBox = Array.from(document.querySelectorAll('div.box')).find((b) => /\bTags\b/i.test(b.querySelector('.head')?.textContent || b.textContent || ''));
        if (tagBox) {
            tags = Array.from(tagBox.querySelectorAll('li a:first-child'))
                .map((a) => (a.textContent || '').trim())
                .filter(Boolean);
        }
    }
    if (/原声|Soundtrack/i.test(rawH2) && !tags.some((t) => /soundtrack|ost/i.test(t))) {
        tags.push('soundtrack');
    }

    const torrentHref =
        (torrentId && $(`a[href*="action=download"][href*="id=${torrentId}"]`).first().attr('href')) ||
        (torrentId && $(`a[href*="download&id=${torrentId}"]`).first().attr('href')) ||
        '';
    const imdbUrl = matchLink('imdb', document.body.innerHTML) || '';

    const finalCover = unwrapOpsImageCacheUrl(cover);
    const finalAlbumDesc = unwrapOpsCacheInText(albumDesc);
    const finalReleaseDesc = unwrapOpsCacheInText(releaseDesc);

    const hasLogHint =
        Boolean(ajaxTorrent?.hasLog) ||
        /\bLog\b/i.test(formatText) ||
        !!detailRow?.querySelector('a[onclick*="show_logs"], a[href*="viewlog"]');
    let ripLogs = undefined;
    if (hasLogHint && torrentId && ['RED', 'OPS', 'DIC', 'lztr'].includes(config.name)) {
        const baseName = [musicAuthor, musicName].filter(Boolean).join(' - ') || rawH2 || config.name;
        const fetchedLogs = await fetchGazelleRipLogs(config.name, currentUrl, torrentId, baseName);
        if (fetchedLogs.length) ripLogs = fetchedLogs;
    }

    const descriptionParts: string[] = [];
    if (finalCover) descriptionParts.push(`[img]${finalCover}[/img]`);
    if (finalReleaseDesc) descriptionParts.push(finalReleaseDesc);
    if (finalAlbumDesc) descriptionParts.push(`[quote]\n${finalAlbumDesc}\n[/quote]`);
    const description = descriptionParts.join('\n\n').trim();

    const payload: MusicMetaPayload = {
        musicName,
        musicAuthor: artists.join(' & ') || musicAuthor,
        artists,
        year,
        releaseType,
        musicType: tags,
        editionYear: finalEditionYear,
        editionTitle: finalEditionTitle,
        recordLabel: finalRecordLabel,
        catalogueNumber: finalCatNo,
        media,
        format: finalFormat,
        bitrate: finalBitrate,
        sampleRate,
        albumDesc: finalAlbumDesc,
        releaseDesc: finalReleaseDesc
    };

    const cleanTitle = rawH2.replace(/–/g, '-').trim() || config.name;
    return {
        title: cleanTitle,
        smallDescr: formatText || undefined,
        subtitle: formatText || undefined,
        description,
        tracklist: tracklist || undefined,
        editionInfo: editionText || undefined,
        musicMedia: media || undefined,
        type: '音乐',
        sourceSite: config.name,
        sourceUrl: currentUrl,
        imdbUrl: imdbUrl || undefined,
        imdbId: imdbUrl ? extractImdbId(imdbUrl) : undefined,
        torrentUrl: torrentHref ? abs(torrentHref) : undefined,
        images: finalCover ? [finalCover] : [],
        ripLogs,
        originalDom: JSON.stringify(payload)
    };
}
