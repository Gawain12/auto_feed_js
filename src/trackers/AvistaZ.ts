import $ from 'jquery';
import { BaseEngine } from '../core/BaseEngine';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { GMAdapter } from '../services/GMAdapter';
import { SettingsService } from '../services/SettingsService';
import { extractImdbId, extractTmdbId, matchLink } from '../common/rules/links';
import { getAudioCodecSel, getCodecSel, getMediumSel, getStandardSel, getType } from '../common/rules/text';
import { cleanMediaInfoText, getMediainfoPictureFromDescr } from '../common/rules/media';
import { dispatchFormEvents, readFieldValue } from '../common/dom/form';

/**
 * Shared engine for the AvistaZ network: AvistaZ (avistaz.to), CinemaZ (cinemaz.to), PrivateHD (privatehd.to).
 * Handles both detail page parsing (`/torrent/<id>-...`) and 2-step upload (`/upload/movie` -> `/upload/torrent/<id>`).
 */
export class AvistazEngine extends BaseEngine {
    private static readonly STEP_META_KEY = 'autofeed_avz_step_meta';

    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isSourcePage(url: URL): boolean {
        return /\/torrent\/\d+/i.test(url.pathname || '');
    }

    isFillComplete(): boolean {
        if (document.getElementById('file_name')) {
            return !!readFieldValue(['#file_name']);
        }
        if (document.getElementById('form_upload_torrent')) {
            const mi = readFieldValue(['#media_info', 'textarea[name="media_info"]']);
            return mi.length > 20;
        }
        return false;
    }

    async recoverForwardMeta(): Promise<TorrentMeta | null> {
        try {
            const raw = await GMAdapter.getValue<string | null>(AvistazEngine.STEP_META_KEY, null);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as { meta?: TorrentMeta; ts?: number };
            if (!parsed?.meta || !parsed.ts || Date.now() - parsed.ts > 15 * 60_000) {
                await GMAdapter.deleteValue(AvistazEngine.STEP_META_KEY);
                return null;
            }
            return parsed.meta;
        } catch {
            return null;
        }
    }

    async onNonUploadPage(): Promise<void> {
        try {
            await GMAdapter.deleteValue(AvistazEngine.STEP_META_KEY);
        } catch {}
    }

    async parse(): Promise<TorrentMeta> {
        this.log(`Parsing ${this.siteName} page...`);

        const readTableField = (label: string): string => {
            const wanted = label.toLowerCase();
            const rows = Array.from(document.querySelectorAll('div.table-responsive table tr'));
            for (const tr of rows) {
                const cells = tr.querySelectorAll('td, th');
                if (cells.length < 2) continue;
                const k = (cells[0].textContent || '').replace(/:/g, '').trim().toLowerCase();
                if (k === wanted) return (cells[1].textContent || '').replace(/\s+/g, ' ').trim();
            }
            return '';
        };

        const title =
            readTableField('Title') ||
            $('h1, .block-titled h3, h3.movie-title').first().text().trim() ||
            document.title.trim();
        const typeRaw = readTableField('Type');
        const ripType = readTableField('Rip Type');
        const quality = readTableField('Video Quality');

        let type = getType(`${typeRaw} ${title}`) || '电影';
        if (/TV/i.test(typeRaw)) type = '剧集';
        else if (/Movie/i.test(typeRaw)) type = '电影';

        const miRaw = (document.getElementById('collapseMediaInfo')?.textContent || '').trim();
        const mediainfo = cleanMediaInfoText(miRaw);

        const images: string[] = [];
        let imgBbcode = '';
        const screenBox = document.getElementById('collapseScreens');
        if (screenBox) {
            Array.from(screenBox.querySelectorAll('img')).forEach((img) => {
                const src = (img.getAttribute('data-src') || img.getAttribute('src') || img.src || '').trim();
                if (!src) return;
                const parent = img.parentElement as HTMLAnchorElement | null;
                const fullHref = parent && parent.tagName === 'A' && parent.href ? parent.href : src;
                images.push(fullHref);
                imgBbcode += parent && parent.tagName === 'A' && parent.href
                    ? `[url=${parent.href}][img]${src}[/img][/url] `
                    : `[img]${src}[/img] `;
            });
        }

        const description = `${mediainfo ? `[quote]\n${mediainfo}\n[/quote]\n\n` : ''}${imgBbcode}`.trim();

        const movieDetails = document.querySelector('.movie-details') || document.body;
        const detailsHtml = movieDetails.innerHTML || '';
        const rawImdbUrl = matchLink('imdb', detailsHtml) || matchLink('imdb', document.body.innerHTML) || '';
        const imdbId = extractImdbId(rawImdbUrl);
        // Strip AvistaZ's `https://anon.to?` outbound wrapper when building canonical IMDb URL.
        const imdbUrl = imdbId ? `https://www.imdb.com/title/${imdbId}/` : rawImdbUrl;
        const tmdbUrl = matchLink('tmdb', detailsHtml) || '';
        const tmdbId = extractTmdbId(tmdbUrl);

        const dlHref = $('a[href*="download/torrent"]').last().attr('href') || '';
        let torrentUrl = '';
        if (dlHref) {
            try { torrentUrl = new URL(dlHref, this.currentUrl).href; } catch { torrentUrl = dlHref; }
        }
        const torrentFilename = title ? `${title.replace(/\s+/g, '.')}.torrent` : undefined;
        const blob = `${title} ${ripType} ${quality} ${mediainfo}`;

        return {
            title,
            description,
            fullMediaInfo: mediainfo || undefined,
            type,
            mediumSel: getMediumSel(blob, title),
            standardSel: getStandardSel(`${quality} ${blob}`),
            codecSel: getCodecSel(blob),
            audioCodecSel: getAudioCodecSel(blob),
            sourceSite: this.siteName,
            sourceUrl: this.currentUrl,
            imdbUrl: imdbUrl || undefined,
            imdbId: imdbId || undefined,
            tmdbUrl: tmdbUrl || undefined,
            tmdbId: tmdbId || undefined,
            images,
            torrentUrl: torrentUrl || undefined,
            torrentFilename,
            torrentName: torrentFilename
        };
    }

