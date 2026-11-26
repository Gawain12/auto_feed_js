import { NexusPHPEngine } from '../NexusPHP';
import { TorrentMeta } from '../../types/TorrentMeta';

export class FRDSEngine extends NexusPHPEngine {
    protected async afterParse(meta: TorrentMeta): Promise<TorrentMeta> {
        const out: TorrentMeta = { ...meta };
        const rawTitle = (out.title || '').trim();
        const rawSub = (out.subtitle || out.smallDescr || '').trim();
        // FRDS swaps `#top` (Chinese title) and `副标题` (English release name).
        const subLooksRelease = /\b(?:2160p|1080[pi]|720p|480p|Blu-?Ray|WEB-?DL|WEBRip|Remux|HDTV|x26[45]|H\.?26[45]|HEVC|AVC|AV1)\b|@FRDS/i.test(rawSub);
        const titleHasCjk = /[\u4e00-\u9fff]/.test(rawTitle);
        if (rawSub && subLooksRelease && (titleHasCjk || !rawTitle)) {
            out.title = rawSub;
            out.subtitle = rawTitle;
            out.smallDescr = rawTitle;
        }
        return out;
    }
}
