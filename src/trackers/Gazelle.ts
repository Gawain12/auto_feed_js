
import { BaseEngine } from '../core/BaseEngine';
import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { parseGazelle, fillGazelle } from '../templates/gazelle';
import { hasTorrentIdQuery, isPage } from '../common/rules/pages';

export class GazelleEngine extends BaseEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    // Gazelle detail pages (GPW/RED/OPS/DIC): torrents.php?id=...&torrentid=...
    isSourcePage(url: URL): boolean {
        return isPage(url, 'torrents.php') && hasTorrentIdQuery(url);
    }

    async parse(): Promise<TorrentMeta> {
        this.log('Parsing Gazelle page...');
        return parseGazelle(this.config, this.currentUrl);
    }

    async fill(meta: TorrentMeta): Promise<void> {
        this.log('Filling Gazelle form...');
        await fillGazelle(meta, this.config);
    }
}
