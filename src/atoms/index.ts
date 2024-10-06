export * from './storage';

import { atom } from 'jotai';

export const platformAtom = atom(await window.electronAPI.getPlatform());

export const searchPanelVisibleAtom = atom(false);
export const repoPanelVisibleAtom = atom(false);

export const searchResultHighlightAtom = atom(false);
