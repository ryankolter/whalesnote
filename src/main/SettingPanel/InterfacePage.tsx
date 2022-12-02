import { useCallback, useContext, useMemo } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import { SelectionOptions } from '../../components/SelectionOptions';

const InterfacePage: React.FC<{}> = ({}) => {
    const {
        theme,
        setTheme,
        language,
        setLanguage,
        editorFontSize,
        renderFontSize,
        setEditorFontSize,
        setRenderFontSize,
    } = useContext(GlobalContext);

    const themeList = useMemo(() => ['light', 'dark'], []);
    const languageList = useMemo(() => ['zh-CN', 'en-US'], []);
    const editorFontSizeList = useMemo(() => ['12', '13', '14', '15', '16', '17', '18'], []);
    const renderFontSizeList = useMemo(() => ['12', '13', '14', '15', '16', '17', '18'], []);

    const changeTheme = useCallback(
        (value: string) => {
            setTheme(value);
            window.localStorage.setItem('whalenote_theme', value);
        },
        [setEditorFontSize]
    );

    const translateTheme = useCallback((option: string) => {
        if (option === 'light') {
            return '浅色';
        } else if (option === 'dark') {
            return '深色';
        } else {
            return '';
        }
    }, []);

    const changeLanguage = useCallback(
        (value: string) => {
            setLanguage(value);
            window.localStorage.setItem('whalenote_language', value);
        },
        [setEditorFontSize]
    );

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
        [setEditorFontSize]
    );

    const changeRenderFontSize = useCallback(
        (value: string) => {
            setRenderFontSize(value);
            window.localStorage.setItem('render_font_size', value);
        },
        [setRenderFontSize]
    );

    return (
        <DataSpaceContainer>
            <ChildPart>
                <PartTitle>模式</PartTitle>
                <PartContent>
                    <SelectionOptions
                        title="主题色"
                        currentOption={theme}
                        optionList={themeList}
                        handleOption={changeTheme}
                        translateFunc={translateTheme}
                    />
                    <SelectionOptions
                        title="语言"
                        currentOption={language}
                        optionList={languageList}
                        handleOption={changeLanguage}
                        translateFunc={translateLanguage}
                    />
                </PartContent>
            </ChildPart>
            <ChildPart>
                <PartTitle>样式</PartTitle>
                <PartContent>
                    <SelectionOptions
                        title="编辑字号"
                        currentOption={editorFontSize}
                        optionList={editorFontSizeList}
                        handleOption={changeEditorFontSize}
                    />
                    <SelectionOptions
                        title="预览字号"
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
