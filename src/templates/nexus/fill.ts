import $ from 'jquery';
import { TorrentMeta } from '../../types/TorrentMeta';
import { SiteConfig } from '../../types/SiteConfig';
import { getAudioCodecSel, getCodecSel, getMediumSel, getStandardSel } from '../../common/rules/text';
import { getMediainfoPictureFromDescr } from '../../common/rules/media';
import { extractDoubanId, extractImdbId } from '../../common/rules/links';
import { dispatchFormEvents } from '../../common/dom/form';
import { repeat } from '../../common/dom/repeat';
import { getMetaLabels } from '../../common/rules/labels';
import { resolveNexusProfileValues } from '../../common/rules/nexusProfile';
import { NexusFieldValue } from '../../types/SiteConfig';

export async function fillNexus(meta: TorrentMeta, config: SiteConfig): Promise<void> {
    const formSelectors = {
        name: 'input[name="name"]',
        smallDescr: 'input[name="small_descr"], input[name="small_desc"], input[name="subhead"]',
        descr: 'textarea[name="descr"], textarea[name="body"]',
        imdb: 'input[name="imdb_id"], input[name="imdbid"], input[name="imdb"], input[name="imdb_url"], input[name="imdburl"], input[name="pt_gen[imdb][link]"], input[name="url"][type="text"], input[name="url"][type="url"]',
        douban: 'input[name="douban"], input[name="douban_id"], input[name="doubanid"], input[name="douban_url"], input[name="dburl"], input[name="url_douban"], input[name="durl"], input[name="pt_gen[douban][link]"]',
        torrent: 'input[type="file"]#file, input[name="file"], input[name="torrent"]'
    };

    const overrides = config.selectors || {};

    const titleVal = meta.targetTitle || meta.title || '';
    const smallDescrVal = meta.subtitle || meta.smallDescr || '';
    const descrVal = meta.description || '';
    const nameInputSelector = overrides.nameInput || formSelectors.name;

    const forceSetNameField = (value: string) => {
        if (!value) return;
        $(nameInputSelector).each((_, el) => {
            const input = el as HTMLInputElement | HTMLTextAreaElement;
            if ((input.value || '').trim() === value.trim()) return;
            input.value = value;
            dispatchFormEvents(input);
        });
    };
    const lockNameAfterFileInject = () => {
        if (!titleVal) return;
        [0, 120, 380, 900, 1800, 3000].forEach((ms) => {
            window.setTimeout(() => forceSetNameField(titleVal), ms);
        });
    };

    forceSetNameField(titleVal);
    lockNameAfterFileInject();
    $(overrides.smallDescrInput || formSelectors.smallDescr).val(smallDescrVal);
    $(overrides.descrInput || formSelectors.descr).val(descrVal);

    // Fill IMDb / Douban fields:
    // - `imdb_id` should receive `ttxxxx`
    // - `url` (or similar) should receive full IMDb URL when present
    // - Douban may have id or url fields depending on site variant
    try {
        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '') || '';
        const imdbUrl = meta.imdbUrl || (imdbId ? `https://www.imdb.com/title/${imdbId}/` : '');
        const imdbSel = overrides.imdbInput || formSelectors.imdb;
        $(imdbSel).each((_, el) => {
            const input = el as HTMLInputElement;
            const name = (input.getAttribute('name') || '').toLowerCase();
            if (name === 'imdb_id' || name === 'imdbid') input.value = imdbId || imdbUrl;
            else if (name === 'url') input.value = imdbUrl || imdbId;
            else input.value = imdbUrl || imdbId;
            dispatchFormEvents(input);
        });
    } catch { }

    try {
        const doubanId = meta.doubanId || extractDoubanId(meta.doubanUrl || '') || '';
        const doubanUrl = meta.doubanUrl || (doubanId ? `https://movie.douban.com/subject/${doubanId}/` : '');
        const doubanSel = overrides.doubanInput || formSelectors.douban;
        // Per legacy L15389-15404: only TTG / HDDolby / BTSchool(`doubanid`) take numeric ID;
        // other sites (PThome `douban_id`, HDArea `dburl`, etc.) expect the full Douban URL.
        const preferNumericDoubanId = ['TTG', 'HDDolby', 'BTSchool'].includes(config.name);
        $(doubanSel).each((_, el) => {
            const input = el as HTMLInputElement;
            const name = (input.getAttribute('name') || '').toLowerCase();
            if (name === 'doubanid' || (preferNumericDoubanId && name.includes('douban') && name.includes('id'))) {
                input.value = doubanId || doubanUrl;
            } else {
                input.value = doubanUrl || doubanId;
            }
            dispatchFormEvents(input);
        });

        // Modern NexusPHP 1.8+/1.9+ PT-Gen link field (`input[name="pt_gen"]`).
        const ptGenVal = doubanUrl || meta.imdbUrl || (meta.imdbId ? `https://www.imdb.com/title/${meta.imdbId}/` : '');
        if (ptGenVal) {
            $('input[name="pt_gen"]').each((_, el) => {
                const input = el as HTMLInputElement;
                if (!input.value) {
                    input.value = ptGenVal;
                    dispatchFormEvents(input);
                }
            });
        }
    } catch { }

    // Modern NexusPHP 1.8+/1.9+ dedicated MediaInfo / BDInfo textarea (`technical_info`, `media_info`, `tr_nfo`),
    // TMDB URL (`tmdb_url`, `tmdb`), screenshots textarea (`screenshots`), and standalone poster URL (`tr_cover_url`, `cover`).
    try {
        const infos = getMediainfoPictureFromDescr(descrVal, { mediumSel: meta.mediumSel });
        const techEl = document.querySelector(
            'textarea[name="technical_info"], textarea[name="media_info"], textarea[name="tr_nfo"]'
        ) as HTMLTextAreaElement | null;
        if (techEl && !techEl.value.trim()) {
            const mi = (meta.fullMediaInfo || infos.mediainfo || '').replace(/\[\/?(quote|code|size|font|color)[^\]]*\]/gi, '').trim();
            if (mi) {
                techEl.value = mi;
                dispatchFormEvents(techEl);
            }
        }
        const coverEl = document.querySelector('input[name="tr_cover_url"], input[name="cover"]') as HTMLInputElement | null;
        if (coverEl && !coverEl.value.trim()) {
            const posterUrl = descrVal.match(/\[img\](\S*?)\[\/img\]/i)?.[1] || meta.images?.[0] || '';
            if (posterUrl) {
                coverEl.value = posterUrl;
                dispatchFormEvents(coverEl);
            }
        }
        const tmdbEl = document.querySelector('input[name="tmdb_url"], input[name="tmdb"]') as HTMLInputElement | null;
        if (tmdbEl && !tmdbEl.value.trim() && (meta.tmdbUrl || meta.tmdbId)) {
            tmdbEl.value = meta.tmdbUrl || `https://www.themoviedb.org/${meta.type === '剧集' ? 'tv' : 'movie'}/${meta.tmdbId}`;
            dispatchFormEvents(tmdbEl);
        }
        const screensEl = document.querySelector('textarea[name="screenshots"]') as HTMLTextAreaElement | null;
        if (screensEl && !screensEl.value.trim() && infos.picInfo) {
            const urls = Array.from(infos.picInfo.matchAll(/\[img\](.*?)\[\/img\]/gi))
                .map((m) => m[1].trim())
                .filter(Boolean);
            if (urls.length) {
                screensEl.value = Array.from(new Set(urls)).join('\n');
                dispatchFormEvents(screensEl);
            }
        }
    } catch { }

    const injectTorrentFile = async () => {
        if (!meta.torrentBase64 && !meta.torrentUrl) return;
        const fileInputSelector = overrides.torrentInput || formSelectors.torrent;
        const fileInput = $(fileInputSelector)[0] as HTMLInputElement | undefined;
        if (!fileInput) return;
        try {
            const { TorrentService } = await import('../../services/TorrentService');
            const result = await TorrentService.buildForwardTorrentFile(meta, config.name, null);
            if (result) {
                TorrentService.injectFileIntoInput(fileInput, result.file);
            } else if (meta.torrentBase64 && meta.torrentFilename) {
                const file = TorrentService.base64ToFile(meta.torrentBase64, meta.torrentFilename);
                TorrentService.injectFileIntoInput(fileInput, file);
            }
            lockNameAfterFileInject();
        } catch (e) {
            console.error('[Auto-Feed] File Injection Failed:', e);
        }
    };
    injectTorrentFile().catch((e) => console.error('[Auto-Feed] File Injection Failed:', e));

    // After we possibly replaced `meta.title` from torrent internal name, (re)derive key selectors.
    // This helps on targets where `type/medium/codec/resolution/audio` are mandatory.
    try {
        const text = `${meta.title || ''} ${meta.subtitle || meta.smallDescr || ''} ${meta.description || ''} ${meta.fullMediaInfo || ''}`;
        meta.mediumSel = meta.mediumSel || getMediumSel(text, meta.title);
        meta.codecSel = meta.codecSel || getCodecSel(text);
        meta.audioCodecSel = meta.audioCodecSel || getAudioCodecSel(text);
        meta.standardSel = meta.standardSel || getStandardSel(text);
    } catch { }

    // ---- generic selects (best-effort) ----
    const findSelect = (selectName: string): HTMLSelectElement | null => {
        const names = [selectName, `${selectName}[4]`, `${selectName}[1]`];
        for (const n of names) {
            const el = document.querySelector(`select[name="${n}"]`) as HTMLSelectElement | null;
            if (el) return el;
        }
        const byId = document.querySelector(`select#${selectName}`) as HTMLSelectElement | null;
        return byId || null;
    };
    const selectLooksLikeRegion = (select: HTMLSelectElement): boolean => {
        const texts = Array.from(select.options).map((o) => (o.textContent || '').trim()).join(' | ');
        const regionHits = (texts.match(/欧美|大陆|香港|台湾|日本|韩国|印度|地区|國家|country|region/gi) || []).length;
        const mediumHits = (texts.match(/Blu|UHD|WEB|HDTV|DVD|Remux|Encode|媒介|介质|source/gi) || []).length;
        return regionHits > 0 && regionHits >= mediumHits;
    };
    const selectLooksLikeMedium = (select: HTMLSelectElement): boolean => {
        const texts = Array.from(select.options).map((o) => (o.textContent || '').trim()).join(' | ');
        const regionHits = (texts.match(/欧美|大陆|香港|台湾|日本|韩国|印度|地区|國家|country|region/gi) || []).length;
        const mediumHits = (texts.match(/Blu|UHD|WEB|HDTV|DVD|Remux|Encode|媒介|介质|source/gi) || []).length;
        return mediumHits > 0 && mediumHits >= regionHits;
    };
    const pickOption = (selectName: string, keywords: (string | RegExp)[]) => {
        const select = findSelect(selectName);
        if (!select) return;
        const opts = Array.from(select.options);
        const scoreOpt = (opt: HTMLOptionElement) => {
            const text = opt.textContent?.trim() || '';
            if (!text) return -1;
            let score = -1;
            for (const k of keywords) {
                if (typeof k === 'string') {
                    const kw = k.trim().toLowerCase();
                    const t = text.toLowerCase();
                    if (!kw) continue;
                    if (t === kw) score = Math.max(score, 120);
                    else if (t.includes(kw)) score = Math.max(score, 80);
                } else {
                    k.lastIndex = 0;
                    const m = text.match(k);
                    if (m) {
                        score = Math.max(score, m[0].length === text.length ? 110 : 70);
                    }
                }
            }
            return score;
        };
        const found = opts
            .map((o) => ({ o, s: scoreOpt(o) }))
            .filter((x) => x.s >= 0)
            .sort((a, b) => b.s - a.s)[0]?.o;
        if (found) {
            found.selected = true;
            // Some sites rely on `change` to reveal dependent fields.
            try {
                select.value = found.value;
                select.dispatchEvent(new Event('change', { bubbles: true }));
                select.dispatchEvent(new Event('input', { bubbles: true }));
            } catch { }
        }
    };

    // ---- declarative NexusPHP profile (opt-in; existing dedicated trackers omit nexusProfile) ----
    const profileHandledFields = new Set<string>();
    const matchTeamOption = (select: HTMLSelectElement, titleStr: string, mode: 'standard' | 'okpt' | 'muxuege' = 'standard') => {
        if (!titleStr) return;
        const opts = Array.from(select.options);
        if (mode === 'okpt') {
            const okptTeams: Array<[string, RegExp]> = [
                ['M-team', /-(.*mteam|mpad|tnp|BMDru|MWEB)/i],
                ['CMCT', /-(CMCT|cmctv)/i],
                ['HDSky', /-(hds|.*@HDSky)/i],
                ['CHDBits', /-(CHD|.*@CHDBits)|@CHDWEB/i],
                ['OurBits', /(-Ao|-.*OurBits|-FLTTH|-IloveTV|OurTV|-IloveHD|OurPad|-MGs)$/i],
                ['TTG', /-(WiKi|DoA|.*TTG|NGB|ARiN)/i],
                ['HDChina', /-(HDC)/i],
                ['PterClub', /-(Pter|.*Pter)/i],
                ['HDHome', /(-hdh|.*@HDHome)/i],
                ['PThome', /(-pthome|-pth|.*@pth)/i],
                ['Audiences', /(-Audies|.*@Audies|-ADE|-ADWeb|.*@ADWeb)/i],
                ['PTLGS', /(-PTLGS|.*@PTLGS)/i],
                ['HDDolby', /-DBTV|-QHstudIo|Dream$|.*@dream/i],
                ['FRDS', /-FRDS|@FRDS/i],
                ['Ying', /Ying(WEB|DIY|TV|MV|MUSIC)?$/i],
                ['Red Leaves', /(RLWEB|RLeaves|RLTV|-R²)$/i],
                ['UBits', /@UBits|-UBits|-UBWEB/i],
                ['AGSV', /AGSV(PT|E|WEB|REMUX|Rip|TV|DIY|MUS)?$/i]
            ];
            if (/PandaMoon|HDSpace|HDClub|LCHD/i.test(titleStr)) return;
            for (const [label, re] of okptTeams) {
                if (!re.test(titleStr)) continue;
                const hit = opts.find((o) => new RegExp(label, 'i').test((o.textContent || '').trim()));
                if (hit) {
                    select.value = hit.value;
                    hit.selected = true;
                    dispatchFormEvents(select);
                    return;
                }
            }
            return;
        }
        const tail = mode === 'muxuege'
            ? (titleStr.split(/Blu-ray/i).pop() || titleStr)
            : (titleStr.split(/(?:19|20)\d{2}/).pop() || titleStr);
        const tailLower = tail.toLowerCase();
        for (const opt of opts) {
            const label = (opt.textContent || '').trim();
            if (!label || label.length < 2 || /^(请选择|其他|其它|other|none|---)$/i.test(label)) continue;
            if (label === 'DIY' || label === 'REMUX') continue;
            if (!tailLower.includes(label.toLowerCase())) continue;
            if (/PSY|LCHD/.test(tail) && label === 'CHD') continue;
            if (/PandaMoon/.test(tail) && label === 'Panda') continue;
            if (/HDSpace/i.test(tail) && /HDS/i.test(label)) continue;
            if (/HDClub/i.test(tail) && /HDC/i.test(label)) continue;
            if (/REPACK/i.test(tail) && /PACK/i.test(label)) continue;
            select.value = opt.value;
            opt.selected = true;
            dispatchFormEvents(select);
            return;
        }
    };

    if (config.nexusProfile) {
        const profile = config.nexusProfile;
        const assignments = resolveNexusProfileValues(meta, profile);
        const resolveSelectByName = (selectorName: string): HTMLSelectElement | null => {
            if (selectorName === 'type') {
                return (
                    (document.getElementById('browsecat') as HTMLSelectElement | null) ||
                    (document.querySelector('select[name="type"]') as HTMLSelectElement | null)
                );
            }
            if (selectorName === 'specialcat') {
                return (
                    (document.getElementById('specialcat') as HTMLSelectElement | null) ||
                    (document.querySelector('select[name="specialcat"]') as HTMLSelectElement | null)
                );
            }
            const exact = document.querySelector(`select[name="${selectorName}"]`) as HTMLSelectElement | null;
            if (exact) return exact;
            const prefix = document.querySelector(`select[name^="${selectorName}"]`) as HTMLSelectElement | null;
            if (prefix) return prefix;
            return findSelect(selectorName.replace(/\[\d+\]$/, ''));
        };
        const applyFieldValue = (select: HTMLSelectElement, val: NexusFieldValue): boolean => {
            if (typeof val === 'string') {
                const opt = Array.from(select.options).find((o) => o.value === val);
                if (!opt) return false;
                select.value = opt.value;
            } else {
                const opt = select.options[val.index];
                if (!opt) return false;
                select.selectedIndex = val.index;
                opt.selected = true;
            }
            dispatchFormEvents(select);
            return true;
        };
        const hasSpecialcat = assignments.some((a) => a.field === 'specialcat');
        const applyProfilePass = () => {
            if (hasSpecialcat && profile.specialcatMode5) {
                $('tr.mode_4').hide();
                $('tr.mode_5').show();
            }
            for (const item of assignments) {
                const sel = resolveSelectByName(item.selector);
                if (!sel) continue;
                if (item.field === 'specialcat') {
                    sel.disabled = false;
                    const browsecat = document.getElementById('browsecat') as HTMLSelectElement | null;
                    if (browsecat) browsecat.disabled = true;
                } else if (item.field === 'type') {
                    const specialcat = document.getElementById('specialcat') as HTMLSelectElement | null;
                    if (specialcat) specialcat.disabled = true;
                    try { (window as any).disableother?.('browsecat', 'specialcat'); } catch {}
                }
                if (applyFieldValue(sel, item.value)) {
                    profileHandledFields.add(item.field);
                    if (item.field === 'team' && profile.team?.matchOption !== false) {
                        matchTeamOption(sel, titleVal, profile.team?.matchMode || 'standard');
                    }
                }
            }
            // Option-text year matching for sites like 麒麟 (`processing_sel[4]`).
            if (profile.processingByYear?.mode === 'optionText') {
                const sel = resolveSelectByName(profile.processingByYear.selector);
                if (sel) {
                    if (profile.processingByYear.defaultValue !== undefined) {
                        applyFieldValue(sel, profile.processingByYear.defaultValue);
                    }
                    const yr = titleVal.match(/(?:19|20)\d{2}/g)?.pop();
                    if (yr) {
                        const hit = Array.from(sel.options).find((o) => (o.textContent || '').includes(yr));
                        if (hit) {
                            sel.value = hit.value;
                            hit.selected = true;
                            dispatchFormEvents(sel);
                        }
                    }
                    profileHandledFields.add('processingByYear');
                }
            }
            // Region option-text fallback when `source` fell through to default/empty.
            if (profile.source && !meta.sourceSel) {
                const sel = resolveSelectByName(profile.source.selector);
                const reg = descrVal.match(/(?:地.{0,5}?区|国.{0,5}?家|产.{0,5}?地|◎產.{0,5}?地)([^\r\n]+)/);
                const region = reg?.[1]?.split('/')[0]?.split(':').pop()?.trim() || '';
                if (sel && region) {
                    const hit = Array.from(sel.options).find((o) => {
                        const part = (o.textContent || '').split(/[/（(]/).pop()?.trim() || '';
                        return part.length >= 2 && region.includes(part);
                    });
                    if (hit) {
                        sel.value = hit.value;
                        hit.selected = true;
                        dispatchFormEvents(sel);
                        profileHandledFields.add('source');
                    }
                }
            }
            // Site-specific custom tag checkboxes.
            if (profile.customTags?.length) {
                const labels = getMetaLabels(meta);
                const teamSel = profile.team ? resolveSelectByName(profile.team.selector) : null;
                for (const tag of profile.customTags) {
                    let active = false;
                    if (tag.when === '4k_sdr') active = meta.standardSel === '4K' && /SDR/i.test(descrVal);
                    else if (tag.when === 'hdr10') active = Boolean(labels.hdr10 || /HDR10/i.test(descrVal));
                    else if (tag.when === 'dv') active = Boolean(labels.db || /Dolby Vision|\bDV\b/i.test(`${titleVal}\n${descrVal}`));
                    else if (tag.when === 'effects_sub') active = /特效字幕/.test(smallDescrVal);
                    else if (tag.when === 'jp_lang') active = /◎语.*?言.*?日语/.test(descrVal);
                    else if (tag.when === 'kr_lang') active = /◎语.*?言.*?韩语/.test(descrVal);
                    else if (tag.when === 'agsv_ark') active = [29, 30, 31].includes(Number(teamSel?.value || 0));
                    if (!active) continue;
                    const cb = document.querySelector(tag.selector) as HTMLInputElement | null;
                    if (cb && !cb.checked) {
                        cb.checked = true;
                        dispatchFormEvents(cb);
                    }
                }
            }
        };
        applyProfilePass();
        // Re-apply shortly after `#browsecat` change in case the site dynamically updates dependent selects.
        window.setTimeout(applyProfilePass, 350);
    }

    const typeMap: Record<string, (string | RegExp)[]> = {
        电影: [/Movie/i, /电影/],
        剧集: [/TV/i, /Series/i, /剧集/],
        纪录: [/Doc/i, /纪录/],
        综艺: [/Variety/i, /综艺/],
        动漫: [/Anime/i, /动画|動漫/],
        音乐: [/Music/i, /音乐/],
        体育: [/Sport/i, /体育/],
        MV: [/MV/i, /Music Video/i],
        书籍: [/Book/i, /书籍/],
        游戏: [/Game/i, /游戏/],
        软件: [/Software/i, /软件/],
        学习: [/Study/i, /学习/]
    };

    if (!profileHandledFields.has('type') && !profileHandledFields.has('specialcat') && meta.type && typeMap[meta.type]) {
        pickOption('type', typeMap[meta.type]);
        pickOption('category', typeMap[meta.type]);
        pickOption('cat', typeMap[meta.type]);
        pickOption('category_id', typeMap[meta.type]);
    }

    const mediumMap: Record<string, (string | RegExp)[]> = {
        UHD: [/UHD/i, /4K/i, /2160p/i, /超清|超高清|4K/],
        'Blu-ray': [/Blu[- ]?ray/i, /\bBD\b/i, /蓝光|原盘/],
        Remux: [/Remux/i],
        Encode: [/Encode/i, /BDRip/i, /WEBRip/i, /压制/],
        'WEB-DL': [/WEB[- ]?DL/i, /WEB/i, /网络/],
        HDTV: [/HDTV/i],
        DVD: [/DVD/i, /DVDRip/i],
        CD: [/CD/i]
    };
    if (!profileHandledFields.has('medium') && !profileHandledFields.has('sourceByMedium') && !profileHandledFields.has('sourceByType') && meta.mediumSel && mediumMap[meta.mediumSel]) {
        pickOption('medium_sel', mediumMap[meta.mediumSel]);
        pickOption('medium', mediumMap[meta.mediumSel]);
        // Some Nexus variants use `source_sel` for medium/source, others use it for region.
        const sourceSel = findSelect('source_sel');
        if (sourceSel && selectLooksLikeMedium(sourceSel)) {
            pickOption('source_sel', mediumMap[meta.mediumSel]);
        }
        pickOption('source', mediumMap[meta.mediumSel]);
    }

    const standardMap: Record<string, (string | RegExp)[]> = {
        '8K': [/8K/i, /4320p/i],
        '4K': [/4K/i, /2160p/i],
        '1080p': [/1080p/i],
        '1080i': [/1080i/i],
        '720p': [/720p/i],
        SD: [/SD/i, /480/i, /576/i]
    };
    if (!profileHandledFields.has('standard') && meta.standardSel && standardMap[meta.standardSel]) {
        pickOption('standard_sel', standardMap[meta.standardSel]);
        pickOption('standard', standardMap[meta.standardSel]);
    }

    const codecMap: Record<string, (string | RegExp)[]> = {
        H264: [/H\.?264/i, /AVC/i, /x264/i],
        X264: [/x264/i],
        H265: [/H\.?265/i, /HEVC/i, /x265/i],
        X265: [/x265/i],
        'VC-1': [/VC-?1/i],
        'MPEG-2': [/MPEG-?2/i],
        XVID: [/XVID/i]
    };
    if (!profileHandledFields.has('codec') && meta.codecSel && codecMap[meta.codecSel]) {
        pickOption('codec_sel', codecMap[meta.codecSel]);
        pickOption('codec', codecMap[meta.codecSel]);
    }

    const audioMap: Record<string, (string | RegExp)[]> = {
        'DTS-HDMA:X 7.1': [/DTS[- ]?X/i],
        'DTS-HDMA': [/DTS[- .]?HD[\s\S]{0,10}(MA|Master)/i, /DTS[- ]?MA/i],
        'DTS-HDHR': [/DTS[- ]?HR/i],
        Atmos: [/Atmos/i],
        TrueHD: [/TrueHD/i],
        DTS: [/\bDTS\b(?![- .]?(HD|X))/i],
        AC3: [/AC-?3/i, /Dolby Digital/i, /\bDD(P|\+)?\b/i],
        AAC: [/AAC/i],
        LPCM: [/LPCM/i, /PCM/i],
        Flac: [/FLAC/i],
        APE: [/APE/i],
        WAV: [/WAV/i],
        MP3: [/MP3/i]
    };
    if (!profileHandledFields.has('audio') && meta.audioCodecSel && audioMap[meta.audioCodecSel]) {
        pickOption('audiocodec_sel', audioMap[meta.audioCodecSel]);
        pickOption('audio', audioMap[meta.audioCodecSel]);
    }

    // HDR / Dolby Vision / Atmos etc: best-effort checkboxes (only if the page exposes them).
    // Many Nexus variants use ids like `hdr10`, `hdr10plus`, `dovi`, etc (PTer and others).
    try {
        const labels = getMetaLabels(meta);
        const byId: Record<string, boolean> = {
            hdr10: !!labels.hdr10,
            hdr10plus: !!labels.hdr10plus,
            dovi: !!labels.db,
            atmos: (meta.description || '').match(/Atmos/i) ? true : false
        };
        Object.entries(byId).forEach(([id, on]) => {
            if (!on) return;
            const el = document.getElementById(id) as HTMLInputElement | null;
            if (el && el.type === 'checkbox') {
                el.checked = true;
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    } catch { }

    // Source region / release group: additional dropdowns on some Nexus sites.
    try {
        if (
            !profileHandledFields.has('source') &&
            !profileHandledFields.has('sourceByMedium') &&
            !profileHandledFields.has('sourceByType') &&
            !profileHandledFields.has('processingBySource') &&
            meta.sourceSel
        ) {
            const regionKw = (() => {
                const src = String(meta.sourceSel || '');
                if (/大陆|内地|中国大陆|中国(?!香港|台湾|澳门)|华语/i.test(src)) return [/大陆|内地|中国(?!香港|台湾|澳门)|CN|华语/i];
                if (/港台|港澳|香港|台湾/i.test(src)) return [/港台|港澳|香港|台湾|Hong.?Kong|Taiwan/i];
                if (/香港/i.test(src)) return [/香港|Hong.?Kong/i];
                if (/台湾|臺灣/i.test(src)) return [/台湾|臺灣|Taiwan/i];
                if (/日本|日/i.test(src)) return [/日本|日剧|Japan/i];
                if (/韩国|韓国|韩/i.test(src)) return [/韩国|韓国|韩剧|Korea/i];
                if (/日韩|日韓/i.test(src)) return [/日本|韩国|Japan|Korea/i];
                if (/欧美|歐美|美国|英國|英国|欧洲|歐洲|US|USA|UK|Europe/i.test(src)) return [/欧美|歐美|美国|英国|欧洲|US|USA|UK|Europe/i];
                return [src, new RegExp(src, 'i')];
            })();
            if (!profileHandledFields.has('team')) {
                pickOption('team_sel', regionKw);
                pickOption('team', regionKw);
            }
            pickOption('region', regionKw);
            pickOption('area', regionKw);
            const sourceSel = findSelect('source_sel');
            if (sourceSel && selectLooksLikeRegion(sourceSel)) {
                pickOption('source_sel', regionKw);
            }
        }
    } catch { }

    // Common tag checkboxes for Nexus variants.
    try {
        const labels = getMetaLabels(meta);
        meta.labelInfo = labels;

        const retry = (fn: () => void, times = 8, delayMs = 220) => repeat(fn, times, delayMs);

        // Value/text based tag checkboxes (HDHome/PThome/HDDolby/Audiences/BTSchool + NP 1.8+ variants).
        retry(() => {
            const inputs = Array.from(
                document.querySelectorAll(
                    'input[type="checkbox"][name="tags[]"], input[type="checkbox"][name="tags[4][]"], input[type="checkbox"][name="span[]"]'
                )
            ) as HTMLInputElement[];
            if (!inputs.length) return;

            const getInputText = (el: HTMLInputElement): string => {
                let t = '';
                if (el.id) {
                    const labels = Array.from(document.querySelectorAll('label')) as HTMLLabelElement[];
                    const byFor = labels.find((lb) => (lb.getAttribute('for') || '') === el.id);
                    if (byFor) t = byFor.textContent || '';
                }
                if (!t) t = (el.closest('label') as HTMLLabelElement | null)?.textContent || '';
                // When multiple checkboxes share a single <td> without <label>, read ONLY the text
                // between this input and the next input/<br> so we never match neighboring tags (e.g. 禁转/首发).
                if (!t) {
                    const chunks: string[] = [];
                    let cur: ChildNode | null = el.nextSibling;
                    while (cur) {
                        if (cur.nodeName === 'INPUT' || cur.nodeName === 'BR') break;
                        if (cur instanceof Element && cur.querySelector('input')) break;
                        const part = (cur.textContent || '').trim();
                        if (part) chunks.push(part);
                        if (chunks.length >= 2) break;
                        cur = cur.nextSibling;
                    }
                    t = chunks.join(' ');
                }
                return t.replace(/\s+/g, ' ').trim();
            };

            const setTag = (on: boolean, semanticValues: string[], numericFallbackValues: string[], labelPattern: RegExp) => {
                if (!on) return;
                const semanticSet = new Set(semanticValues.map((v) => v.toLowerCase()));
                const numericSet = new Set(numericFallbackValues);
                for (const el of inputs) {
                    const val = (el.value || '').trim().toLowerCase();
                    const txt = getInputText(el);
                    const matchedBySemantic = semanticSet.has(val);
                    const matchedByLabel = !!txt && labelPattern.test(txt);
                    // Only fall back to numeric value aliases when the checkbox has no readable label text,
                    // preventing cross-site numeric ID collisions (e.g. value="11" meaning 限转 on another site).
                    const matchedByNumericFallback = !txt && numericSet.has(val);
                    if (!matchedBySemantic && !matchedByLabel && !matchedByNumericFallback) continue;
                    if (!el.checked) {
                        el.checked = true;
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            };

            setTag(!!labels.gy, ['gy'], ['5'], /(国.?语|mandarin|国语配音|中文配音)/i);
            setTag(!!labels.yy, ['yy'], ['11'], /(粤语|cantonese)/i);
            setTag(!!labels.zz, ['zz'], ['6'], /(中字|中文字幕|chinese.?sub)/i);
            setTag(!!labels.diy, ['diy'], ['4'], /(DIY|原盘DIY)/i);
            setTag(!!labels.hdr10, ['hdr10'], ['7'], /(?:\bHDR10\b(?!\+)|^HDR$)/i);
            setTag(!!labels.hdr10plus, ['hdrm'], ['10'], /(HDR10\+|HDR\+)/i);
            setTag(!!labels.db, ['db'], ['8'], /(杜比视界|Dolby.?Vision|DoVi|\bDV\b)/i);
            setTag(!!labels.complete, ['wj'], ['13'], /(完结|全集|pack|complete)/i);
        });
    } catch { }
}
