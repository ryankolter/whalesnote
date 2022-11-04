import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import RepoPanel from './RepoPanel';

const BottomRow: React.FC<{
    mdRenderState: string;
    setMdRenderState: React.Dispatch<React.SetStateAction<string>>;
}> = ({ mdRenderState, setMdRenderState }) => {
    const {
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        whalenote,
        theme,
        platformName,
        setNumArray,
        setFocus,
        setBlur,
        keySelect,
        setKeySelect,
    } = useContext(GlobalContext);

    const folders_obj = useMemo(() => {
        return whalenote.repos_obj ? whalenote.repos_obj[currentRepoKey]?.folders_obj : undefined;
    }, [whalenote, currentRepoKey]);

    const [showSwitchMdRenderState, setShowSwitchMdRenderState] = useState(false);
    const [showAllRepo, setShowAllRepo] = useState(false);

    const handleKeyDown = useCallback(
        async (e: any) => {
            if (platformName === 'darwin' || platformName === 'win32' || platformName === 'linux') {
                const modKey = platformName === 'darwin' ? e.metaKey : e.ctrlKey;

                if (e.keyCode === 90 && !modKey && keySelect) {
                    setShowAllRepo((_showAllRepo) => !_showAllRepo);
                }

                //normal enter and extra enter
                if (e.key === 'Enter' && keySelect) {
                    setKeySelect(false);
                    setNumArray([]);
                    if (currentNoteKey) {
                        setTimeout(() => {
                            setFocus(
                                cryptoRandomString({
                                    length: 24,
                                    type: 'alphanumeric',
                                })
                            );
                        }, 0);
                    }
                }

                // esc
                if (e.key === 'Escape') {
                    if (keySelect) {
                        setKeySelect(false);
                        setNumArray([]);
                    }
                    setShowAllRepo(false);
                }
            }
        },
        [currentNoteKey, keySelect, setBlur, setFocus, setKeySelect]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <BottomRowContainer>
            <BreakCrumb>
                <CurRepoNameTag
                    onClick={() => {
                        setShowAllRepo((_showAllRepo) => !_showAllRepo);
                    }}
                >
                    <RepoNameLabel>
                        {whalenote.repos_obj &&
                        currentRepoKey &&
                        whalenote.repos_obj[currentRepoKey]
                            ? whalenote.repos_obj[currentRepoKey].repo_name
                            : ''}
                    </RepoNameLabel>
                    {keySelect ? <RepoPanelKeyTab>Z</RepoPanelKeyTab> : <></>}
                </CurRepoNameTag>
                <GreaterTag>&gt;</GreaterTag>
                <CurFolderNameTag>
                    <FolderNameLabel>
                        {folders_obj && currentFolderKey && folders_obj[currentFolderKey]
                            ? folders_obj[currentFolderKey].folder_name
                            : ''}
                    </FolderNameLabel>
                </CurFolderNameTag>
                {showAllRepo ? (
                    <AllRepo>
                        <RepoPanel setShowAllRepo={setShowAllRepo} />
                    </AllRepo>
                ) : (
                    <></>
                )}
            </BreakCrumb>
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
        </BottomRowContainer>
    );
};

const BottomRowContainer = styled.div({
    width: '100%',
    height: '66px',
    display: 'flex',
    alignItems: 'center',
    padding: '0 30px 0 30px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--bottom-main-bg-color)',
    borderTop: '1px solid var(--main-border-color)',
});

const BreakCrumb = styled.div({
    width: '100%',
    flex: '1',
    minWidth: '0',
    display: 'flex',
    alignItems: 'center',
    zIndex: '1000',
});

const CurRepoNameTag = styled.div({
    position: 'relative',
    height: '32px',
    minWidth: '60px',
    lineHeight: '32px',
    borderRadius: '5px',
    cursor: 'pointer',
    overflow: 'hidden !important',
    textOverflow: 'ellipsis',
    wordBreak: 'break-all',
    color: 'var(--main-text-color)',
    backgroundColor: 'var(--main-selected-bg-color)',
});

const RepoPanelKeyTab = styled.div({
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '12px',
    height: '14px',
    lineHeight: '14px',
    fontSize: '14px',
    letterSpacing: '1px',
});

const RepoNameLabel = styled.div({
    flex: 1,
    fontSize: '16px',
    padding: '0 25px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const CurFolderNameTag = styled.div({
    height: '32px',
    lineHeight: '32px',
    overflow: 'hidden !important',
    textOverflow: 'ellipsis',
    wordBreak: 'break-all',
    color: 'var(--main-text-color)',
});

const FolderNameLabel = styled.div({
    flex: 1,
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const CurNoteNameTag = styled.div({
    height: '32px',
    lineHeight: '32px',
    overflow: 'hidden !important',
    textOverflow: 'ellipsis',
    wordBreak: 'break-all',
});

const NoteNameLabel = styled.div({
    flex: 1,
    fontSize: '14px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const GreaterTag = styled.div({
    padding: '0 15px',
    color: 'var(--main-text-color)',
});

const AllRepo = styled.div({
    width: 'calc(100% - 52px)',
    position: 'absolute',
    left: '24px',
    bottom: '65px',
    padding: '10px',
    boxSizing: 'border-box',
    borderRadius: '8px',
    zIndex: '3000',
    border: '1px solid var(--float-panel-border-color)',
    backgroundColor: 'var(--float-panel-bg-color)',
});

const SwitchMode = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row-reverse',
    cursor: 'pointer',
});

const SwitchModeBtn = styled.div({
    display: 'flex',
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
    borderBottom: '9px solid #939395',
    borderTop: '10px solid transparent',
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
});

const SwitchMdRenderState = styled.div({
    position: 'absolute',
    bottom: '31px',
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
