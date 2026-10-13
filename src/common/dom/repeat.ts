/**
 * Runs `fn` now and then every `delayMs`, `times` runs in total. Errors are swallowed per run.
 * Used to re-apply form values on upload pages that render or reset fields late.
 */
export function repeat(fn: () => void, times: number, delayMs: number): void {
    let i = 0;
    const tick = () => {
        i += 1;
        try { fn(); } catch { }
        if (i < times) setTimeout(tick, delayMs);
    };
    tick();
}
