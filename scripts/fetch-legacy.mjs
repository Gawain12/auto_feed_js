// Downloads the pinned upstream legacy script into `.legacy/` (gitignored).
//
//   npm run legacy:fetch            # fetch the commit pinned in scripts/legacy.lock.json
//   npm run legacy:fetch -- --latest # re-pin to the current upstream branch head
//
// The legacy script is the behavior reference for the refactor; parity tests load rule
// functions from it, so the exact commit must be pinned to keep results reproducible.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lockPath = path.join(root, 'scripts/legacy.lock.json');
export const LEGACY_FILE = path.join(root, '.legacy/auto_feed.user.js');

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');

async function resolveHead(lock) {
    const res = await fetch(`https://api.github.com/repos/${lock.repo}/commits/${lock.branch}`, {
        headers: { Accept: 'application/vnd.github+json' }
    });
    if (!res.ok) throw new Error(`Cannot resolve ${lock.repo}@${lock.branch}: HTTP ${res.status}`);
    return (await res.json()).sha;
}

async function main() {
    const lock = JSON.parse(await readFile(lockPath, 'utf8'));
    const latest = process.argv.includes('--latest');
    const commit = latest ? await resolveHead(lock) : lock.commit;

    try {
        const existing = await readFile(LEGACY_FILE);
        if (!latest && sha256(existing) === lock.sha256) {
            console.log(`[legacy] up to date (${commit.slice(0, 10)})`);
            return;
        }
    } catch {}

    const url = `https://raw.githubusercontent.com/${lock.repo}/${commit}/${lock.path}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed: ${url} HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = sha256(buf);

    if (!latest && hash !== lock.sha256) {
        throw new Error(`[legacy] sha256 mismatch for ${commit}: expected ${lock.sha256}, got ${hash}`);
    }

    await mkdir(path.dirname(LEGACY_FILE), { recursive: true });
    await writeFile(LEGACY_FILE, buf);

    if (latest) {
        const version = buf.toString('utf8').match(/@version\s+(\S+)/)?.[1] || '';
        await writeFile(lockPath, `${JSON.stringify({ ...lock, commit, version, sha256: hash }, null, 2)}\n`);
        console.log(`[legacy] re-pinned to ${commit.slice(0, 10)} (v${version})`);
    } else {
        console.log(`[legacy] fetched ${commit.slice(0, 10)} -> ${path.relative(root, LEGACY_FILE)}`);
    }
}

main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
});
