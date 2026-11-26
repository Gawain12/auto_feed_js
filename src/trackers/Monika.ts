import { Unit3DClassicEngine } from '../templates/unit3d_classic';
import { TorrentMeta } from '../types/TorrentMeta';
import { extractImdbId } from '../common/rules/links';

// Legacy L23224-23247: Monika uses default Unit3DClassic type_id and resolution maps
// (`4K:2, 1080p:3, 1080i:4, 720p:5, SD:10, 8K:1`), NOT ACM's custom autotype/autores map.
export class MonikaEngine extends Unit3DClassicEngine {
    async fill(meta: TorrentMeta): Promise<void> {
        await super.fill(meta);

        const fire = (el: HTMLElement) => {
            try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
            try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
        };

        const setText = (selectors: string[], value: string) => {
            if (!value) return;
            for (const selector of selectors) {
                const el = document.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement | null;
                if (!el) continue;
                el.value = value;
                fire(el);
                break;
            }
        };

        const imdbId = meta.imdbId || extractImdbId(meta.imdbUrl || '') || '';
        const imdbNo = imdbId.replace(/^tt/i, '');

        setText(['input#name', 'input[name="name"]', 'input#title', 'input[name="title"]'], meta.title || '');
        setText(['input[name="subhead"]', 'input#subhead'], (meta.smallDescr || meta.subtitle || '').trim());
        setText(['textarea#bbcode-description', 'textarea[name="description"]'], (meta.description || '').trim());
        setText(['input#autoimdb', 'input[name="imdb"]'], imdbNo);

        // Live monikadesign.uk/upload/1 category_id mapping
        const catSel = document.querySelector('select#category_id, select[name="category_id"]') as HTMLSelectElement | null;
        if (catSel && meta.type) {
            const isSeries = /S\d{1,2}|E\d{1,3}/i.test(meta.title || '');
            let catVal = '';
            if (meta.type === '动漫') catVal = isSeries ? '8' : '6';
            else if (meta.type === '剧集' || meta.type === '综艺') catVal = '2';
            else if (meta.type === '电影' || meta.type === '纪录') catVal = isSeries ? '2' : '1';
            else if (meta.type === '游戏') catVal = '4';
            else if (meta.type === '音乐') catVal = isSeries ? '9' : '3';
            if (catVal && Array.from(catSel.options).some((o) => o.value === catVal)) {
                catSel.value = catVal;
                fire(catSel);
            }
        }
    }
}
