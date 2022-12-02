import styled from '@emotion/styled';
import { useCallback, useEffect, useRef, useState } from 'react';

const SwitchMode: React.FC<{
    mdRenderState: string;
    setMdRenderState: React.Dispatch<React.SetStateAction<string>>;
}> = ({ mdRenderState, setMdRenderState }) => {
    const switchModeBtnRef = useRef<HTMLDivElement>(null);
    const [showSwitchMdRenderState, setShowSwitchMdRenderState] = useState(false);

    const handleClick = useCallback(
        (event: MouseEvent) => {
            event.preventDefault();
            if (switchModeBtnRef && switchModeBtnRef.current?.contains(event.target as Node)) {
                setShowSwitchMdRenderState((_showSwitchModePanel) => !_showSwitchModePanel);
            } else {
                setShowSwitchMdRenderState(false);
            }
        },
        [setShowSwitchMdRenderState]
    );

    useEffect(() => {
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [handleClick]);

    return (
        <SwitchModePanelContainer>
            <SwitchModeBtn ref={switchModeBtnRef}>
                <ModeNameTag>
                    {mdRenderState === 'hidden' ? <ModeName>编辑</ModeName> : <></>}
                    {mdRenderState === 'half' ? <ModeName>双列</ModeName> : <></>}
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
                            双列
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
        </SwitchModePanelContainer>
    );
};

const SwitchModePanelContainer = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
});

const SwitchModeBtn = styled.div({
    display: 'flex',
    alignItems: 'center',
    width: '80px',
    boxSizing: 'border-box',
    height: '26px',
    margin: '0 5px',
    padding: '0 10px',
    borderRadius: '5px',
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
    lineHeight: '26px',
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
    top: '26px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '80px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '7px 0 5px 0',
    fontSize: '14px',
    borderRadius: '4px',
    zIndex: '4000',
    backgroundColor: 'var(--main-btn-bg-color)',
});

const StateOption = styled.div({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    boxSizing: 'border-box',
    padding: '5px',
    lineHeight: '18px',
});

export default SwitchMode;
