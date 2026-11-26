import { TorrentMeta } from '../../types/TorrentMeta';

export interface RebuildTitleOptions {
    preferredBaseName?: string;
    preferredYear?: string;
    releaseGroup?: string;
    requireDiscInfo?: boolean;
    defaultGroup?: string;
}

const norm = (s: string) => (s || '').replace(/\s+/g, ' ').trim();

function extractBaseFromDescr(blob: string): string {
    const patterns = [
        /◎片\s*名\s*([^\r\n]+)/i,
        /◎译\s*名\s*([^\r\n]+)/i,
        /(?:^|\n)Title\s*:\s*([^\r\n]+)/i
    ];
    for (const re of patterns) {
        const m = blob.match(re)?.[1];
        if (!m) continue;
        const v = m.split('/')[0].replace(/^\W+|\W+$/g, '').trim();
        if (v && v.length >= 2) return v;
    }
    return '';
}

function extractBaseFromTitle(title: string): string {
    let t = norm(title)
        .replace(/\.(mkv|mp4|avi|m2ts|ts|iso|rar|zip)$/i, '')
        .replace(/[._]+/g, ' ');
    if (!t) return '';
    t = t.replace(/\s*-\s*[A-Za-z0-9][A-Za-z0-9._-]{1,40}$/, '');

    const yearIdx = t.search(/\b(19|20)\d{2}\b/);
    if (yearIdx > 0) {
        const left = t.slice(0, yearIdx).trim();
        if (left.length >= 2) return left;
    }

    const tokenIdx = t.search(/\b(2160p|1080p|1080i|720p|UHD|Blu[- ]?ray|WEB[- .]?DL|Remux|HDTV|DVD|AVC|HEVC|x26[45]|H\.?26[45])\b/i);
    if (tokenIdx > 0) {
        const left = t.slice(0, tokenIdx).trim();
        if (left.length >= 2) return left;
    }

    return t.trim();
}

function extractYear(blob: string, title: string, preferred?: string): string {
    if (preferred && /^(19|20)\d{2}$/.test(preferred)) return preferred;
    const fromTitle = title.match(/\b(19|20)\d{2}\b/)?.[0] || '';
    if (fromTitle) return fromTitle;
    const fromDescr = blob.match(/◎年\s*代\s*([12]\d{3})/i)?.[1] || blob.match(/\b(19|20)\d{2}\b/)?.[0] || '';
    return fromDescr || '';
}

function pickFirst(blob: string, pairs: Array<[RegExp, string]>): string {
    for (const [re, value] of pairs) {
        if (re.test(blob)) return value;
    }
    return '';
}

// Require clean boundaries around channel layouts so MediaInfo numbers like "496.1 MiB" or "26.1 fps" never match "6.1".
const CHANNEL_TOKEN_SRC = '(?<![\\d.])(7\\.1|6\\.1|5\\.1|5\\.0|4\\.0|2\\.1|2\\.0|1\\.0)(?![\\d.]|\\s*(?:MiB|GiB|KiB|MB|GB|KB|kb\\/s|Mbps|fps|%|Hz|kHz|ms)\\b)';
const CHANNEL_RE = new RegExp(CHANNEL_TOKEN_SRC, 'i');

function extractChannelToken(text: string): string {
    return text.match(CHANNEL_RE)?.[1] || '';
}

function normalizeAudioToken(audio: string, channels: string): string {
    if (!audio) return '';
    let token = `${audio}${channels ? ` ${channels}` : ''}`.trim();
    // Defensive cleanup: avoid duplicated MA/HR fragments from noisy source titles.
    token = token.replace(/(DTS-HD MA)\s+(?:MA|Master(?:\s*Audio)?)/i, '$1');
    token = token.replace(/(DTS-HD HR)\s+(?:HR|HRA|High(?:\s*Resolution)?)/i, '$1');
    return token.replace(/\s+/g, ' ').trim();
}

