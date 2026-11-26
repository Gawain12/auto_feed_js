import test from 'node:test';
import assert from 'node:assert/strict';
import { SiteCatalogService } from '../src/services/SiteCatalogService';
import { SiteRegistry } from '../src/core/SiteRegistry';
import { ForwardLinkService } from '../src/services/ForwardLinkService';
import { SettingsService, AppSettings } from '../src/services/SettingsService';
import { isUploadLikeUrl } from '../src/common/rules/pages';

const ensureWindow = () => {
    if (typeof (globalThis as any).window === 'undefined') {
        (globalThis as any).window = { location: { host: 'example.com', protocol: 'https:' } };
    }
};

test('all configured sites have unique names and zero hostname/keyword collisions', () => {
    const sites = SiteCatalogService.getAllSites();
    const seen = new Set<string>();
    for (const s of sites) {
        assert.equal(seen.has(s.name), false, `Duplicate site name: ${s.name}`);
        seen.add(s.name);

        const urls = [
            s.baseUrl,
            s.mirrorUrl,
            ...(s.keywords || []).map((k) => `https://${k.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}/`)
        ].filter(Boolean) as string[];

        for (const u of urls) {
            if (!/^https?:\/\/[a-z0-9.-]+\.[a-z]{2,}/i.test(u)) continue;
            const eng = SiteRegistry.getEngine(u);
            assert.equal(eng?.siteName, s.name, `URL ${u} expected ${s.name}, got ${eng?.siteName}`);
        }
    }
});

test('every target-capable site builds a valid upload URL recognized by isUploadLikeUrl and clean search URLs', () => {
    ensureWindow();
    const sites = SiteCatalogService.getAllSites();
    const sampleMeta = {
        title: 'Test Movie 2026 1080p BluRay x264-GRP',
        imdbId: 'tt1234567',
        description: '',
        sourceSite: 'PTP',
        sourceUrl: 'https://passthepopcorn.me/torrents.php?id=1&torrentid=2',
        images: []
    };

    for (const s of sites) {
        const searchUrl = ForwardLinkService.getSearchUrl(s, sampleMeta);
        assert.ok(searchUrl && searchUrl !== '#' && !searchUrl.includes('{'), `Bad search URL for ${s.name}: ${searchUrl}`);

        if (s.capabilities?.target === false) continue;
        const uploadUrl = ForwardLinkService.getUploadUrl(s);
        assert.ok(uploadUrl && uploadUrl !== '#', `Missing upload URL for ${s.name}`);
        assert.equal(isUploadLikeUrl(uploadUrl), true, `Upload URL not recognized by isUploadLikeUrl for ${s.name}: ${uploadUrl}`);
    }
});

test('SettingsService.migrate runs legacy KG/SC/TJUPT/HDT enablement once and respects user clears afterwards', () => {
    const base = {
        enabledSites: ['PTP', 'FileList', 'bib'],
        favoriteSites: ['PTP'],
        showSearchOnList: { PTP: true, HDB: false, HDT: false },
        uiLanguage: 'zh'
    } as unknown as AppSettings;

    // Pre-v5.2 config (schemaVersion < 2): adds KG/SC/TJUPT/HDT once and strips source-only sites.
    const first = SettingsService.migrate({ ...base, schemaVersion: 1 });
    assert.equal(first.schemaVersion, 2);
    assert.ok(first.enabledSites.includes('KG'));
    assert.ok(first.enabledSites.includes('HDT'));
    assert.equal(first.enabledSites.includes('FileList'), false);
    assert.equal(first.enabledSites.includes('bib'), false);

    // Subsequent user "Clear All" (schemaVersion === 2): stays empty!
    const cleared = SettingsService.migrate({ ...first, enabledSites: [], favoriteSites: [] });
    assert.deepEqual(cleared.enabledSites, []);
    assert.deepEqual(cleared.favoriteSites, []);
});
