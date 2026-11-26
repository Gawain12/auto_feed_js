import test from 'node:test';
import assert from 'node:assert/strict';
import {
    normalizeMusicReleaseType,
    parseEditionLine,
    parseFormatLine,
    unwrapOpsImageCacheUrl
} from '../src/trackers/musicGazelleParse';
import { getMediainfoPictureFromDescr } from '../src/common/rules/media';
import { rebuildReleaseTitleFromMedia } from '../src/common/rules/titleRebuild';
import {
    resolveGazelleMediaValue,
    resolveGazelleReleaseTypeValue
} from '../src/trackers/musicGazelleFill';
import {
    mapMusicFormatToOpenCdStandard,
    mapMusicMediaToOpenCdMedium,
    mapMusicTagsToOpenCdGenre
} from '../src/trackers/OpenCD';
import { SiteRegistry } from '../src/core/SiteRegistry';
import { NEXUS_FILL_PROFILES } from '../src/config/nexus_profiles';
import { resolveNexusProfileValues } from '../src/common/rules/nexusProfile';
import { decodeBibliotikCover } from '../src/trackers/LegacyForeignTrackers';
import { normalizeMeta } from '../src/common/rules/normalize';
import { filterForwardTargets, inferTorrentDomains } from '../src/common/rules/siteDomains';
import { extractSiteSpecificBans, getExclusiveSourceWarnings, getForwardTargetBlockReason, getForwardWarnings } from '../src/services/embed/shared';
import { PtgenService, hasPtgenBlock, stripLeadingPtgenBlock } from '../src/services/PtgenService';
import { buildCmctExtraDescr } from '../src/trackers/nexus/CMCT';
import { ensureLogFilename, isValidRipLogText, normalizeRipLogLineEndings, parseOpenCdNfoLogs } from '../src/trackers/musicRipLogs';
import { SiteCatalogService } from '../src/services/SiteCatalogService';

test('musicGazelleParse handles RED, OPS (no-space dash), and DIC (Chinese) lines cleanly', () => {
    // RED edition line
    const redEd = parseEditionLine('− 1998 / Varèse Sarabande / VSD-5940 / CD');
    assert.equal(redEd.editionYear, '1998');
    assert.equal(redEd.recordLabel, 'Varèse Sarabande');
    assert.equal(redEd.catalogueNumber, 'VSD-5940');
    assert.equal(redEd.media, 'CD');

    // OPS edition line (no space after en-dash)
    const opsEd = parseEditionLine('–2026 – FOURTEEN Records / FOURTEEN08');
    assert.equal(opsEd.editionYear, '2026');
    assert.equal(opsEd.recordLabel, 'FOURTEEN Records');
    assert.equal(opsEd.catalogueNumber, 'FOURTEEN08');

    // DIC edition line
    const dicEd = parseEditionLine('− 1989 - Nimbus Records / NI 5210/3 / CD');
    assert.equal(dicEd.editionYear, '1989');
    assert.equal(dicEd.recordLabel, 'Nimbus Records');
    assert.equal(dicEd.media, 'CD');

    // Format lines
    const opsFmt = parseFormatLine('▶ [WEB / FLAC / 24bit Lossless]');
    assert.equal(opsFmt.media, 'WEB');
    assert.equal(opsFmt.format, 'FLAC');
    assert.equal(opsFmt.bitrate, '24bit Lossless');

    const redFmt = parseFormatLine('FLAC / Lossless / Log (100%) / Cue / Freeleech!');
    assert.equal(redFmt.format, 'FLAC');
    assert.equal(redFmt.bitrate, 'Lossless');

    // Release types (EN + ZH)
    assert.equal(normalizeMusicReleaseType('精选'), 'Anthology');
    assert.equal(normalizeMusicReleaseType('原声'), 'Soundtrack');
    assert.equal(normalizeMusicReleaseType('2026 EP'), 'EP');
});

test('musicGazelleFill maps releaseType & media across RED, OPS, and DIC accurately', () => {
    assert.equal(resolveGazelleReleaseTypeValue('精选', 'DIC'), '6');
    assert.equal(resolveGazelleReleaseTypeValue('精选', 'RED'), '6');
    assert.equal(resolveGazelleReleaseTypeValue('Demo', 'OPS'), '10');
    assert.equal(resolveGazelleReleaseTypeValue('Demo', 'RED'), '17');

    assert.equal(resolveGazelleMediaValue('Blu-Ray', 'OPS'), 'BD');
    assert.equal(resolveGazelleMediaValue('Blu-Ray', 'RED'), 'Blu-Ray');
    assert.equal(resolveGazelleMediaValue('Blu-Ray', 'DIC'), 'Blu-ray');
    assert.equal(resolveGazelleMediaValue('WEB', 'OPS'), 'WEB');
});

