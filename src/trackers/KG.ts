import { BaseEngine } from '../core/BaseEngine';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { parseKG, fillKG } from '../templates/kg';
import { StorageService } from '../services/StorageService';
import { GMAdapter } from '../services/GMAdapter';
import { extractImdbId } from '../common/rules/links';

// KG uploads span several pages (search -> takeupload). The continue marker keeps the forwarded
// meta available across them; `kg_info` is the legacy-format payload written by the forward click.
const KG_CONTINUE_KEY = 'autofeed_kg_continue';
const KG_CONTINUE_TTL_MS = 40 * 60 * 1000;
const KG_INFO_KEY = 'kg_info';

const markContinue = () => {
    try {
        sessionStorage.setItem(KG_CONTINUE_KEY, JSON.stringify({ at: Date.now() }));
    } catch {}
};

const shouldContinue = (): boolean => {
    try {
        const raw = sessionStorage.getItem(KG_CONTINUE_KEY);
        if (!raw) return false;
        const at = Number(JSON.parse(raw || '{}')?.at || 0);
        if (!Number.isFinite(at) || at <= 0) return false;
        if (Date.now() - at > KG_CONTINUE_TTL_MS) {
            sessionStorage.removeItem(KG_CONTINUE_KEY);
            return false;
        }
        return true;
    } catch {
        return false;
    }
};

const convertLegacyInfo = (raw: any): TorrentMeta | null => {
    if (!raw || typeof raw !== 'object') return null;
    const imdbUrl = String(raw.url || '').trim();
    return {
        title: String(raw.name || '').trim(),
        description: String(raw.descr || '').trim(),
        fullMediaInfo: String(raw.full_mediainfo || '').trim(),
        imdbUrl,
        imdbId: extractImdbId(imdbUrl) || undefined,
        torrentUrl: String(raw.torrent_url || '').trim(),
        torrentBase64: String(raw.torrent_base64 || raw.torrentBase64 || '').trim(),
        torrentFilename: String(raw.torrent_name || '').trim(),
        torrentName: String(raw.torrent_name || '').trim(),
        mediumSel: String(raw.medium_sel || '').trim(),
        standardSel: String(raw.standard_sel || '').trim(),
        audioCodecSel: String(raw.audiocodec_sel || '').trim(),
        sourceSel: String(raw.source_sel || '').trim(),
        sourceSite: 'KG',
        sourceUrl: window.location.href,
        images: []
    };
};

const loadLegacyInfo = async (): Promise<TorrentMeta | null> => {
    try {
        const raw = await GMAdapter.getValue<string | null>(KG_INFO_KEY, null);
        return raw ? convertLegacyInfo(JSON.parse(raw)) : null;
    } catch {
        return null;
    }
};
import { hasIdQuery, isPage } from '../common/rules/pages';

export class KGEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    // Torrent and request details; userdetails.php must not match.
    isSourcePage(url: URL): boolean {
        return isPage(url, 'details.php', 'reqdetails.php') && hasIdQuery(url);
    }

    async parse(): Promise<TorrentMeta> {
        this.log('Parsing KG page...');
        return parseKG(this.config, this.currentUrl);
    }

    async fill(meta: TorrentMeta): Promise<void> {
        this.log('Filling KG form...');
        await fillKG(meta, this.config);
    }

    onForwardReceived(): void {
        markContinue();
    }

    async recoverForwardMeta(): Promise<TorrentMeta | null> {
        if (shouldContinue()) {
            return (await StorageService.load()) || loadLegacyInfo();
        }
        const cached = await StorageService.load();
        if (cached && cached.sourceSite && cached.sourceSite !== 'KG' && (cached.torrentBase64 || cached.torrentUrl)) {
            markContinue();
            return cached;
        }
        const hasFinalTorrentInput = !!document.querySelector('form[action*="takeupload"] input[type="file"], input[type="file"][name="file"]');
        if (!hasFinalTorrentInput) return null;
        const legacy = await loadLegacyInfo();
        if (legacy) markContinue();
        return legacy;
    }

    async onNonUploadPage(): Promise<void> {
        try { sessionStorage.removeItem(KG_CONTINUE_KEY); } catch {}
        try { await GMAdapter.deleteValue(KG_INFO_KEY); } catch {}
    }
}
