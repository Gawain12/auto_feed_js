import { TorrentMeta } from '../types/TorrentMeta';
import { TorrentService } from '../services/TorrentService';
import { repeat } from '../common/dom/repeat';
import { MusicMetaPayload, normalizeMusicReleaseType, parseEditionLine, parseFormatLine } from './musicGazelleParse';
import { injectGazelleRipLogs } from './musicRipLogs';

function parseOriginalDom(meta: TorrentMeta): Partial<MusicMetaPayload> {
    try {
        return (JSON.parse(meta.originalDom || '{}') || {}) as Partial<MusicMetaPayload>;
    } catch {
        return {};
    }
}

function norm(s: string): string {
    return (s || '').replace(/\*/g, '').replace(/–/g, '-').replace(/\s+/g, ' ').trim();
}

/**
 * Numeric Gazelle release type IDs shared across RED, OPS, and DIC (even when DIC displays Chinese labels).
 */
export function resolveGazelleReleaseTypeValue(
    releaseTypeHint: string,
    site: 'RED' | 'OPS' | 'DIC'
): string {
    const canonical = normalizeMusicReleaseType(releaseTypeHint) || 'Album';
    const map: Record<string, string> = {
        Album: '1',
        Soundtrack: '3',
        EP: '5',
        Anthology: '6',
        Compilation: '7',
        Single: '9',
        'Live album': '11',
        Remix: '13',
        Bootleg: '14',
        Interview: '15',
        Mixtape: '16',
        Demo: site === 'OPS' ? '10' : '17',
        'Concert Recording': '18',
        'DJ Mix': '19'
    };
    return map[canonical] || '1';
}

export function resolveGazelleMediaValue(mediaHint: string, site: 'RED' | 'OPS' | 'DIC'): string {
    const m = (mediaHint || '').toLowerCase();
    if (!m) return '';
    if (/\bweb\b|web[- ]?(?:dl|rip)/.test(m)) return 'WEB';
    if (/\bsacd\b/.test(m)) return 'SACD';
    if (/blu[- ]?ray|\bbd\b/.test(m)) {
        if (site === 'OPS') return 'BD';
        if (site === 'DIC') return 'Blu-ray';
        return 'Blu-Ray';
    }
    if (/\bvinyl\b/.test(m)) return 'Vinyl';
    if (/\bdvd\b/.test(m)) return 'DVD';
    if (/\bsoundboard\b/.test(m)) return 'Soundboard';
    if (/\bdat\b/.test(m)) return 'DAT';
    if (/\bcassette\b/.test(m)) return 'Cassette';
    if (/\blaserdisc\b/.test(m)) return 'LaserDisc';
    if (/\bcd\b|hdcd|lpcd|hqcd|xrcd|shm-cd/.test(m)) return 'CD';
    return '';
}

function pickSelectOption(select: HTMLSelectElement | null, preferredValue: string, fallbackText = '') {
    if (!select) return;
    const cur = (select.value || '').trim();
    if (cur && cur !== '---') return;

    const opts = Array.from(select.options);
    if (preferredValue) {
        const byValue = opts.find((o) => (o.value || '').toLowerCase() === preferredValue.toLowerCase());
        if (byValue) {
            select.value = byValue.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            select.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }
        const byText = opts.find((o) => (o.textContent || '').trim().toLowerCase() === preferredValue.toLowerCase());
        if (byText) {
            select.value = byText.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            select.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }
    }

    const h = (fallbackText || '').toLowerCase();
    if (!h) return;
    for (const o of opts) {
        const t = (o.textContent || '').trim().toLowerCase();
        if (!t || t === '---') continue;
        if (h.includes(t)) {
            select.value = o.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            select.dispatchEvent(new Event('input', { bubbles: true }));
            return;
        }
    }
}

function setInput(selector: string, value: string, opts?: { force?: boolean; native?: boolean }) {
    if (!value) return;
    const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) return;
    const cur = (el.value || '').trim();
    if (!opts?.force && cur) return;

    if (opts?.native && el instanceof HTMLInputElement) {
        try {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (setter) setter.call(el, value);
            else el.value = value;
        } catch {
            el.value = value;
        }
    } else {
        el.value = value;
    }

    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
}