test('OpenCD maps tags, format, and media to live plugin_upload.php values', () => {
    assert.equal(mapMusicTagsToOpenCdGenre('stage.and.screen, score'), '4'); // OST
    assert.equal(mapMusicTagsToOpenCdGenre('electronic, techno'), '14'); // Electronic
    assert.equal(mapMusicTagsToOpenCdGenre('romantic, concerto'), '3'); // Classical
    assert.equal(mapMusicFormatToOpenCdStandard('FLAC / 24bit Lossless'), '4');
    assert.equal(mapMusicMediaToOpenCdMedium('SHM-CD'), '18');
    assert.equal(mapMusicMediaToOpenCdMedium('SACD'), '6');
    assert.equal(mapMusicMediaToOpenCdMedium('CD'), '1');
    assert.equal(mapMusicMediaToOpenCdMedium('WEB Lossless'), '21');
    assert.equal(mapMusicMediaToOpenCdMedium('WEB 24bit Lossless'), '22');
});

test('AvistaZ network (AvistaZ/CinemaZ/PrivateHD), CG, and TCCF resolve properly', () => {
    for (const [url, site, isSrc] of [
        ['https://avistaz.to/torrent/375677-nobody-loves-kay', 'AvistaZ', true],
        ['https://avistaz.to/torrents', 'AvistaZ', false],
        ['https://cinemaz.to/torrent/12345-film', 'CinemaZ', true],
        ['https://privatehd.to/torrent/98765-movie', 'PrivateHD', true],
        ['https://cinemageddon.net/details.php?id=54321', 'CG', true],
        ['https://cinemageddon.net/browse.php', 'CG', false],
        ['https://et8.org/details.php?id=111', 'TCCF', true]
    ] as const) {
        const eng = SiteRegistry.getEngine(url);
        assert.equal(eng?.siteName, site, url);
        assert.equal(eng?.isSourcePage(new URL(url)), isSrc, url);
    }

    const tccf = NEXUS_FILL_PROFILES.TCCF;
    const doc = Object.fromEntries(
        resolveNexusProfileValues({ type: '纪录', mediumSel: 'WEB-DL', codecSel: 'H265', audioCodecSel: 'Atmos', standardSel: '4K' }, tccf)
            .map((a) => [a.field, a.value])
    );
    assert.equal(doc.type, '624');
    assert.equal(doc.medium, '9');
    assert.equal(doc.codec, '8');
    assert.equal(doc.audio, '9');
    assert.equal(doc.standard, '5');
});

test('HDT accepts 40-char hex infohash ids and jpop/lztr resolve as source-only music sites', () => {
    const hdtAlpha = 'https://hd-torrents.org/details.php?id=a073e50bb8d4750b5e06876b8be29cc18b2e3899';
    const hdtNum = 'https://hd-torrents.org/details.php?id=9073e50bb8d4750b5e06876b8be29cc18b2e3899';
    const hdtList = 'https://hd-torrents.org/torrents.php';
    const hdtEngine = SiteRegistry.getEngine(hdtAlpha);
    assert.equal(hdtEngine?.siteName, 'HDT');
    assert.equal(hdtEngine?.isSourcePage(new URL(hdtAlpha)), true);
    assert.equal(hdtEngine?.isSourcePage(new URL(hdtNum)), true);
    assert.equal(hdtEngine?.isSourcePage(new URL(hdtList)), false);

    for (const [url, site, isSrc] of [
        ['https://jpopsuki.eu/torrents.php?id=100&torrentid=200', 'jpop', true],
        ['https://jpopsuki.eu/torrents.php?id=100', 'jpop', false],
        ['https://lztr.me/torrents.php?id=10&torrentid=20', 'lztr', true]
    ] as const) {
        const eng = SiteRegistry.getEngine(url);
        assert.equal(eng?.siteName, site, url);
        assert.equal(eng?.isSourcePage(new URL(url)), isSrc, url);
        assert.equal(eng?.config.capabilities?.source, true, url);
        assert.equal(eng?.config.capabilities?.target, false, url);
    }

    const lztrEd = parseEditionLine('Original Release / CD');
    assert.equal(lztrEd.media, 'CD');
    assert.equal(lztrEd.recordLabel, '');
    const jpopFmt = parseFormatLine('» FLAC / Lossless');
    assert.equal(jpopFmt.format, 'FLAC');
    assert.equal(jpopFmt.bitrate, 'Lossless');
});

