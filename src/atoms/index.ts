export * from './storage';

import { MdEditorRef } from '@/interface';
import { atom } from 'jotai';
import { RefObject } from 'react';

export const platformAtom = atom(await window.electronAPI.getPlatform());

export const searchPanelVisibleAtom = atom(false);
export const searchListFocusedAtom = atom(false);

export const repoPanelVisibleAtom = atom(false);

export const keySelectActiveAtom = atom(false);
export const keySelectNumArrAtom = atom([]);

export const editorRefAtom = atom<RefObject<MdEditorRef>>(() => ({ current: null }));
