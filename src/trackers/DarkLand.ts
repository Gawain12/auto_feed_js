import $ from 'jquery';
import { Unit3DClassicEngine } from '../templates/unit3d_classic';
import { TorrentMeta } from '../types/TorrentMeta';
import { dispatchFormEvents } from '../common/dom/form';

export class DarkLandEngine extends Unit3DClassicEngine {
    protected getClassicAutoResolutionMap(): Record<string, number> {
        return { '4K': 2, '1080p': 3, '1080i': 4, '720p': 5, SD: 6, '': 10, '8K': 1 };
    }

    protected getClassicResolutionFallbackMap(): Record<string, number> {
        return { '4K': 2, '1080p': 3, '1080i': 4, '720p': 5, SD: 6, '': 10, '8K': 1 };
    }

    async fill(meta: TorrentMeta): Promise<void> {
        await super.fill(meta);
        // Legacy parity for DarkLand: subtitle -> input[name="keywords"], #automal -> 0
        try {
            const small = (meta.smallDescr || meta.subtitle || '').trim();
            const kw = document.querySelector('input[name="keywords"]') as HTMLInputElement | null;
            if (kw && small && !kw.value) {
                kw.value = small;
                dispatchFormEvents(kw);
            }
            const automal = document.getElementById('automal') as HTMLInputElement | null;
            if (automal) {
                automal.value = '0';
                dispatchFormEvents(automal);
            }
            if (meta.standardSel === 'SD') {
                $('input[name="sd"]:eq(0)').prop('checked', true);
            }
        } catch {}
    }
}