test('Bibliotik cover decoding, dead-site removal, and legacy/Gazelle/Nexus engine resolution', () => {
    assert.equal(
        decodeBibliotikCover('https://imagecache.bibliotik.me/?url=ssl%3Aimg1.od-cdn.com%2FImageType-100%2Fcover.JPG'),
        'https://img1.od-cdn.com/ImageType-100/cover.JPG'
    );

    // Dead sites must no longer resolve
    assert.equal(SiteRegistry.getEngine('https://www.morethantv.me/torrents.php?id=1'), null);
    assert.equal(SiteRegistry.getEngine('https://xthor.tk/details.php?id=55'), null);
    assert.equal(SiteRegistry.getEngine('https://sugoimusic.me/torrents.php?id=5&torrentid=9'), null);

    // HDF is Gazelle (upload.php), not Unit3D
    const hdf = SiteRegistry.getEngine('https://hdf.world/upload.php');
    assert.equal(hdf?.siteName, 'HDF');
    assert.equal(hdf?.config.type, 'Gazelle');

    for (const [url, site, isSrc] of [
        ['https://bibliotik.me/torrents/983541', 'bib', true],
        ['https://bibliotik.me/torrents', 'bib', false],
        ['https://iptorrents.com/torrent.php?id=12345', 'IPT', true],
        ['https://iptorrents.com/t', 'IPT', false],
        ['https://www.bit-hdtv.com/details.php?id=99', 'bit-hdtv', true],
        ['https://bluebird-hd.org/details.php?id=88', 'BlueBird', true],
        ['https://bwtorrents.tv/details.php?id=77', 'bwtorrents', true],
        ['https://digitalcore.club/torrent/66', 'digitalcore', true],
        ['https://hd-space.org/index.php?page=torrent-details&id=abc', 'HDSpace', true],
        ['https://shadowthein.net/details.php?id=44', 'iTS', true],
        ['https://zhuque.in/torrent/info/123', 'ZHUQUE', true],
        ['https://www.yemapt.org/#/torrent/add', 'YemaPT', false],
        ['https://rousi.pro/upload', 'RouSi', false],
        ['https://byr.pt/details.php?id=10', 'BYR', true],
        ['https://njtupt.top/details.php?id=11', 'NJTUPT', true],
        ['https://www.haidan.video/details.php?id=12', 'HaiDan', true],
        ['https://npupt.com/details.php?id=13', 'NPUPT', true],
        ['https://hdwing.org/details.php?id=14', 'HDChina', true],
        ['https://hdcity.city/upload', 'HDCity', false],
        ['https://anthelion.me/upload.php', 'ANT', false],
        ['https://tv-vault.me/upload.php', 'TVV', false],
        ['https://nebulance.io/upload.php', 'NBL', false],
        ['https://hd-only.org/upload.php', 'HD-Only', false]
    ] as const) {
        const eng = SiteRegistry.getEngine(url);
        assert.equal(eng?.siteName, site, url);
        assert.equal(eng?.isSourcePage(new URL(url)), isSrc, url);
    }
});

