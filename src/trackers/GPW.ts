import $ from 'jquery';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { GazelleEngine } from './Gazelle';
import { extractImdbId, matchLink } from '../common/rules/links';
import { getMediainfoPictureFromDescr } from '../common/rules/media';
import { htmlToBBCode } from '../utils/htmlToBBCode';
import { repeat } from '../common/dom/repeat';

// Dedicated engine entry for GPW.
export class GPWEngine extends GazelleEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    async parse(): Promise<TorrentMeta> {
        this.log('Parsing GPW page...');
        const abs = (href: string) => {
            try { return new URL(href, this.currentUrl).href; } catch { return href; }
        };

        const torrentId = this.currentUrl.match(/torrentid=(\d+)/)?.[1] || '';
        const imdbUrl =
            matchLink('imdb', (document.querySelector('div.LayoutBody') as HTMLElement | null)?.innerHTML || '') ||
            matchLink('imdb', document.body.innerHTML) ||
            $('a[href*="imdb.com/title/tt"]').first().attr('href') ||
            '';

        let title = (document.querySelector('#content .header h2, #content h2, h2') as HTMLElement | null)?.textContent?.trim() || '';
        title = title.replace(/\(\d{4}\)/, '').replace(/\[.*?\]/g, '').trim();

        let description = '';
        let fullMediaInfo = '';
        let torrentUrl = '';
        let images: string[] = [];

        if (torrentId) {
            // Legacy GPW path: `#torrent_detail_${id}` with `.MediaInfoText` and comparison blocks.
            const detail =
                (document.getElementById(`torrent_detail_${torrentId}`) as HTMLElement | null) ||
                (document.getElementById(`torrent_${torrentId}`) as HTMLElement | null) ||
                (document.getElementById(`torrent${torrentId}`) as HTMLElement | null) ||
                (document.querySelector(`tr#torrent_${torrentId}`) as HTMLElement | null);

            if (detail) {
                // Prefer torrent-level filename hint when available.
                const detailName =
                    ($(detail).find('a[data-action="toggle-mediainfo"]').first().parent().text().split('详情 | ')[1] || '').trim() ||
                    ($(detail).find('table.filelist_table tr:eq(1) td:eq(0)').text() || '').trim();
                if (detailName) {
                    const clean = detailName.replace(/\[|\]|\(|\)/g, '').replace(/\.?(?:mkv|mp4)$/gi, '').trim();
                    if (clean) title = clean;
                }

                // GPW renders `.MediaInfoText` inside a hidden `<pre>` using `<br>` tags;
                // both `.textContent` and hidden `.innerText` drop `<br>` newlines unless converted first.
                const extractPreText = (el: HTMLElement | null | undefined): string => {
                    if (!el) return '';
                    const html = el.innerHTML || '';
                    if (/<br\s*\/?>|<\/(?:div|p|li|tr)>/i.test(html)) {
                        const tmp = document.createElement('div');
                        tmp.innerHTML = html
                            .replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<\/(?:div|p|li|tr)>/gi, '\n');
                        return (tmp.textContent || '').replace(/\u00a0/g, ' ').replace(/\r/g, '').trim();
                    }
                    return (el.innerText || el.textContent || '').replace(/\u00a0/g, ' ').replace(/\r/g, '').trim();
                };

                const miEl =
                    (detail.querySelector('.MediaInfoText') as HTMLElement | null) ||
                    (detail.querySelector('blockquote') as HTMLElement | null) ||
                    (detail.nextElementSibling?.querySelector('.MediaInfoText') as HTMLElement | null) ||
                    (detail.nextElementSibling?.querySelector('blockquote') as HTMLElement | null);
                const miText = extractPreText(miEl);
                if (miText) {
                    fullMediaInfo = miText.trim();
                    description += `[quote]\n${fullMediaInfo}\n[/quote]\n\n`;
                }

                $(detail).find('img.scale_image, img').each((_, e) => {
                    const src = ($(e).attr('src') || '').trim();
                    if (!src) return;
                    images.push(abs(src));
                    description += `[img]${abs(src)}[/img] `;
                });

                // Legacy comparison block support (`div.comparison`).
                $(detail).find('div.comparison a[onclick]').each((_, e) => {
                    const onclick = ($(e).attr('onclick') || '').trim();
                    if (!onclick) return;
                    const groups = onclick.match(/\[.*?\]/g) || [];
                    if (groups.length < 2) return;
                    const g0 = groups[0] || '';
                    const g1 = groups[1] || '';
                    const header = g0.replace(/\[|\]|'/g, '').replace(',', ' |').trim();
                    const pics = g1.replace(/\[|\]|'/g, '').split(',').map((x) => x.trim()).filter(Boolean);
                    if (!pics.length) return;
                    description += `\n\n[b]对比图[/b]\n\n${header}\n`;
                    pics.forEach((u) => {
                        const uu = abs(u);
                        images.push(uu);
                        description += `[img]${uu}[/img]`;
                    });
                });
            }

            const findGazelleDownloadHref = (tid: string): string => {
                const exact = $(`a[href*="download&id=${tid}"]`).first().attr('href') || '';
                if (exact) return exact;
                const anchors = Array.from(document.querySelectorAll('a[href*="action=download"]')) as HTMLAnchorElement[];
                for (const a of anchors) {
                    const raw = (a.getAttribute('href') || '').trim();
                    if (!raw) continue;
                    try {
                        const u = new URL(raw, this.currentUrl);
                        if (u.searchParams.get('id') === tid || u.searchParams.get('torrentid') === tid) {
                            return raw;
                        }
                    } catch {
                        if (new RegExp(`[?&](?:id|torrentid)=${tid}(?:&|$)`, 'i').test(raw)) return raw;
                    }
                }
                return '';
            };
            const href = findGazelleDownloadHref(torrentId);
            if (href) torrentUrl = abs(href);
        }

        if (!description) {
            const groupDescr = document.querySelector('.box_movie_info .pad, .box_movie_info, .box_torrent_description .pad') as HTMLElement | null;
            description = groupDescr ? htmlToBBCode(groupDescr) : '';
        }
        // Keep torrent binding strict by `torrentid`; do not fall back to group-level first torrent.

        return {
            title: title || 'GPW',
            description: description.trim(),
            type: '电影',
            sourceSite: this.config.name,
            sourceUrl: this.currentUrl,
            imdbUrl: imdbUrl || undefined,
            imdbId: imdbUrl ? extractImdbId(imdbUrl) : undefined,
            fullMediaInfo: fullMediaInfo || undefined,
            torrentUrl: torrentUrl || undefined,
            images: Array.from(new Set(images)).filter(Boolean)
        };
    }

