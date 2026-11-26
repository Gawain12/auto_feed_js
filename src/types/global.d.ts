
// Declare GM globals
declare function GM_getValue(key: string, defaultValue?: any): any;
declare function GM_setValue(key: string, value: any): void;
declare function GM_setClipboard(data: any, type?: string): void;
declare function GM_deleteValue(key: string): void;
declare function GM_registerMenuCommand(caption: string, commandFunc: () => void, accessKey?: string): void;
declare function GM_xmlhttpRequest(details: any): any;
declare const GM: any;
declare const GM_info: { script?: { version?: string } } | undefined;
declare const __AUTOFEED_VERSION__: string | undefined;

// jQuery plugin extensions
interface JQuery {
    wait(func: () => void, times?: number, interval?: number): JQuery;
}
