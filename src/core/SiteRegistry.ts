
import { BaseEngine } from './BaseEngine';
import { SiteConfig, SiteType } from '../types/SiteConfig';
import { NexusPHPEngine } from '../trackers/NexusPHP';
import { GazelleEngine } from '../trackers/Gazelle';
import { Unit3DEngine } from '../templates/unit3d';
import { Unit3DClassicEngine } from '../templates/unit3d_classic';
import { MTeamEngine } from '../trackers/MTeam';
import { CHDBitsEngine } from '../trackers/CHDBits';
import { BHDEngine } from '../trackers/BHD';
import { PTPEngine } from '../trackers/PTP';
import { HDBEngine } from '../trackers/HDB';
import { KGEngine } from '../trackers/KG';
import { TTGEngine } from '../trackers/TTG';
import { GPWEngine } from '../trackers/GPW';
import { REDEngine } from '../trackers/RED';
import { OPSEngine } from '../trackers/OPS';
import { DICEngine } from '../trackers/DIC';
import { OpenCDEngine } from '../trackers/OpenCD';
import { TikEngine } from '../trackers/Tik';
import { ACMEngine } from '../trackers/ACM';
import { BLUEngine } from '../trackers/BLU';
import { MonikaEngine } from '../trackers/Monika';
import { OnlyEncodesEngine } from '../trackers/OnlyEncodes';
import { CMCTEngine } from '../trackers/nexus/CMCT';
import { HDSkyEngine } from '../trackers/nexus/HDSky';
import { PTerEngine } from '../trackers/nexus/PTer';
import { AudiencesEngine } from '../trackers/nexus/Audiences';
import { HDHomeEngine } from '../trackers/nexus/HDHome';
import { OurBitsEngine } from '../trackers/nexus/OurBits';
import { FRDSEngine } from '../trackers/nexus/FRDS';
import { HDChinaEngine } from '../trackers/nexus/HDChina';
import { HaiDanEngine, NPUPTEngine } from '../trackers/nexus/SpecialChineseNexus';
import { ANTEngine, HDFEngine, HDOnlyEngine, NBLEngine, TVVEngine } from '../trackers/ExperimentalGazelleTrackers';
import { NexusSites } from '../config/sites_nexus';
import { GazelleSites } from '../config/sites_gazelle';
import { Unit3DSites } from '../config/sites_unit3d';
import { SpecialSites } from '../config/sites_special';
import { SCEngine } from '../trackers/SC';
import { TJUPTEngine } from '../trackers/TJUPT';
import { HDTEngine } from '../trackers/HDT';
import { BTNEngine } from '../trackers/BTN';
import { HDRouteEngine } from '../trackers/HDRoute';
import { FileListEngine } from '../trackers/FileList';
import { TorrentLeechEngine } from '../trackers/TorrentLeech';
import { DarkLandEngine } from '../trackers/DarkLand';
import { AvistazEngine } from '../trackers/AvistaZ';
import { CGEngine } from '../trackers/CG';
import { MusicGazelleSourceEngine } from '../trackers/MusicGazelleSource';
import {
    BibEngine,
    BitHDTVEngine,
    BlueBirdEngine,
    BwTorrentsEngine,
    DigitalCoreEngine,
    HDSpaceEngine,
    IPTEngine,
    ITSEngine
} from '../trackers/LegacyForeignTrackers';
import {
    BYREngine,
    HDCityEngine,
    RouSiEngine,
    YemaPTEngine,
    ZhuqueEngine
} from '../trackers/ChineseSpaTrackers';

// Registries for configs
const siteConfigs: SiteConfig[] = [
    ...NexusSites,
    ...GazelleSites,
    ...Unit3DSites,
    ...SpecialSites
];

// Registry for Engine definitions (Classes)
const engineMap: Record<string, new (config: SiteConfig, url: string) => BaseEngine> = {
    [SiteType.NexusPHP]: NexusPHPEngine,
    [SiteType.Gazelle]: GazelleEngine,
    [SiteType.Unit3D]: Unit3DEngine,
    [SiteType.Unit3DClassic]: Unit3DClassicEngine,
    [SiteType.MTeam]: MTeamEngine,
    [SiteType.CHDBits]: CHDBitsEngine,
    [SiteType.BHD]: BHDEngine,
    [SiteType.PTP]: PTPEngine,
    [SiteType.HDB]: HDBEngine,
    [SiteType.KG]: KGEngine,
    [SiteType.HDT]: HDTEngine,
    [SiteType.BTN]: BTNEngine,
    [SiteType.HDRoute]: HDRouteEngine,
    [SiteType.FileList]: FileListEngine,
    [SiteType.TorrentLeech]: TorrentLeechEngine,
    [SiteType.Avistaz]: AvistazEngine,
    [SiteType.CG]: CGEngine
};

