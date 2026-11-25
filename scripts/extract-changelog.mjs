import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const readArg = (flag, fallback = '') => {
    const idx = args.indexOf(flag);
    return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
};

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const rawVersion = readArg('--version', pkg.version).replace(/^v/i, '').trim();
const outPath = readArg('--out', '');
const validateOnly = args.includes('--validate-version');

if (!/^\d+\.\d+\.\d+$/.test(rawVersion)) {
    console.error(`Invalid release version "${rawVersion}". Expected 3-segment SemVer (MAJOR.MINOR.PATCH, e.g. 5.1.1).`);
    process.exit(1);
}

if (validateOnly) {
    console.log(rawVersion);
    process.exit(0);
}

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function extractFromChangelog(version) {
    const changelogPath = path.join(root, 'CHANGELOG.md');
    if (!fs.existsSync(changelogPath)) return '';
    const content = fs.readFileSync(changelogPath, 'utf8').replace(/\r\n/g, '\n');
    const headingRe = new RegExp(`^##\\s+v?${escapeRegex(version)}(?:\\b[^\\n]*)?$`, 'im');
    const match = headingRe.exec(content);
    if (!match) return '';

    const afterHeading = content.slice(match.index + match[0].length).replace(/^\n+/, '');
    const nextHeading = afterHeading.search(/^##\s+/m);
    const section = (nextHeading === -1 ? afterHeading : afterHeading.slice(0, nextHeading)).trim();
    return section;
}

function fallbackFromGitLog(version) {
    try {
        const currentTag = `v${version}`;
        const tags = execSync('git tag --list "v*" --sort=-v:refname', { cwd: root, encoding: 'utf8' })
            .split('\n')
            .map((t) => t.trim())
            .filter((t) => /^v\d+\.\d+\.\d+$/.test(t) && t !== currentTag);
        const prevTag = tags[0] || '';
        const range = prevTag ? `${prevTag}..HEAD` : '-n 15';
        const log = execSync(`git log ${range} --no-merges --pretty=format:"- %s"`, { cwd: root, encoding: 'utf8' }).trim();
        if (log) return log;
    } catch {}
    return `Release v${version}`;
}

const notes = extractFromChangelog(rawVersion) || fallbackFromGitLog(rawVersion);

if (outPath) {
    fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true });
    fs.writeFileSync(outPath, `${notes}\n`, 'utf8');
} else {
    process.stdout.write(`${notes}\n`);
}
