
import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { SettingsService, AppSettings } from '../services/SettingsService';
import { DEFAULT_QUICK_SEARCH_TEMPLATES, getQuickSearchPresetLabel } from '../common/quickSearch';
import { SiteCatalogService } from '../services/SiteCatalogService';
import { RemoteDownloadService } from '../services/RemoteDownloadService';
import { i18n, SupportedLang } from './i18n';

export const App = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [panelPos, setPanelPos] = useState<{ x: number; y: number } | null>(null);
    const [drag, setDrag] = useState<{ offsetX: number; offsetY: number } | null>(null);
    const [settings, setSettings] = useState<AppSettings>({
        ptpImgApiKey: '',
        freeimageApiKey: '',
        imgbbApiKey: '',
        doubanCookie: '',
        tmdbApiKey: '',
        chdBaseUrl: 'https://chdbits.co/',
        tlBaseUrl: 'https://www.torrentleech.org/',
        ptpShowDouban: true,
        ptpShowGroupName: true,
        ptpNameLocation: 1,
        hdbShowDouban: true,
        hdbHideDouban: false,
        showQuickSearchOnDouban: true,
        showQuickSearchOnImdb: true,
        defaultAnonymous: false,
        autoDownloadAfterUpload: true,
        filterForwardTargetsByType: true,
        remoteSidebarOpacity: 0.92,
        settingsPanelOpacity: 0.95,
        popupOpacity: 0.96,
        maskOpacity: 0.25,
        toastOpacity: 0.95,
        enableRemoteSidebar: false,
        remoteSkipCheckingDefault: false,
        remoteAskSkipConfirm: false,
        remoteServer: null,
        imdbToDoubanMethod: 0,
        ptgenApi: 3,
        quickSearchList: [],
        quickSearchPresets: [],
        enabledSites: [],
        favoriteSites: [],
        showSearchOnList: {
            PTP: true,
            HDB: false,
            HDT: false
        },
        uiLanguage: 'zh'
    });
    const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [remoteModalOpen, setRemoteModalOpen] = useState(false);
    const [remoteSaving, setRemoteSaving] = useState(false);
    const [remoteForm, setRemoteForm] = useState<{
        type: 'qb' | 'tr' | 'de';
        name: string;
        url: string;
        username: string;
        password: string;
        paths: { label: string; path: string }[];
        editingKey?: { type: 'qb' | 'tr' | 'de'; name: string };
    }>({
        type: 'qb',
        name: '',
        url: '',
        username: '',
        password: '',
        paths: [{ label: 'default', path: '' }]
    });

    const [quickPreset, setQuickPreset] = useState('');
    const [quickPresetInput, setQuickPresetInput] = useState('');
    const [siteSearch, setSiteSearch] = useState('');
    const [showEnabledOnly, setShowEnabledOnly] = useState(false);
    const [showExperimentalSites, setShowExperimentalSites] = useState(false);
    const settingsRef = useRef<AppSettings>(settings);
    const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
    const saveTimerRef = useRef<number | null>(null);
    const [saveNotice, setSaveNotice] = useState<string>('');

    const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
    const getPanelSize = () => {
        // Keep it compact, but still wide enough to show >= 8 site tiles per row.
        const w = Math.min(880, Math.min(980, window.innerWidth - 24));
        const h = Math.min(760, window.innerHeight - 24);
        return { w: Math.max(660, w), h: Math.max(540, h) };
    };

    const refreshSettingsFromStorage = () => {
        SettingsService.load().then((loaded) => {
            setSettings(loaded);
            settingsRef.current = loaded;
            setHasUnsavedChanges(false);
            setSaveState('idle');
            setSaveNotice('');
            if (loaded.quickSearchList && loaded.quickSearchList.length) {
                setQuickPreset(loaded.quickSearchList[0]);
            } else if (DEFAULT_QUICK_SEARCH_TEMPLATES.length) {
                setQuickPreset(DEFAULT_QUICK_SEARCH_TEMPLATES[0]);
            }
        });
    };

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.altKey && e.code === 'KeyS') {
                setIsOpen((prev) => {
                    const nextOpen = !prev;
                    if (nextOpen) refreshSettingsFromStorage();
                    return nextOpen;
                });
            }
        };
        window.addEventListener('keydown', handleKey);

        const openSettings = () => {
            refreshSettingsFromStorage();
            setIsOpen(true);
            setActiveTab('dashboard');
        };
        window.addEventListener('autofeed:open-settings', openSettings as any);

        refreshSettingsFromStorage();

        return () => {
            window.removeEventListener('keydown', handleKey);
            window.removeEventListener('autofeed:open-settings', openSettings as any);
            if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        };
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        const onMouseDown = (e: MouseEvent) => {
            const host = document.getElementById('auto-feed-overlay-host');
            const root = host?.shadowRoot;
            if (!host || !root) return;
            const target = e.target as Node | null;
            const inUI = !!target && (root.contains(target) || host.contains(target));
            if (!inUI) setIsOpen(false);
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('mousedown', onMouseDown);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('mousedown', onMouseDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        if (panelPos) return;
        const { w, h } = getPanelSize();
        setPanelPos({
            x: Math.max(20, window.innerWidth - w - 20),
            y: Math.max(20, Math.floor((window.innerHeight - h) / 2))
        });
    }, [isOpen, panelPos]);

    useEffect(() => {
        if (!drag) return;

        const onMove = (e: MouseEvent) => {
            e.preventDefault();
            const { w, h } = getPanelSize();
            const nextX = clamp(e.clientX - drag.offsetX, 0, Math.max(0, window.innerWidth - w));
            const nextY = clamp(e.clientY - drag.offsetY, 0, Math.max(0, window.innerHeight - h));
            setPanelPos({ x: nextX, y: nextY });
        };
        const onUp = () => setDrag(null);

        document.addEventListener('mousemove', onMove, true);
        document.addEventListener('mouseup', onUp, true);
        return () => {
            document.removeEventListener('mousemove', onMove, true);
            document.removeEventListener('mouseup', onUp, true);
        };
    }, [drag]);

    useEffect(() => {
        settingsRef.current = settings;
    }, [settings]);

    const flashSaveState = (state: 'saved' | 'error', notice?: string) => {
        setSaveState(state);
        setSaveNotice(notice || '');
        if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = window.setTimeout(() => {
            setSaveState('idle');
            setSaveNotice('');
        }, state === 'error' ? 2800 : 1800);
    };

    const handleSaveSettings = async () => {
        setSaveState('saving');
        setSaveNotice('');
        try {
            const ok = await persistSettings(settingsRef.current, { silentBadge: true });
            if (!ok) throw new Error('save failed');
            setHasUnsavedChanges(false);
            flashSaveState(
                'saved',
                settingsRef.current.uiLanguage === 'en' ? 'Saved' : '已保存'
            );
        } catch {
            flashSaveState(
                'error',
                settingsRef.current.uiLanguage === 'en' ? 'Save failed' : '保存失败'
            );
        }
    };

    const persistSettings = async (
        next: AppSettings,
        opts?: { silentBadge?: boolean }
    ): Promise<boolean> => {
        const normalized = SettingsService.migrate(next);
        setSettings(normalized);
        settingsRef.current = normalized;
        if (!opts?.silentBadge) {
            setSaveState('saving');
        }
        let ok = true;
        const run = async () => {
            try {
                await SettingsService.save(normalized);
            } catch (err) {
                console.error('[Auto-Feed] Failed to persist settings:', err);
                ok = false;
            }
        };
        const queued = saveQueueRef.current
            .catch(() => undefined)
            .then(run);
        saveQueueRef.current = queued;
        await queued;
        if (ok) {
            setHasUnsavedChanges(false);
        }
        if (!opts?.silentBadge) {
            if (ok) {
                flashSaveState(
                    'saved',
                    normalized.uiLanguage === 'en' ? 'Saved' : '已保存'
                );
            } else {
                flashSaveState(
                    'error',
                    normalized.uiLanguage === 'en' ? 'Save failed' : '保存失败'
                );
            }
        }
        return ok;
    };

    const setAndPersist = (next: AppSettings) => {
        void persistSettings(next);
    };

    // Update draft state only — persist & notify tracker pages only when user explicitly clicks "Save".
    const patchSettings = (patch: Partial<AppSettings> | ((cur: AppSettings) => AppSettings)) => {
        const cur = settingsRef.current;
        const next = typeof patch === 'function' ? patch(cur) : { ...cur, ...patch };
        setSettings(next);
        settingsRef.current = next;
        setHasUnsavedChanges(true);
        if (saveState === 'saved' || saveState === 'error') {
            setSaveState('idle');
            setSaveNotice('');
        }
    };

    const normalizeRemoteUrl = (url: string): string => {
        let u = String(url || '').trim();
        if (!u) return '';
        if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
        if (!u.endsWith('/')) u += '/';
        return u;
    };

    const cloneRemoteServer = (src: any) => ({
        qbittorrent: { ...(src?.qbittorrent || {}) },
        transmission: { ...(src?.transmission || {}) },
        deluge: { ...(src?.deluge || {}) }
    });

    const resetRemoteForm = () => {
        setRemoteForm({
            type: 'qb',
            name: '',
            url: '',
            username: '',
            password: '',
            paths: [{ label: 'default', path: '' }]
        });
    };

    const getRemotePathRows = (pathMap: Record<string, string> | undefined) => {
        const rows = Object.entries(pathMap || {})
            .map(([label, path]) => ({ label: String(label || '').trim(), path: String(path || '').trim() }))
            .filter((it) => it.label || it.path)
            .map((it, idx) => ({
                label: it.label || (idx === 0 ? 'default' : `path${idx + 1}`),
                path: it.path
            }));
        return rows.length ? rows : [{ label: 'default', path: '' }];
    };

    const applyRemoteSidebarOpacity = (value: number) => {
        const sidebar = document.getElementById('autofeed-remote-sidebar') as HTMLElement | null;
        if (!sidebar) return;
        const opacity = clamp(Number(value) || 0.92, 0.3, 1);
        sidebar.style.opacity = String(opacity);
    };

    const toggleLanguage = () => {
        patchSettings((cur) => ({ ...cur, uiLanguage: (cur.uiLanguage === 'zh' ? 'en' : 'zh') as any }));
    };

    const allSites = SiteCatalogService.getSupportedSites();
    const targetSites = allSites.filter((s: any) => s.capabilities?.target !== false);
    const sourceOnlySites = allSites.filter((s: any) => s.capabilities?.target === false);
    const t = i18n[settings.uiLanguage as SupportedLang] || i18n.en;

    const sortSites = (sites: any[]) => sites.slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
    const getSiteFavicon = (site: any) => {
        try {
            const base =
                site.baseUrl ||
                (site.keywords && site.keywords.length
                    ? `https://${String(site.keywords.find((k: string) => k.includes('.') && !k.includes('/')) || site.keywords[0]).replace(/^https?:\/\//, '').replace(/\/.*$/, '')}/`
                    : '');
            if (!base) return '';
            return new URL('/favicon.ico', base).href;
        } catch {
            return '';
        }
    };
    const getSiteAbbr = (name: string) => {
        const n = String(name || '').trim();
        if (!n) return '';
        if (/[A-Za-z0-9]/.test(n)) {
            const s = n.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
            return (s.slice(0, 4) || n.slice(0, 4)).toUpperCase();
        }
        return n.slice(0, 2);
    };

    const quickSearchPresets = Array.from(new Set([
        ...DEFAULT_QUICK_SEARCH_TEMPLATES,
        ...(settings.quickSearchPresets || [])
    ]));

    const toggleSite = (name: string) => {
        patchSettings((cur) => {
            const set = new Set(cur.enabledSites || []);
            if (set.has(name)) set.delete(name); else set.add(name);
            const enabledSites = Array.from(set);
            const favoriteSites = (cur.favoriteSites || []).filter((x) => enabledSites.includes(x));
            return { ...cur, enabledSites, favoriteSites };
        });
    };

    const toggleFavoriteSite = (name: string) => {
        patchSettings((cur) => {
            if (!(cur.enabledSites || []).includes(name)) return cur;
            const set = new Set(cur.favoriteSites || []);
            if (set.has(name)) set.delete(name); else set.add(name);
            return { ...cur, favoriteSites: Array.from(set) };
        });
    };

    const selectAllSites = () => {
        const coreNames = targetSites.filter((s: any) => !s.experimental).map((s: any) => s.name);
        patchSettings((cur) => ({ ...cur, enabledSites: Array.from(new Set([...(cur.enabledSites || []), ...coreNames])) }));
    };
    const clearAllSites = () => patchSettings({ enabledSites: [], favoriteSites: [] });

    // Components
    const CheckboxRow = ({ label, checked, onChange, desc }: { label: string, checked: boolean, onChange: () => void, desc?: string }) => (
        <label className="af-row" style={{ cursor: 'pointer' }}>
            <div className="af-label">
                <div>{label}</div>
                {desc && <div className="af-label-desc">{desc}</div>}
            </div>
            <div className="af-toggle">
                <input type="checkbox" checked={checked} onChange={onChange} />
                <span className="af-slider"></span>
            </div>
        </label>
    );

    const InputRow = ({ label, value, onInput, placeholder, desc }: { label: string, value: string, onInput: (v: string) => void, placeholder?: string, desc?: string }) => (
        <div className="af-row">
            <div className="af-label">
                <div>{label}</div>
                {desc && <div className="af-label-desc">{desc}</div>}
            </div>
            <input
                className="af-input"
                style={{ width: '340px', maxWidth: '100%' }}
                type="text"
                value={value}
                onInput={(e) => onInput(e.currentTarget.value)}
                placeholder={placeholder}
            />
        </div>
    );

    // Avoid fixed overlay controls that can block site UI; open via embedded entry or Alt+S.
    if (!isOpen) return null;

    const { w: panelW, h: panelH } = getPanelSize();
    const pos = panelPos || { x: 20, y: 20 };

    return (
        <div
            className="af-panel"
            style={{
                position: 'fixed',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                width: `${panelW}px`,
                height: `${panelH}px`,
                zIndex: 99999,
                opacity: Math.min(1, Math.max(0.3, Number(settings.settingsPanelOpacity ?? 0.95)))
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
        >
            <div
                className="af-header"
                onMouseDown={(e) => {
                    if ((e.target as HTMLElement).closest('button')) return;
                    setDrag({ offsetX: e.clientX - pos.x, offsetY: e.clientY - pos.y });
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 className="af-title">Auto-Feed Refactor</h2>
                    <button
                        type="button"
                        className="af-btn"
                        style={{ padding: '4px 10px', fontSize: '12px', height: '26px', color: '#111' }}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleLanguage(); }}
                        title={t.language}
                    >
                        中/en
                    </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {saveState !== 'idle' ? (
                        <span className={`af-save-badge ${saveState}`}>
                            {saveState === 'saving'
                                ? t.saving
                                : saveState === 'saved'
                                    ? `✓ ${saveNotice || t.saved}`
                                    : `✕ ${saveNotice || t.saveFailed}`}
                        </span>
                    ) : hasUnsavedChanges ? (
                        <span className="af-save-badge dirty">{t.unsaved}</span>
                    ) : null}
                    <button
                        type="button"
                        className={`af-btn ${saveState === 'saved' ? 'af-btn-success' : 'af-btn-primary'}`}
                        onClick={handleSaveSettings}
                    >
                        {saveState === 'saving' ? t.saving : saveState === 'saved' ? `✓ ${t.saved}` : saveState === 'error' ? t.saveFailed : t.save}
                    </button>
                    <button
                        type="button"
                        className="af-close-btn"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsOpen(false);
                        }}
                    >
                        ×
                    </button>
                </div>
            </div>

            <div className="af-layout">
                <div className="af-sidebar">
                    {[
                        { id: 'dashboard', label: t.dashboard, icon: '📊' },
                        { id: 'settings', label: t.settings, icon: '🔧' },
                        { id: 'sites', label: t.sites, icon: '🌐' },
                        { id: 'remote', label: t.remote, icon: '📡' }
                    ].map(item => (
                        <div
                            key={item.id}
                            className={`af-nav-item ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(item.id)}
                        >
                            {item.icon} {item.label}
                        </div>
                    ))}
                </div>

                <div className="af-content">
                    {/* Dashboard */}
                    {activeTab === 'dashboard' && (
                        <div>
                            <div className="af-card">
                                <div className="af-card-header">{t.status}</div>
                                <div className="af-row">
                                    <span className="af-label">{t.status}</span>
                                    <span style={{ color: 'var(--af-success)', fontWeight: '600' }}>{t.active}</span>
                                </div>
                                <div className="af-row">
                                    <span className="af-label">{t.currentHost}</span>
                                    <span style={{ color: 'var(--af-text-secondary)' }}>{window.location.hostname}</span>
                                </div>
                                <div className="af-row">
                                    <span className="af-label">{t.version}</span>
                                    <span style={{ color: 'var(--af-text-secondary)' }}>
                                        {`v${(typeof GM_info !== 'undefined' && GM_info?.script?.version) || (typeof __AUTOFEED_VERSION__ !== 'undefined' ? __AUTOFEED_VERSION__ : '5.x')}`}
                                    </span>
                                </div>
                            </div>
                            <div className="af-card">
                                <div className="af-card-header">UI</div>
                                <div className="af-row">
                                    <div className="af-label">
                                        <div>{t.settingsPanelOpacity}</div>
                                        <div className="af-label-desc">0.30 - 1.00</div>
                                    </div>
                                    <input
                                        className="af-input"
                                        style={{ width: '200px' }}
                                        type="range"
                                        min="0.3"
                                        max="1"
                                        step="0.01"
                                        value={String(settings.settingsPanelOpacity ?? 0.95)}
                                        onInput={(e) => patchSettings({ settingsPanelOpacity: Number(e.currentTarget.value) })}
                                    />
                                </div>
                                <div className="af-row">
                                    <div className="af-label">
                                        <div>{t.popupOpacity}</div>
                                        <div className="af-label-desc">0.30 - 1.00</div>
                                    </div>
                                    <input
                                        className="af-input"
                                        style={{ width: '200px' }}
                                        type="range"
                                        min="0.3"
                                        max="1"
                                        step="0.01"
                                        value={String(settings.popupOpacity ?? 0.96)}
                                        onInput={(e) => patchSettings({ popupOpacity: Number(e.currentTarget.value) })}
                                    />
                                </div>
                                <div className="af-row">
                                    <div className="af-label">
                                        <div>{t.maskOpacity}</div>
                                        <div className="af-label-desc">0.10 - 0.80</div>
                                    </div>
                                    <input
                                        className="af-input"
                                        style={{ width: '200px' }}
                                        type="range"
                                        min="0.1"
                                        max="0.8"
                                        step="0.01"
                                        value={String(settings.maskOpacity ?? 0.25)}
                                        onInput={(e) => patchSettings({ maskOpacity: Number(e.currentTarget.value) })}
                                    />
                                </div>
                                <div className="af-row">
                                    <div className="af-label">
                                        <div>{t.toastOpacity}</div>
                                        <div className="af-label-desc">0.30 - 1.00</div>
                                    </div>
                                    <input
                                        className="af-input"
                                        style={{ width: '200px' }}
                                        type="range"
                                        min="0.3"
                                        max="1"
                                        step="0.01"
                                        value={String(settings.toastOpacity ?? 0.95)}
                                        onInput={(e) => patchSettings({ toastOpacity: Number(e.currentTarget.value) })}
                                    />
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', color: 'var(--af-text-secondary)', marginTop: '20px', fontSize: '12px' }}>
                                Press <span style={{ padding: '2px 6px', background: '#eee', borderRadius: '4px' }}>Alt+S</span> to toggle overlay
                            </div>
                        </div>
                    )}

                    {/* Settings - Reordered as requested */}
                    {activeTab === 'settings' && (
                        <div>
                            <div className="af-card" style={{ padding: '14px 16px', color: '#4b5563', fontSize: '12px', lineHeight: '1.6' }}>
                                <div>{t.languageHelp}</div>
                                <div>{t.optionalEnhancementsHelp}</div>
                            </div>
                            {/* 1. Page Features (Most frequent) */}
                            <div className="af-card">
                                <div className="af-card-header">{t.pageFeatures}</div>
                                <div className="af-two-col">
                                    <CheckboxRow label={t.ptpShowDouban} checked={!!settings.ptpShowDouban} onChange={() => patchSettings((cur) => ({ ...cur, ptpShowDouban: !cur.ptpShowDouban }))} />
                                    <CheckboxRow label={t.ptpShowGroupName} checked={!!settings.ptpShowGroupName} onChange={() => patchSettings((cur) => ({ ...cur, ptpShowGroupName: !cur.ptpShowGroupName }))} />
                                    <CheckboxRow label={t.hdbShowDouban} checked={!!settings.hdbShowDouban} onChange={() => patchSettings((cur) => ({ ...cur, hdbShowDouban: !cur.hdbShowDouban }))} />
                                    <CheckboxRow label={t.hdbCollapseDouban} checked={!!settings.hdbHideDouban} onChange={() => patchSettings((cur) => ({ ...cur, hdbHideDouban: !cur.hdbHideDouban }))} />
                                    <CheckboxRow label={t.doubanQuickSearch} checked={!!settings.showQuickSearchOnDouban} onChange={() => patchSettings((cur) => ({ ...cur, showQuickSearchOnDouban: !cur.showQuickSearchOnDouban }))} />
                                    <CheckboxRow label={t.imdbQuickSearch} checked={!!settings.showQuickSearchOnImdb} onChange={() => patchSettings((cur) => ({ ...cur, showQuickSearchOnImdb: !cur.showQuickSearchOnImdb }))} />
                                    <CheckboxRow label={t.defaultAnonymous} checked={!!settings.defaultAnonymous} onChange={() => patchSettings((cur) => ({ ...cur, defaultAnonymous: !cur.defaultAnonymous }))} />
                                    <CheckboxRow label={t.autoDownloadAfterUpload} checked={!!settings.autoDownloadAfterUpload} onChange={() => patchSettings((cur) => ({ ...cur, autoDownloadAfterUpload: !cur.autoDownloadAfterUpload }))} />
                                </div>
                                <CheckboxRow
                                    label={t.filterForwardTargetsByType}
                                    desc={t.filterForwardTargetsByTypeDesc}
                                    checked={settings.filterForwardTargetsByType !== false}
                                    onChange={() => patchSettings((cur) => ({ ...cur, filterForwardTargetsByType: !(cur.filterForwardTargetsByType !== false) }))}
                                />
                                <div className="af-row">
                                    <span className="af-label">{t.listPageQuickSearch}</span>
                                    <div className="af-segmented">
                                        {(['PTP', 'HDB', 'HDT'] as const).map((key) => (
                                            <div
                                                key={key}
                                                className={`af-segment-opt ${settings.showSearchOnList?.[key] ? 'active' : ''}`}
                                                onClick={() => patchSettings((cur) => ({
                                                    ...cur,
                                                    showSearchOnList: {
                                                        ...cur.showSearchOnList,
                                                        [key]: !cur.showSearchOnList?.[key]
                                                    }
                                                }))}
                                            >
                                                {key}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="af-row">
                                    <span className="af-label">{t.ptpGroupNamePos}</span>
                                    <div className="af-segmented">
                                        {[0, 1].map(v => (
                                            <div
                                                key={v}
                                                className={`af-segment-opt ${settings.ptpNameLocation === v ? 'active' : ''}`}
                                                onClick={() => patchSettings({ ptpNameLocation: v })}
                                            >
                                                {v === 0 ? t.before : t.after}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '0 4px 16px', color: '#6b7280', fontSize: '12px', lineHeight: '1.6' }}>{t.autoDownloadHelp}</div>
                            {/* 2. External Sources */}
                            <div className="af-card">
                                <div className="af-card-header">{t.externalSources}</div>
                                <div className="af-row">
                                    <span className="af-label">{t.imdbToDoubanMethod}</span>
                                    <div className="af-segmented">
                                        {[t.api, t.scrape].map((l, i) => (
                                            <div className={`af-segment-opt ${settings.imdbToDoubanMethod === i ? 'active' : ''}`} onClick={() => patchSettings({ imdbToDoubanMethod: i })}>{l}</div>
                                        ))}
                                    </div>
                                </div>
                                <div className="af-row">
                                    <span className="af-label">{t.ptgenSource}</span>
                                    <div className="af-segmented">
                                        <div className={`af-segment-opt ${settings.ptgenApi === 0 ? 'active' : ''}`} onClick={() => patchSettings({ ptgenApi: 0 })}>IYUU</div>
                                        <div className={`af-segment-opt ${settings.ptgenApi === 1 ? 'active' : ''}`} onClick={() => patchSettings({ ptgenApi: 1 })}>PTGen</div>
                                        <div className={`af-segment-opt ${settings.ptgenApi === 3 ? 'active' : ''}`} onClick={() => patchSettings({ ptgenApi: 3 })}>Douban</div>
                                    </div>
                                </div>
                                <div className="af-row">
                                    <span className="af-label">{t.chdDomain}</span>
                                    <select
                                        className="af-input"
                                        style={{ width: '340px', maxWidth: '100%' }}
                                        value={settings.chdBaseUrl}
                                        onChange={(e) => patchSettings({ chdBaseUrl: e.currentTarget.value.endsWith('/') ? e.currentTarget.value : e.currentTarget.value + '/' })}
                                    >
                                        <option value="https://chdbits.co/">chdbits.co</option>
                                        <option value="https://ptchdbits.co/">ptchdbits.co</option>
                                        <option value="https://ptchdbits.org/">ptchdbits.org</option>
                                        <option value="https://chddiy.xyz/">chddiy.xyz</option>
                                    </select>
                                </div>
                                <div className="af-row">
                                    <span className="af-label">{t.tlDomain}</span>
                                    <select
                                        className="af-input"
                                        style={{ width: '340px', maxWidth: '100%' }}
                                        value={settings.tlBaseUrl}
                                        onChange={(e) => patchSettings({ tlBaseUrl: e.currentTarget.value.endsWith('/') ? e.currentTarget.value : e.currentTarget.value + '/' })}
                                    >
                                        <option value="https://www.torrentleech.org/">torrentleech.org</option>
                                        <option value="https://www.torrentleech.cc/">torrentleech.cc</option>
                                    </select>
                                </div>
                            </div>

                            {/* 3. Quick Search Editor */}
                            <div className="af-card">
                                <div className="af-card-header">{t.quickSearchEditor}</div>
                                <div style={{ padding: '12px' }}>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <select className="af-input" style={{ flex: 1 }} value={quickPreset} onChange={e => setQuickPreset(e.currentTarget.value)}>
                                            {quickSearchPresets.map(l => <option key={l} value={l}>{getQuickSearchPresetLabel(l)}</option>)}
                                        </select>
                                        <button className="af-btn" onClick={() => {
                                            if (!quickPreset) return;
                                            patchSettings((cur) => {
                                                const set = new Set(cur.quickSearchList || []);
                                                set.add(quickPreset);
                                                return { ...cur, quickSearchList: Array.from(set) };
                                            });
                                        }}>{t.add}</button>
                                    </div>
                                    <textarea
                                        className="af-input"
                                        style={{ width: '100%', height: '150px', fontFamily: 'monospace' }}
                                        value={(settings.quickSearchList || []).join('\n')}
                                        onInput={e => patchSettings({ quickSearchList: e.currentTarget.value.split('\n').filter(Boolean) })}
                                    />
                                </div>
                            </div>

                            {/* 4. API Keys (Least frequent) */}
                            <div className="af-card">
                                <div className="af-card-header">{t.servicesApiKeys}</div>
                                <InputRow label="PtpImg API Key" value={settings.ptpImgApiKey} onInput={v => patchSettings({ ptpImgApiKey: v })} />
                                <InputRow label="Freeimage API Key" value={settings.freeimageApiKey} onInput={v => patchSettings({ freeimageApiKey: v })} />
                                <InputRow label="ImgBB API Key" value={settings.imgbbApiKey} onInput={v => patchSettings({ imgbbApiKey: v })} />
                            </div>
                        </div>
                    )}

                    {/* Sites */}
                    {activeTab === 'sites' && (() => {
                        const q = siteSearch.trim().toLowerCase();
                        const enabledSet = new Set(settings.enabledSites || []);
                        const matchFilter = (site: any) => {
                            if (showEnabledOnly && !enabledSet.has(site.name)) return false;
                            if (!q) return true;
                            const hay = `${site.name} ${site.description || ''} ${(site.keywords || []).join(' ')}`.toLowerCase();
                            return hay.includes(q);
                        };
                        const coreSites = sortSites(targetSites.filter((s: any) => !s.experimental || enabledSet.has(s.name))).filter(matchFilter);
                        const experimentalSites = sortSites(targetSites.filter((s: any) => !!s.experimental && !enabledSet.has(s.name))).filter(matchFilter);
                        const expExpanded = showExperimentalSites || !!q;

                        const renderTile = (site: any, keyPrefix = '', isFav = false) => {
                            const checked = isFav ? (settings.favoriteSites || []).includes(site.name) : enabledSet.has(site.name);
                            return (
                                <div
                                    key={keyPrefix + site.name}
                                    className="af-site-tile"
                                    onClick={() => (isFav ? toggleFavoriteSite(site.name) : toggleSite(site.name))}
                                    style={{ background: checked ? 'rgba(0,113,227,0.1)' : undefined }}
                                    title={`${site.name}${site.description ? ` (${site.description})` : ''}${site.experimental ? (settings.uiLanguage === 'zh' ? ' [实验性/未完全测试]' : ' [Experimental / Untested]') : ''}`}
                                >
                                    <input className="af-site-check" type="checkbox" checked={checked} readOnly />
                                    <div className="af-site-icon">
                                        <span>{getSiteAbbr(site.name).slice(0, 1)}</span>
                                        {getSiteFavicon(site) ? (
                                            <img
                                                src={getSiteFavicon(site)}
                                                onError={(e) => {
                                                    const img = e.currentTarget as HTMLImageElement;
                                                    img.style.display = 'none';
                                                }}
                                            />
                                        ) : null}
                                    </div>
                                    <div className="af-site-label">{getSiteAbbr(site.name)}</div>
                                </div>
                            );
                        };

                        return (
                        <div>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <button className="af-btn af-btn-primary" onClick={selectAllSites}>{t.selectAll}</button>
                                <button className="af-btn" onClick={clearAllSites}>{t.clearAll}</button>
                                <input
                                    className="af-input"
                                    style={{ flex: '1 1 180px', maxWidth: '260px', padding: '5px 10px' }}
                                    placeholder={settings.uiLanguage === 'zh' ? '搜索站点名 / 域名（自动展开实验性站点）...' : 'Filter sites (auto-expands experimental)...'}
                                    value={siteSearch}
                                    onInput={(e) => setSiteSearch((e.currentTarget as HTMLInputElement).value)}
                                />
                                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer', userSelect: 'none' }}>
                                    <input type="checkbox" checked={showEnabledOnly} onChange={() => setShowEnabledOnly(!showEnabledOnly)} />
                                    {settings.uiLanguage === 'zh' ? `仅看已启用 (${enabledSet.size}/${targetSites.length})` : `Enabled only (${enabledSet.size}/${targetSites.length})`}
                                </label>
                            </div>

                            <div className="af-card">
                                <div className="af-card-header">{t.enabledSites}</div>
                                <div style={{ padding: '0 10px 10px' }}>
                                    <div className="af-grid">
                                        {coreSites.map((site: any) => renderTile(site))}
                                    </div>
                                    {sourceOnlySites.length > 0 && (
                                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                                            {settings.uiLanguage === 'zh'
                                                ? `仅源站自动生效（无需勾选转发目标）：${sourceOnlySites.map((s: any) => s.name).join(' / ')}`
                                                : `Source-only (always active on detail pages): ${sourceOnlySites.map((s: any) => s.name).join(' / ')}`}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {experimentalSites.length > 0 && (
                                <div className="af-card">
                                    <div
                                        className="af-card-header"
                                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
                                        onClick={() => setShowExperimentalSites(!expExpanded)}
                                    >
                                        <span>
                                            {expExpanded ? '▾ ' : '▸ '}
                                            {settings.uiLanguage === 'zh'
                                                ? `实验性适配站点（未完全测试，欢迎反馈） (${experimentalSites.length})`
                                                : `Experimental / Untested Sites — Feedback Welcome (${experimentalSites.length})`}
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#6b7280' }}>
                                            {expExpanded ? (settings.uiLanguage === 'zh' ? '收起' : 'Collapse') : (settings.uiLanguage === 'zh' ? '展开' : 'Expand')}
                                        </span>
                                    </div>
                                    {expExpanded && (
                                        <div style={{ padding: '0 10px 10px' }}>
                                            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '8px', lineHeight: '1.5' }}>
                                                {settings.uiLanguage === 'zh'
                                                    ? '以下站点已按旧版规则完成适配，但暂未逐一实测；勾选后将移入上方已启用列表。如遇字段或下拉项偏差，欢迎在 GitHub / GreasyFork 反馈。'
                                                    : 'Adapted from legacy rules without full live verification. Checked sites appear in the enabled list above; please report any mapping mismatches.'}
                                            </div>
                                            <div className="af-grid">
                                                {experimentalSites.map((site: any) => renderTile(site, 'exp-'))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="af-card">
                                <div className="af-card-header">{t.favoriteSites}</div>
                                <div style={{ padding: '0 10px 10px' }}>
                                    <div className="af-grid">
                                        {sortSites(targetSites.filter((s: any) => enabledSet.has(s.name))).map((site: any) => renderTile(site, 'fav-', true))}
                                    </div>
                                </div>
                            </div>

                        </div>
                        );
                    })()}

                    {/* Remote */}
                    {activeTab === 'remote' && (
                        <div>
                            <div className="af-card" style={{ padding: '14px 16px', color: '#4b5563', fontSize: '12px', lineHeight: '1.6' }}>{t.remoteHelp}</div>
                            <div className="af-card">
                                <div className="af-card-header">{t.globalSettings}</div>
                                <CheckboxRow label={t.enableSidebar} checked={!!settings.enableRemoteSidebar} onChange={() => patchSettings((cur) => ({ ...cur, enableRemoteSidebar: !cur.enableRemoteSidebar }))} />
                                <CheckboxRow label={t.skipCheckingDefault} checked={!!settings.remoteSkipCheckingDefault} onChange={() => patchSettings((cur) => ({ ...cur, remoteSkipCheckingDefault: !cur.remoteSkipCheckingDefault }))} />
                                <CheckboxRow label={t.askConfirmBeforePush} checked={!!settings.remoteAskSkipConfirm} onChange={() => patchSettings((cur) => ({ ...cur, remoteAskSkipConfirm: !cur.remoteAskSkipConfirm }))} />
                                <div className="af-row">
                                    <div className="af-label">
                                        <div>{t.remoteSidebarOpacity}</div>
                                        <div className="af-label-desc">0.30 - 1.00</div>
                                    </div>
                                    <input
                                        className="af-input"
                                        style={{ width: '200px' }}
                                        type="range"
                                        min="0.3"
                                        max="1"
                                        step="0.01"
                                        value={String(settings.remoteSidebarOpacity ?? 0.92)}
                                        onInput={(e) => {
                                            const value = Number(e.currentTarget.value);
                                            applyRemoteSidebarOpacity(value);
                                            patchSettings({ remoteSidebarOpacity: value });
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="af-card">
                                <div className="af-card-header">{t.clientConfigs}</div>
                                <div style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                                        <button className="af-btn" onClick={() => {
                                            resetRemoteForm();
                                            setRemoteModalOpen(true);
                                        }}>
                                            {t.addClient}
                                        </button>
                                        <label className="af-btn">
                                            {t.importJson}
                                            <input
                                                type="file"
                                                style={{ display: 'none' }}
                                                accept=".json"
                                                onChange={(e) => {
                                                    const f = e.currentTarget.files?.[0];
                                                    if (!f) return;
                                                    const r = new FileReader();
                                                    r.onload = (ev) => {
                                                        try {
                                                            const json = JSON.parse(ev.target?.result as string);
                                                            setAndPersist({ ...settingsRef.current, remoteServer: json });
                                                            alert('Config loaded');
                                                        } catch { alert('Invalid JSON'); }
                                                    };
                                                    r.readAsText(f);
                                                }}
                                            />
                                        </label>
                                    </div>

                                    {settings.remoteServer && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {Object.entries(settings.remoteServer.qbittorrent || {}).map(([name, conf]) => (
                                                <div key={'qb' + name} className="af-row" style={{ background: '#f9f9f9', borderRadius: '8px', gap: '8px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                        <div className="af-label" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            <strong>[QB]</strong> {name}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conf.url}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                        <button type="button" className="af-btn" onClick={async () => {
                                                            const r = await RemoteDownloadService.testQbittorrent({ url: conf.url, username: conf.username, password: conf.password });
                                                            alert(r.ok ? `${t.testSuccess}: ${r.message}` : `${t.testFailed}: ${r.message}`);
                                                        }}>{t.testConnection}</button>
                                                        <button type="button" className="af-btn" onClick={() => {
                                                            const paths = getRemotePathRows((conf as any).path);
                                                            setRemoteForm({
                                                                type: 'qb',
                                                                name,
                                                                url: conf.url,
                                                                username: conf.username || '',
                                                                password: conf.password || '',
                                                                paths,
                                                                editingKey: { type: 'qb', name }
                                                            });
                                                            setRemoteModalOpen(true);
                                                        }}>{t.edit}</button>
                                                        <button type="button" className="af-btn af-btn-danger" onClick={async () => {
                                                            if (!confirm(`Delete QB client "${name}"?`)) return;
                                                            const base = settingsRef.current;
                                                            const next = { ...base, remoteServer: cloneRemoteServer(base.remoteServer) };
                                                            if (next.remoteServer?.qbittorrent) {
                                                                delete (next.remoteServer.qbittorrent as any)[name];
                                                                const ok = await persistSettings(next);
                                                                if (!ok) alert(t.saveFailed);
                                                            }
                                                        }}>{t.delete}</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {Object.entries(settings.remoteServer.transmission || {}).map(([name, conf]) => (
                                                <div key={'tr' + name} className="af-row" style={{ background: '#f9f9f9', borderRadius: '8px', gap: '8px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                        <div className="af-label" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            <strong>[TR]</strong> {name}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conf.url}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                        <button type="button" className="af-btn" onClick={async () => {
                                                            const r = await RemoteDownloadService.testTransmission({ url: conf.url, username: conf.username, password: conf.password });
                                                            alert(r.ok ? `${t.testSuccess}: ${r.message}` : `${t.testFailed}: ${r.message}`);
                                                        }}>{t.testConnection}</button>
                                                        <button type="button" className="af-btn" onClick={() => {
                                                            const paths = getRemotePathRows((conf as any).path);
                                                            setRemoteForm({
                                                                type: 'tr',
                                                                name,
                                                                url: conf.url,
                                                                username: conf.username || '',
                                                                password: conf.password || '',
                                                                paths,
                                                                editingKey: { type: 'tr', name }
                                                            });
                                                            setRemoteModalOpen(true);
                                                        }}>{t.edit}</button>
                                                        <button type="button" className="af-btn af-btn-danger" onClick={async () => {
                                                            if (!confirm(`Delete TR client "${name}"?`)) return;
                                                            const base = settingsRef.current;
                                                            const next = { ...base, remoteServer: cloneRemoteServer(base.remoteServer) };
                                                            if (next.remoteServer?.transmission) {
                                                                delete (next.remoteServer.transmission as any)[name];
                                                                const ok = await persistSettings(next);
                                                                if (!ok) alert(t.saveFailed);
                                                            }
                                                        }}>{t.delete}</button>
                                                    </div>
                                                </div>
                                            ))}
                                            {Object.entries(settings.remoteServer.deluge || {}).map(([name, conf]) => (
                                                <div key={'de' + name} className="af-row" style={{ background: '#f9f9f9', borderRadius: '8px', gap: '8px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                                                        <div className="af-label" style={{ margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            <strong>[DE]</strong> {name}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{conf.url}</div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                        <button type="button" className="af-btn" onClick={async () => {
                                                            const r = await RemoteDownloadService.testDeluge({ url: conf.url, password: conf.password });
                                                            alert(r.ok ? `${t.testSuccess}: ${r.message}` : `${t.testFailed}: ${r.message}`);
                                                        }}>{t.testConnection}</button>
                                                        <button type="button" className="af-btn" onClick={() => {
                                                            const paths = getRemotePathRows((conf as any).path);
                                                            setRemoteForm({
                                                                type: 'de',
                                                                name,
                                                                url: conf.url,
                                                                username: '',
                                                                password: conf.password || '',
                                                                paths,
                                                                editingKey: { type: 'de', name }
                                                            });
                                                            setRemoteModalOpen(true);
                                                        }}>{t.edit}</button>
                                                        <button type="button" className="af-btn af-btn-danger" onClick={async () => {
                                                            if (!confirm(`Delete DE client "${name}"?`)) return;
                                                            const base = settingsRef.current;
                                                            const next = { ...base, remoteServer: cloneRemoteServer(base.remoteServer) };
                                                            if (next.remoteServer?.deluge) {
                                                                delete (next.remoteServer.deluge as any)[name];
                                                                const ok = await persistSettings(next);
                                                                if (!ok) alert(t.saveFailed);
                                                            }
                                                        }}>{t.delete}</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Remote Config Modal - Using English for tech labels potentially, but keys are translated */}
            {remoteModalOpen && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100000
                }}>
                    <div className="af-panel" style={{ width: '400px', maxHeight: '90%', padding: '0', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
                        <div className="af-header">
                            <h3 className="af-title">{t.addClient}</h3>
                            <button
                                type="button"
                                className="af-close-btn"
                                disabled={remoteSaving}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    if (remoteSaving) return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setRemoteSaving(false);
                                    resetRemoteForm();
                                    setRemoteModalOpen(false);
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{ padding: '20px', overflowY: 'auto' }}>
                            <div className="af-row">
                                <span className="af-label">{t.type}</span>
                                <div className="af-segmented">
                                    {(['qb', 'tr', 'de'] as const).map(t => (
                                        <div key={t} className={`af-segment-opt ${remoteForm.type === t ? 'active' : ''}`} onClick={() => setRemoteForm({ ...remoteForm, type: t })}>{t.toUpperCase()}</div>
                                    ))}
                                </div>
                            </div>
                            <div className="af-row"><input className="af-input" style={{ flex: 1 }} placeholder={t.name} value={remoteForm.name} onInput={e => setRemoteForm({ ...remoteForm, name: e.currentTarget.value })} /></div>
                            <div className="af-row"><input className="af-input" style={{ flex: 1 }} placeholder={t.url} value={remoteForm.url} onInput={e => setRemoteForm({ ...remoteForm, url: e.currentTarget.value })} /></div>
                            <div className="af-row"><input className="af-input" style={{ flex: 1 }} placeholder={t.username} value={remoteForm.username} onInput={e => setRemoteForm({ ...remoteForm, username: e.currentTarget.value })} /></div>
                            <div className="af-row"><input className="af-input" style={{ flex: 1 }} placeholder={t.password} type="password" value={remoteForm.password} onInput={e => setRemoteForm({ ...remoteForm, password: e.currentTarget.value })} /></div>

                            <div style={{ marginTop: '10px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>{t.downloadPaths}</div>
                                {remoteForm.paths.map((p, i) => (
                                    <div key={i} className="af-path-row">
                                        <input className="af-input af-path-label" placeholder={t.pathLabel} value={p.label} onInput={e => {
                                            const np = [...remoteForm.paths];
                                            np[i] = { ...np[i], label: e.currentTarget.value };
                                            setRemoteForm({ ...remoteForm, paths: np });
                                        }} />
                                        <input className="af-input af-path-value" placeholder={t.pathValue} value={p.path} onInput={e => {
                                            const np = [...remoteForm.paths];
                                            np[i] = { ...np[i], path: e.currentTarget.value };
                                            setRemoteForm({ ...remoteForm, paths: np });
                                        }} />
                                        <button
                                            type="button"
                                            className="af-btn"
                                            style={{ padding: '0 10px', minWidth: '42px' }}
                                            onClick={() => {
                                                const next = remoteForm.paths.filter((_, idx) => idx !== i);
                                                setRemoteForm({ ...remoteForm, paths: next.length ? next : [{ label: 'default', path: '' }] });
                                            }}
                                        >
                                            -
                                        </button>
                                    </div>
                                ))}
                                <button type="button" className="af-btn" style={{ width: '100%', marginTop: '4px' }} onClick={() => setRemoteForm({ ...remoteForm, paths: [...remoteForm.paths, { label: '', path: '' }] })}>{t.addPath}</button>
                            </div>
                        </div>
                        <div style={{ padding: '16px', borderTop: '1px solid var(--af-border-light)', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" className="af-btn" style={{ marginRight: 'auto' }} onClick={async (e) => {
                                const btn = e.currentTarget;
                                btn.textContent = t.testing;
                                btn.disabled = true;
                                try {
                                    const { type, username, password } = remoteForm;
                                    const url = normalizeRemoteUrl(remoteForm.url);
                                    if (!url) {
                                        alert(settings.uiLanguage === 'zh' ? '地址不能为空' : 'URL is required');
                                        return;
                                    }
                                    let res = { ok: false, message: '' };
                                    if (type === 'qb') res = await RemoteDownloadService.testQbittorrent({ url, username, password });
                                    else if (type === 'tr') res = await RemoteDownloadService.testTransmission({ url, username, password });
                                    else res = await RemoteDownloadService.testDeluge({ url, password });

                                    alert(res.ok ? `${t.testSuccess}: ${res.message}` : `${t.testFailed}: ${res.message}`);
                                } catch (err: any) {
                                    alert(`${t.testFailed}: ${err?.message || String(err)}`);
                                } finally {
                                    btn.textContent = t.testConnection;
                                    btn.disabled = false;
                                }
                            }}>{t.testConnection}</button>
                            <button type="button" className="af-btn" disabled={remoteSaving} onClick={() => {
                                if (remoteSaving) return;
                                setRemoteSaving(false);
                                resetRemoteForm();
                                setRemoteModalOpen(false);
                            }}>{t.cancel}</button>
                            <button
                                type="button"
                                className="af-btn af-btn-primary"
                                disabled={remoteSaving}
                                onClick={async () => {
                                    if (remoteSaving) return;
                                    const name = String(remoteForm.name || '').trim();
                                    const url = normalizeRemoteUrl(remoteForm.url);
                                    const username = String(remoteForm.username || '').trim();
                                    const password = String(remoteForm.password || '').trim();

                                    if (!name) {
                                        alert(settings.uiLanguage === 'zh' ? '名称不能为空' : 'Name is required');
                                        return;
                                    }
                                    if (!url) {
                                        alert(settings.uiLanguage === 'zh' ? '地址不能为空' : 'URL is required');
                                        return;
                                    }
                                    if (remoteForm.type !== 'de' && !username) {
                                        alert(settings.uiLanguage === 'zh' ? '用户名不能为空' : 'Username is required');
                                        return;
                                    }

                                    const pathsMap: Record<string, string> = {};
                                    remoteForm.paths
                                        .map((it) => ({ label: String(it.label || '').trim(), path: String(it.path || '').trim() }))
                                        .filter((it) => it.label || it.path)
                                        .forEach((it, idx) => {
                                            if (!it.path) return;
                                            const label = it.label || (idx === 0 ? 'default' : `path${idx + 1}`);
                                            pathsMap[label] = it.path;
                                        });
                                    if (!Object.keys(pathsMap).length) pathsMap.default = '';

                                    const key = remoteForm.type === 'qb' ? 'qbittorrent' : remoteForm.type === 'tr' ? 'transmission' : 'deluge';
                                    const base = settingsRef.current;
                                    const remoteServer = cloneRemoteServer(base.remoteServer) as any;
                                    if (!remoteServer[key]) remoteServer[key] = {};

                                    if (remoteForm.editingKey) {
                                        const oldKey = remoteForm.editingKey.type === 'qb' ? 'qbittorrent' : remoteForm.editingKey.type === 'tr' ? 'transmission' : 'deluge';
                                        const oldName = remoteForm.editingKey.name;
                                        if (remoteServer[oldKey] && (oldKey !== key || oldName !== name)) {
                                            delete remoteServer[oldKey][oldName];
                                        }
                                    }

                                    remoteServer[key][name] = remoteForm.type === 'de'
                                        ? {
                                            url,
                                            password,
                                            path: pathsMap
                                        }
                                        : {
                                            url,
                                            username,
                                            password,
                                            path: pathsMap
                                    };

                                    setRemoteSaving(true);
                                    const ok = await persistSettings({ ...base, remoteServer });
                                    setRemoteSaving(false);
                                    if (!ok) {
                                        alert(t.saveFailed);
                                        return;
                                    }
                                    resetRemoteForm();
                                    setRemoteModalOpen(false);
                                }}
                            >
                                {remoteSaving ? `${t.save}...` : t.save}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