test('Upgraded NexusFillProfile handles sourceByMedium, sourceByType, specialcat, processingByHdr/Year, and StarSpace', () => {
    const pick = (site: string, meta: Record<string, any>) =>
        Object.fromEntries(resolveNexusProfileValues(meta, NEXUS_FILL_PROFILES[site]).map((a) => [a.selector, a.value]));

    // sourceByMedium (HDVideo, QingWa, PigGo)
    const hdvideo = pick('HDVideo', { type: '电影', mediumSel: 'WEB-DL', codecSel: 'H265', audioCodecSel: 'AC3', standardSel: '4K', title: 'Movie.2024.WEB-DL.DDP5.1-GRP', description: '' });
    assert.equal(hdvideo['source_sel[4]'], '24');
    assert.equal(hdvideo['audiocodec_sel[4]'], '10');

    const qingwa = pick('QingWa', { type: '电影', mediumSel: 'UHD', codecSel: 'H265', audioCodecSel: 'Atmos', standardSel: '4K', title: 'Movie.2024.UHD.TrueHD.Atmos-GRP', description: '' });
    assert.equal(qingwa['source_sel[4]'], '1');
    assert.equal(qingwa['audiocodec_sel[4]'], '11');

    const piggo = pick('PigGo', { type: '电影', mediumSel: 'WEB-DL', codecSel: 'H265', standardSel: '4K', title: 'Movie.2024.WEB-DL.DV-GRP', description: 'Dolby Vision' });
    assert.equal(piggo['source_sel[4]'], '7');
    assert.equal(piggo['processing_sel[4]'], '4');

    // sourceByType (PTsbao)
    const ptsbao = pick('PTsbao', { type: '剧集', sourceSel: '欧美', mediumSel: 'WEB-DL', codecSel: 'H264', standardSel: '1080p', title: 'Show.S01.1080p.WEB-DL-GRP', description: '◎产地 英国' });
    assert.equal(ptsbao['source_sel[1]'], '90');
    assert.equal(ptsbao['processing_sel[1]'], '3');

    // specialcat + mode5 (AGSV, MyPT)
    const agsvGame = pick('AGSV', { type: '游戏', mediumSel: 'Encode', codecSel: 'H264', standardSel: '1080p', title: 'Game-GRP', description: '' });
    assert.equal(agsvGame['specialcat'], '413');
    assert.equal(agsvGame['type'], undefined);

    const myptMusic = pick('MyPT', { type: '音乐', mediumSel: 'CD', title: 'Album.FLAC-GRP', description: '' });
    assert.equal(myptMusic['specialcat'], '412');
    assert.equal(myptMusic['audiocodec_sel[5]'], '1');
    assert.equal(myptMusic['processing_sel[5]'], '1');
    assert.equal(myptMusic['medium_sel[4]'], undefined);

    // processingByYear (ICC), StarSpace (影), RS
    const icc = pick('ICC', { type: '电影', mediumSel: 'Blu-ray', codecSel: 'H264', standardSel: '1080p', title: 'Film.1995.1080p.BluRay-GRP', description: '' });
    assert.equal(icc['processing_sel[5]'], '7');

    const ying = pick('影', { type: '电影', mediumSel: 'UHD', codecSel: 'H265', audioCodecSel: 'Atmos', standardSel: '4K', title: 'Film.2024.2160p.UHD.TrueHD.Atmos.DIY-GRP', description: '' });
    assert.equal(ying['tr_category'], 'mo');
    assert.equal(ying['tr_source'], 's53');
    assert.equal(ying['tr_audio_codec'], '15');
    assert.equal(ying['tr_resolution'], 'r4');

    const rs = pick('RS', { type: '电影', mediumSel: 'Blu-ray', codecSel: 'H265', audioCodecSel: 'DTS-HDMA', standardSel: '4K', title: 'Film.2024.BluRay-GRP', description: '' });
    assert.equal(rs['codec_sel'], '8');
    assert.equal(rs['audiocodec_sel'], '3');
    assert.equal(rs['standard_sel'], '6');
});

test('normalizeMeta does not downgrade DTS-HD MA title from terse NFO DTS line, but still upgrades Atmos', () => {
    const bts = normalizeMeta({
        title: 'A Perfect World 1993 EUR Bluray 1080p x264 DTS-HD MA 5.1-BtsHD',
        description: 'AUDiO ..........: DTS 2452 kb/s\nRUNTiME.........: 2 h 18 min',
        sourceSite: 'BTSchool',
        sourceUrl: 'https://pt.btschool.club/details.php?id=356465'
    });
    assert.equal(bts.audioCodecSel, 'DTS-HDMA');

    const atmos = normalizeMeta({
        title: 'Movie 2024 2160p UHD Blu-ray HEVC TrueHD 7.1-GRP',
        description: 'Audio #1\nFormat : MLP FBA 16-ch\nCommercial name : Dolby TrueHD with Dolby Atmos',
        sourceSite: 'PTer',
        sourceUrl: 'https://pterclub.net/details.php?id=1'
    });
    assert.equal(atmos.audioCodecSel, 'Atmos');
});

test('Live-verified regressions: OpenCD plugin_details.php, HDArea/HDDolby/HDTime live option values', () => {
    const ocd = SiteRegistry.getEngine('https://open.cd/plugin_details.php?id=207588&hit=1');
    assert.equal(ocd?.siteName, 'OpenCD');
    assert.equal(ocd?.isSourcePage(new URL('https://open.cd/plugin_details.php?id=207588&hit=1')), true);

    const pick = (site: string, meta: Record<string, any>) =>
        Object.fromEntries(resolveNexusProfileValues(meta, NEXUS_FILL_PROFILES[site]).map((a) => [a.selector, a.value]));

    const hdarea = pick('HDArea', { type: '电影', mediumSel: 'Encode', codecSel: 'H264', audioCodecSel: 'DTS-X', standardSel: '1080p', title: 'Film.2024.1080p.BluRay.H264.DTS-X-GRP', description: '' });
    assert.equal(hdarea['codec_sel'], '7');
    assert.equal(hdarea['audiocodec_sel'], '12');

    const dby = pick('HDDolby', { type: '电影', mediumSel: 'UHD', codecSel: 'AV1', audioCodecSel: 'DTS-X', standardSel: '4K', title: 'Film.2024.2160p.UHD.AV1.DTS-X-GRP', description: '' });
    assert.equal(dby['codec_sel'], '11');
    assert.equal(dby['audiocodec_sel'], '15');

    const hdt = pick('HDTime', { type: '电影', mediumSel: 'WEB-DL', codecSel: 'AV1', audioCodecSel: 'OPUS', standardSel: '1080p', title: 'Film.2024.1080p.WEB-DL.AV1.OPUS-GRP', description: '' });
    assert.equal(hdt['codec_sel[4]'], '15');
    assert.equal(hdt['audiocodec_sel[4]'], '15');
});

