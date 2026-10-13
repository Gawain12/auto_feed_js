// Loads the pure rule functions of the pinned upstream legacy script into an isolated VM
// so parity tests can compare them with `src/common/rules/*`.
//
// The legacy file lives in `.legacy/` (gitignored) and is fetched by `npm run legacy:fetch`.
// Only side-effect-free sections are evaluated; every chunk is located by its declaration
// so the loader keeps working when upstream inserts code elsewhere.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const LEGACY_PATH = path.resolve(process.cwd(), '.legacy/auto_feed.user.js');

export interface LegacyRules {
    dealWithTitle(title: string): string;
    dealWithSubtitle(subtitle: string): string;
    mediumSel(text: string, title: string): string;
    codecSel(text: string): string;
    audioCodecSel(text: string): string;
    standardSel(text: string): string;
    getType(text: string): string;
    getLabel(text: string): Record<string, boolean>;
    smallDescrFromDescr(descr: string, name: string): string;
    sourceSelFromDescr(descr: string): string;
    searchName(name: string, type?: string): string;
}

const sliceBetween = (source: string, start: string, end: string): string => {
    const from = source.indexOf(start);
    if (from < 0) throw new Error(`legacy marker not found: ${start}`);
    const to = source.indexOf(end, from + start.length);
    if (to < 0) throw new Error(`legacy end marker not found: ${end}`);
    return source.slice(from, to);
};

const sliceLine = (source: string, start: string): string => {
    const from = source.indexOf(start);
    if (from < 0) throw new Error(`legacy marker not found: ${start}`);
    return source.slice(from, source.indexOf('\n', from));
};

export function loadLegacyRules(file = LEGACY_PATH): LegacyRules | null {
    if (!existsSync(file)) return null;
    const source = readFileSync(file, 'utf8');

    const chunks = [
        sliceLine(source, 'const us_ue ='),
        sliceLine(source, 'const us_ue_english ='),
        sliceBetween(source, 'function numToChinese(', '\nfunction '),
        sliceBetween(source, 'function deal_with_title(', 'function dictToString('),
        sliceBetween(source, 'String.prototype.medium_sel', 'function set_selected_option_by_value('),
        sliceBetween(source, 'function get_small_descr_from_descr(', 'function create_site_url_for_douban_info('),
        sliceBetween(source, 'function get_search_name(', 'function getJson(')
    ];

    // Legacy globals the rule functions read. `api_chosen` mirrors the legacy default (3).
    const context = vm.createContext({ raw_info: { name: '', type: '' }, api_chosen: 3 });
    vm.runInContext(chunks.join('\n'), context, { filename: 'legacy-rules.js' });

    // Calls are made inside the VM so string primitives pick up the VM's patched String.prototype.
    const call = vm.runInContext(`({
        dealWithTitle: (t) => deal_with_title(String(t)),
        dealWithSubtitle: (t) => deal_with_subtitle(String(t)),
        mediumSel: (t, name) => { raw_info.name = String(name || ''); return String(t).medium_sel(); },
        codecSel: (t) => String(String(t).codec_sel()),
        audioCodecSel: (t) => String(String(t).audiocodec_sel()),
        standardSel: (t) => String(String(t).standard_sel()),
        getType: (t) => String(String(t).get_type()),
        getLabel: (t) => JSON.stringify(String(t).get_label()),
        smallDescrFromDescr: (d, n) => get_small_descr_from_descr(String(d), String(n)),
        sourceSelFromDescr: (d) => get_source_sel_from_descr(String(d)),
        searchName: (n, type) => { raw_info.type = type || ''; return String(get_search_name(String(n))); }
    })`, context);
    // Objects created inside the VM have a foreign prototype; rebuild them in this realm.
    return { ...call, getLabel: (t: string) => JSON.parse(call.getLabel(t)) } as LegacyRules;
}
