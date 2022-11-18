import styled from '@emotion/styled';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const SwitchModePanel: React.FC<{
    mdRenderState: string;
    setMdRenderState: React.Dispatch<React.SetStateAction<string>>;
}> = ({ mdRenderState, setMdRenderState }) => {
    const [showSwitchMdRenderState, setShowSwitchMdRenderState] = useState(false);

    return (
        <SwitchmodePanelContainer>
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
                        {mdRenderState !== 'hidden' ? (
                            <StateOption
                                onClick={() => {
                                    setMdRenderState('hidden');
                                    setShowSwitchMdRenderState(false);
                                }}
                            >
                                编辑
                            </StateOption>
                        ) : (
                            <></>
                        )}
                        {mdRenderState !== 'half' ? (
                            <StateOption
                                onClick={() => {
                                    setMdRenderState('half');
                                    setShowSwitchMdRenderState(false);
                                }}
                            >
                                编辑+预览
                            </StateOption>
                        ) : (
                            <></>
                        )}
                        {mdRenderState !== 'all' ? (
                            <StateOption
                                onClick={() => {
                                    setMdRenderState('all');
                                    setShowSwitchMdRenderState(false);
                                }}
                            >
                                预览
                            </StateOption>
                        ) : (
                            <></>
                        )}
                    </SwitchMdRenderState>
                ) : (
                    <></>
                )}
            </SwitchMode>
        </SwitchmodePanelContainer>
    );
};

const SwitchmodePanelContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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
    backgroundColor: 'var(--main-btn-bg-color)',
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
    fontSize: '14px',
    borderRadius: '4px',
    zIndex: '4000',
    backgroundColor: 'var(--main-btn-bg-color)',
});

const StateOption = styled.div({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    padding: '5px',
});

export default SwitchModePanel;
