import $ from 'jquery';
import { GazelleEngine } from './Gazelle';
import { TorrentMeta } from '../types/TorrentMeta';
import { extractImdbId } from '../common/rules/links';
import { getMediainfoPictureFromDescr } from '../common/rules/media';
import { getSearchName } from '../common/rules/search';
import { dispatchFormEvents, setAllFormValues, setFirstFormValue } from '../common/dom/form';
import { SettingsService, getEffectiveTmdbApiKey } from '../services/SettingsService';
import { GMAdapter } from '../services/GMAdapter';

function extractTeamFromTitle(title: string): string {
    const m = String(title || '').match(/-(.*)$/);
    if (!m) return '';
    return m[1].split(/x264|x265|ac3|aac|dts|-/i).pop()?.trim() || '';
}

function getCleanMediaInfo(meta: TorrentMeta): { mediainfo: string; picInfo: string } {
    const info = getMediainfoPictureFromDescr(meta.description || '', { mediumSel: meta.mediumSel });
    const mediainfo = (meta.fullMediaInfo || info.mediainfo || '').replace(/\[\/?(?:quote|code|size|font|color)[^\]]*\]/gi, '').trim();
    return { mediainfo, picInfo: info.picInfo || '' };
}

async function resolveTmdbByImdb(imdbId: string): Promise<{ movieId?: string; tvId?: string }> {
    if (!imdbId) return {};
    try {
        const settings = await SettingsService.load();
        const apiKey = getEffectiveTmdbApiKey(settings);
        if (!apiKey) return {};
        const resp = await GMAdapter.xmlHttpRequest({
            method: 'GET',
            url: `https://api.themoviedb.org/3/find/${encodeURIComponent(imdbId)}?api_key=${encodeURIComponent(apiKey)}&external_source=imdb_id&include_adult=false&language=en-US`,
            timeout: 10000
        });
        const data = JSON.parse(resp?.responseText || '{}');
        const movieId = data?.movie_results?.[0]?.id ? String(data.movie_results[0].id) : undefined;
        const tvId = data?.tv_results?.[0]?.id
            ? String(data.tv_results[0].id)
            : data?.tv_episode_results?.[0]?.show_id
                ? String(data.tv_episode_results[0].show_id)
                : undefined;
        return { movieId, tvId };
    } catch {
        return {};
    }
}

async function injectGazelleTorrent(meta: TorrentMeta, siteName: string): Promise<void> {
    if (!meta.torrentBase64 && !meta.torrentUrl) return;
    try {
        const announce = (document.querySelector('input[value*="announce"]') as HTMLInputElement | null)?.value || null;
        const { TorrentService } = await import('../services/TorrentService');
        const result = await TorrentService.buildForwardTorrentFile(meta, siteName, announce);
        if (result) TorrentService.injectTorrentForSite(siteName, result.file, result.filename);
    } catch (e) {
        console.error(`[Auto-Feed][${siteName}] Torrent inject failed:`, e);
    }
}

/**
 * HDF (hdf.world) — French Gazelle tracker (legacy L27707).
 * Previously misclassified as Unit3D; uses Gazelle upload form (`#format`, `#bitrate`, `select[name="media"]`, `#team`, `#release_desc`, `#categories`, `#allocine_url`).
 */
