import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export const assistPanelOpenAtom = atom(false);
type AssistPanelTab = 'mobile' | 'model' | 'trash';
export const assistPanelTabAtom = atomWithStorage<AssistPanelTab>('assist_panel_tab', 'mobile');

export const settingPanelOpenAtom = atom(false);
type SettingPanelTab = 'interfaceTab' | 'dataTab' | 'aboutTab';
export const settingPanelTabAtom = atomWithStorage<SettingPanelTab>(
    'setting_panel_tab',
    'interfaceTab',
);

export const themeAtom = atomWithStorage(
    'whalesnote_theme',
    window.electronAPI.shouldUseDarkMode() ? 'dark' : 'light',
);

export const languageAtom = atomWithStorage(
    'whalesnote_language',
    window.electronAPI.getLanguage(),
);

export const editorFontSizeAtom = atomWithStorage('editor_font_size', '15');
export const renderFontSizeAtom = atomWithStorage('render_font_size', '15');
