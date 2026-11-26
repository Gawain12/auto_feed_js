import { NexusFillProfile } from "../types/SiteConfig";

// Declarative NexusPHP upload-form dropdown profiles extracted and verified
// against pinned upstream legacy (`.legacy/auto_feed.user.js`). Dedicated trackers
// (HDHome, HDSky, OurBits, CMCT, PTer, Audiences, HDChina, NPUPT, HaiDan, etc.)
// omit nexusProfile and handle their custom DOMs directly.
export const NEXUS_FILL_PROFILES: Record<string, NexusFillProfile> = {
    "HDDolby": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "410",
                "学习": "411",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": "1",
                "Blu-ray": "2",
                "Remux": "3",
                "Encode": "10",
                "WEB-DL": "6",
                "HDTV": "5",
                "DVD": "8",
                "CD": "9"
            },
            "defaultValue": "11",
            "titleOverrides": [
                {
                    "pattern": "webrip",
                    "whenMedium": "WEB-DL",
                    "value": "7"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "H266": "13",
                "VC-1": "5",
                "MPEG-2": "6",
                "XVID": "7",
                "AV1": "11",
                "VP9": "12",
                "MPEG-4": "6"
            },
            "defaultValue": "7"
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": "2",
                "DTS-X": "15",
                "DTS-HDMA:X 7.1": "15",
                "TrueHD": "2",
                "DTS-HDMA": "1",
                "DTS-HD": "1",
                "DTS-HDHR": "1",
                "DTS": "4",
                "AC3": "5",
                "AAC": "6",
                "LPCM": "3",
                "Flac": "7",
                "APE": "8",
                "WAV": "9",
                "MP3": "10",
                "M4A": "11",
                "OPUS": "13",
                "DDP": "14"
            },
            "defaultValue": "12",
            "titleOverrides": [
                {
                    "pattern": "DDP|DD\\+|EAC3",
                    "value": "14"
                }
            ]
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "8K": "6",
                "4K": "1",
                "1080p": "2",
                "1080i": "3",
                "720p": "4",
                "SD": "5"
            }
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "8"
        },
        "customTags": [
            { "selector": "input[name=\"tags[]\"][value=\"tx\"]", "when": "effects_sub" },
            { "selector": "input[name=\"tags[]\"][value=\"ja\"]", "when": "jp_lang" },
            { "selector": "input[name=\"tags[]\"][value=\"ko\"]", "when": "kr_lang" }
        ]
    },
    "PThome": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "408",
                "软件": "411",
                "游戏": "410",
                "学习": "412",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": "12",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "15",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "2",
                "CD": "8",
                "UHD_DIY": "13",
                "Blu-ray_DIY": "14"
            },
            "defaultValue": "11"
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": "20",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "19",
                "TrueHD": "20",
                "DTS-HDMA": "19",
                "DTS-HD": "19",
                "DTS-HDHR": "19",
                "DTS": "3",
                "AC3": "18",
                "AAC": "6",
                "LPCM": "21",
                "Flac": "1",
                "APE": "2",
                "WAV": "22",
                "MP3": "23",
                "M4A": "24"
            },
            "defaultValue": "7",
            "titleOverrides": [
                {
                    "pattern": "Atmos",
                    "value": "20"
                }
            ]
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "8K": "10",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            },
            "defaultValue": "11"
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "5"
        },
        "specialcat": {
            "selector": "specialcat",
            "map": {
                "书籍": "508"
            },
            "titleOverrides": [
                {
                    "pattern": "m4a|mp3",
                    "inField": "descr",
                    "whenType": "书籍",
                    "value": "507"
                }
            ]
        }
    },
    "UBits": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "10",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "4",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            },
            "titleOverrides": [
                {
                    "pattern": "HD.?DVD",
                    "value": "2"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "7",
                "X265": "7",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "8",
                "DTS-X": "9",
                "DTS-HDMA:X 7.1": "9",
                "TrueHD": "10",
                "DTS-HDMA": "11",
                "DTS-HD": "11",
                "DTS-HDHR": "11",
                "DTS": "3",
                "AC3": "14",
                "AAC": "6",
                "LPCM": "13",
                "Flac": "1",
                "APE": "2",
                "WAV": "7",
                "MP3": "4",
                "M4A": "7",
                "DDP": "12"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "source": {
            "selector": "source_sel[4]",
            "map": {
                "大陆": "1",
                "香港": "2",
                "台湾": "3",
                "港台": "2",
                "日本": "5",
                "韩国": "6",
                "欧美": "4",
                "印度": "8"
            },
            "defaultValue": "11"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "customTags": [
            {
                "selector": "input[name=\"tags[]\"][value=\"7\"]",
                "when": "4k_sdr"
            }
        ]
    },
    "BTSchool": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "405",
                "剧集": "406",
                "动漫": "407",
                "综艺": "412",
                "纪录": "408",
                "音乐": "409",
                "体育": "410",
                "软件": "404",
                "游戏": "411",
                "学习": "402"
            },
            "defaultValue": "415"
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": "12",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            },
            "defaultValue": "11"
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": "10",
                "X265": "10",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": "11",
                "DTS-X": "3",
                "DTS-HDMA:X 7.1": "3",
                "TrueHD": "11",
                "DTS-HDMA": "3",
                "DTS-HD": "3",
                "DTS-HDHR": "3",
                "DTS": "3",
                "AC3": "10",
                "AAC": "6",
                "LPCM": "5",
                "Flac": "1",
                "APE": "2",
                "MP3": "4"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "8K": "5",
                "4K": "5",
                "1080p": "1",
                "1080i": "1",
                "720p": "3",
                "SD": "4"
            },
            "defaultValue": "6"
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "12"
        }
    },
    "HDArea": {
        "type": {
            "selector": "type",
            "map": {
                "电影_UHD": "300",
                "电影_Blu-ray": "401",
                "电影_Remux": "415",
                "电影_WEB-DL": "412",
                "电影_HDTV": "413",
                "电影_DVD": "414",
                "电影_4K": "300",
                "电影_1080p": "410",
                "电影_720p": "411",
                "电影": "410",
                "剧集": "402",
                "纪录": "404",
                "动漫": "405",
                "综艺": "403",
                "音乐": "408",
                "MV": "406",
                "体育": "407"
            },
            "defaultValue": "409",
            "titleOverrides": [
                {
                    "pattern": "pad$|ipad",
                    "whenType": "电影",
                    "value": "417"
                }
            ]
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "9",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            },
            "titleOverrides": [
                {
                    "pattern": "MiniBD",
                    "value": "4"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "7",
                "X264": "7",
                "VC-1": "2",
                "MPEG-2": "4",
                "MPEG-4": "1",
                "XVID": "3",
                "AV1": "8",
                "VP9": "9"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": "10",
                "Atmos_DDP": "15",
                "DDP_Atmos": "15",
                "DTS-X": "12",
                "DTS-HDMA:X 7.1": "12",
                "TrueHD": "7",
                "DTS-HDMA": "4",
                "DTS-HD": "4",
                "DTS-HDHR": "13",
                "DTS": "3",
                "AC3": "5",
                "AC3_2.0": "11",
                "DDP": "16",
                "AAC": "6",
                "LPCM": "8",
                "Flac": "1",
                "APE": "2",
                "WAV": "9",
                "MP3": "21",
                "OPUS": "25"
            },
            "defaultValue": "24",
            "titleOverrides": [
                {
                    "pattern": "DDP|DD\\+|E-?AC-?3",
                    "value": "16"
                }
            ]
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "6"
        }
    },
    "HDfans": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "417",
                "综艺": "416",
                "纪录": "403",
                "音乐": "406",
                "体育": "418",
                "MV": "407",
                "软件": "419",
                "游戏": "421",
                "学习": "404",
                "书籍": "423"
            },
            "defaultValue": "410",
            "titleOverrides": [
                {
                    "pattern": "m4a|mp3",
                    "inField": "descr",
                    "whenType": "书籍",
                    "value": "405"
                }
            ]
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "17",
                "UHD_DIY": "18",
                "UHD_Remux": "19",
                "Blu-ray": "21",
                "Blu-ray_DIY": "22",
                "Blu-ray_Remux": "23",
                "Remux": "23",
                "HDTV": "6",
                "WEB-DL": "5",
                "DVD": "7",
                "CD": "9",
                "Encode_4K": "20",
                "Encode_1080p": "24",
                "Encode_1080i": "24",
                "Encode_720p": "25",
                "Encode": "24"
            },
            "defaultValue": "10"
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "3",
                "X265": "4",
                "H264": "1",
                "X264": "2",
                "VC-1": "5",
                "MPEG-2": "10",
                "MPEG-4": "11",
                "XVID": "12",
                "AV1": "14"
            },
            "defaultValue": "13"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "1",
                "DTS-X": "3",
                "DTS-HDMA:X 7.1": "3",
                "TrueHD": "6",
                "DTS-HDMA": "4",
                "DTS-HD": "5",
                "DTS-HDHR": "5",
                "DTS": "2",
                "AC3": "10",
                "AAC": "11",
                "LPCM": "7",
                "Flac": "12",
                "APE": "13",
                "WAV": "14",
                "OGG": "15",
                "MP3": "17",
                "ALAC": "25",
                "M4A": "24",
                "DDP": "21",
                "DDP_Atmos": "23",
                "Atmos_DDP": "23"
            },
            "titleOverrides": [
                {
                    "pattern": "DDP|DD\\+",
                    "value": "21"
                },
                {
                    "pattern": " DD ",
                    "flags": "",
                    "value": "19"
                }
            ]
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "1",
                "4K": "2",
                "1080p": "3",
                "1080i": "4",
                "720p": "5",
                "SD": "6"
            },
            "defaultValue": "7"
        },
        "processingBySource": {
            "selector": "processing_sel[4]",
            "map": {
                "大陆": "1",
                "美国": "2",
                "英国": "3",
                "香港": "4",
                "台湾": "5",
                "港台": "4",
                "日本": "6",
                "韩国": "7",
                "欧美": "8",
                "欧洲": "8",
                "印度": "10",
                "新加坡": "11",
                "马来西亚": "12"
            },
            "defaultValue": "9"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "27"
        }
    },
    "HDTime": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "414",
                "游戏": "410",
                "学习": "411",
                "书籍": "411",
                "电影_Blu-ray": "424",
                "电影_UHD": "424"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            },
            "titleOverrides": [
                {
                    "pattern": "HD ?DVD",
                    "whenMedium": "DVD",
                    "value": "2"
                },
                {
                    "pattern": "webrip",
                    "whenMedium": "WEB-DL",
                    "value": "7"
                },
                {
                    "pattern": "minibd",
                    "value": "4"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "12",
                "X265": "12",
                "H264": "1",
                "X264": "1",
                "H266": "16",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "15",
                "VP9": "14"
            },
            "defaultValue": "5",
            "titleOverrides": [
                {
                    "pattern": "10.?bit",
                    "whenCodec": "X264",
                    "value": "11"
                }
            ]
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "8",
                "DTS-X": "10",
                "DTS-HDMA:X 7.1": "10",
                "TrueHD": "9",
                "DTS-HDMA": "10",
                "DTS-HD": "10",
                "DTS-HDHR": "10",
                "DTS": "3",
                "AC3": "11",
                "AAC": "6",
                "LPCM": "13",
                "Flac": "1",
                "APE": "2",
                "WAV": "7",
                "MP3": "4",
                "OGG": "5",
                "M4A": "7",
                "OPUS": "15",
                "DDP": "12"
            },
            "defaultValue": "7",
            "titleOverrides": [
                {
                    "pattern": "DDP|DD\\+|EAC3",
                    "value": "12"
                }
            ]
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "HDU": {
        "type": {
            "selector": "type",
            "map": {
                "电影": {
                    "index": 1
                },
                "剧集": {
                    "index": 2
                },
                "动漫": {
                    "index": 5
                },
                "综艺": {
                    "index": 3
                },
                "纪录": {
                    "index": 4
                },
                "音乐": {
                    "index": 8
                },
                "体育": {
                    "index": 7
                },
                "MV": {
                    "index": 6
                },
                "软件": {
                    "index": 9
                },
                "游戏": {
                    "index": 10
                },
                "学习": {
                    "index": 9
                },
                "书籍": {
                    "index": 9
                }
            },
            "defaultValue": {
                "index": 9
            }
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": {
                    "index": 2
                },
                "Blu-ray": {
                    "index": 1
                },
                "DVD": {
                    "index": 4
                },
                "HDTV": {
                    "index": 3
                },
                "CD": {
                    "index": 14
                },
                "Remux_4K_剧集": {
                    "index": 7
                },
                "Remux_4K": {
                    "index": 6
                },
                "Remux_剧集": {
                    "index": 8
                },
                "Remux": {
                    "index": 5
                },
                "WEB-DL_剧集": {
                    "index": 12
                },
                "WEB-DL": {
                    "index": 11
                },
                "Encode_剧集": {
                    "index": 10
                },
                "Encode": {
                    "index": 9
                }
            },
            "defaultValue": {
                "index": 9
            }
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": {
                    "index": 2
                },
                "X265": {
                    "index": 2
                },
                "H264": {
                    "index": 1
                },
                "X264": {
                    "index": 4
                },
                "VC-1": {
                    "index": 3
                },
                "MPEG-2": {
                    "index": 6
                },
                "XVID": {
                    "index": 5
                },
                "AV1": {
                    "index": 7
                }
            },
            "defaultValue": {
                "index": 7
            }
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": {
                    "index": 3
                },
                "DTS-HDMA:X 7.1": {
                    "index": 1
                },
                "TrueHD": {
                    "index": 3
                },
                "DTS-HDMA": {
                    "index": 2
                },
                "DTS-HD": {
                    "index": 6
                },
                "DTS-HDHR": {
                    "index": 5
                },
                "DTS": {
                    "index": 5
                },
                "AC3": {
                    "index": 6
                },
                "AAC": {
                    "index": 7
                },
                "LPCM": {
                    "index": 4
                },
                "Flac": {
                    "index": 8
                },
                "APE": {
                    "index": 9
                },
                "WAV": {
                    "index": 10
                },
                "MP3": {
                    "index": 10
                }
            }
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "4K": {
                    "index": 3
                },
                "1080p": {
                    "index": 1
                },
                "1080i": {
                    "index": 2
                },
                "720p": {
                    "index": 4
                },
                "SD": {
                    "index": 5
                }
            },
            "titleOverrides": [
                {
                    "pattern": "pad$|ipad",
                    "value": {
                        "index": 6
                    }
                }
            ]
        },
        "processingBySource": {
            "selector": "processing_sel",
            "map": {
                "大陆": {
                    "index": 1
                },
                "香港": {
                    "index": 2
                },
                "台湾": {
                    "index": 2
                },
                "港台": {
                    "index": 2
                },
                "日本": {
                    "index": 4
                },
                "韩国": {
                    "index": 5
                },
                "欧美": {
                    "index": 3
                },
                "印度": {
                    "index": 6
                },
                "日韩": {
                    "index": 5
                }
            },
            "defaultValue": {
                "index": 8
            }
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "5"
        }
    },
    "HDVideo": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "10",
                "Blu-ray": "11",
                "Remux": "12",
                "Encode": "13",
                "WEB-DL": "14",
                "HDTV": "16",
                "DVD": "0",
                "CD": "20"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "7",
                "X264": "7",
                "VC-1": "8",
                "MPEG-2": "9",
                "XVID": "11",
                "AV1": "11"
            },
            "defaultValue": "11"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "14",
                "DTS-X": "16",
                "DTS-HDMA:X 7.1": "16",
                "TrueHD": "11",
                "DTS-HDMA": "3",
                "DTS-HD": "17",
                "DTS-HDHR": "15",
                "DTS": "17",
                "AC3": "9",
                "AAC": "21",
                "LPCM": "8",
                "Flac": "1",
                "APE": "2",
                "WAV": "12",
                "MP3": "18",
                "M4A": "7",
                "DDP": "10"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "5",
                "4K": "6",
                "1080p": "8",
                "1080i": "9",
                "720p": "10",
                "SD": "11"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "4"
        },
        "sourceByMedium": {
            "selector": "source_sel[4]",
            "map": {
                "UHD": "23",
                "Blu-ray_4K": "23",
                "Remux_4K": "23",
                "Encode_4K": "23",
                "Blu-ray": "22",
                "Remux": "22",
                "Encode": "22",
                "WEB-DL": "24",
                "DVD": "25",
                "HDTV": "26",
                "CD": "27"
            },
            "defaultValue": "28"
        },
        "customTags": [
            {
                "selector": "input[name=\"tags[]\"][value=\"11\"]",
                "when": "hdr10"
            },
            {
                "selector": "input[name=\"tags[]\"][value=\"12\"]",
                "when": "dv"
            }
        ]
    },
    "PigGo": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "11",
                "Blu-ray": "11",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "11",
                "HDTV": "8",
                "DVD": "11",
                "CD": "8"
            },
            "titleOverrides": [
                {
                    "pattern": "DVDr",
                    "whenMedium": "DVD",
                    "value": "7"
                },
                {
                    "pattern": "webrip",
                    "whenMedium": "WEB-DL",
                    "value": "7"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "5",
                "MPEG-2": "5",
                "XVID": "5",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "10",
                "DTS-HDMA:X 7.1": "9",
                "TrueHD": "10",
                "DTS-HDMA": "9",
                "DTS-HD": "9",
                "DTS-HDHR": "9",
                "DTS": "3",
                "AC3": "8",
                "AAC": "6",
                "LPCM": "11",
                "Flac": "1",
                "APE": "2",
                "WAV": "7"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "1",
                "720p": "3"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "sourceByMedium": {
            "selector": "source_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "1",
                "Encode": "1",
                "HDTV": "5",
                "WEB-DL": "7",
                "DVD": "3"
            },
            "defaultValue": "6"
        },
        "processingByHdr": {
            "selector": "processing_sel[4]",
            "db": "4",
            "hdr10": "2",
            "hdr10plus": "3",
            "defaultValue": "1"
        }
    },
    "QingWa": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "7",
                "VP9": "8",
                "MPEG-4": "3"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "7",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "9",
                "TrueHD": "12",
                "DTS-HDMA": "10",
                "DTS-HD": "5",
                "DTS-HDHR": "10",
                "DTS": "14",
                "AC3": "15",
                "AAC": "17",
                "LPCM": "13",
                "Flac": "1",
                "APE": "18",
                "WAV": "19",
                "MP3": "4",
                "M4A": "7",
                "DDP": "16",
                "Atmos_TrueHD": "11",
                "OPUS": "20"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "7",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "sourceByMedium": {
            "selector": "source_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "8",
                "Remux": "9",
                "Encode": "10",
                "WEB-DL": "7",
                "HDTV": "4",
                "DVD": "2",
                "CD": "3"
            },
            "defaultValue": "6"
        }
    },
    "PTLGS": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "409",
                "体育": "407",
                "MV": "406",
                "软件": "0",
                "游戏": "0",
                "学习": "0",
                "书籍": "0"
            },
            "defaultValue": "0"
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": "14",
                "Blu-ray": "14",
                "Remux": "8",
                "Encode": "5",
                "WEB-DL": "4",
                "HDTV": "3",
                "DVD": "2",
                "CD": "15"
            },
            "defaultValue": "12",
            "titleOverrides": [
                {
                    "pattern": "webrip",
                    "value": "7"
                },
                {
                    "pattern": "tvrip",
                    "value": "2"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "7",
                "X264": "7",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": "12",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "7",
                "TrueHD": "12",
                "DTS-HDMA": "10",
                "DTS-HD": "10",
                "DTS-HDHR": "10",
                "DTS": "19",
                "AC3": "9",
                "AAC": "11",
                "LPCM": "8",
                "Flac": "13",
                "APE": "14",
                "WAV": "1",
                "MP3": "6",
                "M4A": "7"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "6",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "13"
        }
    },
    "ZMPT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "417",
                "综艺": "403",
                "纪录": "422",
                "音乐": "423",
                "体育": "409",
                "MV": "423",
                "软件": "425",
                "游戏": "426",
                "学习": "409",
                "书籍": "409"
            },
            "defaultValue": "409",
            "titleOverrides": [
                {
                    "pattern": "m4a|mp3",
                    "inField": "descr",
                    "whenType": "书籍",
                    "value": "424"
                }
            ]
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "2",
                "CD": "8"
            },
            "titleOverrides": [
                {
                    "pattern": "DVDr",
                    "whenMedium": "DVD",
                    "value": "6"
                },
                {
                    "pattern": "MiniBD",
                    "value": "4"
                }
            ]
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "7",
                "DTS-HDMA:X 7.1": "3",
                "TrueHD": "7",
                "DTS-HDMA": "3",
                "DTS-HD": "3",
                "DTS": "3",
                "AC3": "8",
                "AAC": "6",
                "LPCM": "7",
                "Flac": "1",
                "APE": "2",
                "WAV": "7"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "1",
                "720p": "8",
                "SD": "7"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "ICC": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "2",
                "CD": "8"
            },
            "titleOverrides": [
                {
                    "pattern": "dvdr",
                    "whenMedium": "DVD",
                    "value": "6"
                },
                {
                    "pattern": "MiniBD",
                    "value": "4"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "6",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "processingByYear": {
            "selector": "processing_sel[5]",
            "mode": "buckets"
        }
    },
    "AGSV": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "411",
                "体育": "407",
                "MV": "406",
                "短剧": "419"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "11",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "2",
                "CD": "8"
            },
            "defaultValue": "13"
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "17",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "7",
                "TrueHD": "9",
                "DTS-HDMA": "8",
                "DTS-HD": "7",
                "DTS-HDHR": "8",
                "DTS": "3",
                "AC3": "11",
                "AAC": "6",
                "LPCM": "10",
                "Flac": "1",
                "APE": "2",
                "WAV": "15",
                "MP3": "4",
                "M4A": "7",
                "DDP": "19"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "5",
                "1080p": "1",
                "1080i": "1",
                "720p": "3",
                "SD": "4"
            },
            "defaultValue": "8"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "22"
        },
        "specialcat": {
            "selector": "specialcat",
            "map": {
                "软件": "412",
                "游戏": "413",
                "书籍": "415",
                "学习": "417"
            }
        },
        "customTags": [
            {
                "selector": "input[name=\"tags[4][]\"][value=\"52\"]",
                "when": "agsv_ark"
            }
        ]
    },
    "SoulVoice": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "409",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "407",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "Encode": "7",
                "audio_Flac": "10",
                "audio_APE": "10"
            },
            "defaultValue": "12",
            "titleOverrides": [
                {
                    "pattern": "MiniBD",
                    "value": "4"
                },
                {
                    "pattern": "dsd",
                    "whenType": "音乐",
                    "value": "11"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "VC-1": "5",
                "MPEG-2": "5",
                "XVID": "5",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "4",
                "4K": "3",
                "1080p": "1",
                "1080i": "2",
                "720p": "4",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "customTags": [
            {
                "selector": "input[name=\"tags[4][]\"][value=\"9\"]",
                "when": "effects_sub"
            }
        ]
    },
    "PTT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "431",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "490",
                "MV": "408",
                "软件": "450",
                "游戏": "406",
                "学习": "420"
            }
        }
    },
    "PTsbao": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "纪录": "404",
                "动漫": "405",
                "综艺": "403",
                "音乐": "414",
                "MV": "414",
                "体育": "409",
                "软件": "409",
                "学习": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[1]",
            "map": {
                "UHD": "10",
                "Blu-ray": "1",
                "Remux": "1",
                "Encode": "1",
                "WEB-DL": "2",
                "HDTV": "5",
                "DVD": "3",
                "CD": "8"
            },
            "defaultValue": "9"
        },
        "codec": {
            "selector": "codec_sel[1]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[1]",
            "map": {
                "Atmos": "9",
                "DTS-X": "13",
                "DTS-HDMA:X 7.1": "13",
                "TrueHD": "9",
                "DTS-HDMA": "8",
                "DTS-HDHR": "8",
                "DTS": "3",
                "AC3": "11",
                "AAC": "6",
                "LPCM": "12",
                "Flac": "1",
                "APE": "2",
                "WAV": "7"
            }
        },
        "standard": {
            "selector": "standard_sel[1]",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "1",
                "720p": "2",
                "SD": "4"
            }
        },
        "processingByMedium": {
            "selector": "processing_sel[1]",
            "map": {
                "Remux": "1",
                "UHD": "5",
                "Blu-ray": "5",
                "Encode": "2"
            },
            "defaultValue": "3"
        },
        "team": {
            "selector": "team_sel[1]",
            "defaultValue": "7"
        },
        "sourceByType": {
            "selector": "source_sel[1]",
            "map": {
                "电影_UHD": "55",
                "电影_Blu-ray": "55",
                "电影_DVD": "89",
                "电影_Remux": "88",
                "电影_HDTV": "94",
                "电影_WEB-DL": "4",
                "电影_Encode_1080p": "3",
                "电影_Encode_720p": "91",
                "电影_Encode_4K": "92",
                "电影_1080p": "3",
                "电影_720p": "91",
                "电影_4K": "92",
                "剧集_大陆": "23",
                "剧集_台湾": "24",
                "剧集_香港": "24",
                "剧集_港台": "24",
                "剧集_日本": "26",
                "剧集_韩国": "27",
                "剧集_英国": "90",
                "剧集_欧美": "25",
                "纪录": "41",
                "动漫_complete": "66",
                "动漫": "45",
                "综艺": "15",
                "音乐": "10",
                "体育": "75",
                "学习": "75",
                "软件": "75"
            },
            "titleOverrides": [
                {
                    "pattern": "Netflix| NF ",
                    "value": "95"
                },
                {
                    "pattern": "",
                    "whenDiy": true,
                    "value": "93"
                }
            ]
        }
    },
    "TLFbits": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "438",
                "剧集": "440",
                "综艺": "441",
                "动漫": "442",
                "纪录": "443",
                "体育": "444",
                "MV": "445",
                "音乐": "446",
                "游戏": "447",
                "软件": "448",
                "学习": "449",
                "书籍": "449"
            },
            "defaultValue": "450"
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": "10",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "4",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            },
            "defaultValue": "9"
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "7",
                "VP9": "8"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": "13",
                "TrueHD": "14",
                "DTS-X": "10",
                "DTS-HDMA:X 7.1": "10",
                "DTS-HDMA": "11",
                "DTS-HD": "11",
                "DTS-HDHR": "11",
                "DTS": "3",
                "AC3": "9",
                "DDP": "17",
                "DDP_Atmos": "18",
                "Atmos_DDP": "18",
                "AAC": "6",
                "OPUS": "15",
                "LPCM": "12",
                "Flac": "1",
                "APE": "2",
                "WAV": "8",
                "MP3": "4",
                "OGG": "5"
            },
            "defaultValue": "7",
            "titleOverrides": [
                {
                    "pattern": "DDP|DD\\+",
                    "value": "17"
                }
            ]
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "4K": "6",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            },
            "defaultValue": "5"
        },
        "source": {
            "selector": "source_sel",
            "map": {},
            "defaultValue": "17"
        },
        "processingBySource": {
            "selector": "processing_sel",
            "map": {
                "大陆": "1",
                "香港": "3",
                "台湾": "3",
                "港台": "3",
                "日本": "4",
                "韩国": "5",
                "欧美": "2"
            },
            "defaultValue": "6"
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "5"
        }
    },
    "WT-Sakura": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "422",
                "综艺": "418",
                "纪录": "410",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "动漫_ep": "413",
                "动漫_pack": "423",
                "剧集_pack": "414",
                "综艺_pack": "403"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "10",
                "Blu-ray": "12",
                "Remux": "14",
                "Encode": "15",
                "WEB-DL": "21",
                "HDTV": "16",
                "CD": "18",
                "UHD_DIY": "11",
                "Blu-ray_DIY": "13"
            },
            "titleOverrides": [
                {
                    "pattern": "HD.?DVD",
                    "whenMedium": "DVD",
                    "value": "23"
                },
                {
                    "pattern": "dvdr",
                    "whenMedium": "DVD",
                    "value": "17"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "9",
                "X265": "7",
                "H264": "6",
                "X264": "8",
                "VC-1": "10",
                "MPEG-2": "11",
                "XVID": "12",
                "AV1": "13"
            },
            "defaultValue": "13"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "10",
                "DTS-X": "21",
                "DTS-HDMA:X 7.1": "9",
                "TrueHD": "12",
                "DTS-HDMA": "8",
                "DTS-HD": "13",
                "DTS-HDHR": "22",
                "DTS": "13",
                "AC3": "20",
                "AAC": "19",
                "LPCM": "14",
                "Flac": "15",
                "APE": "16",
                "WAV": "23",
                "MP3": "17",
                "M4A": "21",
                "DDP": "25"
            },
            "defaultValue": "21"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "5",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "CrabPt": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "3",
                "X265": "3",
                "H264": "2",
                "X264": "2",
                "VC-1": "1",
                "MPEG-2": "1",
                "XVID": "1",
                "AV1": "6",
                "VP9": "5"
            },
            "defaultValue": "1",
            "titleOverrides": [
                {
                    "pattern": "H.?266",
                    "value": "4"
                }
            ]
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "26",
                "DTS-HDMA:X 7.1": "8",
                "TrueHD": "6",
                "DTS-HDMA": "17",
                "DTS-HD": "15",
                "DTS-HDHR": "17",
                "DTS": "5",
                "AC3": "3",
                "AAC": "2",
                "LPCM": "7",
                "Flac": "10",
                "APE": "12",
                "WAV": "11",
                "DDP": "4"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "5",
                "4K": "4",
                "1080p": "3",
                "1080i": "3",
                "720p": "2",
                "SD": "1"
            }
        },
        "processingBySource": {
            "selector": "processing_sel[4]",
            "map": {
                "欧美": "4",
                "大陆": "2",
                "香港": "3",
                "台湾": "3",
                "港台": "3",
                "日本": "5",
                "韩国": "6",
                "印度": "7"
            },
            "defaultValue": "1"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "1"
        },
        "sourceByMedium": {
            "selector": "source_sel[4]",
            "map": {
                "UHD": "3",
                "Blu-ray": "2",
                "Remux": "4",
                "Encode": "5",
                "WEB-DL": "6",
                "HDTV": "7",
                "CD": "8"
            },
            "defaultValue": "1"
        }
    },
    "DiscFan": {
        "type": {
            "selector": "type",
            "map": {
                "电影_大陆": {
                    "index": 1
                },
                "电影_香港": {
                    "index": 2
                },
                "电影_台湾": {
                    "index": 3
                },
                "电影_泰国": {
                    "index": 4
                },
                "电影_日本": {
                    "index": 5
                },
                "电影_韩国": {
                    "index": 6
                },
                "电影": {
                    "index": 7
                },
                "剧集": {
                    "index": 8
                },
                "音乐": {
                    "index": 9
                },
                "MV": {
                    "index": 9
                },
                "纪录": {
                    "index": 10
                },
                "综艺": {
                    "index": 11
                },
                "体育": {
                    "index": 12
                },
                "动漫": {
                    "index": 13
                }
            }
        },
        "sourceByMedium": {
            "selector": "source_sel[4]",
            "map": {
                "UHD": "2",
                "Blu-ray": "3",
                "DVD": "4",
                "HDTV": "1",
                "Encode": "10",
                "WEB-DL": "9",
                "Remux": "131",
                "4K": "2"
            },
            "titleOverrides": [
                {
                    "pattern": "dvdrip|BDRIP",
                    "value": "10"
                },
                {
                    "pattern": " tv ",
                    "value": "5"
                },
                {
                    "pattern": "ldrip",
                    "value": "7"
                },
                {
                    "pattern": "vcd",
                    "value": "6"
                },
                {
                    "pattern": "vhs",
                    "value": "8"
                }
            ]
        }
    },
    "FreeFarm": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "404",
                "纪录": "403",
                "音乐": "407",
                "体育": "408",
                "MV": "406"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "2",
                "Remux": "5",
                "Encode": "6",
                "WEB-DL": "12",
                "HDTV": "7",
                "DVD": "14"
            },
            "titleOverrides": [
                {
                    "pattern": "DVDR",
                    "whenMedium": "DVD",
                    "value": "8"
                },
                {
                    "pattern": "MiniBD",
                    "value": "10"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "1",
                "X265": "3",
                "H264": "2",
                "X264": "4",
                "VC-1": "6",
                "MPEG-2": "8",
                "XVID": "9",
                "AV1": "14"
            },
            "defaultValue": "14"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "1",
                "DTS-X": "21",
                "DTS-HDMA:X 7.1": "6",
                "TrueHD": "5",
                "DTS-HDMA": "2",
                "DTS-HD": "21",
                "DTS-HDHR": "3",
                "DTS": "14",
                "AC3": "4",
                "AAC": "13",
                "LPCM": "7",
                "Flac": "9",
                "APE": "15",
                "WAV": "11",
                "MP3": "12",
                "M4A": "21"
            },
            "defaultValue": "21"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "1",
                "4K": "2",
                "1080p": "3",
                "1080i": "5",
                "720p": "6",
                "SD": "7"
            }
        },
        "source": {
            "selector": "source_sel[4]",
            "map": {
                "大陆": "35",
                "香港": "36",
                "台湾": "37",
                "港台": "42",
                "日本": "40",
                "韩国": "39",
                "欧美": "38",
                "印度": "41"
            },
            "defaultValue": "42"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "14"
        },
        "specialcat": {
            "selector": "specialcat",
            "map": {
                "学习": "413",
                "游戏": "417"
            }
        }
    },
    "Panda": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "409",
                "体育": "407",
                "MV": "406"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "11",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "8",
                "DTS-X": "2",
                "DTS-HDMA:X 7.1": "2",
                "TrueHD": "1",
                "DTS-HDMA": "3",
                "DTS-HD": "3",
                "DTS-HDHR": "18",
                "DTS": "4",
                "AC3": "5",
                "AAC": "7",
                "LPCM": "9",
                "Flac": "11",
                "APE": "12",
                "WAV": "15",
                "MP3": "10",
                "M4A": "16",
                "DDP": "6"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3"
            }
        },
        "source": {
            "selector": "source_sel[4]",
            "map": {
                "大陆": "7",
                "香港": "2",
                "台湾": "2",
                "港台": "6",
                "日本": "3",
                "韩国": "4",
                "欧美": "1",
                "印度": "9"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "CarPt": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "403",
                "综艺": "405",
                "纪录": "404",
                "音乐": "406",
                "体育": "407",
                "MV": "406",
                "软件": "407",
                "游戏": "407",
                "学习": "407",
                "书籍": "407"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "8",
                "Blu-ray": "7",
                "Remux": "9",
                "Encode": "1",
                "WEB-DL": "2",
                "HDTV": "3",
                "DVD": "4",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": {
                    "index": 2
                },
                "X265": {
                    "index": 2
                },
                "H264": {
                    "index": 1
                },
                "X264": {
                    "index": 1
                },
                "VC-1": {
                    "index": 4
                },
                "MPEG-2": {
                    "index": 3
                },
                "XVID": {
                    "index": 5
                },
                "AV1": {
                    "index": 6
                }
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": {
                    "index": 1
                },
                "DTS-HDMA:X 7.1": {
                    "index": 2
                },
                "TrueHD": {
                    "index": 1
                },
                "DTS-HDMA": {
                    "index": 2
                },
                "DTS-HD": {
                    "index": 2
                },
                "DTS-HDHR": {
                    "index": 2
                },
                "DTS": {
                    "index": 2
                },
                "AC3": {
                    "index": 3
                },
                "AAC": {
                    "index": 7
                },
                "LPCM": {
                    "index": 4
                },
                "Flac": {
                    "index": 5
                },
                "APE": {
                    "index": 8
                },
                "WAV": {
                    "index": 9
                }
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": {
                    "index": 1
                },
                "1080p": {
                    "index": 2
                },
                "1080i": {
                    "index": 2
                },
                "720p": {
                    "index": 3
                },
                "SD": {
                    "index": 4
                }
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "1PTBA": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "410",
                "游戏": "411",
                "学习": "412",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "16",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            },
            "titleOverrides": [
                {
                    "pattern": "HD.?DVD",
                    "whenMedium": "DVD",
                    "value": "2"
                },
                {
                    "pattern": "minibd",
                    "value": "4"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "18",
                "X265": "18",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "7",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "3",
                "TrueHD": "31",
                "DTS-HDMA": "3",
                "DTS-HD": "3",
                "DTS-HDHR": "3",
                "DTS": "3",
                "AC3": "7",
                "AAC": "6",
                "LPCM": "7",
                "Flac": "1",
                "APE": "2",
                "WAV": "7",
                "MP3": "4",
                "M4A": "7"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": {
                    "index": 6
                },
                "4K": {
                    "index": 5
                },
                "1080p": {
                    "index": 1
                },
                "1080i": {
                    "index": 2
                },
                "720p": {
                    "index": 3
                },
                "SD": {
                    "index": 4
                }
            }
        },
        "processingByMedium": {
            "selector": "processing_sel[4]",
            "map": {
                "Remux": {
                    "index": 0
                },
                "UHD": {
                    "index": 1
                },
                "Blu-ray": {
                    "index": 1
                },
                "Encode": {
                    "index": 2
                }
            },
            "defaultValue": {
                "index": 0
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "sourceByMedium": {
            "selector": "source_sel[4]",
            "map": {
                "UHD": "16",
                "UHD_DIY": "17",
                "Blu-ray": "1",
                "Blu-ray_DIY": "19",
                "Remux": "20",
                "Encode": "22",
                "HDTV": "4",
                "WEB-DL": "23",
                "DVD": "2",
                "CD": "25"
            },
            "defaultValue": "6"
        }
    },
    "52PT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": {
                    "index": 1
                },
                "剧集": {
                    "index": 4
                },
                "动漫": {
                    "index": 3
                },
                "综艺": {
                    "index": 5
                },
                "纪录": {
                    "index": 2
                },
                "音乐": {
                    "index": 10
                },
                "体育": {
                    "index": 7
                },
                "MV": {
                    "index": 6
                },
                "软件": {
                    "index": 8
                },
                "游戏": {
                    "index": 8
                },
                "学习": {
                    "index": 8
                },
                "书籍": {
                    "index": 8
                }
            },
            "defaultValue": {
                "index": 8
            }
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": {
                    "index": 4
                },
                "Blu-ray": {
                    "index": 3
                },
                "Remux": {
                    "index": 2
                },
                "Encode": {
                    "index": 9
                },
                "WEB-DL": {
                    "index": 13
                },
                "HDTV": {
                    "index": 7
                },
                "DVD": {
                    "index": 11
                },
                "CD": {
                    "index": 14
                },
                "UHD_DIY": {
                    "index": 8
                },
                "Blu-ray_DIY": {
                    "index": 1
                }
            },
            "defaultValue": {
                "index": 14
            },
            "titleOverrides": [
                {
                    "pattern": "uhd",
                    "whenMedium": "Remux",
                    "value": {
                        "index": 10
                    }
                }
            ]
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": "14",
                "X265": "12",
                "H264": "13",
                "X264": "11",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            },
            "defaultValue": "5",
            "titleOverrides": [
                {
                    "pattern": "HEVC",
                    "whenCodec": "H265",
                    "value": "1"
                }
            ]
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": {
                    "index": 3
                },
                "DTS-HDMA:X 7.1": {
                    "index": 4
                },
                "TrueHD": {
                    "index": 2
                },
                "DTS-HDMA": {
                    "index": 1
                },
                "DTS-HD": {
                    "index": 1
                },
                "DTS-HDHR": {
                    "index": 1
                },
                "DTS": {
                    "index": 7
                },
                "AC3": {
                    "index": 5
                },
                "AAC": {
                    "index": 8
                },
                "LPCM": {
                    "index": 6
                },
                "Flac": {
                    "index": 9
                },
                "APE": {
                    "index": 10
                },
                "WAV": {
                    "index": 11
                },
                "MP3": {
                    "index": 13
                }
            }
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "8K": {
                    "index": 8
                },
                "4K": {
                    "index": 2
                },
                "1080p": {
                    "index": 1
                },
                "1080i": {
                    "index": 3
                },
                "720p": {
                    "index": 5
                },
                "SD": {
                    "index": 6
                }
            }
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "5"
        }
    },
    "PTCafe": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "4",
                "Remux": "6",
                "Encode": "7",
                "WEB-DL": "8",
                "HDTV": "13",
                "DVD": "10",
                "CD": "12",
                "UHD_DIY": "2",
                "Blu-ray_DIY": "5",
                "TV": "9"
            },
            "defaultValue": "13",
            "titleOverrides": [
                {
                    "pattern": "UHD",
                    "whenMedium": "Remux",
                    "value": "3"
                },
                {
                    "pattern": "CD",
                    "inField": "smallDescr",
                    "whenMedium": "CD",
                    "value": "11"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "1",
                "X265": "3",
                "H264": "2",
                "X264": "4",
                "VC-1": "5",
                "MPEG-2": "6",
                "XVID": "8",
                "AV1": "11"
            },
            "defaultValue": "11"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "8",
                "DTS-X": "5",
                "DTS-HDMA:X 7.1": "1",
                "TrueHD": "10",
                "DTS-HDMA": "2",
                "DTS-HD": "4",
                "DTS-HDHR": "3",
                "DTS": "11",
                "AC3": "7",
                "AAC": "9",
                "LPCM": "6",
                "Flac": "12",
                "APE": "13",
                "WAV": "15",
                "MP3": "14",
                "M4A": "18"
            },
            "defaultValue": "18"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "1",
                "4K": "2",
                "1080p": "3",
                "1080i": "3",
                "720p": "4",
                "SD": "5"
            },
            "defaultValue": "6"
        },
        "source": {
            "selector": "source_sel[4]",
            "map": {
                "大陆": "1",
                "香港": "2",
                "台湾": "2",
                "港台": "2",
                "日本": "4",
                "韩国": "5",
                "欧美": "3",
                "印度": "6"
            },
            "defaultValue": "7"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "30"
        }
    },
    "PTFans": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "404",
                "动漫": "415",
                "综艺": "405",
                "纪录": "406",
                "音乐": "407",
                "体育": "403",
                "MV": "407",
                "软件": "419",
                "游戏": "419",
                "学习": "419",
                "书籍": "419"
            },
            "defaultValue": "419"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "6",
                "Blu-ray": "6",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "5",
                "HDTV": "8",
                "DVD": "2",
                "CD": "1"
            },
            "defaultValue": "8",
            "titleOverrides": [
                {
                    "pattern": "MiniBD",
                    "flags": "",
                    "value": "4"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "VC-1": "3",
                "MPEG-2": "6",
                "XVID": "9",
                "AV1": "8",
                "H265_Blu-ray": "5",
                "X265_Blu-ray": "5",
                "H265_UHD": "5",
                "X265_UHD": "5",
                "H264_Blu-ray": "4",
                "X264_Blu-ray": "4",
                "H264_UHD": "4",
                "X264_UHD": "4"
            },
            "defaultValue": "9"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "CyanBug": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "11",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "2",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "13",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "11",
                "TrueHD": "10",
                "DTS-HDMA": "12",
                "DTS-HD": "15",
                "DTS-HDHR": "15",
                "DTS": "3",
                "AC3": "8",
                "AAC": "6",
                "LPCM": "14",
                "Flac": "1",
                "APE": "2",
                "WAV": "9",
                "MP3": "7",
                "M4A": "7"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "OKPT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "415",
                "体育": "407",
                "软件": "431",
                "游戏": "413",
                "学习": "409",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "11",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "2",
                "CD": "8"
            },
            "defaultValue": "7",
            "titleOverrides": [
                {
                    "pattern": "MiniBD",
                    "value": "4"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "11",
                "X265": "11",
                "H264": "2",
                "X264": "2",
                "VC-1": "14",
                "MPEG-2": "14",
                "XVID": "14",
                "AV1": "14",
                "VP9": "9"
            },
            "defaultValue": "14",
            "titleOverrides": [
                {
                    "pattern": "H.?266",
                    "value": "10"
                }
            ]
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "15",
                "DTS-HDMA:X 7.1": "22",
                "TrueHD": "19",
                "DTS-HDMA": "7",
                "DTS-HD": "7",
                "DTS-HDHR": "7",
                "DTS": "3",
                "AC3": "15",
                "AAC": "6",
                "LPCM": "16",
                "Flac": "1",
                "APE": "5",
                "WAV": "7",
                "Atmos_TrueHD": "19"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "1",
                "4K": "2",
                "1080p": "3",
                "1080i": "3",
                "720p": "4",
                "SD": "5"
            },
            "defaultValue": "5"
        },
        "processingBySource": {
            "selector": "processing_sel[4]",
            "map": {
                "欧美": "6",
                "大陆": "8",
                "香港": "7",
                "台湾": "7",
                "港台": "7",
                "澳门": "7",
                "日本": "5",
                "韩国": "4",
                "印度": "17",
                "东南亚": "18"
            },
            "defaultValue": "3"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "14",
            "matchMode": "okpt"
        },
        "specialcat": {
            "selector": "specialcat",
            "map": {
                "MV": "406"
            }
        },
        "customTags": [
            {
                "selector": "input[name=\"tags[4][]\"][value=\"28\"]",
                "when": "jp_lang"
            },
            {
                "selector": "input[name=\"tags[4][]\"][value=\"25\"]",
                "when": "kr_lang"
            }
        ]
    },
    "KuFei": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "412",
                "游戏": "410",
                "学习": "413"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "UHD_DIY": "2",
                "Blu-ray": "4",
                "Blu-ray_DIY": "5",
                "Remux_4K": "3",
                "Remux": "6",
                "Encode_4K": "7",
                "Encode_1080p": "8",
                "Encode_1080i": "8",
                "Encode_720p": "9",
                "Encode": "18",
                "WEB-DL": "11",
                "HDTV": "12",
                "DVD": "13",
                "CD": "14"
            },
            "titleOverrides": [
                {
                    "pattern": "minibd",
                    "value": "10"
                },
                {
                    "pattern": "",
                    "whenDiy": true,
                    "whenStandard": "4K",
                    "value": "2"
                },
                {
                    "pattern": "",
                    "whenDiy": true,
                    "whenStandard": "1080p",
                    "value": "5"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "3",
                "X265": "4",
                "H264": "1",
                "X264": "2",
                "VC-1": "5",
                "MPEG-2": "6",
                "XVID": "8",
                "AV1": "10"
            },
            "defaultValue": "10"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "8",
                "DTS-X": "10",
                "DTS-HDMA:X 7.1": "10",
                "TrueHD": "13",
                "DTS-HDMA": "11",
                "DTS-HD": "11",
                "DTS-HDHR": "11",
                "DTS": "9",
                "AC3": "17",
                "AAC": "18",
                "LPCM": "14",
                "Flac": "1",
                "APE": "2",
                "WAV": "19",
                "MP3": "10",
                "M4A": "7",
                "DDP": "15",
                "DDP_Atmos": "24"
            },
            "defaultValue": "7",
            "titleOverrides": [
                {
                    "pattern": "dts.?hd.?hr",
                    "value": "12"
                }
            ]
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "6",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "Dragon": {
        "type": {
            "selector": "type",
            "map": {
                "电影": {
                    "index": 1
                },
                "剧集": {
                    "index": 2
                },
                "动漫": {
                    "index": 5
                },
                "综艺": {
                    "index": 6
                },
                "纪录": {
                    "index": 4
                },
                "音乐": {
                    "index": 9
                },
                "体育": {
                    "index": 8
                },
                "MV": {
                    "index": 7
                },
                "软件": {
                    "index": 11
                },
                "游戏": {
                    "index": 3
                },
                "学习": {
                    "index": 11
                }
            }
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": {
                    "index": 1
                },
                "Blu-ray": {
                    "index": 2
                },
                "Remux": {
                    "index": 3
                },
                "Encode": {
                    "index": 4
                },
                "WEB-DL": {
                    "index": 5
                },
                "HDTV": {
                    "index": 7
                },
                "DVD": {
                    "index": 6
                },
                "CD": {
                    "index": 8
                }
            }
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": {
                    "index": 2
                },
                "X265": {
                    "index": 2
                },
                "H264": {
                    "index": 1
                },
                "X264": {
                    "index": 1
                },
                "VC-1": {
                    "index": 3
                },
                "MPEG-2": {
                    "index": 4
                },
                "XVID": {
                    "index": 5
                },
                "AV1": {
                    "index": 5
                }
            }
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": {
                    "index": 1
                },
                "DTS-X": {
                    "index": 15
                },
                "DTS-HDMA:X 7.1": {
                    "index": 3
                },
                "TrueHD": {
                    "index": 2
                },
                "DTS-HDMA": {
                    "index": 4
                },
                "DTS-HD": {
                    "index": 1
                },
                "DTS-HDHR": {
                    "index": 5
                },
                "DTS": {
                    "index": 6
                },
                "AC3": {
                    "index": 9
                },
                "AAC": {
                    "index": 8
                },
                "LPCM": {
                    "index": 10
                },
                "Flac": {
                    "index": 7
                },
                "APE": {
                    "index": 13
                },
                "WAV": {
                    "index": 14
                },
                "MP3": {
                    "index": 15
                },
                "M4A": {
                    "index": 15
                }
            }
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "8K": {
                    "index": 1
                },
                "4K": {
                    "index": 2
                },
                "1080p": {
                    "index": 4
                },
                "1080i": {
                    "index": 4
                },
                "720p": {
                    "index": 5
                },
                "SD": {
                    "index": 6
                }
            }
        }
    },
    "iloli": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "430",
                "纪录": "404",
                "音乐": "408",
                "体育": "402",
                "MV": "410",
                "软件": "413",
                "游戏": "412",
                "学习": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "14",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "12",
                "HDTV": "5",
                "DVD": "2",
                "CD": "8"
            },
            "defaultValue": "11",
            "titleOverrides": [
                {
                    "pattern": "MiniBD|DVDRip",
                    "value": "7"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "8",
                "X265": "8",
                "H264": "9",
                "X264": "9",
                "VC-1": "12",
                "MPEG-2": "13",
                "XVID": "5",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "14",
                "DTS-X": "14",
                "DTS-HDMA:X 7.1": "23",
                "TrueHD": "9",
                "DTS-HDMA": "10",
                "DTS-HD": "3",
                "DTS-HDHR": "10",
                "DTS": "3",
                "AC3": "13",
                "AAC": "6",
                "LPCM": "15",
                "Flac": "1",
                "APE": "14",
                "WAV": "14",
                "MP3": "21",
                "M4A": "14",
                "DDP": "20",
                "Atmos_TrueHD": "9"
            },
            "defaultValue": "14"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "9",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            },
            "defaultValue": "9"
        },
        "source": {
            "selector": "source_sel[4]",
            "map": {
                "大陆": "1",
                "香港": "2",
                "台湾": "3",
                "港台": "13",
                "日本": "6",
                "韩国": "5",
                "欧美": "4",
                "印度": "7"
            },
            "defaultValue": "13"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "ITZMX": {
        "type": {
            "selector": "type",
            "map": {
                "电影": {
                    "index": 4
                },
                "剧集": {
                    "index": 5
                },
                "动漫": {
                    "index": 1
                },
                "综艺": {
                    "index": 5
                },
                "纪录": {
                    "index": 5
                },
                "音乐": {
                    "index": 3
                },
                "体育": {
                    "index": 0
                },
                "MV": {
                    "index": 3
                },
                "软件": {
                    "index": 7
                },
                "游戏": {
                    "index": 8
                },
                "学习": {
                    "index": 0
                }
            }
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "8K": {
                    "index": 0
                },
                "4K": {
                    "index": 3
                },
                "1080p": {
                    "index": 1
                },
                "1080i": {
                    "index": 1
                },
                "720p": {
                    "index": 2
                },
                "SD": {
                    "index": 0
                }
            }
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "1"
        }
    },
    "Oshen": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "410",
                "学习": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "10",
                "X265": "10",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "YDY": {
        "type": {
            "selector": "type",
            "map": {
                "电影_UHD": {
                    "index": 8
                },
                "电影_Blu-ray": {
                    "index": 8
                },
                "电影": {
                    "index": 7
                },
                "剧集_UHD": {
                    "index": 10
                },
                "剧集_Blu-ray": {
                    "index": 10
                },
                "剧集": {
                    "index": 9
                }
            },
            "defaultValue": {
                "index": 12
            }
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": {
                    "index": 1
                },
                "Blu-ray": {
                    "index": 2
                },
                "Remux": {
                    "index": 3
                },
                "Encode": {
                    "index": 4
                },
                "HDTV": {
                    "index": 5
                }
            }
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": {
                    "index": 5
                },
                "X265": {
                    "index": 5
                },
                "H264": {
                    "index": 1
                },
                "X264": {
                    "index": 1
                },
                "VC-1": {
                    "index": 2
                },
                "MPEG-2": {
                    "index": 4
                },
                "XVID": {
                    "index": 3
                },
                "AV1": {
                    "index": 6
                }
            },
            "defaultValue": {
                "index": 6
            }
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": {
                    "index": 9
                },
                "DTS-HDMA:X 7.1": {
                    "index": 8
                },
                "TrueHD": {
                    "index": 7
                },
                "DTS-HDMA": {
                    "index": 8
                },
                "DTS-HD": {
                    "index": 8
                },
                "DTS-HDHR": {
                    "index": 8
                },
                "DTS": {
                    "index": 1
                },
                "AC3": {
                    "index": 5
                },
                "AAC": {
                    "index": 6
                },
                "Flac": {
                    "index": 2
                },
                "APE": {
                    "index": 4
                },
                "WAV": {
                    "index": 3
                }
            }
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "4K": {
                    "index": 1
                },
                "1080p": {
                    "index": 2
                },
                "1080i": {
                    "index": 3
                },
                "720p": {
                    "index": 4
                },
                "SD": {
                    "index": 5
                }
            }
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "9"
        },
        "sourceByMedium": {
            "selector": "source_sel",
            "map": {
                "UHD": {
                    "index": 1
                },
                "Blu-ray": {
                    "index": 2
                },
                "Remux": {
                    "index": 2
                },
                "Encode": {
                    "index": 2
                },
                "HDTV": {
                    "index": 3
                },
                "DVD": {
                    "index": 4
                },
                "WEB-DL": {
                    "index": 5
                }
            },
            "defaultValue": {
                "index": 7
            },
            "titleOverrides": [
                {
                    "pattern": "dvdrip|webrip",
                    "value": {
                        "index": 6
                    }
                }
            ]
        }
    },
    "UltraHD": {
        "type": {
            "selector": "type",
            "map": {
                "电影": {
                    "index": 1
                },
                "剧集": {
                    "index": 2
                },
                "动漫": {
                    "index": 5
                },
                "综艺": {
                    "index": 3
                },
                "纪录": {
                    "index": 4
                },
                "MV": {
                    "index": 6
                }
            }
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": {
                    "index": 2
                },
                "Blu-ray": {
                    "index": 9
                },
                "Remux": {
                    "index": 3
                },
                "Encode": {
                    "index": 4
                },
                "WEB-DL": {
                    "index": 6
                },
                "HDTV": {
                    "index": 5
                },
                "DVD": {
                    "index": 9
                },
                "CD": {
                    "index": 9
                }
            }
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": {
                    "index": 1
                },
                "X265": {
                    "index": 1
                },
                "H264": {
                    "index": 2
                },
                "X264": {
                    "index": 2
                },
                "VC-1": {
                    "index": 6
                },
                "MPEG-2": {
                    "index": 6
                },
                "XVID": {
                    "index": 6
                },
                "AV1": {
                    "index": 5
                }
            }
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Atmos": {
                    "index": 1
                },
                "DTS-X": {
                    "index": 6
                },
                "DTS-HDMA:X 7.1": {
                    "index": 2
                },
                "TrueHD": {
                    "index": 4
                },
                "DTS-HDMA": {
                    "index": 3
                },
                "DTS-HD": {
                    "index": 9
                },
                "DTS-HDHR": {
                    "index": 9
                },
                "DTS": {
                    "index": 7
                },
                "AC3": {
                    "index": 5
                },
                "AAC": {
                    "index": 8
                },
                "LPCM": {
                    "index": 9
                },
                "Flac": {
                    "index": 9
                },
                "APE": {
                    "index": 9
                },
                "WAV": {
                    "index": 9
                },
                "MP3": {
                    "index": 9
                },
                "M4A": {
                    "index": 9
                }
            }
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "8K": {
                    "index": 2
                },
                "4K": {
                    "index": 1
                }
            }
        }
    },
    "麒麟": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "420",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "411",
                "游戏": "412",
                "学习": "419",
                "书籍": "409",
                "短剧": "421"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "24",
                "Blu-ray": "25",
                "Remux": "30",
                "Encode": "29",
                "WEB-DL": "31",
                "HDTV": "28",
                "DVD": "27",
                "CD": "33",
                "Blu-ray_DIY": "26"
            },
            "titleOverrides": [
                {
                    "pattern": "webrip",
                    "value": "29"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "15",
                "DTS-HDMA:X 7.1": "8",
                "TrueHD": "9",
                "DTS-HDMA": "8",
                "DTS-HD": "13",
                "DTS-HDHR": "19",
                "DTS": "3",
                "AC3": "11",
                "AAC": "6",
                "LPCM": "10",
                "Flac": "1",
                "APE": "12",
                "WAV": "13",
                "DDP": "17",
                "Atmos_DDP": "17"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "9",
                "4K": "6",
                "1080p": "1",
                "1080i": "1",
                "720p": "3",
                "SD": "8"
            },
            "defaultValue": "9"
        },
        "source": {
            "selector": "source_sel[4]",
            "map": {
                "大陆": "15",
                "香港": "16",
                "台湾": "17",
                "港台": "14",
                "日本": "19",
                "韩国": "20",
                "欧美": "14",
                "印度": "14"
            },
            "defaultValue": "14"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "processingByYear": {
            "selector": "processing_sel[4]",
            "mode": "optionText",
            "defaultValue": "9"
        }
    },
    "海棠": {
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H265": {
                    "index": 2
                },
                "X265": {
                    "index": 2
                },
                "H264": {
                    "index": 1
                },
                "X264": {
                    "index": 1
                }
            }
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "4K": "1",
                "1080p": "2",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "type": {
            "selector": "type",
            "map": {},
            "titleOverrides": [
                {
                    "pattern": "相声",
                    "inField": "all",
                    "value": "1"
                },
                {
                    "pattern": "小品",
                    "inField": "all",
                    "value": "4101"
                }
            ]
        }
    },
    "PTzone": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "406",
                "体育": "407",
                "MV": "406",
                "软件": "408",
                "游戏": "408",
                "学习": "408",
                "书籍": "408"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "10",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "4",
                "HDTV": "5",
                "DVD": "2",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "3",
                "XVID": "5",
                "AV1": "5"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "14",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "10",
                "TrueHD": "14",
                "DTS-HDMA": "10",
                "DTS-HD": "4",
                "DTS-HDHR": "10",
                "DTS": "3",
                "AC3": "11",
                "AAC": "6",
                "LPCM": "7",
                "Flac": "1",
                "APE": "2",
                "WAV": "15",
                "MP3": "4",
                "M4A": "7",
                "DDP": "12"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "5",
                "4K": "6",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "TCCF": {
        "type": {
            "selector": "type",
            "map": {
                "纪录": "624",
                "学习": "628",
                "书籍": "629"
            }
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": "10",
                "Blu-ray": "1",
                "Remux": "5",
                "Encode": "11",
                "WEB-DL": "9",
                "HDTV": "6",
                "DVD": "7"
            }
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H264": "1",
                "X265": "6",
                "H265": "8",
                "X264": "7",
                "VC-1": "2",
                "XVID": "3",
                "MPEG-2": "4"
            }
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Flac": "1",
                "APE": "2",
                "DTS": "3",
                "AC3": "4",
                "MP3": "5",
                "AAC": "6",
                "DTS-HD": "8",
                "DTS-HDMA": "8",
                "DTS-HDHR": "8",
                "DTS-HDMA:X 7.1": "8",
                "TrueHD": "9",
                "Atmos": "9",
                "LPCM": "10",
                "WAV": "11"
            }
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel",
            "defaultValue": "7"
        }
    },
    "13City": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "413",
                "音乐": "408",
                "MV": "406"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "2",
                "CD": "8"
            },
            "defaultValue": "9",
            "titleOverrides": [
                {
                    "pattern": "minibd",
                    "value": "4"
                },
                {
                    "pattern": "dvdr",
                    "value": "6"
                },
                {
                    "pattern": "HD.DVD",
                    "value": "2"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "VC-1": "4",
                "MPEG-2": "3",
                "XVID": "6",
                "AV1": "7"
            },
            "defaultValue": "7"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "9",
                "DTS-X": "3",
                "DTS-HDMA:X 7.1": "3",
                "TrueHD": "8",
                "DTS-HDMA": "3",
                "DTS-HD": "11",
                "DTS-HDHR": "3",
                "DTS": "3",
                "AC3": "7",
                "AAC": "6",
                "LPCM": "10",
                "Flac": "1",
                "APE": "2",
                "WAV": "11",
                "MP3": "4",
                "M4A": "11",
                "DDP": "7"
            },
            "defaultValue": "11"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "1",
                "4K": "2",
                "1080p": "3",
                "1080i": "4",
                "720p": "5",
                "SD": "5"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "11"
        },
        "processingBySource": {
            "selector": "processing_sel[4]",
            "map": {
                "大陆": "1",
                "香港": "1",
                "台湾": "1",
                "港台": "1",
                "日本": "2",
                "泰国": "3",
                "印度": "4",
                "韩国": "5",
                "欧美": "6"
            },
            "defaultValue": "7"
        }
    },
    "HITPT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "416",
                "纪录": "413",
                "体育": "407",
                "MV": "415"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "10",
                "X265": "14",
                "H264": "1",
                "X264": "13",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "13",
                "DTS-X": "15",
                "DTS-HDMA:X 7.1": "19",
                "TrueHD": "12",
                "DTS-HDMA": "18",
                "DTS-HD": "16",
                "DTS-HDHR": "7",
                "DTS": "3",
                "AC3": "8",
                "AAC": "6",
                "LPCM": "14",
                "Flac": "1",
                "APE": "2",
                "WAV": "11",
                "MP3": "4",
                "M4A": "7",
                "DDP": "8"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "7",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            },
            "defaultValue": "8"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "4"
        },
        "specialcat": {
            "selector": "specialcat",
            "map": {
                "音乐": "406",
                "软件": "408",
                "游戏": "410"
            }
        },
        "sourceByMedium": {
            "selector": "source_sel[4]",
            "map": {
                "UHD": "11",
                "Blu-ray": "1",
                "Remux": "12",
                "HDTV": "4",
                "Encode": "2",
                "WEB-DL": "9",
                "DVD": "3",
                "CD": "7",
                "TV": "5"
            },
            "defaultValue": "8"
        }
    },
    "HUDBT": {
        "type": {
            "selector": "type",
            "map": {
                "电影_大陆": "401",
                "电影_港台": "413",
                "电影_香港": "413",
                "电影_台湾": "413",
                "电影_日本": "414",
                "电影_韩国": "414",
                "电影_日韩": "414",
                "电影_印度": "414",
                "电影_欧美": "415",
                "电影": "415",
                "剧集_大陆": "402",
                "剧集_港台": "417",
                "剧集_香港": "417",
                "剧集_台湾": "417",
                "剧集_日本": "416",
                "剧集_韩国": "416",
                "剧集_日韩": "416",
                "剧集_印度": "416",
                "剧集_欧美": "418",
                "剧集": "418",
                "综艺_大陆": "403",
                "综艺_港台": "419",
                "综艺_香港": "419",
                "综艺_台湾": "419",
                "综艺_日本": "420",
                "综艺_韩国": "420",
                "综艺_日韩": "420",
                "综艺_欧美": "421",
                "综艺": "421",
                "纪录": "404",
                "动漫": "405",
                "MV": "406",
                "体育": "407",
                "音乐": "408",
                "游戏": "410",
                "软件": "411",
                "学习": "412",
                "书籍": "432"
            },
            "titleOverrides": [
                {
                    "pattern": "pad$|ipad",
                    "value": "430"
                }
            ]
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "4K": {
                    "index": 6
                },
                "1080p": {
                    "index": 1
                },
                "1080i": {
                    "index": 2
                },
                "720p": {
                    "index": 3
                },
                "SD": {
                    "index": 4
                }
            }
        }
    },
    "NanYang": {
        "type": {
            "selector": "type",
            "map": {
                "电影": {
                    "index": 1
                },
                "剧集": {
                    "index": 2
                },
                "动漫": {
                    "index": 3
                },
                "综艺": {
                    "index": 4
                },
                "纪录": {
                    "index": 6
                },
                "音乐": {
                    "index": 7
                },
                "体育": {
                    "index": 5
                },
                "MV": {
                    "index": 7
                },
                "软件": {
                    "index": 9
                },
                "学习": {
                    "index": 8
                }
            }
        }
    },
    "NexusHD": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "101",
                "剧集": "102",
                "综艺": "103",
                "纪录": "104",
                "动漫": "105",
                "体育": "106",
                "MV": "107",
                "音乐": "108",
                "游戏": "110",
                "学习": "111"
            },
            "defaultValue": "109"
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H264": "1",
                "X264": "1",
                "H265": "2",
                "X265": "2"
            },
            "defaultValue": "0"
        },
        "sourceByMedium": {
            "selector": "source_sel",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "DVD": "3",
                "HDTV": "4",
                "WEB-DL": "7"
            },
            "defaultValue": "0",
            "titleOverrides": [
                {
                    "pattern": "blu[-]?ray|bdrip",
                    "value": "1"
                },
                {
                    "pattern": "hd[-]?dvd",
                    "value": "2"
                },
                {
                    "pattern": "web[-]?dl",
                    "value": "7"
                },
                {
                    "pattern": "web[-]?rip",
                    "value": "9"
                }
            ]
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4",
                "4K": "6"
            },
            "defaultValue": "0",
            "titleOverrides": [
                {
                    "pattern": "dvd",
                    "whenMedium": "DVD",
                    "value": "4"
                }
            ]
        },
        "processingByMedium": {
            "selector": "processing_sel",
            "map": {
                "Remux": "1",
                "WEB-DL": "1",
                "Encode": "2"
            },
            "titleOverrides": [
                {
                    "pattern": "x264|x265|bdrip|dvdrip|web[-]?rip",
                    "value": "2"
                },
                {
                    "pattern": "remux",
                    "value": "1"
                }
            ]
        }
    },
    "PuTao": {
        "type": {
            "selector": "type",
            "map": {
                "电影_大陆": "401",
                "电影_港台": "401",
                "电影_香港": "401",
                "电影_台湾": "401",
                "电影_欧美": "402",
                "电影_日本": "403",
                "电影_韩国": "403",
                "电影_日韩": "403",
                "电影_印度": "403",
                "电影": "402",
                "剧集_港台": "407",
                "剧集_香港": "407",
                "剧集_台湾": "407",
                "剧集_日本": "408",
                "剧集_韩国": "408",
                "剧集_日韩": "408",
                "剧集_印度": "408",
                "剧集_大陆": "409",
                "剧集_欧美": "410",
                "剧集": "410",
                "综艺_大陆": "411",
                "综艺_港台": "412",
                "综艺_香港": "412",
                "综艺_台湾": "412",
                "综艺_欧美": "413",
                "综艺_日本": "414",
                "综艺_韩国": "414",
                "综艺_日韩": "414",
                "纪录": "406",
                "音乐": "423",
                "MV": "427",
                "动漫": "431",
                "体育": "432",
                "软件": "434",
                "学习": "435"
            },
            "defaultValue": "450"
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H264": {
                    "index": 1
                },
                "X264": {
                    "index": 1
                },
                "VC-1": {
                    "index": 2
                },
                "Xvid": {
                    "index": 3
                },
                "MPEG-2": {
                    "index": 4
                },
                "H265": {
                    "index": 10
                },
                "X265": {
                    "index": 10
                }
            }
        },
        "codecAudioFallback": {
            "Flac": {
                "index": 5
            },
            "APE": {
                "index": 6
            },
            "DTS": {
                "index": 7
            },
            "AC3": {
                "index": 8
            },
            "WAV": {
                "index": 9
            },
            "MP3": {
                "index": 9
            },
            "AAC": {
                "index": 9
            }
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "4K": {
                    "index": 6
                },
                "1080p": {
                    "index": 1
                },
                "1080i": {
                    "index": 2
                },
                "720p": {
                    "index": 3
                },
                "SD": {
                    "index": 4
                },
                "": {
                    "index": 5
                }
            }
        }
    },
    "RS": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "综艺": "403",
                "纪录": "404",
                "动漫": "405",
                "体育": "407",
                "音乐": "408",
                "学习": "411",
                "软件": "412"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel",
            "map": {
                "UHD": "0",
                "Blu-ray": "1",
                "DVD": "2",
                "Remux": "3",
                "HDTV": "5",
                "Encode": "7",
                "WEB-DL": "10"
            },
            "titleOverrides": [
                {
                    "pattern": "DVDR",
                    "whenMedium": "DVD",
                    "value": "6"
                },
                {
                    "pattern": "MiniBD",
                    "value": "10"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel",
            "map": {
                "H264": "1",
                "VC-1": "2",
                "XVID": "3",
                "X265": "3",
                "MPEG-2": "4",
                "MPEG-4": "5",
                "X264": "6",
                "H265": "8"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "Flac": "1",
                "APE": "2",
                "DTS": "3",
                "DTS-HD": "3",
                "DTS-HDHR": "3",
                "DTS-HDMA": "3",
                "DTS-HDMA:X 7.1": "3",
                "MP3": "4",
                "OGG": "5",
                "AAC": "6"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel",
            "map": {
                "8K": "0",
                "4K": "6",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        }
    },
    "GTK": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "411",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "10",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "11",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "ECUST": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "411",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "1",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "HDClone": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "410",
                "软件": "407",
                "游戏": "407",
                "学习": "407",
                "书籍": "407"
            },
            "defaultValue": "407"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "9",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "6",
                "HDTV": "11",
                "DVD": "10",
                "CD": "5"
            },
            "defaultValue": "5",
            "titleOverrides": [
                {
                    "pattern": "minibd",
                    "value": "4"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "3"
            },
            "defaultValue": "5"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "1",
                "1080p": "2",
                "1080i": "2",
                "720p": "3",
                "SD": "4",
                "8K": "6"
            }
        }
    },
    "HDBAO": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "409",
                "体育": "407",
                "MV": "406",
                "软件": "411",
                "游戏": "411",
                "学习": "411",
                "书籍": "411"
            },
            "defaultValue": "411"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "3",
                "Remux": "5",
                "Encode": "6",
                "WEB-DL": "7",
                "HDTV": "8",
                "DVD": "12",
                "CD": "12"
            },
            "defaultValue": "13",
            "titleOverrides": [
                {
                    "pattern": "dvdrip",
                    "value": "3"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "7",
                "X265": "7",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "5",
                "1080p": "8",
                "1080i": "2",
                "720p": "7",
                "SD": "10"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel",
            "map": {
                "AAC": "1",
                "WAV": "1",
                "AC3": "2",
                "DTS": "3",
                "APE": "6",
                "DTS-HDMA:X 7.1": "8",
                "DTS-X": "8",
                "Atmos": "9",
                "DTS-HD": "11",
                "DTS-HDMA": "11",
                "DTS-HDHR": "11",
                "TrueHD": "12",
                "LPCM": "13",
                "Flac": "15"
            },
            "defaultValue": "7"
        }
    },
    "唐门": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "10",
                "Blu-ray": "11",
                "Remux": "12",
                "Encode": "13",
                "WEB-DL": "14",
                "HDTV": "15",
                "DVD": "16",
                "CD": "17"
            },
            "titleOverrides": [
                {
                    "pattern": "MiniBD",
                    "value": "4"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "7",
                "X265": "7",
                "H264": "6",
                "X264": "6",
                "VC-1": "8",
                "MPEG-2": "9",
                "XVID": "11",
                "AV1": "10"
            },
            "defaultValue": "11"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "11",
                "DTS-X": "16",
                "DTS-HDMA:X 7.1": "23",
                "TrueHD": "15",
                "DTS-HDMA": "17",
                "DTS-HD": "23",
                "DTS-HDHR": "17",
                "DTS": "18",
                "AC3": "13",
                "AAC": "9",
                "LPCM": "14",
                "Flac": "22",
                "APE": "10",
                "WAV": "20",
                "MP3": "21",
                "M4A": "19",
                "DDP": "12"
            },
            "defaultValue": "23"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "9",
                "4K": "8",
                "1080p": "7",
                "1080i": "7",
                "720p": "6",
                "SD": "5"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "processingByYear": {
            "selector": "processing_sel[5]",
            "mode": "buckets"
        }
    },
    "天枢": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "0",
                "游戏": "0",
                "学习": "410",
                "书籍": "0"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "11",
                "X265": "10",
                "H264": "13",
                "X264": "12",
                "VC-1": "2",
                "MPEG-2": "6",
                "XVID": "8",
                "AV1": "5"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "0",
                "4K": "5",
                "1080p": "1",
                "1080i": "1",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "财神": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "410",
                "游戏": "410",
                "学习": "410",
                "书籍": "410"
            },
            "defaultValue": "410"
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "VC-1": "3",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "6"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "11",
                "DTS-X": "16",
                "DTS-HDMA:X 7.1": "16",
                "TrueHD": "15",
                "DTS-HDMA": "17",
                "DTS-HD": "13",
                "DTS-HDHR": "17",
                "DTS": "18",
                "AC3": "13",
                "AAC": "9",
                "LPCM": "14",
                "Flac": "22",
                "APE": "10",
                "WAV": "20",
                "MP3": "21",
                "M4A": "19",
                "DDP": "12"
            },
            "defaultValue": "13"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "8",
                "4K": "7",
                "1080p": "6",
                "1080i": "6",
                "720p": "5",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "sourceByMedium": {
            "selector": "source_sel[4]",
            "map": {
                "Blu-ray": "7",
                "UHD": "8",
                "Remux": "9",
                "Encode": "10",
                "WEB-DL": "11",
                "HDTV": "12",
                "DVD": "13",
                "CD": "14"
            },
            "defaultValue": "16"
        }
    },
    "星陨阁": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "418",
                "游戏": "409",
                "学习": "414",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "2",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "4",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "VC-1": "3",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "6"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "12",
                "DTS-X": "16",
                "DTS-HDMA:X 7.1": "7",
                "TrueHD": "8",
                "DTS-HDMA": "6",
                "DTS-HD": "6",
                "DTS-HDHR": "6",
                "DTS": "5",
                "AC3": "10",
                "AAC": "14",
                "LPCM": "9",
                "Flac": "1",
                "APE": "13",
                "WAV": "3",
                "MP3": "2",
                "M4A": "4",
                "DDP": "11"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "5",
                "4K": "4",
                "1080p": "3",
                "1080i": "3",
                "720p": "2",
                "SD": "6"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "我好闲": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "10",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "9",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "3"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "10",
                "DTS-X": "16",
                "DTS-HDMA:X 7.1": "11",
                "TrueHD": "9",
                "DTS-HDMA": "8",
                "DTS-HD": "8",
                "DTS-HDHR": "8",
                "DTS": "3",
                "AC3": "14",
                "AAC": "6",
                "LPCM": "12",
                "Flac": "1",
                "APE": "2",
                "WAV": "7",
                "MP3": "4",
                "M4A": "7",
                "DDP": "13"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "7",
                "4K": "1",
                "1080p": "2",
                "1080i": "3",
                "720p": "5",
                "SD": "6"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "6"
        }
    },
    "下水道": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "409",
                "MV": "409",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "11",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "7",
                "TrueHD": "13",
                "DTS-HDMA": "14",
                "DTS-HD": "7",
                "DTS-HDHR": "14",
                "DTS": "3",
                "AC3": "8",
                "AAC": "6",
                "LPCM": "16",
                "Flac": "1",
                "APE": "2",
                "WAV": "10",
                "MP3": "4",
                "M4A": "7",
                "DDP": "11"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "5",
                "1080p": "1",
                "1080i": "1",
                "720p": "3",
                "SD": "2"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "柠檬不甜": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "406",
                "动漫": "403",
                "综艺": "407",
                "纪录": "405",
                "音乐": "408",
                "体育": "407",
                "MV": "404",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "6",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "2",
                "WEB-DL": "4",
                "HDTV": "5",
                "DVD": "8",
                "CD": "9"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "VC-1": "3",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "5"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "1",
                "DTS-X": "13",
                "DTS-HDMA:X 7.1": "4",
                "TrueHD": "2",
                "DTS-HDMA": "3",
                "DTS-HD": "13",
                "DTS-HDHR": "13",
                "DTS": "5",
                "AC3": "6",
                "AAC": "8",
                "LPCM": "9",
                "Flac": "10",
                "APE": "12",
                "WAV": "11",
                "MP3": "13",
                "M4A": "13",
                "DDP": "7"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": {
                    "index": 1
                },
                "1080p": {
                    "index": 2
                },
                "1080i": {
                    "index": 2
                },
                "720p": {
                    "index": 3
                },
                "SD": {
                    "index": 4
                }
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "RailgunPT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "410",
                "游戏": "412",
                "学习": "411",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "2",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "4",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "VC-1": "3",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "6"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "1",
                "DTS-X": "9",
                "DTS-HDMA:X 7.1": "9",
                "TrueHD": "1",
                "DTS-HDMA": "2",
                "DTS-HD": "9",
                "DTS-HDHR": "2",
                "DTS": "9",
                "AC3": "3",
                "AAC": "7",
                "LPCM": "4",
                "Flac": "5",
                "APE": "8",
                "WAV": "10",
                "MP3": "6",
                "M4A": "9",
                "DDP": "3"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "5",
                "4K": "1",
                "1080p": "2",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "MyPT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "体育": "407",
                "MV": "406",
                "短剧": "408"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "2",
                "CD": "8"
            },
            "defaultValue": "0",
            "titleOverrides": [
                {
                    "pattern": "minibd",
                    "value": "4"
                },
                {
                    "pattern": "dvdr",
                    "value": "6"
                },
                {
                    "pattern": "HD.DVD",
                    "value": "2"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "VC-1": "7",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "7"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "5",
                "1080p": "2",
                "1080i": "2",
                "720p": "3",
                "SD": "8"
            },
            "defaultValue": "1"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "specialcat": {
            "selector": "specialcat",
            "map": {
                "音乐": "412",
                "漫画": "413",
                "游戏": "415",
                "软件": "416"
            }
        },
        "specialcatMode5": true,
        "specialcatExtras": [
            {
                "selector": "processing_sel[5]",
                "value": "1"
            },
            {
                "selector": "audiocodec_sel[5]",
                "value": "1",
                "whenPattern": "flac"
            }
        ]
    },
    "PTSkit": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "404",
                "剧集": "405",
                "动漫": "407",
                "综艺": "409",
                "纪录": "406",
                "音乐": "408",
                "游戏": "403",
                "学习": "406"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "9",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "5",
                "X265": "5",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "MARCH": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "410"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "13",
                "HDTV": "5",
                "DVD": "8",
                "CD": "4"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "3",
                "X265": "7",
                "H264": "1",
                "X264": "6",
                "VC-1": "11",
                "MPEG-2": "4",
                "XVID": "9",
                "AV1": "10"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "8",
                "4K": "6",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "0"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "11"
        }
    },
    "NovaHD": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "409",
                "体育": "407",
                "MV": "406",
                "软件": "410",
                "游戏": "410",
                "学习": "410",
                "书籍": "410"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "10",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "11",
                "HDTV": "5",
                "DVD": "12",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "10"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "8",
                "DTS-X": "15",
                "DTS-HDMA:X 7.1": "15",
                "TrueHD": "12",
                "DTS-HDMA": "13",
                "DTS-HD": "15",
                "DTS-HDHR": "13",
                "DTS": "3",
                "AC3": "10",
                "AAC": "6",
                "LPCM": "11",
                "Flac": "1",
                "APE": "2",
                "WAV": "15",
                "MP3": "4",
                "M4A": "15",
                "DDP": "9"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "LuckPT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "410",
                "纪录": "411",
                "音乐": "408",
                "体育": "412",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "10",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "11",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            },
            "defaultValue": "13",
            "titleOverrides": [
                {
                    "pattern": "dvdrip",
                    "value": "7"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "3",
                "MPEG-2": "4",
                "XVID": "12",
                "AV1": "2"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "11",
                "DTS-X": "15",
                "DTS-HDMA:X 7.1": "15",
                "TrueHD": "14",
                "DTS-HDMA": "16",
                "DTS-HD": "7",
                "DTS-HDHR": "16",
                "DTS": "3",
                "AC3": "8",
                "AAC": "6",
                "LPCM": "13",
                "Flac": "1",
                "APE": "2",
                "WAV": "18",
                "MP3": "4",
                "M4A": "17",
                "DDP": "12",
                "Atmos_DDP": "12"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "7",
                "4K": "6",
                "1080p": "1",
                "1080i": "1",
                "720p": "3",
                "SD": "8"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "Tokyo": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "409",
                "纪录": "409",
                "音乐": "408",
                "体育": "409",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "2",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "7",
                "H264": "1",
                "X264": "1",
                "VC-1": "3",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "6"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "16",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "7",
                "TrueHD": "12",
                "DTS-HDMA": "10",
                "DTS-HD": "7",
                "DTS-HDHR": "10",
                "DTS": "3",
                "AC3": "14",
                "AAC": "6",
                "LPCM": "13",
                "Flac": "1",
                "APE": "17",
                "WAV": "8",
                "MP3": "4",
                "M4A": "9",
                "DDP": "15"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "5",
                "4K": "6",
                "1080p": "1",
                "1080i": "1",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "ALing": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "402",
                "纪录": "404",
                "MV": "404"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "5",
                "HDTV": "4",
                "DVD": "6",
                "CD": "8",
                "UHD_DIY": "2",
                "Blu-ray_DIY": "2"
            },
            "defaultValue": "8",
            "titleOverrides": [
                {
                    "pattern": "",
                    "whenDiy": true,
                    "value": "2"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "VC-1": "5",
                "MPEG-2": "4",
                "XVID": "6",
                "AV1": "3"
            },
            "defaultValue": "6"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": {
                    "index": 2
                },
                "1080p": {
                    "index": 3
                },
                "1080i": {
                    "index": 3
                },
                "720p": {
                    "index": 4
                },
                "SD": {
                    "index": 5
                }
            }
        },
        "source": {
            "selector": "source_sel[4]",
            "map": {
                "大陆": "1",
                "香港": "2",
                "台湾": "3",
                "港台": "11",
                "日本": "4",
                "韩国": "5",
                "欧美": "10",
                "印度": "6"
            },
            "defaultValue": "11"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "3"
        }
    },
    "LongPT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "409",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "2",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "4",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "2",
                "X265": "2",
                "H264": "1",
                "X264": "1",
                "VC-1": "3",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "5"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "9",
                "DTS-X": "11",
                "DTS-HDMA:X 7.1": "11",
                "TrueHD": "9",
                "DTS-HDMA": "3",
                "DTS-HD": "11",
                "DTS-HDHR": "3",
                "DTS": "13",
                "AC3": "15",
                "AAC": "6",
                "LPCM": "14",
                "Flac": "1",
                "APE": "2",
                "WAV": "17",
                "MP3": "4",
                "M4A": "8",
                "DDP": "10"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "5",
                "1080p": "2",
                "1080i": "2",
                "720p": "3"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "藏宝阁": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "404",
                "综艺": "407",
                "纪录": "408",
                "音乐": "409",
                "体育": "0",
                "MV": "407",
                "软件": "0",
                "游戏": "0",
                "学习": "410",
                "书籍": "0"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "9",
                "Blu-ray": "7",
                "Remux": "8",
                "Encode": "3",
                "WEB-DL": "6",
                "HDTV": "4",
                "DVD": "2",
                "CD": "0"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "8",
                "X265": "8",
                "H264": "6",
                "X264": "6",
                "VC-1": "5",
                "MPEG-2": "3",
                "XVID": "0",
                "AV1": "9"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "0",
                "DTS-X": "0",
                "DTS-HDMA:X 7.1": "0",
                "TrueHD": "8",
                "DTS-HDMA": "3",
                "DTS-HD": "0",
                "DTS-HDHR": "3",
                "DTS": "3",
                "AC3": "2",
                "AAC": "4",
                "LPCM": "9",
                "Flac": "7",
                "APE": "0",
                "WAV": "0",
                "MP3": "1",
                "M4A": "0",
                "DDP": "5"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "7",
                "4K": "6",
                "1080p": "4",
                "1080i": "4",
                "720p": "3",
                "SD": "0"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "1"
        }
    },
    "自然": {
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "8",
                "Remux": "9",
                "Encode": "10",
                "WEB-DL": "7",
                "HDTV": "4",
                "DVD": "2",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "7"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "5",
                "DTS-X": "1",
                "DTS-HDMA:X 7.1": "17",
                "TrueHD": "6",
                "DTS-HDMA": "3",
                "DTS-HD": "17",
                "DTS-HDHR": "4",
                "DTS": "2",
                "AC3": "8",
                "AAC": "11",
                "LPCM": "7",
                "Flac": "10",
                "APE": "12",
                "WAV": "13",
                "MP3": "14",
                "M4A": "15",
                "DDP": "9"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "1",
                "4K": "2",
                "1080p": "3",
                "1080i": "4",
                "720p": "5",
                "SD": "6"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "SBPT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "0"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "5"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "0",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "YHPP": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "0",
                "短剧": "402"
            },
            "defaultValue": "0"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "19",
                "UHD_DIY": "18",
                "UHD_Remux": "17",
                "Blu-ray": "15",
                "Blu-ray_DIY": "14",
                "Blu-ray_Remux": "13",
                "DVD": "6",
                "HDTV": "8",
                "WEB-DL": "9",
                "CD": "5",
                "Encode_4K": "16",
                "Encode_1080p": "12",
                "Encode_1080i": "12",
                "Encode_720p": "11",
                "Encode": "12"
            },
            "defaultValue": "1"
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "8",
                "X265": "7",
                "H264": "10",
                "X264": "9",
                "VC-1": "6",
                "MPEG-2": "1",
                "XVID": "3",
                "AV1": "5"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "23",
                "DTS-HDMA:X 7.1": "22",
                "TrueHD": "21",
                "DTS-HDMA": "20",
                "DTS-HD": "13",
                "DTS-HDHR": "19",
                "DTS": "18",
                "AC3": "2",
                "AAC": "1",
                "LPCM": "17",
                "Flac": "14",
                "APE": "15",
                "WAV": "16",
                "DDP": "11",
                "Atmos_DDP": "12"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "7",
                "4K": "6",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        },
        "processingBySource": {
            "selector": "processing_sel[4]",
            "map": {
                "美国": "9",
                "英国": "7",
                "欧洲": "8",
                "欧美": "8",
                "大陆": "12",
                "香港": "11",
                "台湾": "10",
                "港台": "11",
                "日本": "6",
                "韩国": "5",
                "印度": "4"
            },
            "defaultValue": "2"
        }
    },
    "52MOVIE": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "410",
                "MV": "406",
                "软件": "411",
                "游戏": "411",
                "学习": "411",
                "书籍": "411",
                "短剧": "402"
            },
            "defaultValue": "411"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            },
            "defaultValue": "11"
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "1",
                "X265": "1",
                "H264": "2",
                "X264": "2",
                "VC-1": "3",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "6"
            },
            "defaultValue": "9"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "6",
                "DTS-X": "15",
                "DTS-HDMA:X 7.1": "4",
                "TrueHD": "7",
                "DTS-HDMA": "4",
                "DTS-HD": "4",
                "DTS-HDHR": "4",
                "DTS": "3",
                "AC3": "2",
                "AAC": "1",
                "LPCM": "9",
                "Flac": "11",
                "APE": "12",
                "WAV": "10",
                "MP3": "13",
                "M4A": "15",
                "DDP": "5",
                "Atmos_TrueHD": "8",
                "DDP_Atmos": "6",
                "Atmos_DDP": "6"
            },
            "defaultValue": "15"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        }
    },
    "躺平": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "409",
                "体育": "407",
                "MV": "406",
                "软件": "414",
                "游戏": "414",
                "学习": "414",
                "书籍": "411"
            }
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "10",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "11",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8"
            }
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "3",
                "AV1": "7"
            }
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "9",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "7",
                "TrueHD": "12",
                "DTS-HDMA": "16",
                "DTS-HD": "7",
                "DTS-HDHR": "16",
                "DTS": "14",
                "AC3": "11",
                "AAC": "6",
                "LPCM": "19",
                "Flac": "1",
                "APE": "2",
                "WAV": "13",
                "MP3": "4",
                "M4A": "17",
                "DDP": "10"
            }
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "5",
                "1080p": "1",
                "1080i": "1",
                "720p": "2",
                "SD": "7"
            }
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "BaoZi": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "动漫": "405",
                "综艺": "403",
                "纪录": "404",
                "音乐": "408",
                "体育": "407",
                "MV": "406",
                "软件": "409",
                "游戏": "409",
                "学习": "409",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "11",
                "Blu-ray": "1",
                "Remux": "3",
                "Encode": "7",
                "WEB-DL": "10",
                "HDTV": "5",
                "DVD": "6",
                "CD": "8",
                "UHD_DIY": "12",
                "Blu-ray_DIY": "13"
            },
            "defaultValue": "0",
            "titleOverrides": [
                {
                    "pattern": "dvdrip",
                    "value": "6"
                },
                {
                    "pattern": "HD DVD",
                    "value": "2"
                },
                {
                    "pattern": "minibd",
                    "value": "4"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H265": "6",
                "X265": "6",
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "MPEG-2": "4",
                "XVID": "5",
                "AV1": "3"
            },
            "defaultValue": "5"
        },
        "audio": {
            "selector": "audiocodec_sel[4]",
            "map": {
                "Atmos": "9",
                "DTS-X": "8",
                "DTS-HDMA:X 7.1": "8",
                "TrueHD": "11",
                "DTS-HDMA": "10",
                "DTS-HD": "7",
                "DTS-HDHR": "10",
                "DTS": "3",
                "AC3": "1",
                "AAC": "6",
                "LPCM": "12",
                "Flac": "13",
                "APE": "14",
                "WAV": "15",
                "MP3": "4",
                "M4A": "5",
                "DDP": "1"
            },
            "defaultValue": "7"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "6",
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            },
            "defaultValue": "7"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5"
        }
    },
    "NJTUPT": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "综艺": "403",
                "纪录": "404",
                "动漫": "405",
                "MV": "406",
                "体育": "407",
                "学习": "415",
                "音乐": "422",
                "游戏": "425",
                "软件": "409",
                "书籍": "409"
            },
            "defaultValue": "409"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "9",
                "Blu-ray": "9",
                "Remux": "8",
                "Encode": "7",
                "WEB-DL": "5",
                "HDTV": "6",
                "DVD": "2"
            },
            "defaultValue": "10"
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "H265": "3",
                "X265": "3",
                "MPEG-2": "4",
                "MPEG-4": "4",
                "AV1": "6"
            },
            "defaultValue": "5"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "4K": "5",
                "1080p": "1",
                "1080i": "2",
                "720p": "3",
                "SD": "4"
            }
        }
    },
    "影": {
        "type": {
            "selector": "tr_category",
            "map": {
                "电影": "mo",
                "剧集": "tv",
                "动漫": "an",
                "综艺": "ot",
                "纪录": "do",
                "体育": "sp",
                "MV": "mv"
            }
        },
        "medium": {
            "selector": "tr_source",
            "map": {
                "UHD": "s54",
                "UHD_DIY": "s53",
                "Blu-ray": "s44",
                "Blu-ray_DIY": "s43",
                "DVD": "s33",
                "Remux_4K": "s52",
                "Remux": "s42",
                "HDTV": "s22",
                "WEB-DL": "s13",
                "Encode_4K": "s51",
                "Encode": "s41"
            },
            "defaultValue": "s11",
            "titleOverrides": [
                {
                    "pattern": "dvdrip",
                    "whenMedium": "DVD",
                    "value": "s31"
                },
                {
                    "pattern": "remux",
                    "whenMedium": "DVD",
                    "value": "s32"
                },
                {
                    "pattern": "dvd",
                    "whenMedium": "Remux",
                    "value": "s32"
                },
                {
                    "pattern": "tvrip",
                    "whenMedium": "HDTV",
                    "value": "s21"
                },
                {
                    "pattern": "dvd",
                    "whenMedium": "Encode",
                    "value": "s31"
                },
                {
                    "pattern": "web",
                    "whenMedium": "Encode",
                    "whenStandard": "1080p",
                    "value": "s13"
                },
                {
                    "pattern": "web",
                    "whenMedium": "Encode",
                    "whenStandard": "720p",
                    "value": "s13"
                }
            ]
        },
        "codec": {
            "selector": "tr_video_codec",
            "map": {
                "H264": "1",
                "H265": "2",
                "MPEG-2": "3",
                "MPEG-4": "3",
                "VC-1": "5",
                "X264": "6",
                "X265": "7",
                "XVID": "8"
            },
            "defaultValue": "4"
        },
        "audio": {
            "selector": "tr_audio_codec",
            "map": {
                "AAC": "1",
                "APE": "2",
                "AC3": "3",
                "DTS-HD": "4",
                "DTS": "4",
                "DTS-HDHR": "5",
                "DTS-HDMA": "6",
                "DTS-X": "7",
                "DTS-HDMA:X 7.1": "7",
                "Flac": "8",
                "LPCM": "9",
                "M4A": "10",
                "MP3": "11",
                "TrueHD": "14",
                "Atmos_TrueHD": "15",
                "Atmos": "3",
                "WAV": "16"
            },
            "defaultValue": "13"
        },
        "standard": {
            "selector": "tr_resolution",
            "map": {
                "SD": "r1",
                "720p": "r2",
                "1080p": "r3",
                "1080i": "r3",
                "4K": "r4",
                "8K": "r5"
            }
        },
        "team": {
            "selector": "tr_team",
            "defaultValue": "5"
        }
    },
    "慕雪阁": {
        "type": {
            "selector": "type",
            "map": {
                "电影": "401",
                "剧集": "402",
                "短剧": "402",
                "综艺": "403",
                "纪录": "404",
                "动漫": "405",
                "MV": "406",
                "体育": "407",
                "音乐": "408",
                "游戏": "409",
                "学习": "409",
                "软件": "409"
            },
            "defaultValue": "0"
        },
        "medium": {
            "selector": "medium_sel[4]",
            "map": {
                "UHD": "1",
                "Blu-ray": "1",
                "HD DVD": "2",
                "Remux": "3",
                "HDTV": "5",
                "DVD": "6",
                "Encode": "7",
                "CD": "8",
                "WEB-DL": "10"
            },
            "defaultValue": "0",
            "titleOverrides": [
                {
                    "pattern": "dvdrip",
                    "value": "7"
                },
                {
                    "pattern": "MiniBD",
                    "value": "4"
                }
            ]
        },
        "codec": {
            "selector": "codec_sel[4]",
            "map": {
                "H264": "1",
                "X264": "1",
                "VC-1": "2",
                "XVID": "3",
                "MPEG-2": "4",
                "H265": "6",
                "X265": "6"
            },
            "defaultValue": "5"
        },
        "standard": {
            "selector": "standard_sel[4]",
            "map": {
                "8K": "0",
                "4K": "5",
                "2K": "0",
                "1080p": "1",
                "1080i": "1",
                "720p": "3",
                "720i": "3",
                "SD": "4"
            },
            "defaultValue": "0"
        },
        "team": {
            "selector": "team_sel[4]",
            "defaultValue": "5",
            "matchMode": "muxuege"
        }
    }
};
