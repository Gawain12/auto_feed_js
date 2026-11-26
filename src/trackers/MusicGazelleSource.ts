import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { GazelleEngine } from './Gazelle';
import { parseMusicGazelle } from './musicGazelleParse';

// Source-only engine for Gazelle music trackers (jpop / lztr / SugoiMusic).
export class MusicGazelleSourceEngine extends GazelleEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    async parse(): Promise<TorrentMeta> {
        this.log(`Parsing ${this.siteName} music page...`);
        return parseMusicGazelle(this.config, this.currentUrl);
    }

    async fill(_meta: TorrentMeta): Promise<void> {
        // Source-only music tracker
    }
}
