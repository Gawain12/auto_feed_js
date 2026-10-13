import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = await mkdtemp(path.join(tmpdir(), 'autofeed-tik-test-'));
try {
    const outfile = path.join(dir, 'tik-upload.test.mjs');
    await build({ entryPoints: [path.join(root, 'tests/tik-upload.test.ts')], outfile, bundle: true, platform: 'node', format: 'esm', logLevel: 'warning' });
    process.exitCode = await new Promise((resolve, reject) => {
        const child = spawn(process.execPath, ['--test', outfile], { stdio: 'inherit' });
        child.on('error', reject);
        child.on('exit', code => resolve(code ?? 1));
    });
} finally {
    await rm(dir, { recursive: true, force: true });
}