test('Site content-domain isolation separates music/movie/TV while preserving PTP<->BTN miniseries overlap', () => {
    const allSites = SiteCatalogService.getSupportedSites();
    const byName = (name: string) => allSites.find((s) => s.name === name)!;
    const sampleTargets = ['PTP', 'GPW', 'BTN', 'SC', 'BLU', 'HDB', 'PTer', 'HDSky', 'RED', 'OPS', 'DIC', 'OpenCD', 'TCCF'].map(byName);

    // 1. Music site (RED / jpop / OpenCD) -> only music targets visible
    const fromRed = filterForwardTargets(sampleTargets, { sourceSite: 'RED', title: 'Artist - Album [2024] FLAC', type: '音乐' }, byName('RED'));
    assert.deepEqual(fromRed.visible.map((s) => s.name), ['RED', 'OPS', 'DIC', 'OpenCD']);

    const fromJpop = filterForwardTargets(sampleTargets, { sourceSite: 'jpop', title: 'Utada Hikaru - Single' }, byName('jpop'));
    assert.deepEqual(fromJpop.visible.map((s) => s.name), ['RED', 'OPS', 'DIC', 'OpenCD']);

    // 2. Pure Movie (GPW) -> hides BTN and all pure music sites
    const fromGpw = filterForwardTargets(sampleTargets, { sourceSite: 'GPW', title: 'Oppenheimer.2023.1080p.BluRay-GRP', type: '电影' }, byName('GPW'));
    const gpwNames = fromGpw.visible.map((s) => s.name);
    assert.ok(gpwNames.includes('PTP') && gpwNames.includes('PTer') && gpwNames.includes('BLU'));
    assert.ok(!gpwNames.includes('BTN'));
    assert.ok(!gpwNames.includes('RED') && !gpwNames.includes('OpenCD'));

    // 3. Regular multi-season / single-episode TV on BTN -> hides GPW, SC, PTP, and music sites
    const fromBtnS02 = filterForwardTargets(sampleTargets, { sourceSite: 'BTN', title: 'Succession.S02.1080p.WEB-DL-GRP', type: '剧集' }, byName('BTN'));
    const btnS02Names = fromBtnS02.visible.map((s) => s.name);
    assert.ok(btnS02Names.includes('BTN') && btnS02Names.includes('BLU') && btnS02Names.includes('HDB') && btnS02Names.includes('PTer'));
    assert.ok(!btnS02Names.includes('GPW') && !btnS02Names.includes('SC') && !btnS02Names.includes('PTP') && !btnS02Names.includes('RED'));

    // 4. Miniseries on BTN (explicit or S01 pack) -> allows PTP, still hides GPW & music
    const fromBtnMini = filterForwardTargets(sampleTargets, { sourceSite: 'BTN', title: 'Chernobyl.S01.1080p.BluRay-GRP', type: '剧集' }, byName('BTN'));
    const btnMiniNames = fromBtnMini.visible.map((s) => s.name);
    assert.ok(btnMiniNames.includes('PTP') && btnMiniNames.includes('BTN') && btnMiniNames.includes('HDB'));
    assert.ok(!btnMiniNames.includes('GPW') && !btnMiniNames.includes('RED'));

    // 5. PTP Movie vs PTP Miniseries
    const ptpMovie = filterForwardTargets(sampleTargets, { sourceSite: 'PTP', title: 'Arrival.2016.1080p.BluRay-GRP', type: '电影' }, byName('PTP'));
    assert.ok(!ptpMovie.visible.some((s) => s.name === 'BTN'));
    assert.ok(ptpMovie.visible.some((s) => s.name === 'GPW'));

    const ptpMini = filterForwardTargets(sampleTargets, { sourceSite: 'PTP', title: 'Chernobyl.2019.S01.1080p.BluRay-GRP', editionInfo: 'Miniseries', type: '剧集' }, byName('PTP'));
    assert.ok(ptpMini.visible.some((s) => s.name === 'BTN'));
    assert.ok(!ptpMini.visible.some((s) => s.name === 'GPW'));
    assert.ok(!ptpMini.visible.some((s) => s.name === 'RED'));

    // 6. Book source (bib) -> matches TCCF, hides movie/TV/music
    const fromBib = filterForwardTargets(sampleTargets, { sourceSite: 'bib', title: 'Clean Architecture EPUB' }, byName('bib'));
    assert.deepEqual(fromBib.visible.map((s) => s.name), ['TCCF']);

    // 7. Concert Blu-ray under type '音乐' with video resolution is NOT misclassified as audio-only
    assert.ok(!inferTorrentDomains({ sourceSite: 'PTer', title: 'Live.Concert.2024.1080p.BluRay.x264-GRP', type: '音乐', standardSel: '1080p' }, byName('PTer')).includes('music'));

    // 8. Filter toggle OFF returns all targets unchanged
    const disabled = filterForwardTargets(sampleTargets, { sourceSite: 'RED', title: 'Album', type: '音乐' }, byName('RED'), false);
    assert.equal(disabled.visible.length, sampleTargets.length);
    assert.equal(disabled.hidden.length, 0);
});

