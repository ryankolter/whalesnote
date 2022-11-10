import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

const BottomRow: React.FC<{
    mdRenderState: string;
    setMdRenderState: React.Dispatch<React.SetStateAction<string>>;
}> = ({ mdRenderState, setMdRenderState }) => {
    const { currentRepoKey, currentFolderKey, currentNoteKey } = useContext(GlobalContext);

    const [showSwitchMdRenderState, setShowSwitchMdRenderState] = useState(false);

    return (
        <TopRowContainer>
            <BreakCrumb></BreakCrumb>
            <SwitchMode>
                <SwitchModeBtn
                    onClick={() => {
                        setShowSwitchMdRenderState((_showSwitchModePanel) => !_showSwitchModePanel);
                    }}
                >
                    <ModeNameTag>
                        {mdRenderState === 'hidden' ? <ModeName>编辑</ModeName> : <></>}
                        {mdRenderState === 'half' ? <ModeName>编辑+预览</ModeName> : <></>}
                        {mdRenderState === 'all' ? <ModeName>预览</ModeName> : <></>}
                    </ModeNameTag>
                    <Triangle></Triangle>
                </SwitchModeBtn>
                {showSwitchMdRenderState ? (
                    <SwitchMdRenderState>
                        <StateOption
                            onClick={() => {
                                setMdRenderState('hidden');
                                setShowSwitchMdRenderState(false);
                            }}
                        >
                            编辑
                        </StateOption>
                        <StateOption
                            onClick={() => {
                                setMdRenderState('all');
                                setShowSwitchMdRenderState(false);
                            }}
                        >
                            预览
                        </StateOption>
                        <StateOption
                            onClick={() => {
                                setMdRenderState('half');
                                setShowSwitchMdRenderState(false);
                            }}
                        >
                            编辑+预览
                        </StateOption>
                    </SwitchMdRenderState>
                ) : (
                    <></>
                )}
            </SwitchMode>
        </TopRowContainer>
    );
};

const TopRowContainer = styled.div(
    {
        width: '100%',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 30px 0 30px',
        boxSizing: 'border-box',
        backgroundColor: 'var(--main-bg-color)',
    },
    `
    -webkit-app-region: drag;
`
);

const BreakCrumb = styled.div({
    width: '100%',
    flex: '1',
    minWidth: '0',
    display: 'flex',
    alignItems: 'center',
    zIndex: '1000',
});

const SwitchMode = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row-reverse',
    cursor: 'pointer',
});

const SwitchModeBtn = styled.div({
    display: 'flex',
    alignItems: 'center',
    width: '112px',
    boxSizing: 'border-box',
    height: '30px',
    margin: '1px 5px',
    padding: '0 14px',
    borderRadius: '8px',
    border: '1px solid var(--bottom-btn-border-color)',
    color: 'var(--bottom-btn-text-color)',
    backgroundColor: 'var(--bottom-btn-bg-color)',
});

const ModeNameTag = styled.div({
    flex: '1',
    minWidth: '0',
    display: 'flex',
    justifyContent: 'center',
});

const ModeName = styled.div({
    fontSize: '14px',
    lineHeight: '28px',
});

const Triangle = styled.div({
    display: 'block',
    height: '0',
    width: '0',
    marginLeft: '4px',
    transform: 'translateY(25%)',
    borderBottom: '9px solid transparent',
    borderTop: '10px solid #939395',
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
});

const SwitchMdRenderState = styled.div({
    position: 'absolute',
    top: '31px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '112px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '5px 0',
    borderRadius: '4px',
    zIndex: '4000',
    backgroundColor: 'var(--float-panel-bg-color-no-border)',
});

const StateOption = styled.div({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    padding: '5px',
});

export default BottomRow;
