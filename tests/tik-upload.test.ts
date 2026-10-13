import test from 'node:test';
import assert from 'node:assert/strict';
import { ImdbAspectRatioService as Ratio } from '../src/services/ImdbAspectRatioService';
import { updateTikFilmAspectRatio, stripTikImages } from '../src/trackers/Tik';
import currentImdb from './fixtures/imdb-tt0047346-aspect.json';

test('reads the current IMDb technical-specification JSON shape', () => {
    assert.equal(Ratio.extractFromPageData(currentImdb.props.pageProps), '1.37:1');
});

test('does not take a ratio from an unrelated recommendation', () => {
    assert.equal(Ratio.extractFromPageData({
        contentData: { data: { title: { technicalSpecifications: {} }, recommended: { aspectRatio: '2.39:1' } } }
    }), '');
});

test('supports the older main-column data shape and nested ratio fields', () => {
    assert.equal(Ratio.extractFromPageData({ mainColumnData: { aspectRatios: { edges: [{ node: { aspectRatio: '1.85 : 1' } }] } } }), '1.85:1');
    assert.equal(Ratio.extractFromPageData({ contentData: { data: { title: { aspectRatios: { aspectRatio: { aspectRatio: '2.35:1' } } } } } }), '2.35:1');
});

test('rejects missing, malformed and object-valued ratios', () => {
    for (const invalid of ['', '[object Object]', 'Unknown', '2026', '1.85:0', {}, null, undefined]) {
        assert.equal(Ratio.normalizeAspectRatio(invalid), '');
    }
    assert.equal(Ratio.normalizeAspectRatio('1.37 : 1'), '1.37:1');
    assert.equal(Ratio.normalizeAspectRatio('1.85'), '1.85:1');
    assert.equal(Ratio.extractFromText('Aspect ratio1.37 : 1'), '1.37:1');
});

test('refreshes only the film ratio and preserves manually rehosted images and edits', () => {
    const original = '[center][img]https://hostik.cinematik.net/upload/my-cover.jpg[/img][/center]\nFilm Aspect Ratio..: 16:9\nDVD Format.........: Anamorphic\nMy uploader notes';
    assert.equal(updateTikFilmAspectRatio(original, '1.37 : 1'), original.replace('Film Aspect Ratio..: 16:9', 'Film Aspect Ratio..: 1.37:1'));
    assert.equal(updateTikFilmAspectRatio(original, 'unavailable'), original);
    assert.equal(updateTikFilmAspectRatio('Custom description without a ratio line', '1.37:1'), 'Custom description without a ratio line');
});

test('strips images from generated Tik text regardless of their host or BBCode size', () => {
    const source = 'Synopsis\n[url=https://pixhost.to/original][img=350x350]https://pixhost.to/thumb.jpg[/img][/url]\n[img]https://hostik.cinematik.net/upload/old.jpg[/img]\n<img src="https://example.com/poster.jpg">\n[quote]DISC INFO: keep this[/quote]';
    const clean = stripTikImages(source);
    assert.doesNotMatch(clean, /\[img|<img|pixhost|hostik|example.com/i);
    assert.match(clean, /Synopsis/);
    assert.match(clean, /DISC INFO: keep this/);
});
