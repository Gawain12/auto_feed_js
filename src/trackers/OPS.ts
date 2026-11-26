import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { GazelleEngine } from './Gazelle';
import { parseMusicGazelle } from './musicGazelleParse';
import { fillMusicGazelleUpload } from './musicGazelleFill';

// Dedicated engine entry for OPS (Orpheus).
export class OPSEngine extends GazelleEngine {
    constructor(config: SiteConfig, url: string) {
        super(config, url);
    }

    async parse(): Promise<TorrentMeta> {
        this.log('Parsing OPS page...');
        return parseMusicGazelle(this.config, this.currentUrl);
    }

    async fill(meta: TorrentMeta): Promise<void> {
        this.log('Filling OPS form...');
        const isMusicUpload =
            /orpheus\.network\/upload\.php/i.test(this.currentUrl) ||
            !!document.querySelector('#artistfields, #album_desc, #release_desc, input[name="artists[]"]');
        if (!isMusicUpload) {
            await super.fill(meta);
            return;
        }
        await fillMusicGazelleUpload(meta, 'OPS');
    }
}
