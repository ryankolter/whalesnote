import { useCallback, useContext, useMemo } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import { SelectionOptions } from '../../components/SelectionOptions';

const GlobalSetting: React.FC<{}> = ({}) => {
    const {
        theme,
        setTheme,
        editorFontSize,
        renderFontSize,
        setEditorFontSize,
        setRenderFontSize,
    } = useContext(GlobalContext);

    const themeList = useMemo(() => ['light', 'dark'], []);
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
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '15px',
    paddingBottom: '4px',
    borderBottom: '1px solid var(--main-border-color)',
});

const PartContent = styled.div({
    padding: '0 30px 0 30px',
});

const SelectArea = styled.div({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 50px',
});

export default GlobalSetting;
