import $ from 'jquery';
import { GazelleEngine } from './Gazelle';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { GMAdapter } from '../services/GMAdapter';
import { extractImdbId, matchLink } from '../common/rules/links';
import { getAudioCodecSel, getCodecSel, getMediumSel, getStandardSel } from '../common/rules/text';
import { getMediainfoPictureFromDescr } from '../common/rules/media';
import { getSearchName } from '../common/rules/search';
import { dispatchFormEvents, readFieldValue } from '../common/dom/form';

function buildBtnSceneName(
    rawName: string,
    tvTitle: string,
    tvSeries: string,
    searchName: string,
    descBlob: string
): string {
    let name = rawName.trim();
    if (name.match(/S\d+E\d+-E?\d+/)) {
        name = name.replace(name.match(/S\d+E\d+-E?\d+/)![0], tvTitle);
    } else if (name.match(/E\d+-E?\d+/)) {
        name = name.replace(name.match(/E\d+-E?\d+/)![0], tvTitle);
    } else if (!name.match(/S\d+/) && tvTitle && !tvTitle.match(/Season/i)) {
        name = name.replace(searchName, `${searchName} ${tvTitle} `).replace(/ +/g, ' ');
    } else if (!name.match(/S\d+/i) && tvTitle.match(/Season/i)) {
        const season = tvTitle.match(/\d+/)?.[0] || '';
        if (season) {
            const sTag = season.length < 2 ? `S0${season}` : `S${season}`;
            name = name.replace(searchName, `${searchName} ${sTag} `).replace(/ +/g, ' ');
        }
    } else if (name.match(/S\d+/) && tvTitle && !tvTitle.match(/Season/i)) {
        name = name.replace(/S\d+(E\d+)?/, tvTitle).replace(/ +/g, ' ');
    }

    if (tvTitle && tvTitle === name.replace(/ /g, '.')) {
        if (name.match(/E\d+/i) && !name.match(/S\d+E\d+/i)) {
            name = name.replace(/(E\d+)/, 'S01$1');
        }
    }

    if (tvSeries) {
        if (!tvSeries.match(/(19|20)\d{2}/) && name.match(/[^S](19|20)\d{2}[^pP]/i)) {
            name = name.replace(/([^S])(19|20)\d{2}/i, '$1').replace(/ +/g, ' ');
        }
        if (tvSeries.match(/(19|20)\d{2}/) && !name.match(/(19|20)\d{2}[^pP]/)) {
            name = name.replace(searchName, tvSeries.replace(/[()]/g, ' ') + ' ').replace(/ +/g, ' ');
        } else if (tvSeries.match(/\(.*\)/)) {
            const country = tvSeries.match(/\((.*)\)/)?.[1] || '';
            if (country && !name.includes(country)) {
                name = name.replace(searchName, tvSeries.replace(/[()]/g, ' ') + ' ').replace(/ +/g, ' ');
            }
        } else if (searchName) {
            name = name.replace(searchName, tvSeries.replace(/[()]/g, ' ') + ' ').replace(/ +/g, ' ');
        }
    }

    name = name.replace(/4k/i, '2160p');

    const applyChannels = (channels: string, input: string): string => {
        const map: Record<string, { re: RegExp; str: string }> = {
            '1': { re: /1\.0/, str: '1.0' },
            '2': { re: /2\.0/, str: '2.0' },
            '6': { re: /5\.1/, str: '5.1' },
            '8': { re: /7\.1/, str: '7.1' }
        };
        const target = map[channels];
        if (!target) return input;
        let out = input;
        if (!out.match(target.re)) {
            out = out.replace(/(DDPA|AAC|DDP|FLAC|DTS|LPCM|TrueHD)/, `$1${target.str}`);
        }
        out = out.replace(
            /(H\.?265|H\.?264|x264|x265)(.*?)(DDPA|AAC|DDP|FLAC|DTS|LPCM|TrueHD)(2\.0|1\.0|5\.1|7\.1)/i,
            '$3 $4 $1 $2'
        );
        return out;
    };

    const chFromMi = descBlob.match(/Channel[^\n]*?(\d)/i)?.[1];
    if (chFromMi) {
        name = applyChannels(chFromMi, name);
    } else {
        const chFromAudio = descBlob.match(/(?:AUDIO.*CODEC.*?|音频编码.*?)(2\.0|1\.0|5\.1|7\.1)/i)?.[1];
        if (chFromAudio) {
            if (!name.includes(chFromAudio)) {
                name = name.replace(/(DDPA|AAC|DDP|FLAC|DTS|LPCM|TrueHD)/, `$1${chFromAudio}`);
            }
            name = name.replace(
                /(H\.?265|H\.?264|x264|x265)(.*?)(DDPA|AAC|DDP|FLAC|DTS|LPCM|TrueHD)(2\.0|1\.0|5\.1|7\.1)/i,
                '$3 $4 $1 $2'
            );
        } else {
            const chPlain = descBlob.match(/(\d)\s*channels/i)?.[1];
            if (chPlain) name = applyChannels(chPlain, name);
        }
    }

    if (name.match(/(WEB-DL|Bluray|HDTV).(1080p|4K|2160p|720p|480p)/i)) {
        name = name.replace(/(WEB-DL|Bluray|HDTV).(1080p|4K|2160p|720p|480p)/i, '$2 $1');
    }

    name = name.replace(/['’]/g, '').replace(/ +/g, ' ').replace(' -', '-');
    return name.replace(/ /g, '.').replace(/([,!?';\\:])\./g, '$1');
}

export class BTNEngine extends GazelleEngine {
    private static readonly STEP_META_KEY = 'autofeed_btn_step_meta';

    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    isFillComplete(): boolean {
        const scene = readFieldValue(['#scenename', 'input[name="scenename"]']);
        const desc = readFieldValue(['#release_desc', 'textarea[name="release_desc"]']);
        if (scene && desc.length > 20) return true;
        // On Step 1 (Autofill), consider complete once #autofill has a value.
        if (!document.getElementById('scenename') && document.getElementById('autofill')) {
            return !!readFieldValue(['#autofill']);
        }
        return false;
    }

    async recoverForwardMeta(): Promise<TorrentMeta | null> {
        try {
            const raw = await GMAdapter.getValue<string | null>(BTNEngine.STEP_META_KEY, null);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as { meta?: TorrentMeta; ts?: number };
            if (!parsed?.meta || !parsed.ts || Date.now() - parsed.ts > 15 * 60_000) {
                await GMAdapter.deleteValue(BTNEngine.STEP_META_KEY);
                return null;
            }
            return parsed.meta;
        } catch {
            return null;
        }
    }

    async onNonUploadPage(): Promise<void> {
        try {
            await GMAdapter.deleteValue(BTNEngine.STEP_META_KEY);
        } catch {}
    }

    private async fetchSeriesLinks(seriesHref: string): Promise<{ imdbUrl?: string; tvdbUrl?: string }> {
        if (!seriesHref) return {};
        let targetUrl = seriesHref;
        try {
            targetUrl = new URL(seriesHref, this.currentUrl).href;
        } catch {}

        try {
            const res = await GMAdapter.xmlHttpRequest({
                method: 'GET',
                url: targetUrl,
                timeout: 6000
            });
            const html = String(res?.responseText || '');
            if (!html) return {};
            const doc = new DOMParser().parseFromString(html, 'text/html');
            const links = Array.from(doc.querySelectorAll('.box a, a[href*="imdb.com"], a[href*="thetvdb.com"]')) as HTMLAnchorElement[];
            let imdbUrl = '';
            let tvdbUrl = '';
            for (const a of links) {
                const href = a.href || a.getAttribute('href') || '';
                if (!imdbUrl && /imdb\.com\/title\/tt\d+/i.test(href)) imdbUrl = href;
                if (!tvdbUrl && /thetvdb\.com/i.test(href)) tvdbUrl = href;
            }
            return { imdbUrl: imdbUrl || undefined, tvdbUrl: tvdbUrl || undefined };
        } catch {
            return {};
        }
    }

    async parse(): Promise<TorrentMeta> {
        this.log('Parsing BTN page...');
        const u = new URL(this.currentUrl);
        const tid = (u.searchParams.get('torrentid') || '').trim();
        const torrentTr = tid ? document.getElementById(`torrent_${tid}`) : null;

        let title = '';
        if (torrentTr?.previousElementSibling) {
            const td = torrentTr.previousElementSibling.querySelector('td');
            title = (td?.textContent || '').replace(/^»\s*/, '').replace(/\s+/g, ' ').trim();
        }
        if (!title) {
            title = ($('.thin h2').first().text() || document.title || '').replace(/\s*::\s*BroadcasTheNet.*$/i, '').trim();
        }

        let mediainfo = '';
        const images: string[] = [];
        let imgBbcode = '';

        const scope = torrentTr || document.getElementById('torrent_details') || document.body;
        const blockquotes = Array.from(scope.querySelectorAll('blockquote'));
        const miBox = blockquotes.find((bq) => /Unique ID|DISC INFO:|\.MPLS|General/i.test(bq.textContent || '')) || blockquotes[0] || null;

        if (miBox) {
            mediainfo = (miBox.textContent || '').trim();
            Array.from(miBox.querySelectorAll('img')).forEach((img) => {
                const src = img.getAttribute('src') || img.src || '';
                if (!src || /favicon|logo|avatar|icon|smiley/i.test(src)) return;
                images.push(src);
                const parent = img.parentElement as HTMLAnchorElement | null;
                if (parent && parent.tagName === 'A' && parent.href) {
                    imgBbcode += `[url=${parent.href}][img]${src}[/img][/url]`;
                } else {
                    imgBbcode += `[img]${src}[/img]`;
                }
            });
        }

        const description = `${mediainfo ? `[quote]\n${mediainfo}\n[/quote]\n\n` : ''}${imgBbcode}`.trim();

        let torrentHref =
            (tid ? $(`a[href*="download&id=${tid}"]`).first().attr('href') : '') ||
            $('a[href*="action=download"]').first().attr('href') ||
            '';
        let torrentUrl = '';
        if (torrentHref) {
            try {
                torrentUrl = new URL(torrentHref, this.currentUrl).href;
            } catch {
                torrentUrl = torrentHref;
            }
        }

        // Look for IMDb/TVDB on page first, then fetch series.php (legacy parity).
        let imdbUrl = matchLink('imdb', document.body.innerHTML) || '';
        let tvdbUrl = '';
        const seriesHref = $('.thin a[href*="series.php"]').first().attr('href') || $('.thin a').first().attr('href') || '';
        if (!imdbUrl && seriesHref) {
            const seriesLinks = await this.fetchSeriesLinks(seriesHref);
            if (seriesLinks.imdbUrl) imdbUrl = seriesLinks.imdbUrl;
            if (seriesLinks.tvdbUrl) tvdbUrl = seriesLinks.tvdbUrl;
        }
        const imdbId = extractImdbId(imdbUrl);

        const blob = `${title} ${mediainfo}`;
        const torrentFilename = title ? `${title.replace(/\s+/g, '.')}.torrent` : undefined;

        const meta: TorrentMeta = {
            title,
            description,
            fullMediaInfo: mediainfo || undefined,
            type: '剧集',
            mediumSel: getMediumSel(blob, title),
            standardSel: getStandardSel(blob),
            codecSel: getCodecSel(blob),
            audioCodecSel: getAudioCodecSel(blob),
            sourceSite: this.siteName,
            sourceUrl: this.currentUrl,
            imdbUrl: imdbUrl || undefined,
            imdbId: imdbId || undefined,
            tvdbUrl: tvdbUrl || undefined,
            images,
            torrentUrl: torrentUrl || undefined,
            torrentFilename,
            torrentName: torrentFilename
        };

        this.log(`Parsed BTN: ${meta.title}`);
        return meta;
    }

    async fill(meta: TorrentMeta): Promise<void> {
        this.log('Filling BTN upload form...');
        $('#dnu_header').parent().hide();

        let normalizedName = (meta.targetTitle || meta.title || '').trim();
        if (/S\d+ E\d+/i.test(normalizedName)) {
            normalizedName = normalizedName.replace(/(S\d+) (E\d+)/i, '$1$2');
        }
        const searchName = getSearchName(normalizedName, meta.type || '剧集');
        if (/complete/i.test(normalizedName) && !/S\d+/i.test(normalizedName)) {
            normalizedName = normalizedName.replace(/complete/i, 'S01');
        } else if (/complete/i.test(normalizedName) && /S\d+/i.test(normalizedName)) {
            normalizedName = normalizedName.replace(/complete/i, '');
        }
        normalizedName = normalizedName.replace(/ +/g, ' ').trim();

        const manualTable = document.getElementById('table_manual_upload_2');
        const isManualHidden = !!manualTable && window.getComputedStyle(manualTable).display === 'none';
        const hasSceneForm = !!document.getElementById('scenename') || !!document.getElementById('release_desc');
        if (isManualHidden || !hasSceneForm) {
            // BTN Step 1 (Autofill): prefill autofill inputs and preserve meta for Step 2.
            try {
                await GMAdapter.setValue(BTNEngine.STEP_META_KEY, JSON.stringify({ meta, ts: Date.now() }));
            } catch {}
            const autofillEl = document.getElementById('autofill') as HTMLInputElement | null;
            if (autofillEl && normalizedName) {
                autofillEl.value = normalizedName;
                dispatchFormEvents(autofillEl);
            }
            const seriesEl = document.getElementById('auto_series') as HTMLInputElement | null;
            if (seriesEl && searchName && !seriesEl.value) {
                seriesEl.value = searchName;
                dispatchFormEvents(seriesEl);
            }
            const seasonNum = normalizedName.match(/\bS0?(\d{1,2})\b/i)?.[1] || '';
            const seasonEl = document.getElementById('auto_season') as HTMLInputElement | null;
            if (seasonEl && seasonNum && !seasonEl.value) {
                seasonEl.value = seasonNum;
                dispatchFormEvents(seasonEl);
            }
            this.log('Prefilled BTN Step 1 Autofill and preserved meta for Step 2.');
            return;
        }

        // Arrived on Step 2: clear step cache once filled.
        try {
            await GMAdapter.deleteValue(BTNEngine.STEP_META_KEY);
        } catch {}

        // Torrent injection
        if (meta.torrentBase64 || meta.torrentUrl) {
            try {
                const { TorrentService } = await import('../services/TorrentService');
                const announce = String($('input[value*="announce"]').first().val() || '').trim() || null;
                const result = await TorrentService.buildForwardTorrentFile(meta, 'BTN', announce);
                if (result) {
                    TorrentService.injectTorrentForSite('BTN', result.file, result.filename);
                }
            } catch (e) {
                console.error('[Auto-Feed][BTN] File Injection Failed:', e);
            }
        }

        // Inject helper row (#imdbid + #fill) once.
        if (!document.getElementById('autofeed-btn-helper-row')) {
            const releaseLabel = $('td.label:contains(Release Name)').last().parent();
            if (releaseLabel.length) {
                releaseLabel.before(
                    `<tr id="autofeed-btn-helper-row"><td class="label">Links</td>` +
                    `<td><input type="text" id="imdbid" name="imdbid" size="60" /> ` +
                    `<input id="fill" type="button" value="辅助发布"></td></tr>`
                );
            }
        }

        const linkVal = meta.imdbUrl || meta.tmdbUrl || meta.tvdbUrl || '';
        if (linkVal) {
            $('#imdbid').val(linkVal);
        }

        const sceneInput = document.getElementById('scenename') as HTMLInputElement | null;
        if (sceneInput && normalizedName) {
            sceneInput.value = normalizedName;
            dispatchFormEvents(sceneInput);
            if (!document.getElementById('remind_scenename')) {
                $(sceneInput).after(
                    `<div id="remind_scenename" style="display:inline-block; margin-left:5px"><font color="red">请点击辅助发布后检查！！</font></div>`
                );
            }
        }

        if ($('#tags').length && !$('#tags').val() && !document.getElementById('remind_tags')) {
            $('#tags').after(
                `<div id="remind_tags" style="display:inline-block; margin-left:5px"><font color="red">请选择对应的标签！！</font></div>`
            );
        }

        let descr = meta.description || '';
        const quoteIdx = descr.search(/\[quote\]/i);
        if (quoteIdx >= 0) descr = descr.slice(quoteIdx);
        const parsed = getMediainfoPictureFromDescr(descr, { mediumSel: meta.mediumSel });
        let mediainfo = (meta.fullMediaInfo || parsed.mediainfo || '').trim();
        if (!mediainfo) {
            mediainfo = descr.replace(/\[\/?(quote|code)\]/gi, '').trim();
        }
        mediainfo = mediainfo.replace(/\[\/?(quote|code)\]/gi, '').trim();

        const descEl = document.getElementById('release_desc') as HTMLTextAreaElement | null;
        if (descEl && mediainfo) {
            descEl.value = mediainfo;
            dispatchFormEvents(descEl);
        }

        if (!/Video[\s\S]{0,10}?ID/i.test(mediainfo) && !document.getElementById('remind_desc')) {
            $('#fill').after(`<div id="remind_desc"><font color="red">请先将mediainfo补充完整后点击辅助发布！！</font></div>`);
        }

        // Bind legacy "辅助发布" formatting helper
        $('#fill').off('click.autofeed').on('click.autofeed', () => {
            $('#remind_scenename').find('font').css('color', 'yellow').text('已经点击辅助发布，请检查！！');
            const currentName = String($('#scenename').val() || normalizedName).trim();
            const tvTitle = String($('#title').val() || '').trim();
            const tvSeries = String($('#artist').val() || '').trim();
            const descBlob = `${meta.description || ''}\n${String($('#release_desc').val() || '')}`;

            const built = buildBtnSceneName(currentName, tvTitle, tvSeries, searchName, descBlob);
            if (tvTitle && tvTitle === currentName.replace(/ /g, '.') && /E\d+/i.test(currentName) && !/S\d+E\d+/i.test(currentName)) {
                const ep = tvTitle.match(/E\d+/i)?.[0];
                if (ep) $('#title').val(`S01${ep}`);
            }

            $('#scenename').val(built);
            if (sceneInput) dispatchFormEvents(sceneInput);
            $('#origin').val('P2P');

            const albumDesc = String($('#album_desc').val() || '');
            if (!/Season/i.test(albumDesc)) {
                const sNum = built.match(/S(\d+)/i)?.[1];
                const eNum = built.match(/E(\d+)/i)?.[1];
                if (sNum) {
                    const tpl =
                        `[b]Episode Name: [/b]\n[b]Season: ${parseInt(sNum, 10)} [/b]\n` +
                        `[b]Episode: ${eNum ? parseInt(eNum, 10) : ''} [/b]\n[b]Aired: [/b]\n\n[b]Episode Overview: [/b]`;
                    $('#album_desc').val(tpl);
                }
            }

            const codec = getCodecSel(built);
            if (codec === 'H264' || codec === 'X264') $('#bitrate').val('H.264');
            else if (codec === 'H265' || codec === 'X265') $('#bitrate').val('H.265');

            const medium = getMediumSel(built, built);
            if (medium === 'HDTV') $('#media').val('HDTV');
            else if (medium === 'WEB-DL') $('#media').val('WEB-DL');
            else if (medium === 'Blu-ray' || medium === 'UHD') $('#media').val('Bluray');

            const standard = getStandardSel(built);
            if (standard === '720p') $('#resolution').val('720p');
            else if (standard === '1080p') $('#resolution').val('1080p');
            else if (standard === '1080i') $('#resolution').val('1080i');
            else if (standard === '4K') $('#resolution').val('2160p');
        });
    }
}
