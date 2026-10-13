// Differential tests: shared rule functions vs. the pinned upstream legacy script.
//
// These rules are used by every site, so this suite covers sites we cannot log into.
// Run `npm run legacy:fetch` first; without the legacy file the suite is skipped.
//
// A mismatch is either a regression (fix the rule) or an intentional improvement
// (add it to KNOWN_DIVERGENCES with the reason). Re-pinning legacy to a newer upstream
// commit surfaces upstream rule changes the refactor has not adopted yet.
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadLegacyRules, LEGACY_PATH } from './legacy/loadLegacy';
import { DESCRIPTIONS, RELEASE_TITLES, SUBTITLES, TYPE_TEXTS } from './fixtures/rules-corpus';
import { getAudioCodecSel, getCodecSel, getLabel, getMediumSel, getStandardSel, getType } from '../src/common/rules/text';
import { dealWithSubtitle, dealWithTitle } from '../src/common/rules/title';
import { getSearchName } from '../src/common/rules/search';
import { getSmallDescrFromDescr, getSourceSelFromDescr } from '../src/common/rules/helpers';

const legacy = loadLegacyRules();
const skip = legacy ? false : `legacy script missing at ${LEGACY_PATH}; run \`npm run legacy:fetch\``;

type Divergence = { reason: string; inputs: string[] };

// Intentional differences from legacy. Keep each entry narrow (exact inputs) and explained.
const KNOWN_DIVERGENCES: Record<string, Divergence> = {
    dealWithSubtitle: {
        reason: 'collapses every run of spaces; legacy only collapses the first one',
        inputs: ['寄生虫  |  官方中字 DIY简繁特效字幕']
    },
    getLabel: {
        reason: 'zz only matches real subtitle tracks; legacy `Text.*?[\\s\\S]*?Chinese` also fires on any later "Chinese" (here: Text before Chinese text in MediaInfo order)',
        inputs: [`${SUBTITLES[0]}${RELEASE_TITLES[0]}#separator#${DESCRIPTIONS[0]}`]
    },
    getSearchName: {
        reason: 'legacy cuts the title at the "aka" inside "Aka.Mr.Nobody" and returns an empty search',
        inputs: ['Aka.Mr.Nobody.aka.Nemo.2009.Extended.1080p.BluRay.x264.DTS-ES.6.1']
    }
};

function compare(rule: string, inputs: string[], current: (input: string) => unknown, reference: (input: string) => unknown) {
    const allowed = new Set(KNOWN_DIVERGENCES[rule]?.inputs || []);
    const mismatches: string[] = [];
    for (const input of inputs) {
        const actual = current(input);
        const expected = reference(input);
        try {
            assert.deepEqual(actual, expected);
        } catch {
            if (!allowed.has(input)) {
                mismatches.push(`  input:    ${JSON.stringify(input).slice(0, 160)}\n  current:  ${JSON.stringify(actual)}\n  legacy:   ${JSON.stringify(expected)}`);
            }
        }
    }
    assert.equal(mismatches.length, 0, `${rule}: ${mismatches.length} mismatch(es) vs legacy\n${mismatches.join('\n\n')}`);
}

const TEXTS = [...RELEASE_TITLES, ...SUBTITLES, ...DESCRIPTIONS];
const LABEL_TEXTS = RELEASE_TITLES.flatMap((title, i) => [
    `${SUBTITLES[i % SUBTITLES.length]}${title}#separator#${DESCRIPTIONS[i % DESCRIPTIONS.length]}`,
    `${title}#separator#`
]);

test('dealWithTitle', { skip }, () => compare('dealWithTitle', RELEASE_TITLES, dealWithTitle, (t) => legacy!.dealWithTitle(t)));
test('dealWithSubtitle', { skip }, () => compare('dealWithSubtitle', SUBTITLES, dealWithSubtitle, (t) => legacy!.dealWithSubtitle(t)));
test('getMediumSel', { skip }, () => compare('getMediumSel', RELEASE_TITLES, (t) => getMediumSel(t, t), (t) => legacy!.mediumSel(t, t)));
test('getCodecSel', { skip }, () => compare('getCodecSel', TEXTS, getCodecSel, (t) => legacy!.codecSel(t)));
test('getAudioCodecSel', { skip }, () => compare('getAudioCodecSel', TEXTS, getAudioCodecSel, (t) => legacy!.audioCodecSel(t)));
test('getStandardSel', { skip }, () => compare('getStandardSel', TEXTS, getStandardSel, (t) => legacy!.standardSel(t)));
test('getType', { skip }, () => compare('getType', TYPE_TEXTS, getType, (t) => legacy!.getType(t)));
test('getLabel', { skip }, () => compare('getLabel', LABEL_TEXTS, getLabel, (t) => legacy!.getLabel(t)));
test('getSourceSelFromDescr', { skip }, () => compare('getSourceSelFromDescr', DESCRIPTIONS, getSourceSelFromDescr, (d) => legacy!.sourceSelFromDescr(d)));
test('getSmallDescrFromDescr', { skip }, () => {
    const pairs = DESCRIPTIONS.flatMap((d) => RELEASE_TITLES.slice(6, 9).map((t) => `${t}\u0000${d}`));
    const split = (p: string) => p.split('\u0000') as [string, string];
    compare('getSmallDescrFromDescr', pairs, (p) => getSmallDescrFromDescr(split(p)[1], split(p)[0]), (p) => legacy!.smallDescrFromDescr(split(p)[1], split(p)[0]));
});
// Search names are URL-encoded into search links; surrounding whitespace is irrelevant.
test('getSearchName', { skip }, () => compare('getSearchName', RELEASE_TITLES, (t) => getSearchName(dealWithTitle(t)).trim(), (t) => legacy!.searchName(legacy!.dealWithTitle(t)).trim()));
