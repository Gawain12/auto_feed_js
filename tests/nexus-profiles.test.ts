import test from 'node:test';
import assert from 'node:assert/strict';
import { NEXUS_FILL_PROFILES } from '../src/config/nexus_profiles';
import { resolveNexusProfileValues } from '../src/common/rules/nexusProfile';
import { SiteCatalogService, isChineseNexusSite } from '../src/services/SiteCatalogService';
import { SiteRegistry } from '../src/core/SiteRegistry';
import { getForwardTargetBlockReason } from '../src/services/embed/shared';
import { TorrentMeta } from '../src/types/TorrentMeta';

test('every declared Nexus fill profile is wired to a registered Chinese NexusPHP site', () => {
    const sitesByName = new Map(SiteCatalogService.getAllSites().map((s) => [s.name, s]));
    const profileNames = Object.keys(NEXUS_FILL_PROFILES);
    assert.ok(profileNames.length >= 40, `Expected 40+ profiles, got ${profileNames.length}`);

    for (const name of profileNames) {
        const site = sitesByName.get(name);
        assert.ok(site, `Profile "${name}" must exist in SiteCatalogService`);
        assert.ok(site?.nexusProfile, `Site "${name}" must reference its nexusProfile`);
        assert.equal(isChineseNexusSite(name), true, `Site "${name}" should be marked Chinese Nexus`);
        assert.equal(SiteRegistry.getEngine(`${site.baseUrl}details.php?id=1`)?.siteName, name);
    }
});

test('resolveNexusProfileValues handles standard movie, UHD DIY, and DDP audio correctly', () => {
    const pthome = NEXUS_FILL_PROFILES.PThome;
    const uhdDiy = resolveNexusProfileValues(
        {
            type: '电影',
            mediumSel: 'UHD',
            codecSel: 'H265',
            audioCodecSel: 'Atmos',
            standardSel: '4K',
            title: 'Movie.2024.2160p.UHD.BluRay.DIY-GROUP'
        },
        pthome
    );
    const byField = Object.fromEntries(uhdDiy.map((a) => [a.field, a.value]));
    assert.equal(byField.type, '401');
    assert.equal(byField.medium, '13'); // UHD DIY on PThome
    assert.equal(byField.codec, '6');
    assert.equal(byField.audio, '20');

    const ubits = NEXUS_FILL_PROFILES.UBits;
    const ddpMovie = resolveNexusProfileValues(
        {
            type: '电影',
            mediumSel: 'WEB-DL',
            codecSel: 'H264',
            audioCodecSel: 'AC3',
            standardSel: '1080p',
            sourceSel: '欧美',
            title: 'Movie.2024.1080p.WEB-DL.DDP5.1.H.264-GRP',
            description: 'Dolby Digital Plus'
        },
        ubits
    );
    const ubitsByField = Object.fromEntries(ddpMovie.map((a) => [a.field, a.value]));
    assert.equal(ubitsByField.type, '401');
    assert.equal(ubitsByField.medium, '4');
    assert.equal(ubitsByField.audio, '12'); // DDP on UBits
    assert.equal(ubitsByField.source, '4'); // 欧美 on UBits
});

test('legacy cross-site ban rules block prohibited release groups', () => {
    const base: TorrentMeta = {
        title: 'Movie.2024.1080p.WEB-DL-UBits',
        description: '',
        sourceSite: 'UBits',
        sourceUrl: 'https://ubits.club/details.php?id=1',
        images: []
    };
    assert.ok(getForwardTargetBlockReason('HDSky', base, 'zh'));
    assert.ok(getForwardTargetBlockReason('CMCT', base, 'zh'));
    assert.ok(getForwardTargetBlockReason('PTT', base, 'zh'));
    assert.equal(getForwardTargetBlockReason('PTer', base, 'zh'), '');

    const hdh = { ...base, title: 'Movie.2024.1080p.BluRay-HDHome', sourceSite: 'HDHome' };
    assert.ok(getForwardTargetBlockReason('PThome', hdh, 'zh'));

    const hdv = { ...base, title: 'Movie.2024.1080p.WEB-DL-HDVWEB', sourceSite: 'HDVideo' };
    assert.ok(getForwardTargetBlockReason('HDDolby', hdv, 'zh'));

    const frds = { ...base, title: 'Movie.2024.1080p.x265-FRDS', sourceSite: 'FRDS' };
    assert.ok(getForwardTargetBlockReason('HDChina', frds, 'zh'));
});

test('source-only sites are excluded from default enabled upload targets', () => {
    const hhclub = SiteCatalogService.getAllSites().find((s) => s.name === 'HHClub');
    assert.equal(hhclub?.capabilities?.target, false);
    assert.equal(SiteCatalogService.getDefaultEnabledSiteNames().includes('HDDolby'), false);
});

test('all nexus profile selectors have balanced brackets and HDArea/PTsbao resolve categories', () => {
    for (const [siteName, profile] of Object.entries(NEXUS_FILL_PROFILES)) {
        for (const [field, cfg] of Object.entries(profile)) {
            const sel = (cfg as { selector?: string } | undefined)?.selector || '';
            if (!sel) continue;
            const opens = (sel.match(/\[/g) || []).length;
            const closes = (sel.match(/\]/g) || []).length;
            assert.equal(opens, closes, `Malformed selector "${sel}" on ${siteName}.${field}`);
        }
    }

    const hdarea = NEXUS_FILL_PROFILES.HDArea;
    const uhd = Object.fromEntries(resolveNexusProfileValues({ type: '电影', mediumSel: 'UHD', standardSel: '4K' }, hdarea).map((a) => [a.field, a.value]));
    const remux = Object.fromEntries(resolveNexusProfileValues({ type: '电影', mediumSel: 'Remux', standardSel: '1080p' }, hdarea).map((a) => [a.field, a.value]));
    const web = Object.fromEntries(resolveNexusProfileValues({ type: '电影', mediumSel: 'WEB-DL', standardSel: '1080p' }, hdarea).map((a) => [a.field, a.value]));
    const enc = Object.fromEntries(resolveNexusProfileValues({ type: '电影', mediumSel: 'Encode', standardSel: '1080p' }, hdarea).map((a) => [a.field, a.value]));
    const tv = Object.fromEntries(resolveNexusProfileValues({ type: '剧集', mediumSel: 'WEB-DL', standardSel: '1080p' }, hdarea).map((a) => [a.field, a.value]));
    assert.equal(uhd.type, '300');
    assert.equal(remux.type, '415');
    assert.equal(web.type, '412');
    assert.equal(enc.type, '410');
    assert.equal(tv.type, '402');

    const ptsbao = NEXUS_FILL_PROFILES.PTsbao;
    const baoMovie = Object.fromEntries(resolveNexusProfileValues({ type: '电影' }, ptsbao).map((a) => [a.field, a.value]));
    assert.equal(baoMovie.type, '401');
});