    async fill(meta: TorrentMeta): Promise<void> {
        this.log('Filling GPW form...');
        await super.fill(meta);

        const isGPWUpload =
            /greatposterwall\.com\/upload\.php/i.test(this.currentUrl) ||
            !!document.querySelector('input[name="identifier"], #release_desc');
        if (!isGPWUpload) return;

        try {
            if (meta.torrentBase64 || meta.torrentUrl) {
                const { TorrentService } = await import('../services/TorrentService');
                const announce = (document.querySelector('input[value*="announce"]') as HTMLInputElement | null)?.value || null;
                const result = await TorrentService.buildForwardTorrentFile(meta, 'GPW', announce);
                if (result) TorrentService.injectTorrentForSite('GPW', result.file, result.filename);
            }
        } catch (e) {
            console.error('[Auto-Feed][GPW] Torrent inject failed:', e);
        }

        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '') || '';
        const year =
            (meta.subtitle || '').match(/(19|20)\d{2}/)?.[0] ||
            (meta.title || '').match(/(19|20)\d{2}/)?.[0] ||
            '';

        const sourceText = `${meta.mediumSel || meta.medium || ''}`.toLowerCase();
        const resolutionText = `${meta.standardSel || meta.resolution || ''}`.toLowerCase();
        const codecText = `${meta.codecSel || meta.codec || ''}`.toLowerCase();
        const fullText = `${meta.description || ''}\n${meta.fullMediaInfo || ''}\n${meta.title || ''}\n${meta.editionInfo || ''}`;