export class HDFEngine extends GazelleEngine {
    async fill(meta: TorrentMeta): Promise<void> {
        await injectGazelleTorrent(meta, this.siteName);

        const title = meta.targetTitle || meta.title || '';
        const codecMap: Record<string, string> = {
            H265: 'H265',
            X265: 'x265',
            H264: 'H264',
            X264: 'x264',
            'VC-1': 'VC-1',
            'MPEG-2': 'MPEG-2'
        };
        let fmt = codecMap[meta.codecSel || ''] || '';
        if (/AVC/.test(title)) fmt = 'AVC';
        if (fmt) setAllFormValues('#format, select[name="format"]', fmt);

        const stdMap: Record<string, string> = {
            '720p': '720p',
            '1080i': '1080i',
            '1080p': '1080p',
            '4K': '2160p',
            '': 'Other'
        };
        const bitrate = stdMap[meta.standardSel || ''];
        if (bitrate) setAllFormValues('#bitrate, select[name="bitrate"]', bitrate);

        let mediaVal = '';
        if (meta.mediumSel === 'UHD' || meta.mediumSel === 'Blu-ray') mediaVal = 'Blu-Ray Original';
        else if (meta.mediumSel === 'Encode') mediaVal = 'Blu-Ray Rip';
        else if (meta.mediumSel === 'Remux') mediaVal = 'Blu-Ray Remux';
        else if (meta.mediumSel === 'WEB-DL') mediaVal = 'WEB-DL';
        if (/hd-dvd/i.test(title)) mediaVal = 'HD-DVD';
        if (mediaVal) setAllFormValues('select[name="media"], #media', mediaVal);

        const team = extractTeamFromTitle(title);
        if (team) setFirstFormValue('#team, input[name="team"]', team);

        const { mediainfo } = getCleanMediaInfo(meta);
        setFirstFormValue('#release_desc, textarea[name="release_desc"]', mediainfo || (meta.description || '').replace(/\[.*?\]/g, ''), { force: true });

        if (meta.type === '剧集') {
            const isAnime = /类[\s\S]{0,5}别[\s\S]{0,30}动画/.test(meta.description || '');
            setAllFormValues('#categories', isAnime ? '5' : '4');
        } else if (meta.type === '纪录') {
            setAllFormValues('#categories', '6');
        }

        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '');
        if (imdbId) {
            const tmdb = await resolveTmdbByImdb(imdbId);
            const url = tmdb.movieId
                ? `https://www.themoviedb.org/movie/${tmdb.movieId}`
                : tmdb.tvId
                    ? `https://www.themoviedb.org/tv/${tmdb.tvId}`
                    : '';
            if (url) setFirstFormValue('#allocine_url', url, { force: false });
        }
    }
}

/**
 * Anthelion (ANT, anthelion.me) — Movie Gazelle tracker (legacy L27197).
 */