test('Live-test regressions: GPW DD5.1 title preservation, MediaInfo size decimal guard, CMCT poster priority, OPS imgcache unwrap', () => {
    // 1. GPW WEB-DL DD5.1 title must not be corrupted into DD 6.1 by MediaInfo "496.1 MiB"
    const miWithSize = 'General\nFormat : Matroska\nAudio\nFormat : AC-3\nCommercial name : Dolby Digital\nStream size : 496.1 MiB\nChannel(s) : 6 channels\n';
    const normGpw = normalizeMeta({
        title: 'Project.Y.2026.1080p.ATV.WEB-DL.DD5.1.H.264-Spidey',
        description: `[quote]\n${miWithSize}\n[/quote]`,
        fullMediaInfo: miWithSize,
        sourceSite: 'GPW',
        sourceUrl: 'https://greatposterwall.com/torrents.php?id=51728&torrentid=121644'
    });
    assert.ok(normGpw.title.includes('ATV') && normGpw.title.includes('DD5.1') && !normGpw.title.includes('6.1'), normGpw.title);

    // 2. titleRebuild itself must not mistake "496.1 MiB" for "6.1"
    const rebuilt = rebuildReleaseTitleFromMedia({
        title: 'Project Y 2026',
        description: `1080p WEB-DL H.264\n${miWithSize}`,
        fullMediaInfo: miWithSize
    });
    assert.ok(rebuilt && !rebuilt.includes('6.1'), String(rebuilt));

    // 3. Poster must stay first non-banner image instead of being overwritten by PTerWEB.png
    const mediaInfo = getMediainfoPictureFromDescr(
        '[img]https://doubaninfo.com/dbposter/doubaninfo_com_36697078.jpg[/img]\n\n[img]https://pterclub.net/pic/PTerWEB.png[/img]\n\n◎片　　名　密探'
    );
    assert.equal(mediaInfo.coverImg, '[img]https://doubaninfo.com/dbposter/doubaninfo_com_36697078.jpg[/img]');

    // 4. OPS imgcache proxy URL unwraps to original host
    const wrapped = 'https://imgcache.opsfet.ch/f/full/eUmbXdV9N9qILKwe/' + Buffer.from('https://files.catbox.moe/sample.png').toString('base64url');
    assert.equal(unwrapOpsImageCacheUrl(wrapped), 'https://files.catbox.moe/sample.png');

    // 5. HDfans & TLFbits live option values + TCCF doc/book-only domain isolation
    const pick = (site: string, meta: Record<string, any>) =>
        Object.fromEntries(resolveNexusProfileValues(meta, NEXUS_FILL_PROFILES[site]).map((a) => [a.selector, a.value]));
    const hdfans = pick('HDfans', { type: '电影', mediumSel: 'WEB-DL', codecSel: 'AV1', audioCodecSel: 'DDP_Atmos', standardSel: '4K', title: 'Film.2024.2160p.WEB-DL.AV1.DDP.Atmos-GRP', description: '' });
    assert.equal(hdfans['codec_sel[4]'], '14');
    assert.equal(hdfans['standard_sel[4]'], '2');
    const hdfansOther = pick('HDfans', { type: '电影', mediumSel: 'WEB-DL', codecSel: 'UNKNOWN', standardSel: 'SD', title: 'Film', description: '' });
    assert.equal(hdfansOther['codec_sel[4]'], '13');
    assert.equal(hdfansOther['standard_sel[4]'], '6');

    const tlf = pick('TLFbits', { type: '电影', mediumSel: 'Encode', codecSel: 'AV1', audioCodecSel: 'DTS-X', standardSel: '4K', title: 'Film.2024.2160p.AV1.DTS-X-GRP', description: '' });
    assert.equal(tlf['type'], '438');
    assert.equal(tlf['codec_sel'], '7');
    assert.equal(tlf['audiocodec_sel'], '10');
    assert.equal(tlf['standard_sel'], '6');

    const allSites = SiteCatalogService.getSupportedSites();
    const tccfSite = allSites.find((s) => s.name === 'TCCF')!;
    const pterSite = allSites.find((s) => s.name === 'PTer')!;
    assert.equal(filterForwardTargets([tccfSite], { sourceSite: 'PTer', title: 'Movie 2025 1080p', type: '电影' }, pterSite).visible.length, 0);
    assert.equal(filterForwardTargets([tccfSite], { sourceSite: 'PTer', title: 'Planet Earth 2025', type: '纪录' }, pterSite).visible.length, 1);
});