function fillArtists(artists: string[]) {
    const cleaned = artists.map((a) => norm(a)).filter(Boolean);
    if (!cleaned.length) return;

    const getArtistInputs = () =>
        Array.from(document.querySelectorAll('input[name="artists[]"], #artist, #artist_0')) as HTMLInputElement[];

    // Click Gazelle's "+" button to add extra artist fields when needed (up to 6 artists).
    const wantCount = Math.min(cleaned.length, 6);
    const addBtn = document.querySelector('#artistfields a[onclick*="AddArtistField"], a[onclick*="AddArtistField"]') as HTMLElement | null;
    if (addBtn && wantCount > 1) {
        let currentCount = getArtistInputs().length;
        while (currentCount < wantCount) {
            addBtn.click();
            const nextCount = getArtistInputs().length;
            if (nextCount <= currentCount) break;
            currentCount = nextCount;
        }
    }

    const inputs = getArtistInputs();
    if (inputs.length >= wantCount) {
        for (let i = 0; i < wantCount; i++) {
            const el = inputs[i];
            if (!el.value.trim()) {
                el.value = cleaned[i];
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    } else if (inputs[0] && !inputs[0].value.trim()) {
        inputs[0].value = cleaned.join(' & ');
        inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    }
}

async function fillTorrentFile(meta: TorrentMeta, forwardSite: string) {
    if (!meta.torrentBase64 && !meta.torrentUrl) return;
    try {
        const announce = (document.querySelector('input[value*="announce"]') as HTMLInputElement | null)?.value || null;
        const result = await TorrentService.buildForwardTorrentFile(meta, forwardSite, announce);
        if (!result) return;

        // Target `input[name="file_input"]` explicitly first (on RED/DIC, `logfiles[]` also has id="file"!).
        const fileInput =
            (document.querySelector('input[type="file"][name="file_input"]') as HTMLInputElement | null) ||
            (document.querySelector('input[type="file"][name="file"]') as HTMLInputElement | null);
        if (fileInput) {
            TorrentService.injectFileIntoInput(fileInput, result.file);
            return;
        }
        TorrentService.injectTorrentForSite(forwardSite, result.file, result.filename);
    } catch (e) {
        console.error('[Auto-Feed] Music gazelle torrent injection failed:', e);
    }
}

export async function fillMusicGazelleUpload(meta: TorrentMeta, forwardSite: 'RED' | 'OPS' | 'DIC') {
    const domInfo = parseOriginalDom(meta);
    const title = norm(meta.title || '');

    const artists: string[] = Array.isArray(domInfo.artists) && domInfo.artists.length
        ? domInfo.artists
        : (() => {
            const rawAuthor = norm(String(domInfo.musicAuthor || ''));
            if (rawAuthor) return rawAuthor.split(/\s*(?:&|,|\/)\s*/).filter(Boolean);
            const parts = title.split(' - ').map((x) => x.trim()).filter(Boolean);
            return parts.length > 1 ? [parts[0]] : [];
        })();

    const albumTitle = (() => {
        const fromDom = norm(String(domInfo.musicName || ''));
        if (fromDom) return fromDom;
        const stripped = title.replace(/\s*\[[^\]]+\]\s*/g, ' ').replace(/\s+/g, ' ').trim();
        const parts = stripped.split(' - ').map((x) => x.trim()).filter(Boolean);
        return parts.length > 1 ? parts.slice(1).join(' - ') : stripped;
    })();

    const parsedEd = parseEditionLine(meta.editionInfo || '');
    const parsedFmt = parseFormatLine(`${meta.smallDescr || ''} ${meta.subtitle || ''} ${meta.musicMedia || ''}`);

    const year =
        String(domInfo.year || '') ||
        title.match(/\[((?:19|20)\d{2})/)?.[1] ||
        parsedEd.editionYear ||
        (meta.smallDescr || meta.subtitle || '').match(/(?:19|20)\d{2}/)?.[0] ||
        '';

    const editionYear = String(domInfo.editionYear || parsedEd.editionYear || '');
    const recordLabel = norm(String(domInfo.recordLabel || parsedEd.recordLabel || ''));
    const catalogueNumber = norm(String(domInfo.catalogueNumber || parsedEd.catalogueNumber || ''));
    const editionTitle = norm(String(domInfo.editionTitle || parsedEd.editionTitle || ''));

    const format = String(domInfo.format || parsedFmt.format || '');
    const bitrate = String(domInfo.bitrate || parsedFmt.bitrate || '');
    const media = resolveGazelleMediaValue(
        String(domInfo.media || meta.musicMedia || parsedFmt.media || parsedEd.media || `${meta.smallDescr || ''} ${meta.editionInfo || ''}`),
        forwardSite
    );
    const sampleRate = String(domInfo.sampleRate || parsedFmt.sampleRate || '');
    const releaseTypeValue = resolveGazelleReleaseTypeValue(
        `${domInfo.releaseType || ''} ${meta.title || ''} ${meta.smallDescr || ''}`,
        forwardSite
    );

    const tagsFromDom = Array.isArray(domInfo.musicType)
        ? domInfo.musicType
        : typeof domInfo.musicType === 'string'
            ? (domInfo.musicType as string).split(',')
            : [];
    const tagsText = tagsFromDom.map((x) => norm(String(x))).filter(Boolean).join(', ');

    const albumDesc = (
        String(domInfo.albumDesc || '') ||
        (meta.description || '').replace(/^\s*\[img\][\s\S]*?\[\/img\]\s*/i, '').replace(/\[quote=Tracklist\]/gi, '[quote]').trim()
    ).trim();
    const releaseDesc = String(domInfo.releaseDesc || '').trim();

    const retry = (fn: () => void, times = 12, delayMs = 260) => repeat(fn, times, delayMs);

    retry(() => {
        fillArtists(artists);
        setInput('#title, input[name="title"]', albumTitle, { native: true, force: true });
        setInput('#year, input[name="year"]', year, { native: true });

        // Release type (numeric ID works across English RED/OPS & Chinese DIC!)
        pickSelectOption(
            document.querySelector('#releasetype, select[name="releasetype"]') as HTMLSelectElement | null,
            releaseTypeValue
        );

        // Edition / Remaster fields
        const hasRemasterInfo = !!(editionYear || recordLabel || catalogueNumber || editionTitle);
        if (hasRemasterInfo) {
            const remasterBox = document.getElementById('remaster') as HTMLInputElement | null;
            if (remasterBox && !remasterBox.checked) {
                remasterBox.click();
            }
            setInput('#remaster_year, input[name="remaster_year"]', editionYear || year, { native: true });
            setInput('#remaster_title, input[name="remaster_title"]', editionTitle, { native: true });
            setInput('#remaster_record_label, input[name="remaster_record_label"]', recordLabel, { native: true });
            setInput('#remaster_catalogue_number, input[name="remaster_catalogue_number"]', catalogueNumber, { native: true });
        }
        // DIC also exposes original-release record_label / catalogue_number fields
        setInput('#record_label, input[name="record_label"]', recordLabel, { native: true });
        setInput('#catalogue_number, input[name="catalogue_number"]', catalogueNumber, { native: true });

        // Format / Bitrate / Media / Sample rate (DIC)
        pickSelectOption(document.querySelector('#format, select[name="format"]') as HTMLSelectElement | null, format);
        pickSelectOption(document.querySelector('#bitrate, select[name="bitrate"]') as HTMLSelectElement | null, bitrate);
        pickSelectOption(document.querySelector('#media, select[name="media"]') as HTMLSelectElement | null, media);
        if (sampleRate) {
            pickSelectOption(document.querySelector('#sample_rate, select[name="sample_rate"]') as HTMLSelectElement | null, sampleRate);
        }

        // Tags, cover image, album & release descriptions (cleanly separated!)
        setInput('#tags, input[name="tags"]', tagsText, { native: true });
        setInput('#image, input[name="image"]', (meta.images && meta.images[0]) || '', { native: true });
        setInput('#album_desc, textarea[name="album_desc"]', albumDesc);
        if (releaseDesc) {
            setInput('#release_desc, textarea[name="release_desc"]', releaseDesc);
        }

        // Attach CD rip `.log` files once Media=CD / Format=FLAC reveals `#upload_logs`.
        if (meta.ripLogs?.length) {
            injectGazelleRipLogs(meta.ripLogs);
        }
    });

    await fillTorrentFile(meta, forwardSite);
    if (meta.ripLogs?.length) {
        injectGazelleRipLogs(meta.ripLogs);
    }
}
