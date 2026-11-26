import { TorrentMeta } from '../../types/TorrentMeta';
import { NexusFieldValue, NexusFillProfile, NexusSelectMapping, NexusTitleOverride } from '../../types/SiteConfig';
import { getMetaLabels } from './labels';

export interface ResolvedNexusSelectAssignment {
    field: keyof NexusFillProfile;
    selector: string;
    value: NexusFieldValue;
}

const EUROPEAN_COUNTRIES = new Set([
    '阿尔巴尼亚', '安道尔', '奥地利', '白俄罗斯', '比利时', '波斯尼亚和黑塞哥维那',
    '保加利亚', '克罗地亚', '塞浦路斯', '捷克', '丹麦', '爱沙尼亚', '芬兰', '法国',
    '德国', '希腊', '匈牙利', '冰岛', '爱尔兰', '意大利', '科索沃', '拉脱维亚',
    '列支敦士登', '立陶宛', '卢森堡', '马耳他', '摩尔多瓦', '摩纳哥', '黑山', '荷兰',
    '北马其顿', '挪威', '波兰', '葡萄牙', '罗马尼亚', '俄罗斯', '圣马力诺', '塞尔维亚',
    '斯洛伐克', '斯洛文尼亚', '西班牙', '瑞典', '瑞士', '乌克兰', '英国', '梵蒂冈', '西德'
]);

const SOUTHEAST_ASIA = new Set([
    '菲律宾', '印度尼西亚', '马来西亚', '新加坡', '泰国', '老挝', '缅甸', '越南', '文莱', '柬埔寨', '不丹'
]);

function extractPrimaryRegionFromDescr(descr: string): string {
    const m = String(descr || '').match(/(?:地.{0,5}?区|国.{0,5}?家|产.{0,5}?地|◎產.{0,5}?地)([^\r\n]+)/);
    if (!m) return '';
    return m[1].split('/')[0].split(':').pop()?.trim() || '';
}

function pickFromMap(
    mapping: NexusSelectMapping | undefined,
    keys: Array<string | undefined>,
    ctx: {
        title: string;
        descr: string;
        smallDescr: string;
        type?: string;
        medium?: string;
        codec?: string;
        audio?: string;
        standard?: string;
        isDiy: boolean;
    }
): NexusFieldValue | undefined {
    if (!mapping) return undefined;
    let val: NexusFieldValue | undefined = undefined;
    for (const k of keys) {
        if (!k) continue;
        if (Object.prototype.hasOwnProperty.call(mapping.map, k)) {
            val = mapping.map[k];
            break;
        }
    }
    if (val === undefined && mapping.defaultValue !== undefined) {
        val = mapping.defaultValue;
    }
    if (mapping.titleOverrides?.length) {
        for (const ov of mapping.titleOverrides) {
            if (matchesOverride(ov, ctx)) {
                val = ov.value;
            }
        }
    }
    return val;
}

function matchesOverride(
    ov: NexusTitleOverride,
    ctx: {
        title: string;
        descr: string;
        smallDescr: string;
        type?: string;
        medium?: string;
        codec?: string;
        audio?: string;
        standard?: string;
        isDiy: boolean;
    }
): boolean {
    if (ov.whenType && ctx.type !== ov.whenType) return false;
    if (ov.whenMedium && ctx.medium !== ov.whenMedium) return false;
    if (ov.whenCodec && ctx.codec !== ov.whenCodec) return false;
    if (ov.whenAudio && ctx.audio !== ov.whenAudio) return false;
    if (ov.whenStandard && ctx.standard !== ov.whenStandard) return false;
    if (ov.whenDiy !== undefined && ctx.isDiy !== ov.whenDiy) return false;
    if (!ov.pattern) return true;
    const haystack =
        ov.inField === 'descr'
            ? ctx.descr
            : ov.inField === 'smallDescr'
                ? ctx.smallDescr
                : ov.inField === 'all'
                    ? `${ctx.title}\n${ctx.smallDescr}\n${ctx.descr}`
                    : ctx.title;
    try {
        return new RegExp(ov.pattern, ov.flags ?? 'i').test(haystack);
    } catch {
        return false;
    }
}

