export * from './storage';

import { MarkdownEditorRef } from '@/main/CenterArea/MarkdownEditor';
import { atom } from 'jotai';
import { RefObject } from 'react';

export const platformAtom = atom(await window.electronAPI.getPlatform());

export const searchPanelVisibleAtom = atom(false);
export const searchListFocusedAtom = atom(false);

export const repoPanelVisibleAtom = atom(false);

export const keySelectActiveAtom = atom(false);
export const keySelectNumArrAtom = atom([]);

export const editorRefAtom = atom<RefObject<MarkdownEditorRef>>(() => ({ current: null }));