test('Targeted bans like 禁转至PTT do not trigger global exclusive warnings, and PTGen/CMCT deduplicate cleanly', () => {
    // 1. Site-specific bans (禁转至PTT / 禁止转载至PTT / Audies) only apply to the named target, not globally
    const pttBanMeta = {
        title: 'Movie.2025.1080p.WEB-DL-Audies',
        subtitle: '普通中字 | 禁转至PTT',
        description: '压制说明：欢迎转载，但禁止转载至PTT / PTTime。',
        sourceSite: 'Audiences',
        sourceUrl: 'https://audiences.me/details.php?id=1',
        images: []
    };
    const parsedBan = extractSiteSpecificBans(`${pttBanMeta.subtitle}\n${pttBanMeta.description}`);
    assert.deepEqual(parsedBan.restrictedTargets, ['PTT']);
    assert.deepEqual(getExclusiveSourceWarnings(pttBanMeta, 'zh'), []);
    assert.deepEqual(getForwardWarnings('PTer', pttBanMeta, 'zh'), []);
    assert.deepEqual(getForwardWarnings('CMCT', pttBanMeta, 'zh'), []);
    assert.ok(getForwardWarnings('PTT', pttBanMeta, 'zh').length >= 1);
    assert.ok(getForwardTargetBlockReason('PTT', pttBanMeta, 'zh'));

    // 2. Real global bans ("禁转他站" / "禁止转载") still warn globally
    const realBanMeta = {
        title: 'Movie.2025.1080p.BluRay-GRP',
        description: '本资源严禁转载至其他站点！',
        sourceSite: 'PTer',
        sourceUrl: 'https://pterclub.net/details.php?id=1',
        images: []
    };
    assert.ok(getExclusiveSourceWarnings(realBanMeta, 'zh').length >= 1);

    // 3. PtgenService.applyPtgenResult does not duplicate PTGen blocks on repeated clicks
    const ptgenBlock = [
        '[img]https://img2.doubanio.com/view/photo/l_ratio_poster/public/p2928452603.jpg[/img]',
        '',
        '◎译　　名　孤警追凶',
        '◎片　　名　Oscar Shaw',
        '◎年　　代　2026',
        '◎产　　地　美国',
        '◎类　　别　剧情 / 动作 / 犯罪',
        '◎豆瓣链接　https://movie.douban.com/subject/37537657/',
        '',
        '◎简　　介',
        '　　A retired cop seeks revenge.'
    ].join('\n');
    const miBlock = '[quote]General\nUnique ID : 12345\nComplete name : Oscar.Shaw.2026.mkv[/quote]';
    const shotsBlock = '[img]https://img3.pixhost.to/images/7473/1.png[/img]\n[img]https://img3.pixhost.to/images/7473/2.png[/img]';
    const baseMeta = {
        title: 'Oscar.Shaw.2026.720p.AMZN.WEB-DL.DDP5.1.H.264-RGP',
        description: `${miBlock}\n\n${shotsBlock}`,
        sourceSite: 'PTP',
        sourceUrl: 'https://passthepopcorn.me/torrents.php?id=400757&torrentid=1565319',
        images: []
    };
    const once = PtgenService.applyPtgenResult(baseMeta, { format: ptgenBlock, doubanId: '37537657' });
    const twice = PtgenService.applyPtgenResult(once, { format: ptgenBlock, doubanId: '37537657' });
    assert.equal((twice.description.match(/◎译　　名/g) || []).length, 1);
    assert.equal(twice.doubanId, '37537657');
    assert.equal(twice.sourceSel, '欧美');
    assert.ok(hasPtgenBlock(twice.description));
    assert.equal(stripLeadingPtgenBlock(`${ptgenBlock}\n\n${ptgenBlock}\n\n${shotsBlock}`), shotsBlock);

    // 4. CMCT extra description strips MediaInfo, `#url_vimages` screenshots, Douban poster & PTGen block,
    // while keeping genuine release notes or comparison screenshots.
    const cmctClean = buildCmctExtraDescr(once.description, {
        mediaInfo: 'General\nUnique ID : 12345\nComplete name : Oscar.Shaw.2026.mkv',
        screenshotUrls: ['https://img3.pixhost.to/images/7473/1.png', 'https://img3.pixhost.to/images/7473/2.png'],
        coverUrl: 'https://img2.doubanio.com/view/photo/l_ratio_poster/public/p2928452603.jpg',
        hasExternalLink: true
    });
    assert.equal(cmctClean, '');

    const cmctWithNote = buildCmctExtraDescr(`[quote]注意：附带导演评论音轨[/quote]\n\n${once.description}\n\n[b]对比图[/b]\n[img]https://ptpimg.me/comp1.png[/img]`, {
        mediaInfo: 'General\nUnique ID : 12345\nComplete name : Oscar.Shaw.2026.mkv',
        screenshotUrls: ['https://img3.pixhost.to/images/7473/1.png', 'https://img3.pixhost.to/images/7473/2.png'],
        coverUrl: 'https://img2.doubanio.com/view/photo/l_ratio_poster/public/p2928452603.jpg',
        hasExternalLink: true
    });
    assert.ok(cmctWithNote.includes('注意：附带导演评论音轨'));
    assert.ok(cmctWithNote.includes('https://ptpimg.me/comp1.png'));
    assert.ok(!cmctWithNote.includes('◎译　　名'));
    assert.ok(!cmctWithNote.includes('img3.pixhost.to'));
});