export class ANTEngine extends GazelleEngine {
    async fill(meta: TorrentMeta): Promise<void> {
        await injectGazelleTorrent(meta, this.siteName);
        const settings = await SettingsService.load();

        const title = meta.targetTitle || meta.title || '';
        const { mediainfo, picInfo } = getCleanMediaInfo(meta);
        setFirstFormValue('#mediainfo, textarea[name="mediainfo"]', mediainfo || (meta.description || '').replace(/\[.*?\]/g, ''), { force: true });
        if (picInfo) {
            const urls = Array.from(picInfo.matchAll(/\[img\](.*?)\[\/img\]/gi)).map((m) => m[1].trim()).filter(Boolean);
            setFirstFormValue('#screenshots, textarea[name="screenshots"]', urls.length ? Array.from(new Set(urls)).join('\n') : picInfo);
        }

        const catEl = document.getElementById('categories') as HTMLSelectElement | null;
        if (catEl && $(catEl).is(':visible')) {
            setFirstFormValue('#title, input[name="title"]', getSearchName(title), { force: false });
            const year = title.match(/(?:19|20)\d{2}/)?.[0] || '';
            if (year) setFirstFormValue('#year, input[name="year"]', year, { force: false });
            if (meta.type === '剧集') {
                catEl.value = '2';
                dispatchFormEvents(catEl);
            }
        }

        let mediaVal = '';
        if (['UHD', 'Blu-ray', 'Encode', 'Remux'].includes(meta.mediumSel || '')) mediaVal = 'Blu-ray';
        else if (meta.mediumSel === 'HDTV') mediaVal = 'HDTV';
        else if (meta.mediumSel === 'WEB-DL') mediaVal = 'WEB';
        else if (meta.mediumSel === 'DVD') mediaVal = 'DVD';
        else if (meta.mediumSel === 'TV') mediaVal = 'TV';
        if (/hd-dvd/i.test(title)) mediaVal = 'HD-DVD';
        if (mediaVal) setAllFormValues('select[name="media"], #media', mediaVal);

        const codecMap: Record<string, string> = {
            H265: 'H265',
            X265: 'H265',
            H264: 'H264',
            X264: 'H264',
            'VC-1': 'VC-1',
            Xvid: 'XviD',
            XVID: 'XviD',
            'MPEG-2': 'MPEG-2'
        };
        if (meta.codecSel && codecMap[meta.codecSel]) {
            setAllFormValues('select[name="codec"], #codec', codecMap[meta.codecSel]);
        }

        const audioMap: Record<string, string> = {
            'DTS-HD': 'DTS',
            'DTS-HDMA:X 7.1': 'DTS',
            'DTS-HDMA': 'DTS',
            DTS: 'DTS',
            TrueHD: 'True-HD',
            Atmos: 'True-HD',
            LPCM: 'PCM',
            AC3: /E-AC-3|DD[P+]/i.test(`${title}\n${meta.description || ''}`) ? 'EAC3' : 'AC3',
            AAC: 'AAC',
            Flac: 'FLAC',
            MP3: 'MP3'
        };
        if (meta.audioCodecSel && audioMap[meta.audioCodecSel]) {
            setAllFormValues('select[name="audioformat"]', audioMap[meta.audioCodecSel]);
        }

        if (/Atmos/i.test(title)) {
            const cb = document.querySelector('input[value="Atmos"]') as HTMLInputElement | null;
            if (cb) { cb.checked = true; dispatchFormEvents(cb); }
        }
        if (/Remux/i.test(title)) {
            const cb = document.querySelector('input[value="Remux"]') as HTMLInputElement | null;
            if (cb) { cb.checked = true; dispatchFormEvents(cb); }
        }

        const stdMap: Record<string, string> = {
            SD: '480p',
            '720p': '720p',
            '1080i': '1080i',
            '1080p': '1080p',
            '4K': '2160p',
            '': 'Other'
        };
        if (stdMap[meta.standardSel || '']) {
            setAllFormValues('#ressel, select[name="resolution"]', stdMap[meta.standardSel || '']);
        }

        const team = extractTeamFromTitle(title);
        if (team) setFirstFormValue('#releasegroup, input[name="releasegroup"]', team);

        if (settings.defaultAnonymous) {
            const anon = document.querySelector('input[name="anonymous"]') as HTMLInputElement | null;
            if (anon && !anon.checked) { anon.checked = true; dispatchFormEvents(anon); }
        }

        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '');
        if (imdbId) {
            const tmdb = await resolveTmdbByImdb(imdbId);
            if (tmdb.movieId) {
                setFirstFormValue('#tmdbid, input[name="tmdbid"]', tmdb.movieId, { force: false });
            }
        }
    }
}

/**
 * TV-Vault (TVV, tv-vault.me) — Classic TV Gazelle tracker (legacy L27391).
 */
export class TVVEngine extends GazelleEngine {
    async fill(meta: TorrentMeta): Promise<void> {
        await injectGazelleTorrent(meta, this.siteName);

        const title = meta.targetTitle || meta.title || '';
        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '');
        if (imdbId) setFirstFormValue('input[name="imdb_link"]', imdbId);

        const year = title.match(/(?:19|20)\d{2}/g)?.pop() || '';
        if (year) setFirstFormValue('#year, input[name="year"]', year, { force: false });

        // Season / Episode formatted title: "Season 1, Episodes 02 (1080p)"
        const showInfo = title.match(/S\d+(?:E\d+)?/i)?.[0] || '';
        if (showInfo) {
            let tvvTitle = '';
            const s = showInfo.match(/S(\d+)/i)?.[1];
            const e = showInfo.match(/E(\d+)/i)?.[1];
            if (s) tvvTitle += `Season ${parseInt(s, 10)}`;
            if (e) tvvTitle += `, Episodes ${e}`;
            const res = title.match(/(?:720|1080|2160|576|480|4k)[pi]/i)?.[0];
            if (res) tvvTitle += ` (${res})`;
            if (tvvTitle) setFirstFormValue('#title, input[name="title"]', tvvTitle, { force: false });
        }