        const sourceValue = (() => {
            if (/uhd|blu-ray|bluray|encode|remux/.test(sourceText)) return 'Blu-ray';
            if (/DISC INFO|\.MPLS|Disc Label|BDMV|Blu[- ]?ray/i.test(fullText)) return 'Blu-ray';
            if (/hdtv/.test(sourceText)) return 'HDTV';
            if (/web/.test(sourceText)) return 'WEB';
            if (/dvd/.test(sourceText)) return 'DVD';
            if (/tv/.test(sourceText)) return 'TV';
            if (/vhs/.test(sourceText)) return 'VHS';
            return '';
        })();
        const resolutionValue = (() => {
            if (/4k|2160/.test(resolutionText)) return '2160p';
            if (/1080i/.test(resolutionText)) return '1080i';
            if (/1080/.test(resolutionText)) return '1080p';
            if (/720/.test(resolutionText)) return '720p';
            if (/576/.test(resolutionText)) return '576p';
            if (/480|sd/.test(resolutionText)) return '480p';
            return '';
        })();
        let codecOther = '';
        const codecValue = (() => {
            if (/x265/.test(codecText)) return 'x265';
            if (/h265|hevc/.test(codecText)) return 'H.265';
            if (/x264/.test(codecText)) return 'x264';
            if (/h264|avc/.test(codecText)) return 'H.264';
            if (/xvid/.test(codecText)) return 'XviD';
            if (/divx/.test(codecText)) return 'DivX';
            if (/vc-?1/.test(codecText)) { codecOther = 'VC-1'; return 'Other'; }
            if (/mpeg-?2/.test(codecText)) { codecOther = 'MPEG-2'; return 'Other'; }
            if (/av1/.test(codecText)) { codecOther = 'AV1'; return 'Other'; }
            return '';
        })();
        const containerValue = (() => {
            if (/vob ifo/i.test(fullText)) return 'VOB IFO';
            if (/\biso\b/i.test(fullText)) return 'ISO';
            if (/mp4|\.mp4/i.test(fullText)) return 'MP4';
            if (/matroska|\.mkv/i.test(fullText)) return 'MKV';
            if (/\.mpg/i.test(fullText)) return 'MPG';
            if (/mpls/i.test(fullText)) return 'm2ts';
            if (/audio video interleave|\.avi/i.test(fullText)) return 'AVI';
            return '';
        })();
        const infos = getMediainfoPictureFromDescr(meta.description || '', { mediumSel: meta.mediumSel });
        const mediaInfo = (meta.fullMediaInfo || infos.mediainfo || '').replace(/\[\/?quote\]/gi, '').trim();
        const mediaInfoLooksStructured = !!mediaInfo.match(/General|Disc Info|Disc Title|DISC INFO|Disc Label|RELEASE\.NAME|Unique ID/i) &&
            !mediaInfo.match(/General Information|General\.\.\.\.\.\.\.\./i);
        const candidateQuotes = (meta.description || '').match(/\[quote\][\s\S]*?\[\/quote\]/gi) || [];
        const miBlocks = candidateQuotes
            .map((q) => q.replace(/\[\/?quote.*?\]/gi, '').trim())
            .filter((q) => /General|Disc Info|Disc Title|DISC INFO|Disc Label|RELEASE\.NAME|Unique ID|\.MPLS|Video Codec/i.test(q));
        const extraQuoteBlocks = candidateQuotes
            .map((q) => q.replace(/\[\/?quote.*?\]/gi, '').trim())
            .filter((q) => q && !/General|Disc Info|Disc Title|DISC INFO|Disc Label|RELEASE\.NAME|Unique ID|\.MPLS|Video Codec/i.test(q));

        let extraText = (meta.description || '').replace(/\[quote\][\s\S]*?\[\/quote\]/gi, '').trim();
        extraText = extraText.replace(/^\s*\[img\][\s\S]*?\[\/img\]\s*/i, '').trim();
        const releaseInfoBlock = mediaInfo && !mediaInfoLooksStructured ? `[hide=Release Info]${mediaInfo}[/hide]` : '';
        const releaseDesc = [extraText, extraQuoteBlocks.join('\n\n'), releaseInfoBlock, infos.picInfo || '']
            .filter(Boolean)
            .join('\n\n')
            .trim();
        const processingValue = (() => {
            const titleBlob = `${meta.title || ''} ${meta.editionInfo || ''}`;
            if (sourceValue !== 'Blu-ray') return '';
            if ((meta.mediumSel || '').toLowerCase() === 'encode') return 'Encode';
            if ((meta.mediumSel || '').toLowerCase() === 'remux') return 'Remux';
            if (/DIY|@/i.test(titleBlob)) return 'DIY';
            return 'Untouched';
        })();
        const processingOther = (() => {
            const text = `${meta.editionInfo || ''} ${meta.description || ''}`;
            const m = text.match(/(DVD9|DVD5|BD25|BD50|BD66|BD100)/i)?.[1];
            return m || '';
        })();

