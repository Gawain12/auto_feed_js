// Rule regressions that must hold without the legacy reference (CI runs these unconditionally).
import test from 'node:test';
import assert from 'node:assert/strict';
import { dealWithTitle } from '../src/common/rules/title';
import { getMediumSel } from '../src/common/rules/text';
import { getSmallDescrFromDescr } from '../src/common/rules/helpers';

test('dealWithTitle restores audio channel dots after dot-to-space conversion', () => {
    assert.equal(dealWithTitle('Dune.Part.Two.2024.2160p.WEB-DL.DDP5.1.Atmos.DV.HDR10.H.265-FLUX'), 'Dune Part Two 2024 2160p WEB-DL DDP5.1 Atmos DV HDR10 H.265-FLUX');
    assert.equal(dealWithTitle('Perfect.Days.2023.1080i.HDTV.MPEG-2.DD5.1'), 'Perfect Days 2023 1080i HDTV MPEG-2 DD5.1');
    assert.equal(dealWithTitle('The.Matrix.1999.1080p.BluRay.x264.DTS-HD.MA.7.1-FGT'), 'The Matrix 1999 1080p BluRay x264 DTS-HD MA 7.1-FGT');
    // Years and resolutions are not channel layouts.
    assert.equal(dealWithTitle('Movie.2020.1080p.WEB-DL'), 'Movie 2020 1080p WEB-DL');
});

test('getMediumSel treats UHD encodes as Encode, UHD discs as UHD', () => {
    assert.equal(getMediumSel('Planet.Earth.II.2016.2160p.UHD.BluRay.x265.10bit.HDR-SWTYBLZ', 'Planet.Earth.II.2016.2160p.UHD.BluRay.x265.10bit.HDR-SWTYBLZ'), 'Encode');
    assert.equal(getMediumSel('Movie 2160p UHD HEVC DTS-HD MA', 'Movie 2160p UHD HEVC DTS-HD MA'), 'UHD');
});

test('getSmallDescrFromDescr prefers a Chinese name and works without 译名', () => {
    const descr = '◎译　　名　Parasite\n◎片　　名　기생충\n◎类　　别　剧情 / 喜剧';
    assert.equal(getSmallDescrFromDescr(descr, 'Parasite.2019.1080p'), 'Parasite | 类别：剧情  喜剧');
    assert.equal(getSmallDescrFromDescr('◎片　　名　无间道\n◎类　　别　剧情', 'Infernal.Affairs.S01'), '无间道 *第一季* | 类别：剧情');
    assert.equal(getSmallDescrFromDescr('◎类　　别　剧情', 'X'), '类别：剧情');
});