// Site-specific engines override framework-level engines.
// Keep one-file-per-site mapping here so site behaviors do not leak into framework templates.
const siteEngineMap: Record<string, new (config: SiteConfig, url: string) => BaseEngine> = {
    ACM: ACMEngine,
    ANT: ANTEngine,
    Audiences: AudiencesEngine,
    AvistaZ: AvistazEngine,
    bib: BibEngine,
    'bit-hdtv': BitHDTVEngine,
    BlueBird: BlueBirdEngine,
    BTN: BTNEngine,
    bwtorrents: BwTorrentsEngine,
    BYR: BYREngine,
    CG: CGEngine,
    CHDBits: CHDBitsEngine,
    CinemaZ: AvistazEngine,
    BLU: BLUEngine,
    CMCT: CMCTEngine,
    DarkLand: DarkLandEngine,
    digitalcore: DigitalCoreEngine,
    FileList: FileListEngine,
    FRDS: FRDSEngine,
    HaiDan: HaiDanEngine,
    HDB: HDBEngine,
    HDChina: HDChinaEngine,
    HDCity: HDCityEngine,
    HDF: HDFEngine,
    HDHome: HDHomeEngine,
    'HD-Only': HDOnlyEngine,
    HDRoute: HDRouteEngine,
    HDSky: HDSkyEngine,
    HDSpace: HDSpaceEngine,
    IPT: IPTEngine,
    iTS: ITSEngine,
    KG: KGEngine,
    MTeam: MTeamEngine,
    Monika: MonikaEngine,
    NBL: NBLEngine,
    NPUPT: NPUPTEngine,
    OpenCD: OpenCDEngine,
    OnlyEncodes: OnlyEncodesEngine,
    OurBits: OurBitsEngine,
    PrivateHD: AvistazEngine,
    PTP: PTPEngine,
    PTer: PTerEngine,
    RouSi: RouSiEngine,
    TTG: TTGEngine,
    TVV: TVVEngine,
    GPW: GPWEngine,
    RED: REDEngine,
    OPS: OPSEngine,
    DIC: DICEngine,
    jpop: MusicGazelleSourceEngine,
    lztr: MusicGazelleSourceEngine,
    Tik: TikEngine,
    TorrentLeech: TorrentLeechEngine,
    SC: SCEngine,
    TJUPT: TJUPTEngine,
    HDT: HDTEngine,
    YemaPT: YemaPTEngine,
    ZHUQUE: ZhuqueEngine
};

export class SiteRegistry {

    static registerConfig(config: SiteConfig) {
        siteConfigs.push(config);
    }

    static registerEngine(type: SiteType, engineClass: new (config: SiteConfig, url: string) => BaseEngine) {
        engineMap[type] = engineClass;
    }

    static getEngine(url: string): BaseEngine | null {
        // 1. Find matching config
        const config = this.matchConfig(url);
        if (!config) return null;

        // 2. Find matching engine class (site-specific first, then framework type)
        const EngineClass = siteEngineMap[config.name] || engineMap[config.type];
        if (!EngineClass) {
            console.error(`[Auto-Feed] No engine registered for type: ${config.type}`);
            return null;
        }

        return new EngineClass(config, url);
    }

    private static matchConfig(url: string): SiteConfig | null {
        // Keywords are domains: match them against the hostname only, so a tracker domain that
        // appears in a query string or path (`?ref=hdbits.org`) does not activate that engine.
        let host = '';
        try {
            host = new URL(url).hostname.toLowerCase();
        } catch {
            return null;
        }
        for (const config of siteConfigs) {
            if (config.keywords.some(k => host.includes(k))) {
                return config;
            }
            // Check regex if defined
            if (config.match?.source?.some(r => r.test(url))) return config;
            if (config.match?.target?.some(r => r.test(url))) return config;
        }
        return null;
    }
}
