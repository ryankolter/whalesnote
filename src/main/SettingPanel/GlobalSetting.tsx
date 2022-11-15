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

    const editorFontSizeList = useMemo(() => ['12', '13', '14', '15', '16', '17', '18'], []);
    const renderFontSizeList = useMemo(() => ['12', '13', '14', '15', '16', '17', '18'], []);

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
                <PartTitle>配色</PartTitle>
                <SelectArea>
                    <div className="radio-beauty-container">
                        <input
                            type="radio"
                            name="theme"
                            value="light"
                            id="radioNameWhite"
                            className="radio-input"
                            checked={theme === 'light'}
                            onChange={(e: any) => {
                                window.localStorage.setItem('whalenote_theme', e.target.value);
                                setTheme(e.target.value);
                            }}
                        />
                        <label htmlFor="radioNameWhite" className="radio-beauty"></label>
                        <span className="radio-name">浅色</span>
                    </div>
                    <div className="radio-beauty-container">
                        <input
                            type="radio"
                            name="theme"
                            value="dark"
                            id="radioNameDark"
                            className="radio-input"
                            checked={theme === 'dark'}
                            onChange={(e: any) => {
                                window.localStorage.setItem('whalenote_theme', e.target.value);
                                setTheme(e.target.value);
                            }}
                        />
                        <label htmlFor="radioNameDark" className="radio-beauty"></label>
                        <span className="radio-name">深色</span>
                    </div>
                </SelectArea>
            </ChildPart>
            <ChildPart>
                <PartTitle>字号</PartTitle>
                <PartContent>
                    <SelectionOptions
                        title="编辑"
                        currentOption={editorFontSize}
                        optionList={editorFontSizeList}
                        handleOption={changeEditorFontSize}
                    />
                    <SelectionOptions
                        title="预览"
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
    padding: '0 10px 0 50px',
});

const SelectArea = styled.div({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 50px',
});

export default GlobalSetting;
