import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRender } from './MarkdownRender';
import RepoPanel from './RepoPanel';

const CenterArea: React.FC<{
    theme: string;
}> = ({ theme }) => {
    const {
        dataPathChangeFlag,
        whalenote,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        repos_obj,
        setNumArray,
        setFocus,
        setBlur,
        keySelect,
        setKeySelect,
    } = useContext(GlobalContext);

    const repos_key = whalenote.repos_key;
    const folders_obj = repos_obj[currentRepoKey]?.folders_obj;

    const [editorWidth, setEditorWidth] = useState('100%');
    const [renderWidth, setRenderWidth] = useState('0');
    const [renderLeft, setRenderLeft] = useState('100%');

    const [renderPanelState, setRenderPanelState] = useState(
        window.localStorage.getItem('render_panel_state') || 'half'
    );
    const [showSwitchModePanel, setShowSwitchModePanel] = useState(false);
    const [showAllRepo, setShowAllRepo] = useState(false);
    const [allowHiddenAllRepoViaEnter, setAllowHiddenAllRepoViaEnter] = useState(true);

    const [cursorInRender, setCursorInRender] = useState(false);
    const [editorScrollRatio, setEditorScrollRatio] = useState(0);
    const [renderScrollRatio, setRenderScrollRatio] = useState(0);

    const outerRef = useRef<HTMLDivElement>(null);

    const repoNameClickHandler = useCallback(() => {
        setShowAllRepo((_showAllRepo) => !_showAllRepo);
    }, [showAllRepo, keySelect]);

    useEffect(() => {
        if (renderPanelState === 'hidden') {
            setEditorWidth('100%');
            setRenderWidth('0');
            setRenderLeft('100%');
            window.localStorage.setItem('render_panel_state', 'hidden');
        } else if (renderPanelState === 'half') {
            setEditorWidth('calc(50% - 15px)');
            setRenderWidth('calc(50% - 15px)');
            setRenderLeft('calc(50% + 15px)');
            window.localStorage.setItem('render_panel_state', 'half');
        } else if (renderPanelState === 'all') {
            setEditorWidth('100%');
            setRenderWidth('calc(100% - 24px)');
            setRenderLeft('24px');
            window.localStorage.setItem('render_panel_state', 'all');
        }
    }, [renderPanelState]);

    const handleKeyDown = useCallback(
        (e: any) => {
            if (
                process.platform === 'darwin' ||
                process.platform === 'win32' ||
                process.platform === 'linux'
            ) {
                const modKey = process.platform === 'darwin' ? e.metaKey : e.ctrlKey;

                // normal number 0 and extra number 0
                if ((e.keyCode === 48 || e.keyCode === 96) && modKey) {
                    if (keySelect) {
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
                    } else {
                        setKeySelect(true);
                        setNumArray([]);
                        //只有这里才会让它初始化为显示框框
                        setBlur(
                            cryptoRandomString({
                                length: 24,
                                type: 'alphanumeric',
                            })
                        );
                    }
                }

                if (e.keyCode === 90 && !modKey && keySelect) {
                    setShowAllRepo((_showAllRepo) => !_showAllRepo);
                }

                //normal enter and extra enter
                if (e.key === 'Enter' && keySelect && allowHiddenAllRepoViaEnter) {
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

                if (e.key === 'Enter' && allowHiddenAllRepoViaEnter) {
                    setShowAllRepo(false);
                }

                // esc
                if (e.key === 'Escape') {
                    if (keySelect) {
                        setKeySelect(false);
                        setNumArray([]);
                    }
                    setShowAllRepo(false);
                }

                //switch among hidden, half, all
                if (e.key === '/' && modKey && !e.shiftKey) {
                    if (renderPanelState === 'hidden') {
                        setRenderPanelState('half');
                    } else if (renderPanelState === 'half') {
                        setRenderPanelState('all');
                    } else if (renderPanelState === 'all') {
                        setRenderPanelState('hidden');
                    }
                }
            }
        },
        [
            currentNoteKey,
            keySelect,
            allowHiddenAllRepoViaEnter,
            renderPanelState,
            setBlur,
            setFocus,
            setKeySelect,
            setRenderPanelState,
        ]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <CenterAreaContainer>
            <TopRow>
                <EditorTools></EditorTools>
            </TopRow>
            <MarkdownArea>
                <EditorPanel widthValue={editorWidth}>
                    <MarkdownEditor
                        theme={theme}
                        cursorInRender={cursorInRender}
                        renderScrollRatio={renderScrollRatio}
                        renderPanelState={renderPanelState}
                        setEditorScrollRatio={setEditorScrollRatio}
                    />
                </EditorPanel>
                <RenderPanel leftValue={renderLeft} widthValue={renderWidth}>
                    {renderPanelState !== 'hidden' ? (
                        <MarkdownRender
                            cursorInRender={cursorInRender}
                            setCursorInRender={setCursorInRender}
                            editorScrollRatio={editorScrollRatio}
                            theme={theme}
                            renderPanelState={renderPanelState}
                            setRenderScrollRatio={setRenderScrollRatio}
                        />
                    ) : (
                        <></>
                    )}
                </RenderPanel>
            </MarkdownArea>
            {dataPathChangeFlag > 0 ? (
                <BottomRow>
                    <BreakCrumb>
                        <CurRepoNameTag
                            onClick={() => {
                                repoNameClickHandler();
                            }}
                        >
                            <RepoNameLabel>
                                {repos_obj && currentRepoKey && repos_obj[currentRepoKey]
                                    ? repos_obj[currentRepoKey].repo_name
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
                                <RepoPanel
                                    repos_key={repos_key}
                                    showAllRepo={showAllRepo}
                                    setShowAllRepo={setShowAllRepo}
                                    setAllowHiddenAllRepoViaEnter={setAllowHiddenAllRepoViaEnter}
                                />
                            </AllRepo>
                        ) : (
                            <></>
                        )}
                    </BreakCrumb>
                    <SwitchMode>
                        <SwitchModeBtn
                            onClick={() => {
                                setShowSwitchModePanel(
                                    (_showSwitchModePanel) => !_showSwitchModePanel
                                );
                            }}
                        >
                            <ModeNameTag>
                                {renderPanelState === 'hidden' ? <ModeName>编辑</ModeName> : <></>}
                                {renderPanelState === 'half' ? (
                                    <ModeName>编辑+预览</ModeName>
                                ) : (
                                    <></>
                                )}
                                {renderPanelState === 'all' ? <ModeName>预览</ModeName> : <></>}
                            </ModeNameTag>
                            <Triangle></Triangle>
                        </SwitchModeBtn>
                        {showSwitchModePanel ? (
                            <SwitchModePanel>
                                <ModeOption
                                    onClick={() => {
                                        setRenderPanelState('hidden');
                                        setShowSwitchModePanel(false);
                                    }}
                                >
                                    编辑
                                </ModeOption>
                                <ModeOption
                                    onClick={() => {
                                        setRenderPanelState('all');
                                        setShowSwitchModePanel(false);
                                    }}
                                >
                                    预览
                                </ModeOption>
                                <ModeOption
                                    onClick={() => {
                                        setRenderPanelState('half');
                                        setShowSwitchModePanel(false);
                                    }}
                                >
                                    编辑+预览
                                </ModeOption>
                            </SwitchModePanel>
                        ) : (
                            <></>
                        )}
                    </SwitchMode>
                </BottomRow>
            ) : (
                <></>
            )}
        </CenterAreaContainer>
    );
};

const CenterAreaContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    flex: '1',
    minWidth: '0',
    height: '100%',
    boxSizing: 'border-box',
});

const TopRow = styled.div(
    {
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        height: '49px',
        borderBottom: '1px solid var(--main-border-color)',
        paddingRight: '30px',
        boxSizing: 'border-box',
    },
    `
    -webkit-app-region: drag;
`
);

const EditorTools = styled.div({
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    minWidth: '0',
});

const MarkdownArea = styled.div({
    position: 'relative',
    flex: '1',
    minHeight: '0',
    width: 'calc(100% - 29px)',
    paddingLeft: '24px',
    boxSizing: 'border-box',
});

const EditorPanel = styled.div(
    {
        height: '100%',
    },
    (props: { widthValue: string }) => ({
        width: props.widthValue,
    })
);

const RenderPanel = styled.div(
    {
        position: 'absolute',
        top: '0',
        height: 'calc(100% + 2px)',
        boxSizing: 'border-box',
    },
    (props: { leftValue: string; widthValue: string }) => ({
        left: props.leftValue,
        width: props.widthValue,
    })
);

const BottomRow = styled.div({
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

const SwitchModePanel = styled.div({
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

const ModeOption = styled.div({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    padding: '5px',
});

export default CenterArea;