test('Music CD rip log parser validates EAC/XLD logs, splits multi-disc OpenCD NFOs, and normalizes filenames/EOLs', () => {
    const eacSample = [
        'Exact Audio Copy V1.8 from 15. July 2024',
        '',
        'EAC extraction logfile from 24. November 2026, 22:31',
        'Joe Hisaishi / My Lost City',
        'Track  1',
        '     Peak level 98.8 %',
        '     Copy OK',
        '==== Log checksum 1F7BB4887DC2EB0E6F1C53C09E5F4FC0D2D1B6B7053BD8D197B10E19CC1C74CA ===='
    ].join('\n');
    const xldSample = [
        'X Lossless Decoder version 20161007 (149.3)',
        'XLD extraction logfile from 2017-04-02 09:49:29 -0700',
        'Spacehog / The Hogyssey',
        'TOC of the extracted CD',
        '-----END XLD SIGNATURE-----'
    ].join('\n');

    assert.equal(isValidRipLogText(eacSample), true);
    assert.equal(isValidRipLogText(xldSample), true);
    assert.equal(isValidRipLogText('Random album liner notes without rip log metadata'), false);

    // EAC uses CRLF; XLD uses LF
    assert.ok(normalizeRipLogLineEndings(eacSample).includes('\r\n'));
    assert.ok(!normalizeRipLogLineEndings(xldSample).includes('\r\n'));

    // OPS `.txt` log filename normalizes to `.log` for RED/DIC accept=".log,.LOG"
    assert.equal(ensureLogFilename('2836860_766422.txt', 'Spacehog', 0, 1), '2836860_766422.log');
    assert.equal(ensureLogFilename('', 'Joe Hisaishi - My Lost City', 1, 2), 'Joe Hisaishi - My Lost City - CD2.log');

    // OpenCD multi-disc `#divnfo` splits cleanly on Score banners
    const openCdMulti = `******************** Score : 100 ********************\n${eacSample}\n******************** Score : 100 ********************\n${xldSample}`;
    const parsed = parseOpenCdNfoLogs(openCdMulti, 'Joe Hisaishi - Live');
    assert.equal(parsed.length, 2);
    assert.equal(parsed[0].filename, 'Joe Hisaishi - Live - CD1.log');
    assert.equal(parsed[1].filename, 'Joe Hisaishi - Live - CD2.log');
    assert.ok(!parsed[0].content?.includes('Score : 100'));
    assert.ok(parsed[0].content?.includes('Log checksum'));
    assert.ok(parsed[1].content?.includes('END XLD SIGNATURE'));
});