function buildRegionKeys(sourceSel: string | undefined, descr: string): Array<string | undefined> {
    const primary = extractPrimaryRegionFromDescr(descr);
    const keys: Array<string | undefined> = [];
    if (sourceSel === '欧美' && primary) {
        if (/美国/.test(primary)) keys.push('美国');
        else if (/英国/.test(primary)) keys.push('英国');
        else if (EUROPEAN_COUNTRIES.has(primary)) keys.push('欧洲');
    }
    if (primary && /泰国/.test(primary)) keys.push('泰国');
    if (sourceSel && SOUTHEAST_ASIA.has(sourceSel)) keys.push(sourceSel, '东南亚');
    if (sourceSel === '香港' || sourceSel === '台湾') {
        keys.push(sourceSel, '港台');
    } else if (sourceSel) {
        keys.push(sourceSel);
    }
    if (primary && !keys.includes(primary)) {
        if (SOUTHEAST_ASIA.has(primary)) keys.push('东南亚');
        keys.push(primary);
    }
    return keys;
}

/**
 * Resolve declarative NexusPHP select assignments for a site profile.
 * Pure function so it can be verified directly against legacy behavior in unit tests.
 */
export function resolveNexusProfileValues(
    meta: Partial<TorrentMeta>,
    profile: NexusFillProfile
): ResolvedNexusSelectAssignment[] {
    const out: ResolvedNexusSelectAssignment[] = [];
    const title = String(meta.title || '');
    const smallDescr = String(meta.smallDescr || meta.subtitle || '');
    const descr = String(meta.description || '');
    const fullBlob = `${title}\n${smallDescr}\n${descr}\n${meta.fullMediaInfo || ''}`;
    const labels = getMetaLabels(meta as TorrentMeta);
    const isDiy = Boolean(labels.diy || /DIY|@/i.test(title));
    const isDdp = /Dolby Digital Plus|E-?AC-?3/i.test(fullBlob) || /DD[P+]/i.test(title);
    const isAtmos = /Atmos/i.test(fullBlob);
    const isTrueHd = /True.?HD/i.test(fullBlob);
    const isRemuxName = /remux/i.test(title);
    const isComplete = Boolean(labels.complete || /S\d+[^E]|complete/i.test(title) || /全\d+集/.test(smallDescr));
    const hasEpisode = /E\d+/i.test(title);
    const hasSeason = /S\d+/i.test(title);

    const ctx = {
        title,
        descr,
        smallDescr,
        type: meta.type,
        medium: meta.mediumSel,
        codec: meta.codecSel,
        audio: meta.audioCodecSel,
        standard: meta.standardSel,
        isDiy
    };

    const push = (field: keyof NexusFillProfile, selector: string, value: NexusFieldValue | undefined) => {
        if (value === undefined) return;
        out.push({ field, selector, value });
    };

    // Specialcat takes precedence when it matches `meta.type` (e.g. AGSV, FreeFarm, HITPT, MyPT, OKPT, PThome).
    let usedSpecialcat = false;
    if (profile.specialcat && meta.type) {
        const spKeys: Array<string | undefined> = [meta.type];
        const spVal = pickFromMap(profile.specialcat, spKeys, ctx);
        if (spVal !== undefined) {
            push('specialcat', profile.specialcat.selector, spVal);
            usedSpecialcat = true;
            if (profile.specialcatExtras?.length) {
                for (const ex of profile.specialcatExtras) {
                    if (!ex.whenPattern || new RegExp(ex.whenPattern, 'i').test(title)) {
                        push('processingByMedium', ex.selector, ex.value);
                    }
                }
            }
        }
    }

    if (profile.type && !(usedSpecialcat && profile.specialcatMode5)) {
        if (!usedSpecialcat) {
            const typeKeys: Array<string | undefined> = [];
            if (meta.type) {
                const regionKeys = buildRegionKeys(meta.sourceSel, descr);
                if (meta.mediumSel) typeKeys.push(`${meta.type}_${meta.mediumSel}`);
                if (meta.standardSel) typeKeys.push(`${meta.type}_${meta.standardSel}`);
                for (const rk of regionKeys) {
                    if (rk) typeKeys.push(`${meta.type}_${rk}`);
                }
                if (hasEpisode) typeKeys.push(`${meta.type}_ep`);
                if (isComplete || hasSeason) typeKeys.push(`${meta.type}_pack`);
                typeKeys.push(meta.type);
            }
            push('type', profile.type.selector, pickFromMap(profile.type, typeKeys, ctx));
        }
    }

    // Mode-5 specialcat pages (like MyPT) hide mode-4 dropdowns completely.
    if (usedSpecialcat && profile.specialcatMode5) {
        return out;
    }

    if (profile.medium) {
        const mediumKeys: Array<string | undefined> = [];
        const med = meta.mediumSel;
        if (med) {
            if (isDiy && (med === 'UHD' || med === 'Blu-ray')) {
                mediumKeys.push(`${med}_DIY`);
            }
            if (isRemuxName && (med === 'UHD' || med === 'Blu-ray')) {
                mediumKeys.push(`${med}_Remux`);
            }
            if (med === 'Remux' && meta.standardSel && meta.type) {
                mediumKeys.push(`${med}_${meta.standardSel}_${meta.type}`);
            }
            if (meta.standardSel) {
                mediumKeys.push(`${med}_${meta.standardSel}`);
            }
            if (meta.type) {
                mediumKeys.push(`${med}_${meta.type}`);
            }
            mediumKeys.push(med);
        }
        if (meta.audioCodecSel) {
            mediumKeys.push(`audio_${meta.audioCodecSel}`);
        }
        push('medium', profile.medium.selector, pickFromMap(profile.medium, mediumKeys, ctx));
    }

    if (profile.codec) {
        const codecFallbacks: Record<string, string[]> = {
            X265: ['X265', 'H265'],
            H265: ['H265', 'X265'],
            X264: ['X264', 'H264'],
            H264: ['H264', 'X264'],
            'MPEG-4': ['MPEG-4', 'MPEG-2'],
            Xvid: ['Xvid', 'XVID'],
            XVID: ['XVID', 'Xvid']
        };
        const keys: Array<string | undefined> = [];
        if (meta.codecSel) {
            const baseKeys = codecFallbacks[meta.codecSel] || [meta.codecSel];
            if (meta.mediumSel) {
                for (const k of baseKeys) keys.push(`${k}_${meta.mediumSel}`);
            }
            keys.push(...baseKeys);
        }
        let codecVal = pickFromMap(profile.codec, keys, ctx);
        // Audio-in-codec fallback (e.g. PuTao) when video codec is absent.
        if (codecVal === undefined && profile.codecAudioFallback && meta.audioCodecSel) {
            if (Object.prototype.hasOwnProperty.call(profile.codecAudioFallback, meta.audioCodecSel)) {
                codecVal = profile.codecAudioFallback[meta.audioCodecSel];
            }
        }
        push('codec', profile.codec.selector, codecVal);
    }

    if (profile.audio) {
        const audioKeys: Array<string | undefined> = [];
        const ac = meta.audioCodecSel;
        if (ac === 'Atmos') {
            if (isDdp) audioKeys.push('Atmos_DDP', 'DDP_Atmos');
            if (isTrueHd) audioKeys.push('Atmos_TrueHD');
            audioKeys.push('Atmos');
        } else if (ac === 'AC3') {
            if (isDdp && isAtmos) audioKeys.push('DDP_Atmos', 'Atmos_DDP', 'DDP');
            else if (isDdp) audioKeys.push('DDP');
            if (/(?:DD|DD\+|AC3).*?2\.0/i.test(title)) audioKeys.push('AC3_2.0');
            audioKeys.push('AC3');
        } else if (ac === 'DTS-HDMA:X 7.1' || ac === 'DTS-X') {
            audioKeys.push(ac, 'DTS-X', 'DTS-HDMA:X 7.1', 'DTS-HDMA', 'DTS-HD');
        } else if (ac === 'DTS-HDMA') {
            audioKeys.push('DTS-HDMA', 'DTS-HD');
        } else if (ac === 'DTS-HDHR') {
            audioKeys.push('DTS-HDHR', 'DTS-HD');
        } else if (ac) {
            audioKeys.push(ac);
        }
        push('audio', profile.audio.selector, pickFromMap(profile.audio, audioKeys, ctx));
    }

    if (profile.standard) {
        push('standard', profile.standard.selector, pickFromMap(profile.standard, [meta.standardSel], ctx));
    }

    if (profile.source) {
        const srcKeys = buildRegionKeys(meta.sourceSel, descr);
        push('source', profile.source.selector, pickFromMap(profile.source, srcKeys, ctx));
    }

    if (profile.sourceByMedium) {
        const medKeys: Array<string | undefined> = [];
        const med = meta.mediumSel;
        if (med) {
            if (isDiy && (med === 'UHD' || med === 'Blu-ray')) medKeys.push(`${med}_DIY`);
            if (meta.standardSel === '4K' || /UHD/i.test(title)) medKeys.push(`${med}_4K`);
            medKeys.push(med);
        }
        if (meta.standardSel === '4K') medKeys.push('4K');
        push('sourceByMedium', profile.sourceByMedium.selector, pickFromMap(profile.sourceByMedium, medKeys, ctx));
    }

    if (profile.sourceByType) {
        const stKeys: Array<string | undefined> = [];
        if (meta.type) {
            const regionKeys = buildRegionKeys(meta.sourceSel, descr);
            if (meta.mediumSel && meta.standardSel) {
                stKeys.push(`${meta.type}_${meta.mediumSel}_${meta.standardSel}`);
            }
            if (meta.mediumSel) stKeys.push(`${meta.type}_${meta.mediumSel}`);
            if (meta.standardSel) stKeys.push(`${meta.type}_${meta.standardSel}`);
            if (isComplete) stKeys.push(`${meta.type}_complete`);
            for (const rk of regionKeys) {
                if (rk) stKeys.push(`${meta.type}_${rk}`);
            }
            stKeys.push(meta.type);
        }
        push('sourceByType', profile.sourceByType.selector, pickFromMap(profile.sourceByType, stKeys, ctx));
    }

    if (profile.processingByMedium) {
        push('processingByMedium', profile.processingByMedium.selector, pickFromMap(profile.processingByMedium, [meta.mediumSel], ctx));
    }

    if (profile.processingBySource) {
        const srcKeys = buildRegionKeys(meta.sourceSel, descr);
        push('processingBySource', profile.processingBySource.selector, pickFromMap(profile.processingBySource, srcKeys, ctx));
    }

    if (profile.processingByHdr) {
        const cfg = profile.processingByHdr;
        const val = labels.db
            ? cfg.db
            : labels.hdr10
                ? cfg.hdr10
                : labels.hdr10plus
                    ? cfg.hdr10plus
                    : cfg.defaultValue;
        push('processingByHdr', cfg.selector, val);
    }

    if (profile.processingByYear && profile.processingByYear.mode === 'buckets') {
        const matches = title.match(/\d{4}[^pi]/gi);
        const yearStr = matches?.[matches.length - 1]?.slice(0, 4);
        const year = yearStr ? parseInt(yearStr, 10) : NaN;
        if (Number.isFinite(year)) {
            const thresholds = [2011, 2001, 1981, 1961, 1941, 1921, 1901, 1851, 1800];
            for (let idx = 0; idx < thresholds.length; idx++) {
                if (year > thresholds[idx]) {
                    push('processingByYear', profile.processingByYear.selector, String(9 - idx));
                    break;
                }
            }
        } else if (profile.processingByYear.defaultValue !== undefined) {
            push('processingByYear', profile.processingByYear.selector, profile.processingByYear.defaultValue);
        }
    }

    if (profile.team) {
        push('team', profile.team.selector, profile.team.defaultValue);
    }

    return out;
}
