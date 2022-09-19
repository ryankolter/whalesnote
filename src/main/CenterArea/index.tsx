import { useContext, useCallback, useEffect, useState, useRef, createRef } from 'react';
import cryptoRandomString from 'crypto-random-string';
import styled from '@emotion/styled';
import RepoPanel from './RepoPanel';
import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRender } from './MarkdownRender';

import { GlobalContext } from '../../GlobalProvider';

const CenterArea: React.FC<CenterAreaProps> = ({
    keySelect,
    setFocus,
    setBlur,
    setKeySelect,
    showAssistantPanel,
    setShowAssistantPanel,
    focus,
    blur,
    theme,
}) => {
    console.log('CenterArea render');
    const {
        dataPath,
        dxnote,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        repos_obj,
        content,
        setNumArray,
    } = useContext(GlobalContext);

    const repos_key = dxnote.repos_key;
    const folders_obj = repos_obj[currentRepoKey]?.folders_obj;
    const notes_obj = repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj;

    const [editorWidth, setEditorWidth] = useState('100%');
    const [renderWidth, setRenderWidth] = useState('0');
    const [renderLeft, setRenderLeft] = useState('100%');

    const [renderPanelState, setRenderPanelState] = useState('hidden');
    const [showSwitchModePanel, setShowSwitchModePanel] = useState(false);
    const [showAllRepo, setShowAllRepo] = useState(false);
    const [allowHiddenAllRepoViaEnter, setAllowHiddenAllRepoViaEnter] = useState(true);

    const [editorScrollRatio, setEditorScrollRatio] = useState(0);

    const repoNameClickHandler = useCallback(() => {
        setShowAllRepo((_showAllRepo) => !_showAllRepo);
    }, [showAllRepo, keySelect]);

    useEffect(() => {
        if (renderPanelState === 'hidden') {
            setEditorWidth('100%');
            setRenderWidth('0');
            setRenderLeft('100%');
        } else if (renderPanelState === 'half') {
            setEditorWidth('calc(50% - 6px)');
            setRenderWidth('calc(50% - 6px)');
            setRenderLeft('calc(50%)');
        } else if (renderPanelState === 'all') {
            setEditorWidth('100%');
            setRenderWidth('100%');
            setRenderLeft('0');
        }
    }, [renderPanelState]);

    useEffect(() => {
        if (showAssistantPanel) {
            setRenderPanelState('hidden');
        }
    }, [showAssistantPanel]);

    const handleKeyDown = useCallback(
        (e: any) => {
            // console.log(e.ctrlKey)
            // console.log(e.shiftKey)
            // console.log(e.altKey)
            // console.log(e.metaKey)
            // console.log(e.keyCode)
            if (process.platform === 'darwin') {
                // console.log('这是mac系统');

                // normal number 0 and extra number 0
                if ((e.keyCode === 48 || e.keyCode === 96) && e.metaKey) {
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
                        // 只有这里才会让它初始化为显示框框
                        setBlur(
                            cryptoRandomString({
                                length: 24,
                                type: 'alphanumeric',
                            })
                        );
                    }
                }

                if (e.keyCode === 90 && !e.metaKey && keySelect) {
                    setShowAllRepo((_showAllRepo) => !_showAllRepo);
                }

                //nromal enter and extra enter
                if (
                    (e.keyCode === 13 || e.keyCode === 108) &&
                    keySelect &&
                    allowHiddenAllRepoViaEnter
                ) {
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

                if ((e.keyCode === 13 || e.keyCode === 108) && allowHiddenAllRepoViaEnter) {
                    setShowAllRepo(false);
                }

                // esc
                if (e.keyCode === 27) {
                    if (keySelect) {
                        setKeySelect(false);
                        setNumArray([]);
                    } else {
                        setTimeout(() => {
                            setBlur(
                                cryptoRandomString({
                                    length: 24,
                                    type: 'alphanumeric',
                                })
                            );
                        }, 0);
                    }
                    setShowAllRepo(false);
                }

                //switch among hidden, half, all
                if ((e.keyCode === 191 || e.keyCode === 47) && e.metaKey) {
                    if (renderPanelState === 'hidden') {
                        setRenderPanelState('half');
                    } else if (renderPanelState === 'half') {
                        setRenderPanelState('all');
                    } else if (renderPanelState === 'all') {
                        setRenderPanelState('hidden');
                    }
                }
            }
            if (process.platform === 'win32' || process.platform === 'linux') {
                //console.log('这是windows系统');

                // normal number 0 and extra number 0
                if ((e.keyCode === 48 || e.keyCode === 96) && e.ctrlKey) {
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
                        setBlur(
                            cryptoRandomString({
                                length: 24,
                                type: 'alphanumeric',
                            })
                        );
                    }
                }

                if (e.keyCode === 90 && !e.ctrlKey && keySelect) {
                    setShowAllRepo((_showAllRepo) => !_showAllRepo);
                }

                //nromal enter and extra enter
                if ((e.keyCode === 13 || e.keyCode === 108) && keySelect) {
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

                if (e.keyCode === 13 || e.keyCode === 108) {
                    setShowAllRepo(false);
                }

                // esc
                if (e.keyCode === 27) {
                    if (keySelect) {
                        setKeySelect(false);
                        setNumArray([]);
                    } else {
                        setTimeout(() => {
                            setBlur(
                                cryptoRandomString({
                                    length: 24,
                                    type: 'alphanumeric',
                                })
                            );
                        }, 0);
                    }
                    setShowAllRepo(false);
                }

                //switch among hidden, half, all
                if ((e.keyCode === 191 || e.keyCode === 47) && e.ctrlKey) {
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

    return dataPath ? (
        <CenterAreaContainer>
            <MarkdownArea>
                <EditorPanel widthValue={editorWidth}>
                    <MarkdownEditor
                        theme={theme}
                        focus={focus}
                        blur={blur}
                        renderPanelState={renderPanelState}
                        setKeySelect={setKeySelect}
                        setEditorScrollRatio={setEditorScrollRatio}
                    />
                </EditorPanel>
                <RenderPanel topValue={renderLeft} widthValue={renderWidth}>
                    {renderPanelState !== 'hidden' ? (
                        <MarkdownRender
                            content={content}
                            editorScrollRatio={editorScrollRatio}
                            theme={theme}
                            renderPanelState={renderPanelState}
                        />
                    ) : (
                        <></>
                    )}
                </RenderPanel>
            </MarkdownArea>
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
                    <GreaterTag>&gt;</GreaterTag>
                    <CurNoteNameTag>
                        <NoteNameLabel>
                            {notes_obj && currentNoteKey && notes_obj[currentNoteKey]
                                ? notes_obj[currentNoteKey].title
                                : ''}
                        </NoteNameLabel>
                    </CurNoteNameTag>
                    {showAllRepo ? (
                        <AllRepo>
                            <RepoPanel
                                repos_key={repos_key}
                                keySelect={keySelect}
                                showAllRepo={showAllRepo}
                                setFocus={setFocus}
                                setBlur={setBlur}
                                setKeySelect={setKeySelect}
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
                            setShowSwitchModePanel((_showSwitchModePanel) => !_showSwitchModePanel);
                        }}
                    >
                        <ModeNameTag>
                            {renderPanelState === 'hidden' ? <ModeName>编辑</ModeName> : <></>}
                            {renderPanelState === 'half' ? <ModeName>编辑+预览</ModeName> : <></>}
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
                <AssistantActive>
                    <AssistantActiveBtn
                        onClick={() => {
                            setShowAssistantPanel(
                                (_showAssistantPanel: boolean) => !_showAssistantPanel
                            );
                        }}
                    >
                        {showAssistantPanel ? <div>&gt;</div> : <div>&lt;</div>}
                    </AssistantActiveBtn>
                </AssistantActive>
            </BottomRow>
        </CenterAreaContainer>
    ) : (
        <></>
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
    padding: '12px 15px 8px 12px',
});

const MarkdownArea = styled.div({
    position: 'relative',
    flex: '1',
    minHeight: '0',
    width: '100%',
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
    (props: { topValue: string; widthValue: string }) => ({
        left: props.topValue,
        width: props.widthValue,
    })
);

const BottomRow = styled.div({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '10px 10px 0 0',
});

const BreakCrumb = styled.div({
    width: '100%',
    flex: '1',
    minWidth: '0',
    display: 'flex',
    alignItems: 'center',
    zIndex: '9999',
});

const CurRepoNameTag = styled.div({
    position: 'relative',
    height: '32px',
    minWidth: '60px',
    lineHeight: '32px',
    borderRadius: '4px',
    backgroundColor: 'rgb(58, 64, 76)',
    color: '#939395',
    cursor: 'pointer',
    overflow: 'hidden !important',
    textOverflow: 'ellipsis',
    wordBreak: 'break-all',
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
    padding: '0 30px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const CurFolderNameTag = styled.div({
    height: '32px',
    lineHeight: '32px',
    color: '#939395',
    overflow: 'hidden !important',
    textOverflow: 'ellipsis',
    wordBreak: 'break-all',
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
    color: '#939395',
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
    color: '#939395',
    padding: '0 15px',
});

const AllRepo = styled.div({
    width: 'calc(100% - 20px)',
    position: 'absolute',
    left: '10px',
    bottom: '48px',
    padding: '10px',
    boxSizing: 'border-box',
    border: '1px solid rgb(58, 64, 76)',
    borderRadius: '8px',
    backgroundColor: '#2C3033',
    zIndex: '9999',
});

const SwitchMode = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row-reverse',
    cursor: 'pointer',
});

const SwitchModeBtn = styled.div({
    display: 'flex',
    width: '110px',
    boxSizing: 'border-box',
    height: '30px',
    margin: '1px 5px',
    padding: '0 14px',
    backgroundColor: 'rgb(58, 64, 76)',
    borderRadius: '14px',
});

const ModeNameTag = styled.div({
    flex: '1',
    minWidth: '0',
    display: 'flex',
    justifyContent: 'center',
});

const ModeName = styled.div({
    fontSize: '14px',
    lineHeight: '30px',
    color: '#939395',
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
    bottom: '34px',
    left: 'calc(50% - 50px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '5px 0',
    color: '#939395',
    backgroundColor: '#2C3033',
    border: '1px solid rgba(58, 64, 76)',
    borderRadius: '4px',
    zIndex: '99999',
});

const ModeOption = styled.div({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    padding: '5px',
});

const AssistantActive = styled.div({
    width: '50px',
    height: '40px',
    display: 'flex',
    flexDirection: 'row-reverse',
});

const AssistantActiveBtn = styled.div({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '36px',
    height: '36px',
    lintHeight: '36px',
    boxSizing: 'border-box',
    margin: '2px 5px',
    border: '1px solid rgba(58, 64, 76)',
    borderRadius: '18px',
    fontSize: '18px',
    color: '#939395',
    cursor: 'pointer',
});

type CenterAreaProps = {
    keySelect: boolean;
    showAssistantPanel: boolean;
    setFocus: (focus: string) => void;
    setBlur: (focus: string) => void;
    setKeySelect: (keySelect: boolean) => void;
    setShowAssistantPanel: any;
    focus: string;
    blur: string;
    theme: string;
};

export default CenterArea;
