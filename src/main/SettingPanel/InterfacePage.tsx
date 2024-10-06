import { useCallback, useContext, useMemo } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import { useTranslation } from 'react-i18next';

import styled from '@emotion/styled';

import { SelectionOptions } from '@/components/SelectionOptions';
import { useAtom } from 'jotai';
import { editorFontSizeAtom, renderFontSizeAtom, languageAtom, themeAtom } from '@/atoms';

const InterfacePage: React.FC<{}> = ({}) => {
    const { t } = useTranslation();
    const [editorFontSize, setEditorFontSize] = useAtom(editorFontSizeAtom);
    const [renderFontSize, setRenderFontSize] = useAtom(renderFontSizeAtom);

    const [theme, setTheme] = useAtom(themeAtom);
    const themeList = useMemo(() => ['light', 'dark'], []);

    const [language, setLanguage] = useAtom(languageAtom);
    const languageList = useMemo(() => ['zh-CN', 'en-US'], []);

    const editorFontSizeList = useMemo(() => ['12', '13', '14', '15', '16', '17', '18'], []);
    const renderFontSizeList = useMemo(() => ['12', '13', '14', '15', '16', '17', '18'], []);

    const translateTheme = useCallback((option: string) => {
        if (option === 'light') {
            return t('setting.interface.mode.light');
        } else if (option === 'dark') {
            return t('setting.interface.mode.dark');
        } else {
            return '';
        }
    }, []);

    const translateLanguage = useCallback((option: string) => {
        if (option === 'zh-CN') {
            return '简体中文';
        } else if (option === 'en-US') {
            return 'English';
        } else {
            return '';
        }
    }, []);

    const changeEditorFontSize = useCallback(
        (value: string) => {
            setEditorFontSize(value);
            window.localStorage.setItem('editor_font_size', value);
        },
        [setEditorFontSize],
    );

    const changeRenderFontSize = useCallback(
        (value: string) => {
            setRenderFontSize(value);
            window.localStorage.setItem('render_font_size', value);
        },
        [setRenderFontSize],
    );

    return (
        <DataSpaceContainer>
            <ChildPart>
                <PartTitle>{t('setting.interface.mode.title')}</PartTitle>
                <PartContent>
                    <SelectionOptions
                        title={t('setting.interface.mode.language')}
                        currentOption={language}
                        optionList={languageList}
                        handleOption={setLanguage}
                        translateFunc={translateLanguage}
                    />
                    <SelectionOptions
                        title={t('setting.interface.mode.theme')}
                        currentOption={theme}
                        optionList={themeList}
                        handleOption={setTheme}
                        translateFunc={translateTheme}
                    />
                </PartContent>
            </ChildPart>
            <ChildPart>
                <PartTitle>{t('setting.interface.style.title')}</PartTitle>
                <PartContent>
                    <SelectionOptions
                        title={t('setting.interface.style.edit_font_size')}
                        currentOption={editorFontSize}
                        optionList={editorFontSizeList}
                        handleOption={changeEditorFontSize}
                    />
                    <SelectionOptions
                        title={t('setting.interface.style.preview_font_size')}
                        currentOption={renderFontSize}
                        optionList={renderFontSizeList}
                        handleOption={changeRenderFontSize}
                    />
                </PartContent>
            </ChildPart>
        </DataSpaceContainer>
    );
};

const DataSpaceContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '5px',
});

const ChildPart = styled.div({
    padding: '10px',
});

const PartTitle = styled.div({
    fontSize: '15px',
    fontWeight: '500',
    marginBottom: '15px',
    paddingBottom: '4px',
    borderBottom: '1px solid var(--main-border-color)',
});

const PartContent = styled.div({
    padding: '0 40px 0 40px',
});

export default InterfacePage;