        const setValue = (sel: string, value: string, opts?: { force?: boolean; native?: boolean }) => {
            if (!value) return;
            const el = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
            if (!el) return;
            const rawCur = ((el as any).value ?? '').toString().trim();
            const cur = rawCur === '---' || rawCur === '0' ? '' : rawCur;
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
                (el as any).value = value;
            }
            try {
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            } catch { }
        };
        const checkById = (id: string, checked: boolean) => {
            const el = document.getElementById(id) as HTMLInputElement | null;
            if (!el || el.checked === checked) return;
            el.checked = checked;
            try {
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            } catch { }
        };
        const clickIf = (sel: string) => {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) return;
            try { el.click(); } catch { }
        };
        const retry = (fn: () => void, times = 14, delayMs = 260) => repeat(fn, times, delayMs);

        retry(() => {
            if (imdbId) {
                setValue('input[name="identifier"]', imdbId, { force: true, native: true });
                clickIf('button[aria-label="自动填充"], button[aria-label="Auto Fill"]');
            } else {
                checkById('no_imdb_link', true);
            }

            // Do not overwrite movie title autofilled by IMDb (`force: false`).
            setValue('input[name="title"], input[name="name"], #title, #name', meta.title || '', { force: false, native: true });
            setValue('input[name="year"], #year', year, { force: false, native: true });
            setValue('input[name="image"], #image', (meta.images && meta.images[0]) || '', { force: false, native: true });
            setValue('#release_desc, textarea[name="release_desc"], textarea[name="description"], textarea[name="body"]', releaseDesc || meta.description || '', { force: false });
            if (mediaInfoLooksStructured) {
                const miAreas = Array.from(document.querySelectorAll('textarea[name="mediainfo[]"], textarea[name="mediainfo"], #mediainfo textarea')) as HTMLTextAreaElement[];
                if (miAreas.length) {
                    const quoted = (meta.fullMediaInfo || '').match(/\[quote\][\s\S]*?\[\/quote\]/gi) || [];
                    const parsedBlocks = (quoted.length ? quoted : miBlocks.map((b) => `[quote]${b}[/quote]`))
                        .map((q) => q.replace(/\[\/?quote\]/gi, '').trim())
                        .filter(Boolean);
                    if (parsedBlocks.length > 1 && miAreas.length > 1) {
                        miAreas.forEach((ta, idx) => {
                            const v = parsedBlocks[idx] || parsedBlocks[parsedBlocks.length - 1] || '';
                            if (!v) return;
                            ta.value = v;
                            ta.dispatchEvent(new Event('input', { bubbles: true }));
                            ta.dispatchEvent(new Event('change', { bubbles: true }));
                        });
                    } else {
                        miAreas.forEach((ta) => {
                            ta.value = mediaInfo;
                            ta.dispatchEvent(new Event('input', { bubbles: true }));
                            ta.dispatchEvent(new Event('change', { bubbles: true }));
                        });
                    }
                } else {
                    setValue('#mediainfo', mediaInfo, { force: false });
                }
            }

            setValue('#releasetype, select[name="releasetype"]', '1', { force: false });
            setValue('#source, select[name="source"]', sourceValue, { force: true });
            setValue('#processing, select[name="processing"]', processingValue, { force: true });
            setValue('select[name="processing_other"], #processing_other', processingOther, { force: false });
            setValue('#resolution, select[name="resolution"]', resolutionValue, { force: false });
            setValue('#codec, select[name="codec"]', codecValue, { force: false });
            if (codecValue === 'Other' && codecOther) {
                setValue('input[name="codec_other"]', codecOther, { force: false, native: true });
            }
            setValue('#container, select[name="container"]', containerValue, { force: false });

            // Edition / HDR / Audio / Dub / Subtitles checkboxes (legacy L2854-2936)
            const tTitle = meta.title || '';
            const tSmall = meta.smallDescr || meta.subtitle || '';
            const tDescr = meta.description || '';
            let hasEdition = false;
            const checkEdition = (id: string, on: boolean) => {
                if (!on) return;
                checkById(id, true);
                hasEdition = true;
            };
            checkEdition('dolby_vision', /Dolby.?Vision|杜比视界|\bDoVi\b|\bDV\b/i.test(`${tTitle} ${tSmall} ${tDescr}`));
            checkEdition('hdr10', /\bHDR10\b(?!\+)/i.test(`${tTitle} ${tSmall} ${tDescr}`));
            checkEdition('hdr10plus', /HDR10\+/i.test(`${tTitle} ${tSmall} ${tDescr}`));
            checkEdition('dolby_atmos', /Atmos/i.test(`${tTitle} ${tSmall}`));
            checkEdition('10_bit', /10.?bit/i.test(tTitle));
            checkEdition('dts_x', /DTS.?X(?![26])/i.test(tTitle));
            if (hasEdition) {
                checkById('movie_edition_information', true);
                const container = document.getElementById('movie_edition_information_container');
                if (container) container.style.display = 'block';
            }
            if (/国配|国语配音/.test(tSmall)) checkById('chinese_dubbed', true);
            if (/特效字幕/.test(`${tSmall} ${tDescr}`)) checkById('special_effects_subtitles', true);
        });
    }
}
