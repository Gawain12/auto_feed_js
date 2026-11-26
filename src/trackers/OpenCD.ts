import $ from 'jquery';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { NexusPHPEngine } from './NexusPHP';
import { TorrentService } from '../services/TorrentService';
import { hasIdQuery, isPage } from '../common/rules/pages';
import { repeat } from '../common/dom/repeat';
import { MusicMetaPayload, parseFormatLine } from './musicGazelleParse';
import { injectOpenCdRipLogs, parseOpenCdNfoLogs } from './musicRipLogs';

export function mapMusicTagsToOpenCdGenre(tagsBlob: string): string {
    const t = (tagsBlob || '').toLowerCase();
    if (/soundtrack|\bost\b|原声|score/.test(t)) return '4';
    if (/classical|symphony|concerto|opera|baroque|chamber|古典/.test(t)) return '3';
    if (/jazz|swing|bebop|bossa|爵士/.test(t)) return '8';
    if (/electronic|techno|house|ambient|trance|edm|synth|电子/.test(t)) return '14';
    if (/hip[\s.-]*hop|rap|嘻哈/.test(t)) return '17';
    if (/rock|metal|punk|grunge|摇滚/.test(t)) return '5';
    if (/indie|独立/.test(t)) return '16';
    if (/alternative|另类/.test(t)) return '20';
    if (/folk|acoustic|民谣/.test(t)) return '15';
    if (/country|bluegrass|乡村/.test(t)) return '19';
    if (/dance|disco|舞曲/.test(t)) return '13';
    if (/new[\s.-]*age|新世纪/.test(t)) return '12';
    if (/instrumental|piano|violin|guitar|器乐/.test(t)) return '11';
    if (/musical|音乐剧/.test(t)) return '18';
    if (/world|ethnic|世界音乐/.test(t)) return '21';
    if (/pop|cantopop|mandopop|jpop|kpop|流行/.test(t)) return '2';
    return '9';
}

export function mapMusicFormatToOpenCdStandard(blob: string): string {
    const t = (blob || '').toLowerCase();
    if (/\bflac\b/.test(t)) return '4';
    if (/\bwav\b/.test(t)) return '2';
    if (/\bdts\b/.test(t)) return '15';
    if (/\bdsf\b/.test(t)) return '18';
    if (/\bdff\b/.test(t)) return '17';
    if (/\bdst\b/.test(t)) return '19';
    if (/镜像|mirror|iso/.test(t)) return '1';
    return '';
}

export function mapMusicMediaToOpenCdMedium(blob: string): string {
    const t = (blob || '').toLowerCase();
    if (/shm-?cd/.test(t)) return '18';
    if (/xrcd/.test(t)) return '17';
    if (/hqcd/.test(t)) return '16';
    if (/lpcd/.test(t)) return '4';
    if (/hdcd/.test(t)) return '5';
    if (/sacd/.test(t)) return '6';
    if (/srcd/.test(t)) return '7';
    if (/k2cd|k2hd/.test(t)) return '8';
    if (/24kcd/.test(t)) return '2';
    if (/blu-?spec/.test(t)) return '19';
    if (/blu-?ray|\bbd\b/.test(t)) return '11';
    if (/\bdsd\b/.test(t)) return '3';
    if (/\bvinyl\b|黑胶/.test(t)) return '20';
    if (/\bdvd\b/.test(t)) return '14';
    if (/\bdat\b/.test(t)) return '10';
    if (/hi-?res/.test(t) || (/\bweb\b/.test(t) && /24\s*bit/.test(t))) return '22';
    if (/\bweb\b/.test(t)) return '21';
    if (/\bcd\b/.test(t)) return '1';
    return '';
}

