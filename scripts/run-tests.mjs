// Bundles every `tests/**/*.test.ts` with esbuild and runs them with `node --test`.
//
//   npm test                 # all tests
//   npm test -- tik parity   # only files whose path contains one of the words
import { build } from 'esbuild';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const filters = process.argv.slice(2).filter((a) => !a.startsWith('-'));

async function findTests(dir) {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) out.push(...await findTests(full));
        else if (entry.name.endsWith('.test.ts')) out.push(full);
    }
    return out.sort();
}

const tests = (await findTests(path.join(root, 'tests')))
    .filter((f) => !filters.length || filters.some((w) => path.relative(root, f).includes(w)));
if (!tests.length) {
    console.error('No tests matched.');
    process.exit(1);
}

const dir = await mkdtemp(path.join(tmpdir(), 'autofeed-tests-'));
try {
    const outfiles = [];
    for (const entry of tests) {
        const outfile = path.join(dir, `${path.relative(root, entry).replace(/[\\/]/g, '__').replace(/\.ts$/, '.mjs')}`);
        await build({ entryPoints: [entry], outfile, bundle: true, platform: 'node', format: 'esm', logLevel: 'warning' });
        outfiles.push(outfile);
    }
    process.exitCode = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['--test', ...outfiles], { stdio: 'inherit', cwd: root });
        child.on('error', reject);
        child.on('exit', (code) => resolve(code ?? 1));
    });
} finally {
    await rm(dir, { recursive: true, force: true });
}
