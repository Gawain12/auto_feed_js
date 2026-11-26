
import { SiteConfig, SiteType } from '../types/SiteConfig';
import { NEXUS_FILL_PROFILES } from './nexus_profiles';

const VERIFIED_CHINESE_NP = new Set(['PThome', 'BTSchool', 'HDArea', 'HDTime', 'TCCF', 'HDChina', 'HDDolby', 'HDfans', 'TLFbits']);
const makeChineseNexus = (
    name: string,
    baseUrl: string,
    keywords: string[],
    description: string,
    extra?: Partial<SiteConfig>
): SiteConfig => ({
    name,
    type: SiteType.NexusPHP,
    keywords,
    baseUrl,
    description,
    isChinese: true,
    experimental: !VERIFIED_CHINESE_NP.has(name),
    nexusProfile: NEXUS_FILL_PROFILES[name],
    ...extra
});

export const NexusSites: SiteConfig[] = [
    {
        name: 'OpenCD',
        type: SiteType.NexusPHP,
        keywords: ['open.cd'],
        baseUrl: 'https://open.cd/',
        uploadPath: 'plugin_upload.php',
        contentDomains: ['music'],
        description: 'OpenCD'
    },
    {
        name: 'HDHome',
        type: SiteType.NexusPHP,
        keywords: ['hdhome.org'],
        baseUrl: 'https://hdhome.org/',
        description: 'HDHome'
    },
    {
        name: 'MTeam',
        type: SiteType.MTeam,
        keywords: ['m-team.cc', 'm-team.io'],
        baseUrl: 'https://kp.m-team.cc/',
        uploadPath: 'upload',
        // Legacy parity: browse keyword is title-based, not IMDb id.
        search: { name: 'browse?keyword={name}' },
        preferCurrentHost: true,
        contentDomains: ['movie', 'tv', 'miniseries', 'anime', 'doc', 'book', 'game', 'misc'],
        description: 'M-Team TP (New AntD Layout)',
        features: {
            imdbSearch: true,
            doubanSearch: true,
        },
        selectors: {
            title: [
                'h2.ant-typography',           // New Antd
                '#top',                        // Legacy Nexus
                'h1#top',
                '.torrent-title',
                '.ant-descriptions-item-content:first'
            ],
            description: [
                'div[id="kdescr"]',            // Classic
                '.braft-output-content',       // New Editor
                '.ant-card-body .markdown',
                '#description'
            ],
            // Hardcode these for now to be safe
            nameInput: 'input#name',
            descrInput: 'textarea#description',
            imdbInput: 'input#imdb_id'
        }
    },
    {
        name: 'HDSky',
        type: SiteType.NexusPHP,
        keywords: ['hdsky.me'],
        baseUrl: 'https://hdsky.me/',
        description: 'HDSky'
    },
    {
        name: 'OurBits',
        type: SiteType.NexusPHP,
        keywords: ['ourbits.club'],
        baseUrl: 'https://ourbits.club/',
        description: 'OurBits'
    },
    {
        name: 'CMCT',
        type: SiteType.NexusPHP,
        keywords: ['hdcmct.org', 'springsunday.net'],
        baseUrl: 'https://springsunday.net/',
        description: 'SpringSunday'
    },
    {
        name: 'TTG',
        type: SiteType.NexusPHP,
        keywords: ['totheglory.im', 'totheglory.me', 'totheglory.'],
        baseUrl: 'https://totheglory.im/',
        search: {
            imdb: 'browse.php?search_field=imdb{imdbNo}&c=M',
            name: 'browse.php?search_field={name}'
        },
        description: 'TTG (Nexus-like parsing)',
        // TTG detail pages use a different description container (`#kt_d`) and sometimes lack a structured subtitle row.
        // Rely on legacy normalization (`getSmallDescrFromDescr`) after parsing the raw description.
        selectors: {
            title: ['h1#top', 'h1'],
            description: ['#kt_d', '#kdescr', '#description']
        }
    },
    {
        name: 'PTer',
        type: SiteType.NexusPHP,
        keywords: ['pterclub.net'],
        baseUrl: 'https://pterclub.net/',
        description: 'Pter'
    },
    {
        name: 'Audiences',
        type: SiteType.NexusPHP,
        keywords: ['audiences.me'],
        baseUrl: 'https://audiences.me/',
        description: 'Audiences'
    },
    {
        name: 'TJUPT',
        type: SiteType.NexusPHP,
        keywords: ['tjupt.org'],
        baseUrl: 'https://www.tjupt.org/',
        contentDomains: ['movie', 'tv', 'miniseries', 'anime', 'doc', 'book', 'game', 'misc'],
        search: {
            imdb: 'torrents.php?incldead=0&search_area=4&search={imdb}&sort=5&type=desc',
            name: 'torrents.php?incldead=0&search_area=0&search={name}&sort=5&type=desc'
        },
        description: '北洋园 PT',
        selectors: {
            title: ['#top', 'h1#top', 'h1'],
            description: ['#kdescr', '#description'],
            nameInput: 'input[name="name"]',
            smallDescrInput: 'input[name="small_descr"]',
            descrInput: 'textarea#descr',
            imdbInput: 'input[name="url"][type="text"]',
            doubanInput: 'input[name="external_url"], input#external_url',
            torrentInput: 'input[name="file"], input[type="file"]#file'
        }
    },
    {
        name: 'FRDS',
        type: SiteType.NexusPHP,
        keywords: ['keepfrds.com'],
        baseUrl: 'https://pt.keepfrds.com/',
        description: 'FRDS'
    },
    {
        name: 'CHDBits',
        type: SiteType.CHDBits,
        keywords: ['chdbits.co', 'ptchdbits.co', 'ptchdbits.org', 'chddiy.xyz', 'chdbits'],
        baseUrl: 'https://chdbits.co/',
        baseUrlSetting: 'chdBaseUrl',
        description: 'CHDBits',
        features: {
            imdbSearch: true
        }
    },
    // --- Group A: Declarative Chinese NexusPHP sites (aligned with upstream legacy) ---
    makeChineseNexus('HDDolby', 'https://www.uhddolby.com/', ['uhddolby.com', 'hddolby.com'], '高清杜比 (HDDolby)'),
    makeChineseNexus('PThome', 'https://www.pthome.net/', ['pthome.net'], '铂金家 (PThome)'),
    makeChineseNexus('UBits', 'https://ubits.club/', ['ubits.club'], '你堡 (UBits)'),
    makeChineseNexus('BTSchool', 'https://pt.btschool.club/', ['btschool.club'], '学校 (BTSchool)'),
    makeChineseNexus('HDArea', 'https://hdarea.club/', ['hdarea.club', 'hdarea.co'], '高清地带 (HDArea)'),
    makeChineseNexus('HDfans', 'https://hdfans.org/', ['hdfans.org'], '红豆饭 (HDfans)'),
    makeChineseNexus('HDTime', 'https://hdtime.org/', ['hdtime.org'], '高清时光 (HDTime)', {
        contentDomains: ['movie', 'tv', 'miniseries', 'anime', 'doc', 'book', 'game', 'misc']
    }),
    makeChineseNexus('HDU', 'https://pt.upxin.net/', ['pt.upxin.net', 'pt.hdupt.com'], '好多油 (HDU)'),
    makeChineseNexus('HDVideo', 'https://hdvideo.top/', ['hdvideo.top', 'hdvideo.one'], 'HDVideo'),
    makeChineseNexus('PigGo', 'https://piggo.me/', ['piggo.me'], '猪猪网 (PigGo)'),
    makeChineseNexus('QingWa', 'https://qingwapt.com/', ['qingwapt.com'], '青蛙 (QingWa)'),
    makeChineseNexus('PTLGS', 'https://ptlgs.org/', ['ptlgs.org'], '劳改所 (PTLGS)'),
    makeChineseNexus('ZMPT', 'https://zmpt.cc/', ['zmpt.cc'], '织梦 (ZMPT)'),
    makeChineseNexus('ICC', 'https://www.icc2022.com/', ['icc2022.com'], '冰淇淋 (ICC)'),
    makeChineseNexus('AGSV', 'https://www.agsvpt.com/', ['agsvpt.com'], '末日种子库 (AGSV)'),
    makeChineseNexus('SoulVoice', 'https://pt.soulvoice.club/', ['soulvoice.club'], '铃音 (SoulVoice)'),
    makeChineseNexus('PTT', 'https://www.pttime.org/', ['pttime.org'], 'PTTime'),
    makeChineseNexus('PTsbao', 'https://ptsbao.club/', ['ptsbao.club'], '烧包 (PTsbao)'),
    makeChineseNexus('TLFbits', 'https://pt.eastgame.org/', ['eastgame.org'], '吐鲁番 (TLFbits)'),
    makeChineseNexus('WT-Sakura', 'https://wintersakura.net/', ['wintersakura.net', 'wintersakura.org'], '冬樱 (WT-Sakura)'),
    makeChineseNexus('CrabPt', 'https://crabpt.vip/', ['crabpt.vip'], '蟹黄堡 (CrabPt)'),
    makeChineseNexus('DiscFan', 'https://discfan.net/', ['discfan.net'], '碟粉 (DiscFan)'),
    makeChineseNexus('FreeFarm', 'https://pt.0ff.cc/', ['0ff.cc'], '自由农场 (FreeFarm)'),
    makeChineseNexus('Panda', 'https://pandapt.net/', ['pandapt.net'], '熊猫 (Panda)'),
    makeChineseNexus('CarPt', 'https://carpt.net/', ['carpt.net'], '车PT (CarPt)'),
    makeChineseNexus('1PTBA', 'https://1ptba.com/', ['1ptba.com'], '壹PT吧 (1PTBA)'),
    makeChineseNexus('52PT', 'https://52pt.site/', ['52pt.site'], '吾爱PT (52PT)'),
    makeChineseNexus('PTCafe', 'https://ptcafe.club/', ['ptcafe.club'], '咖啡 (PTCafe)'),
    makeChineseNexus('PTFans', 'https://ptfans.cc/', ['ptfans.cc'], 'PTFans'),
    makeChineseNexus('CyanBug', 'https://cyanbug.net/', ['cyanbug.net'], '大青虫 (CyanBug)'),
    makeChineseNexus('OKPT', 'https://www.okpt.net/', ['okpt.net'], 'OKPT'),
    makeChineseNexus('KuFei', 'https://kufei.org/', ['kufei.org'], '库非 (KuFei)'),
    makeChineseNexus('Dragon', 'https://www.dragonhd.xyz/', ['dragonhd.xyz'], '龙之家 (Dragon)'),
    makeChineseNexus('iloli', 'https://share.ilolicon.com/', ['ilolicon.com', 'xloli.cc'], 'iloli'),
    makeChineseNexus('ITZMX', 'https://pt.itzmx.com/', ['itzmx.com'], 'ITZMX'),
    makeChineseNexus('JoyHD', 'https://www.joyhd.net/', ['joyhd.net'], 'JoyHD'),
    makeChineseNexus('Oshen', 'http://www.oshen.win/', ['oshen.win'], '欧神 (Oshen)'),
    makeChineseNexus('YDY', 'https://pt.hdbd.us/', ['hdbd.us'], '伊甸园 (YDY)'),
    makeChineseNexus('UltraHD', 'https://ultrahd.net/', ['ultrahd.net'], 'UltraHD'),
    makeChineseNexus('麒麟', 'https://www.hdkyl.in/', ['hdkyl.in'], '麒麟 (HDKylin)'),
    makeChineseNexus('海棠', 'https://www.htpt.cc/', ['htpt.cc'], '海棠 (HTPT)'),
    makeChineseNexus('HDChina', 'https://hdwing.org/', ['hdwing.org', 'hdchina.org'], '瓷器 (HDChina)', { nexusProfile: undefined }),
    makeChineseNexus('PTzone', 'https://ptzone.xyz/', ['ptzone.xyz'], 'PTzone'),
    makeChineseNexus('TCCF', 'https://et8.org/', ['et8.org'], 'TorrentCCF (TCCF)', {
        contentDomains: ['doc', 'book']
    }),
    makeChineseNexus("13City", "https://13city.org/", ["13city.org"], "13City"),
    makeChineseNexus("HITPT", "https://www.hitpt.com/", ["hitpt.com"], "百川 (HITPT)"),
    makeChineseNexus("HUDBT", "https://hudbt.hust.edu.cn/", ["hudbt.hust.edu.cn"], "蝴蝶 (HUDBT)"),
    makeChineseNexus("NanYang", "https://nanyangpt.com/", ["nanyangpt.com"], "南洋 (NanYang)"),
    makeChineseNexus("NexusHD", "https://www.nexushd.org/", ["nexushd.org"], "NexusHD"),
    makeChineseNexus("PuTao", "https://pt.sjtu.edu.cn/", ["pt.sjtu.edu.cn"], "葡萄 (PuTao)"),
    makeChineseNexus("RS", "https://resource.xidian.edu.cn/", ["resource.xidian.edu.cn"], "睿思 (RS)"),
    makeChineseNexus("雨", "https://raingfh.top/", ["raingfh.top"], "雨 (RainGFH)"),
    makeChineseNexus("GTK", "https://pt.gtk.pw/", ["pt.gtk.pw"], "GTK"),
    makeChineseNexus("ECUST", "https://pt.ecust.pp.ua/", ["pt.ecust.pp.ua"], "华理 (ECUST)"),
    makeChineseNexus("HDClone", "https://pt.hdclone.top/", ["pt.hdclone.top"], "HDClone"),
    makeChineseNexus("CDFile", "https://pt.cdfile.org/", ["pt.cdfile.org"], "CDFile"),
    makeChineseNexus("HDBAO", "https://hdbao.cc/", ["hdbao.cc"], "HDBAO"),
    makeChineseNexus("AFUN", "https://www.ptlover.cc/", ["ptlover.cc"], "AFUN"),
    makeChineseNexus("DevTracker", "https://www.devtracker.me/", ["devtracker.me"], "DevTracker"),
    makeChineseNexus("唐门", "https://tmpt.top/", ["tmpt.top"], "唐门 (TMPT)"),
    makeChineseNexus("天枢", "https://dubhe.site/", ["dubhe.site"], "天枢 (Dubhe)"),
    makeChineseNexus("财神", "https://cspt.top/", ["cspt.top"], "财神 (CSPT)"),
    makeChineseNexus("星陨阁", "https://pt.xingyungept.org/", ["pt.xingyungept.org"], "星陨阁"),
    makeChineseNexus("樱花", "http://pt.ying.us.kg/", ["pt.ying.us.kg"], "樱花"),
    makeChineseNexus("我好闲", "http://whax.net/", ["whax.net"], "我好闲"),
    makeChineseNexus("下水道", "https://sewerpt.com/", ["sewerpt.com"], "下水道"),
    makeChineseNexus("柠檬不甜", "https://lemonhd.net/", ["lemonhd.net"], "柠檬不甜 (LemonHD)"),
    makeChineseNexus("RailgunPT", "https://bilibili.download/", ["bilibili.download"], "RailgunPT"),
    makeChineseNexus("MyPT", "https://cc.mypt.cc/", ["cc.mypt.cc"], "MyPT"),
    makeChineseNexus("PTSkit", "https://www.ptskit.org/", ["ptskit.org"], "PTSkit"),
    makeChineseNexus("MARCH", "https://duckboobee.org/", ["duckboobee.org"], "MARCH"),
    makeChineseNexus("NovaHD", "https://pt.novahd.top/", ["pt.novahd.top"], "NovaHD"),
    makeChineseNexus("LuckPT", "https://pt.luckpt.de/", ["pt.luckpt.de"], "LuckPT"),
    makeChineseNexus("Tokyo", "https://www.tokyopt.xyz/", ["tokyopt.xyz"], "Tokyo"),
    makeChineseNexus("ALing", "https://pt.aling.de/", ["pt.aling.de"], "ALing"),
    makeChineseNexus("LongPT", "https://longpt.org/", ["longpt.org"], "LongPT"),
    makeChineseNexus("藏宝阁", "https://cangbao.ge/", ["cangbao.ge"], "藏宝阁"),
    makeChineseNexus("未来幻境", "https://nex.jivon.de/", ["nex.jivon.de"], "未来幻境"),
    makeChineseNexus("自然", "http://zrpt.cc/", ["zrpt.cc"], "自然"),
    makeChineseNexus("SBPT", "https://sbpt.link/", ["sbpt.link"], "SBPT"),
    makeChineseNexus("YHPP", "https://www.yhpp.cc/", ["yhpp.cc"], "YHPP"),
    makeChineseNexus("52MOVIE", "https://www.52movie.top/", ["52movie.top"], "52MOVIE"),
    makeChineseNexus("躺平", "https://www.tangpt.top/", ["tangpt.top"], "躺平"),
    makeChineseNexus("BaoZi", "https://p.t-baozi.cc/", ["p.t-baozi.cc"], "BaoZi"),
    makeChineseNexus("NPUPT", "https://npupt.com/", ["npupt.com"], "蒲公英 (NPUPT)", { nexusProfile: undefined }),
    makeChineseNexus("NJTUPT", "https://njtupt.top/", ["njtupt.top"], "南工大 (NJTUPT)"),
    makeChineseNexus("HaiDan", "https://www.haidan.video/", ["haidan.video"], "海胆 (HaiDan)", { nexusProfile: undefined }),
    makeChineseNexus("BYR", "https://byr.pt/", ["byr.pt", "bt.byr.cn"], "北邮人 (BYR)", { nexusProfile: undefined }),
    makeChineseNexus("HDCity", "https://hdcity.city/", ["hdcity.city"], "高清城市 (HDCity)", {
        uploadPath: "upload",
        nexusProfile: undefined
    }),
    makeChineseNexus('GGPT', 'https://www.gamegamept.com/', ['gamegamept.com'], 'GGPT', { contentDomains: ['game'], nexusProfile: undefined }),
    makeChineseNexus('杏林', 'https://xingtan.one/', ['xingtan.one'], '杏林 (XingTan)', { nexusProfile: undefined }),
    makeChineseNexus('影', 'https://star-space.net/', ['star-space.net'], '影 (StarSpace)'),
    makeChineseNexus('慕雪阁', 'https://pt.muxuege.org/', ['pt.muxuege.org'], '慕雪阁'),
    makeChineseNexus('U2', 'https://u2.dmhy.org/', ['u2.dmhy.org'], 'U2 动漫花园 (仅源站)', { contentDomains: ['anime'], capabilities: { source: true, target: false }, nexusProfile: undefined }),
    makeChineseNexus('HHClub', 'https://hhanclub.top/', ['hhanclub.top', 'hhan.club', 'hhanclub.net'], '憨憨 (HHClub, 源站)', {
        capabilities: { source: true, target: false },
        nexusProfile: undefined
    }),
];