// Dedicated engine entry for OpenCD (plugin_upload form quirks).
export class OpenCDEngine extends NexusPHPEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    // Live OpenCD detail pages use `plugin_details.php?id=` (legacy used `details.php?id=`).
    isSourcePage(url: URL): boolean {
        return isPage(url, 'plugin_details.php', 'details.php') && hasIdQuery(url);
    }

    async parse(): Promise<TorrentMeta> {
        this.log('Parsing OpenCD page...');
        // Live OpenCD `plugin_details.php` & legacy `details.php` source parser.
        if (
            this.currentUrl.includes('open.cd') &&
            document.getElementsByClassName('title').length &&
            document.getElementById('divdescr')
        ) {
            const title = (document.getElementsByClassName('title')[0] as HTMLElement).textContent?.trim() || '';
            const small = (document.getElementsByClassName('smalltitle')[0] as HTMLElement | undefined)?.textContent?.trim() || '';

            let cover = '';
            try {
                const coverBox = document.getElementsByClassName('cover')[0] as HTMLElement;
                const img = coverBox.getElementsByTagName('img')[0];
                const onclick = img.getAttribute('onclick') || '';
                cover = onclick.match(/'(.*)'/)?.[1] || img.getAttribute('src') || '';
                if (cover && !/^https?:\/\//i.test(cover)) cover = `https://open.cd/${cover.replace(/^\/+/, '')}`;
            } catch { }

            const descrText = (document.getElementById('divdescr')?.textContent || '').trim();
            const tracklist = (document.getElementById('divtracklist')?.textContent || '').trim();
            const nfo = (document.getElementById('divnfo')?.textContent || '').trim();
            let description = `${cover ? `[img]${cover}[/img]\n\n` : ''}${descrText}`.trim();
            if (tracklist) description += `\n\n[quote]${tracklist}[/quote]`;
            if (nfo) description += `\n\n[quote]${nfo}[/quote]`;

            const torrentTitle = $('a[href*="download.php"]').first().attr('title') || '';
            const dlText = $('td:contains("下载链接"):last').next().find('a').first().text().trim();
            const dlHref =
                $('td:contains("下载链接"):last').next().find('a').first().attr('href') ||
                $('a[href*="download.php?id="]').first().attr('href') ||
                '';
            let torrentUrl = dlText || dlHref || '';
            if (torrentUrl && !/^https?:\/\//i.test(torrentUrl)) {
                try { torrentUrl = new URL(torrentUrl, 'https://open.cd/').href; } catch { }
            }

            // Parse OpenCD metadata table rows (艺术家名 / 专辑名称 / 标签列表 / 格式 / 介质) for RED/OPS/DIC forwarding.
            const readRow = (label: string) => $(`td:contains("${label}"):last`).next().text().replace(/\s+/g, ' ').trim();
            const musicAuthor = readRow('艺术家名') || (title.includes('-') ? title.split('-')[0].trim() : '');
            const musicName = readRow('专辑名称') || (title.includes('-') ? title.split('-').slice(1).join('-').trim() : title);
            const tags = Array.from($('td:contains("标签列表"):last').next().find('a'))
                .map((e) => $(e).text().trim())
                .filter(Boolean);
            const year = (title.match(/(?:19|20)\d{2}/)?.[0]) || (small.match(/(?:19|20)\d{2}/)?.[0]) || '';
            const parsedFmt = parseFormatLine(`${title} ${small} ${descrText}`);

            const payload: Partial<MusicMetaPayload> = {
                musicName,
                musicAuthor,
                artists: musicAuthor ? musicAuthor.split(/\s*(?:&|,|\/)\s*/).filter(Boolean) : [],
                year,
                musicType: tags,
                format: parsedFmt.format || 'FLAC',
                bitrate: parsedFmt.bitrate || (/24\s*bit/i.test(`${title} ${small}`) ? '24bit Lossless' : 'Lossless'),
                media: parsedFmt.media || 'CD',
                albumDesc: [descrText, tracklist ? `[quote]\n${tracklist}\n[/quote]` : ''].filter(Boolean).join('\n\n'),
                releaseDesc: nfo
            };

            const ripLogs = parseOpenCdNfoLogs(nfo, title || `${musicAuthor} - ${musicName}`);

            return {
                title: title || 'OpenCD',
                subtitle: small || undefined,
                smallDescr: small || undefined,
                description,
                type: '音乐',
                sourceSite: this.config.name,
                sourceUrl: this.currentUrl,
                tracklist: tracklist || undefined,
                musicMedia: payload.media,
                torrentName: torrentTitle ? `${torrentTitle}.torrent` : undefined,
                torrentFilename: torrentTitle ? `${torrentTitle}.torrent` : undefined,
                torrentUrl: torrentUrl || undefined,
                images: cover ? [cover] : [],
                ripLogs: ripLogs.length ? ripLogs : undefined,
                originalDom: JSON.stringify(payload)
            };
        }

        return super.parse();
    }

    async fill(meta: TorrentMeta): Promise<void> {
        this.log('Filling OpenCD form...');
        // OpenCD plugin upload page (`plugin_upload.php`) has custom ids.
        const isPluginUpload =
            !!document.querySelector('#resource_name') ||
            !!document.querySelector('#audio_mode') ||
            /open\.cd\/plugin_upload\.php/i.test(this.currentUrl);

        if (!isPluginUpload) {
            await super.fill(meta);
            return;
        }

        const retry = (fn: () => void, times = 12, delayMs = 220) => repeat(fn, times, delayMs);

        const norm1 = (s: string) => (s || '').replace(/\*/g, '').replace(/–/g, '-').replace(/\s+/g, ' ').trim();
        const normBlock = (s: string) =>
            (s || '')
                .replace(/\*/g, '')
                .replace(/–/g, '-')
                .replace(/\r/g, '')
                .replace(/[ \t]+\n/g, '\n')
                .replace(/\n{3,}/g, '\n\n')
                .trim();

        let dom: Partial<MusicMetaPayload> = {};
        try {
            dom = JSON.parse(meta.originalDom || '{}') as Partial<MusicMetaPayload>;
        } catch { }

        const musicName = norm1(String(dom.musicName || ''));
        const musicAuthor = norm1(String(dom.musicAuthor || (Array.isArray(dom.artists) ? dom.artists.join(' & ') : '')));

        const rawTitle = norm1(meta.title || '');
        const subtitle = norm1(meta.subtitle || meta.smallDescr || '');
        const year =
            String(dom.year || '') ||
            (rawTitle.match(/\[((?:19|20)\d{2})/)?.[1]) ||
            (subtitle.match(/(?:19|20)\d{2}/)?.[0]) ||
            (rawTitle.match(/(?:19|20)\d{2}/)?.[0]) ||
            '';

        const strippedTitle = rawTitle.replace(/\s*\[[^\]]+\]\s*/g, ' ').replace(/\s+/g, ' ').trim();
        let artist = musicAuthor;
        let album = musicName;
        if (!album || !artist) {
            const parts = strippedTitle.split(' - ').map((p) => p.trim()).filter(Boolean);
            if (parts.length >= 2) {
                if (!artist) artist = parts[0];
                if (!album) album = parts.slice(1).join(' - ');
            } else if (!album) {
                album = strippedTitle || rawTitle;
            }
        }
        const displayName = norm1(artist && album ? `${artist} - ${album}` : (album || rawTitle));

        const cover =
            (Array.isArray(meta.images) && meta.images[0]) ||
            (meta.description || '').match(/\[img\](.*?)\[\/img\]/i)?.[1] ||
            '';

        let releaseDesc = normBlock(
            String(dom.albumDesc || '') ||
            (meta.description || '').replace(/^\s*\[img\][\s\S]*?\[\/img\]\s*/i, '').trim()
        );
        releaseDesc = releaseDesc
            .replace(/\[b\]\[color=green\]\[size=3\]本站提供的所有影视[\s\S]*$/i, '')
            .replace(/ \n \n/g, ' \n')
            .trim();
        let tracklist = normBlock(meta.tracklist || '');
        if (!tracklist) {
            const m = (meta.description || '').match(/◎曲目[\s\S]*$/);
            if (m?.[0]) tracklist = normBlock(m[0].replace(/^◎曲目/, '').trim());
        }
        if (tracklist && releaseDesc.includes(tracklist)) {
            releaseDesc = releaseDesc.replace(tracklist, '').trim();
        }

        const tagsArr = Array.isArray(dom.musicType)
            ? dom.musicType
            : typeof dom.musicType === 'string'
                ? (dom.musicType as string).split(',')
                : [];
        const tagsStr = tagsArr.map((x) => norm1(String(x || ''))).filter(Boolean).join(', ');
        const genreValue = mapMusicTagsToOpenCdGenre(`${tagsStr} ${dom.releaseType || ''} ${rawTitle}`);

        const smallDescrValue = (() => {
            const pieces = [
                dom.format || '',
                dom.bitrate || '',
                dom.media || meta.musicMedia || '',
                dom.recordLabel || '',
                dom.catalogueNumber || ''
            ].filter(Boolean);
            return pieces.length ? pieces.join(' / ') : subtitle;
        })();

        const frNameDict: Record<string, string> = {
            RED: 'Redacted',
            OPS: 'Orpheus',
            DIC: 'DICMusic',
            DICMusic: 'DICMusic',
            SugoiMusic: 'SugoiMusic',
            jpop: 'Jpopsuki',
            lztr: 'LzTr'
        };
        const frName = frNameDict[meta.sourceSite || ''] || '';

        const setValue = (
            el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null,
            v: string,
            opts?: { force?: boolean }
        ) => {
            if (!el || !v) return;
            const cur = ((el as any).value ?? '').toString().trim();
            if (!opts?.force && cur && cur !== '---') return;
            (el as any).value = v;
            try {
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            } catch { }
        };
        const setSelect = (el: HTMLSelectElement | null, v: string) => {
            if (!el || !v) return;
            const cur = (el.value || '').toString().trim();
            if (cur && cur !== '0' && cur !== '---') return;
            const exists = Array.from(el.options).some((o) => o.value === v);
            if (!exists) return;
            el.value = v;
            try {
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            } catch { }
        };

        const formatBlob = `${dom.format || ''} ${dom.bitrate || ''} ${subtitle} ${meta.editionInfo || ''} ${rawTitle}`;
        const mediaBlob = `${dom.media || ''} ${meta.musicMedia || ''} ${dom.bitrate || ''} ${meta.editionInfo || ''} ${subtitle} ${rawTitle}`;
        const standardVal = mapMusicFormatToOpenCdStandard(formatBlob);
        const mediumVal = mapMusicMediaToOpenCdMedium(mediaBlob);

        retry(() => {
            setSelect(document.querySelector('#browsecat, select[name="type"]') as HTMLSelectElement | null, '408');
            setValue(document.querySelector('#artist, input[name="artist"]') as HTMLInputElement | null, artist);
            setValue(document.querySelector('#resource_name, input[name="resource_name"]') as HTMLInputElement | null, album);
            setValue(document.querySelector('#name, input[name="name"]') as HTMLInputElement | null, displayName, { force: true });
            setValue(document.querySelector('#year, input[name="year"]') as HTMLInputElement | null, year);
            // OpenCD uses `#cover` (`input[name="cover"]`), NOT `#image`!
            setValue(document.querySelector('#cover, input[name="cover"], #image, input[name="image"]') as HTMLInputElement | null, cover);
            setValue(document.querySelector('#small_descr, input[name="small_descr"]') as HTMLInputElement | null, smallDescrValue);
            setSelect(document.querySelector('#source, select[name="source"]') as HTMLSelectElement | null, genreValue);
            setSelect(document.querySelector('#standard, select[name="standard"]') as HTMLSelectElement | null, standardVal);
            setSelect(document.querySelector('#medium, select[name="medium"]') as HTMLSelectElement | null, mediumVal);
            setSelect(document.querySelector('#share_rule, select[name="share_rule"]') as HTMLSelectElement | null, '3');
            setSelect(document.querySelector('#team, select[name="team"]') as HTMLSelectElement | null, '5');
            setValue(document.querySelector('#descr, textarea[name="descr"]') as HTMLTextAreaElement | null, releaseDesc);
            if (tracklist) {
                setValue(document.querySelector('textarea[name="track_list"]') as HTMLTextAreaElement | null, tracklist);
            }
            if (frName) {
                setValue(document.querySelector('#frname, input[name="frname"]') as HTMLInputElement | null, frName);
            }

            const audioMode = document.querySelector('#audio_mode') as HTMLSelectElement | null;
            if (audioMode && (!audioMode.value || audioMode.value === '---')) {
                const b = `${meta.editionInfo || ''} ${meta.smallDescr || ''} ${meta.subtitle || ''} ${tracklist}`;
                if (/整轨|image\s*\+\s*cue/i.test(b)) audioMode.value = 'single';
                else if (/分轨/i.test(b) || standardVal === '4') audioMode.value = 'multi';
                else audioMode.value = 'none';
                audioMode.dispatchEvent(new Event('change', { bubbles: true }));
                audioMode.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        // Plugin upload path bypasses generic Nexus file injection; inject cleaned torrent + CD rip logs here.
        try {
            if (meta.ripLogs?.length) {
                injectOpenCdRipLogs(meta.ripLogs);
            }
        } catch (e) {
            console.error('[Auto-Feed] OpenCD rip log injection failed:', e);
        }

        try {
            if (meta.torrentBase64 || meta.torrentUrl) {
                const result = await TorrentService.buildForwardTorrentFile(meta, this.config.name, null);
                if (result) {
                    const fileInput =
                        (document.querySelector('input[type="file"][name="file"]') as HTMLInputElement | null) ||
                        (document.querySelector('input[type="file"]#torrent') as HTMLInputElement | null) ||
                        (document.querySelector('input[type="file"]') as HTMLInputElement | null);
                    if (fileInput) {
                        TorrentService.injectFileIntoInput(fileInput, result.file);
                    }
                }
            }
        } catch (e) {
            console.error('[Auto-Feed] OpenCD torrent injection failed:', e);
        }
    }
}