        const { mediainfo, picInfo } = getCleanMediaInfo(meta);
        const relDesc = [mediainfo, picInfo].filter(Boolean).join('\n\n') || (meta.description || '').replace(/\[\/?.{1,20}\]\n?/g, '');
        setFirstFormValue('#release_desc, textarea[name="release_desc"]', relDesc, { force: true });

        if (/Audio Video Interleave|AVI/i.test(relDesc)) setAllFormValues('#container', 'AVI');
        else if (/mp4|\.mp4/i.test(relDesc)) setAllFormValues('#container', 'MP4');
        else if (/Matroska|\.mkv/i.test(relDesc)) setAllFormValues('#container', 'MKV');
        else if (/\.mpg/i.test(relDesc)) setAllFormValues('#container', 'MPG');
        else if (/MPLS/i.test(meta.description || '')) setAllFormValues('#container', 'm2ts');

        let mediaVal = '';
        if (['UHD', 'Blu-ray', 'Encode', 'Remux'].includes(meta.mediumSel || '')) mediaVal = 'Blu-ray';
        else if (meta.mediumSel === 'HDTV') mediaVal = 'HDTV';
        else if (meta.mediumSel === 'WEB-DL') mediaVal = 'Web';
        else if (meta.mediumSel === 'DVD') mediaVal = /hd.?dvd/i.test(title) ? 'HD-DVD' : 'DVD';
        else if (meta.mediumSel === 'TV') mediaVal = 'TV';
        if (mediaVal) setAllFormValues('select[name="media"]', mediaVal);
        if (/hd-dvd/i.test(title)) setAllFormValues('#source', 'HD-DVD');

        const fmtMap: Record<string, string> = {
            H264: 'H.264',
            X264: 'H.264',
            H265: 'Other',
            X265: 'Other',
            'VC-1': 'Other',
            Xvid: 'XviD',
            XVID: 'XviD'
        };
        if (meta.codecSel && fmtMap[meta.codecSel]) setAllFormValues('select[name="format"]', fmtMap[meta.codecSel]);
        if (/dvd5/i.test(title)) setAllFormValues('#codec', 'DVD5');
        else if (/dvd9/i.test(title)) setAllFormValues('#codec', 'DVD9');

        const aformat = document.getElementsByName('aformat')[0] as HTMLSelectElement | undefined;
        if (aformat) {
            const idxMap: Record<string, number> = {
                AC3: 1,
                MP3: 2,
                AAC: 6,
                DTS: 7,
                'DTS-HD': 7,
                'DTS-HDMA': 7,
                'DTS-HDMA:X 7.1': 7,
                Flac: 8,
                LPCM: 9,
                TrueHD: 12,
                Atmos: 12,
                APE: 12,
                WAV: 12
            };
            const idx = idxMap[meta.audioCodecSel || ''] ?? 12;
            if (aformat.options[idx]) {
                aformat.selectedIndex = idx;
                dispatchFormEvents(aformat);
            }
        }
        setAllFormValues('select[name="tvdb_link_type"]', meta.type === '电影' ? 'movies' : 'series');
    }
}

/**
 * Nebulance (NBL, nebulance.io) — TV Gazelle tracker (legacy L27106).
 */