export function rebuildReleaseTitleFromMedia(meta: Pick<TorrentMeta, 'title' | 'description' | 'fullMediaInfo'>, opts?: RebuildTitleOptions): string | null {
    const title = norm(meta.title || '');
    const blob = `${meta.description || ''}\n${meta.fullMediaInfo || ''}\n${title}`;
    if (!blob.trim()) return null;
    if (opts?.requireDiscInfo && !/(DISC INFO|\.MPLS|Disc Label|BDMV|Blu[- ]?ray|Ultra HD|UHD)/i.test(blob)) return null;

    const base =
        norm(opts?.preferredBaseName || '') ||
        extractBaseFromDescr(blob) ||
        extractBaseFromTitle(title);
    if (!base) return null;
    const year = extractYear(blob, title, opts?.preferredYear);
    const baseNoYear = year ? base.replace(new RegExp(`\\b${year}\\b`), '').trim() : base;

    const resolution = pickFirst(blob, [
        [/(^|[^0-9])2160[pi]?([^0-9]|$)|4K|3840\s*[xX]\s*2160/i, '2160p'],
        [/(^|[^0-9])1080p([^0-9]|$)/i, '1080p'],
        [/(^|[^0-9])1080i([^0-9]|$)/i, '1080i'],
        [/(^|[^0-9])720p([^0-9]|$)/i, '720p']
    ]);
    const medium = pickFirst(blob, [
        [/Ultra HD|UHD/i, 'UHD Blu-ray'],
        [/Blu[- ]?ray|DISC INFO|\.MPLS|Disc Label|BDMV/i, 'Blu-ray'],
        [/Remux/i, 'Remux'],
        [/WEB[- .]?(DL|RIP)|\bWEB\b/i, 'WEB-DL'],
        [/HDTV/i, 'HDTV'],
        [/DVD|DVDRip/i, 'DVD'],
        [/Encode|BDRip/i, 'Encode']
    ]);
    if (!medium) return null;
    const video = pickFirst(blob, [
        [/AVC Video|\bAVC\b/i, 'AVC'],
        [/HEVC|H\.?265|x265/i, 'HEVC'],
        [/MPEG-2 Video|MPEG-2/i, 'MPEG-2'],
        [/VC-1/i, 'VC-1'],
        [/H\.?264|x264/i, 'H.264']
    ]);

    const audioRules: Array<{ re: RegExp; audio: string }> = [
        { re: new RegExp(`TrueHD[\\s\\S]{0,120}?${CHANNEL_TOKEN_SRC}`, 'i'), audio: 'TrueHD' },
        { re: new RegExp(`DTS[- .]?X[\\s\\S]{0,120}?${CHANNEL_TOKEN_SRC}`, 'i'), audio: 'DTS-HD MA' },
        { re: new RegExp(`DTS[- .]?HD[\\s\\S]{0,40}?(?:MA|Master(?:\\s*Audio)?)[\\s\\S]{0,120}?${CHANNEL_TOKEN_SRC}`, 'i'), audio: 'DTS-HD MA' },
        { re: new RegExp(`DTS[- .]?HD[\\s\\S]{0,40}?(?:HR|HRA|High(?:\\s*Resolution)?)[\\s\\S]{0,120}?${CHANNEL_TOKEN_SRC}`, 'i'), audio: 'DTS-HD HR' },
        { re: new RegExp(`LPCM[\\s\\S]{0,120}?${CHANNEL_TOKEN_SRC}`, 'i'), audio: 'LPCM' },
        { re: new RegExp(`(?:\\bDDP\\b|E-?AC-?3|Dolby Digital Plus)[\\s\\S]{0,120}?${CHANNEL_TOKEN_SRC}`, 'i'), audio: 'DD+' },
        { re: new RegExp(`(?:\\bAC-?3\\b|\\bDD\\s*5\\.1|Dolby Digital)[\\s\\S]{0,120}?${CHANNEL_TOKEN_SRC}`, 'i'), audio: 'DD' },
        { re: new RegExp(`\\bDTS\\b[\\s\\S]{0,120}?${CHANNEL_TOKEN_SRC}`, 'i'), audio: 'DTS' },
        { re: new RegExp(`AAC[\\s\\S]{0,120}?${CHANNEL_TOKEN_SRC}`, 'i'), audio: 'AAC' },
        { re: new RegExp(`FLAC[\\s\\S]{0,120}?${CHANNEL_TOKEN_SRC}`, 'i'), audio: 'FLAC' }
    ];
    let audio = '';
    let channels = '';
    for (const item of audioRules) {
        const m = blob.match(item.re);
        if (!m) continue;
        audio = item.audio;
        channels = extractChannelToken(m[0] || '');
        break;
    }
    if (!channels) channels = extractChannelToken(blob);
    if (!audio) {
        audio = pickFirst(blob, [
            [/TrueHD/i, 'TrueHD'],
            [/DTS[- .]?HD[\s\S]{0,40}?(MA|Master)/i, 'DTS-HD MA'],
            [/DTS[- .]?HD[\s\S]{0,40}?(HR|HRA)/i, 'DTS-HD HR'],
            [/\bDTS\b/i, 'DTS'],
            [/LPCM|PCM/i, 'LPCM'],
            [/\bDDP\b|E-?AC-?3/i, 'DD+'],
            [/\bAC-?3\b|Dolby Digital/i, 'DD'],
            [/AAC/i, 'AAC'],
            [/FLAC/i, 'FLAC']
        ]);
    }
    if (!resolution && !video && !audio) return null;

    const audioToken = normalizeAudioToken(audio, channels);
    const core = [baseNoYear, year, resolution, medium, video, audioToken]
        .filter(Boolean)
        .join(' ')
        .replace(/ +/g, ' ')
        .trim();

    const titleGroup = title.match(/-([A-Za-z0-9][A-Za-z0-9._-]{1,40})$/)?.[1] || '';
    const rawGroup = norm(opts?.releaseGroup || titleGroup || opts?.defaultGroup || '');
    const group = rawGroup.replace(/[^A-Za-z0-9._-]/g, '');
    return group ? `${core}-${group}` : core;
}