    async fill(meta: TorrentMeta): Promise<void> {
        this.log(`Filling ${this.siteName} upload form...`);

        // Step 2 (`/upload/torrent/<id>`): fill release filename & anonymous toggle, then clear cache.
        const fileNameInput = document.getElementById('file_name') as HTMLInputElement | null;
        if (fileNameInput) {
            const title = (meta.targetTitle || meta.title || '').trim();
            if (title) {
                fileNameInput.value = title;
                dispatchFormEvents(fileNameInput);
            }
            const settings = await SettingsService.load();
            const anon = document.querySelector('input[name="anon_upload"]') as HTMLInputElement | null;
            if (settings.defaultAnonymous && anon && !anon.checked) {
                anon.checked = true;
                dispatchFormEvents(anon);
            }
            try { await GMAdapter.deleteValue(AvistazEngine.STEP_META_KEY); } catch {}
            return;
        }

        // Step 1 (`/upload/movie` or `/upload/tv`): save meta for Step 2, inject torrent & MediaInfo.
        try {
            await GMAdapter.setValue(AvistazEngine.STEP_META_KEY, JSON.stringify({ meta, ts: Date.now() }));
        } catch {}

        const form = document.getElementById('form_upload_torrent');
        if (form && !document.getElementById('autofeed-avz-summary')) {
            const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '') || '';
            const imdbHref = meta.imdbUrl || (imdbId ? `https://www.imdb.com/title/${imdbId}/` : '');
            const banner = document.createElement('div');
            banner.id = 'autofeed-avz-summary';
            banner.className = 'form-group';
            banner.style.padding = '8px 15px';
            banner.style.background = 'rgba(0, 113, 227, 0.08)';
            banner.style.borderRadius = '6px';
            banner.style.marginBottom = '12px';
            const titleRow = document.createElement('div');
            titleRow.textContent = `Name: ${meta.targetTitle || meta.title || ''}`;
            banner.appendChild(titleRow);
            if (imdbHref) {
                const imdbRow = document.createElement('div');
                imdbRow.textContent = 'IMDb: ';
                const a = document.createElement('a');
                a.href = imdbHref;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.textContent = imdbId || imdbHref;
                imdbRow.appendChild(a);
                banner.appendChild(imdbRow);
            }
            form.prepend(banner);
        }

        // MediaInfo
        const miInput = document.querySelector('#media_info, textarea[name="media_info"]') as HTMLTextAreaElement | null;
        if (miInput && !miInput.value.trim()) {
            const infos = getMediainfoPictureFromDescr(meta.description || '', { mediumSel: meta.mediumSel });
            const mi = (meta.fullMediaInfo || infos.mediainfo || '').replace(/\[\/?(quote|code)[^\]]*\]/gi, '').trim();
            if (mi) {
                miInput.value = mi;
                dispatchFormEvents(miInput);
            }
        }

        // Torrent file injection
        if (meta.torrentBase64 || meta.torrentUrl) {
            try {
                const { TorrentService } = await import('../services/TorrentService');
                const announce = document.body.textContent?.match(/https?:\/\/[^\s"'<>]*announce[^\s"'<>]*/i)?.[0] || null;
                const result = await TorrentService.buildForwardTorrentFile(meta, this.siteName, announce);
                const fileInput = document.querySelector('input[type="file"]#torrent_file, input[type="file"][name="torrent_file"]') as HTMLInputElement | null;
                if (result && fileInput) {
                    TorrentService.injectFileIntoInput(fileInput, result.file);
                }
            } catch (e) {
                console.error(`[Auto-Feed][${this.siteName}] File Injection Failed:`, e);
            }
        }
    }
}