export class NBLEngine extends GazelleEngine {
    async fill(meta: TorrentMeta): Promise<void> {
        await injectGazelleTorrent(meta, this.siteName);

        const title = meta.targetTitle || meta.title || '';
        $('#categorywrap, #tvmaze, #mediainfowrap, #checkbutton').show();
        setAllFormValues('#category', /S\d+E\d+/i.test(title) ? '1' : '3');

        const { mediainfo } = getCleanMediaInfo(meta);
        setFirstFormValue('#media, textarea[name="media"]', mediainfo || (meta.description || '').replace(/\[.*?\]/g, ''), { force: true });

        // Auto-match TVMaze ID using IMDb ID when available
        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '');
        const searchName = getSearchName(title);
        if (imdbId || searchName) {
            try {
                const url = imdbId
                    ? `https://api.tvmaze.com/lookup/shows?imdb=${encodeURIComponent(imdbId)}`
                    : `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(searchName)}`;
                const resp = await GMAdapter.xmlHttpRequest({ method: 'GET', url, timeout: 10000 });
                const data = JSON.parse(resp?.responseText || 'null');
                const showId = imdbId
                    ? data?.id
                    : Array.isArray(data)
                        ? data[0]?.show?.id
                        : undefined;
                if (showId) setFirstFormValue('#tvmazeid, input[name="tvmazeid"]', String(showId), { force: false });
            } catch {}
        }
    }
}

/**
 * HD-Only (hd-only.org) — French Gazelle tracker (legacy L26898).
 */
export class HDOnlyEngine extends GazelleEngine {
    async fill(meta: TorrentMeta): Promise<void> {
        await injectGazelleTorrent(meta, this.siteName);

        const title = meta.targetTitle || meta.title || '';
        const isTv = meta.type === '剧集' || meta.type === '纪录' || meta.type === '综艺';
        if (isTv) {
            setAllFormValues('#categories', '1');
        }

        const applyFields = () => {
            const isAnim = /类.{0,5}型.*动画/.test(meta.description || '');
            if (meta.type === '电影') setAllFormValues('#releasetype', isAnim ? '7' : '1');
            else if (meta.type === '剧集' || meta.type === '综艺') setAllFormValues('#releasetype', isAnim ? '6' : '5');
            else if (meta.type === '纪录') setAllFormValues('#releasetype', '11');

            const codecMap: Record<string, string> = {
                H265: 'HEVC',
                X265: 'x265',
                H264: 'AVC',
                X264: 'x264',
                'VC-1': 'VC-1',
                'MPEG-2': 'MPEG-2',
                'MPEG-4': 'MPEG-2'
            };
            if (meta.codecSel && codecMap[meta.codecSel]) {
                setAllFormValues('select[name="format"]', codecMap[meta.codecSel]);
            }

            const bitrateEl = document.getElementsByName('bitrate')[0] as HTMLSelectElement | undefined;
            const stdIdx: Record<string, number> = { '4K': 6, '1080p': 1, '1080i': 3, '720p': 2, SD: 6, '': 6, '8K': 5 };
            if (bitrateEl && stdIdx[meta.standardSel || ''] !== undefined) {
                const idx = stdIdx[meta.standardSel || ''];
                if (bitrateEl.options[idx]) {
                    bitrateEl.selectedIndex = idx;
                    dispatchFormEvents(bitrateEl);
                }
            }

            let mediaVal = '';
            const is4K = meta.standardSel === '4K';
            if (meta.mediumSel === 'UHD') mediaVal = 'Blu-ray 4K';
            else if (meta.mediumSel === 'Blu-ray') mediaVal = 'Blu-ray HD';
            else if (meta.mediumSel === 'Remux') mediaVal = is4K ? 'Blu-ray Remux 4K' : 'Blu-ray Remux HD';
            else if (meta.mediumSel === 'HDTV') mediaVal = 'HDTV';
            else if (meta.mediumSel === 'Encode') mediaVal = is4K ? 'Blu-ray Rip 4K' : 'Blu-ray Rip HD';
            else if (meta.mediumSel === 'WEB-DL') mediaVal = is4K ? 'Web-DL/Rip 4K' : 'Web-DL/Rip HD';
            if (mediaVal) setAllFormValues('select[name="media"]', mediaVal);

            const team = title.split('-').pop()?.trim() || '';
            if (team) setFirstFormValue('#team', team);

            const { mediainfo } = getCleanMediaInfo(meta);
            setFirstFormValue('textarea[name="release_desc"]', mediainfo || meta.description || '', { force: true });
        };

        applyFields();
        if (isTv) window.setTimeout(applyFields, 1500);
    }
}
