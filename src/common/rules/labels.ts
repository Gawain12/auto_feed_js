import { TorrentMeta } from '../../types/TorrentMeta';
import { getLabel } from './text';

/**
 * Text fed to `getLabel`: names before `#separator#` (only these are used for 粤语 / DIY checks),
 * full description and MediaInfo after it.
 */
export function labelSourceText(meta: Pick<TorrentMeta, 'smallDescr' | 'subtitle' | 'title' | 'description' | 'fullMediaInfo'>): string {
    return `${meta.smallDescr || ''}${meta.subtitle || ''}${meta.title || ''}#separator#${meta.description || ''}${meta.fullMediaInfo || ''}`;
}

/** Labels (国语 / 中字 / DIY / HDR …) for a meta, reusing ones already computed upstream. */
export function getMetaLabels(meta: TorrentMeta): Record<string, boolean> {
    return meta.labelInfo || getLabel(labelSourceText(meta));
}
