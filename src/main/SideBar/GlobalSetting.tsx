import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

const GlobalSetting: React.FC<{
    closeAssistantPanel: () => void;
}> = ({ closeAssistantPanel }) => {
    const { theme, setTheme } = useContext(GlobalContext);

    return (
        <DataSpaceContainer>
            <TopRow>
                <CloseDataSpaceBtn
                    onClick={() => {
                        closeAssistantPanel();
                    }}
                >
                    x
                </CloseDataSpaceBtn>
            </TopRow>
            <ChildPart>
                <PartTitle>主题</PartTitle>
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
                <PartTitle>字体</PartTitle>
                <div>编辑框</div>
                <div>预览框</div>
            </ChildPart>
            <ChildPart>
                <PartTitle>同步</PartTitle>
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

const TopRow = styled.div({
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'flex-end',
});

const CloseDataSpaceBtn = styled.div({
    width: '20px',
    height: '20px',
    lineHeight: '18px',
    fontSize: '20px',
    padding: '5px 10px',
    margin: '0 0 2px 0',
    cursor: 'pointer',
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

const SelectArea = styled.div({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0 50px',
});

export default GlobalSetting;
