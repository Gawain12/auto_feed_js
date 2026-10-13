import { TorrentMeta } from '../types/TorrentMeta';
import { SiteConfig } from '../types/SiteConfig';
import { parseMediaInfoFromDescription, type MediaInfoResult } from '../common/rules/media';
import { isGenericDetailPage } from '../common/rules/pages';
import { readFieldValue } from '../common/dom/form';

export abstract class BaseEngine {
    constructor(
        protected config: SiteConfig,
        protected currentUrl: string
    ) { }

    get siteName(): string {
        return this.config.name;
    }

    getConfig(): SiteConfig {
        return this.config;
    }

    /**
     * Scrape data from the current page
     */
    abstract parse(): Promise<TorrentMeta>;

    /**
     * Fill the upload form with data
     */
    abstract fill(meta: TorrentMeta): Promise<void>;

    /**
     * Whether `url` is a single-torrent detail page of this site. Gates the embedded forward UI
     * and the remote-download sidebar. Override when the site's detail URLs differ.
     */
    isSourcePage(url: URL): boolean {
        return isGenericDetailPage(url);
    }

    /**
     * Whether the upload form already holds the key fields after a fill. While false,
     * SiteManager keeps re-running `fill` (pages that render their form late).
     */
    isFillComplete(): boolean {
        const name = readFieldValue(['input[name="name"]', '#name', 'input[name="title"]', '#title']);
        const descr = readFieldValue(['textarea[name="descr"]', '#descr', 'textarea[name="description"]']);
        const releaseDesc = readFieldValue(['textarea[name="release_desc"]', '#release_desc', 'textarea[name="info"]', '#info']);
        return !!name && (descr.length > 30 || releaseDesc.length > 30);
    }

    /**
     * Called on upload-like pages that received forwarded data (handoff token or pending forward),
     * right before the fill button is shown.
     */
    onForwardReceived(): void { }

    /**
     * Upload-like page without forwarded data: return meta to offer a fill anyway (multi-step
     * upload flows), or null for nothing.
     */
    async recoverForwardMeta(): Promise<TorrentMeta | null> {
        return null;
    }

    /** Called on every page of this site that is not upload-like (reset multi-step state). */
    async onNonUploadPage(): Promise<void> { }

    protected log(message: string) {
        console.log(`[Auto-Feed][${this.siteName}] ${message}`);
    }

    protected error(message: string) {
        console.error(`[Auto-Feed][${this.siteName}] ${message}`);
    }

    protected selectOption(selectName: string, value: string) {
        // Simple helper to select option by value or text
        const $ = (window as any).$; // Assume jQuery is available
        const select = $(`select[name="${selectName}"]`);
        if (select.length === 0) return;

        // Try by value
        select.val(value);

        // If value didn't change (invalid option), try text match
        if (select.val() !== value) {
            select.find('option').each((_: number, el: any) => {
                if ($(el).text().includes(value)) {
                    $(el).prop('selected', true);
                }
            });
        }
    }

    protected parseMediaInfo(description: string): MediaInfoResult {
        return parseMediaInfoFromDescription(description);
    }
}
