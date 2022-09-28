const { ipcRenderer } = window.require('electron');
import { useCallback, useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import { MarkdownEditor } from './MarkdownEditor';
import { MarkdownRender } from './MarkdownRender';
import RepoPanel from './RepoPanel';

const CenterArea: React.FC<{
    showAssistantPanel: boolean;
    setShowAssistantPanel: any;
    theme: string;
}> = ({ showAssistantPanel, setShowAssistantPanel, theme }) => {
    console.log('CenterArea render');
    const {
        dataPath,
        dxnote,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        repos_obj,
        currentTitle,
        setNumArray,
        setFocus,
        setBlur,
        keySelect,
        setKeySelect,
    } = useContext(GlobalContext);

    const repos_key = dxnote.repos_key;
    const folders_obj = repos_obj[currentRepoKey]?.folders_obj;
    const notes_obj = repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj;

    const [editorWidth, setEditorWidth] = useState('100%');
    const [renderWidth, setRenderWidth] = useState('0');
    const [renderLeft, setRenderLeft] = useState('100%');

    const [renderPanelState, setRenderPanelState] = useState(
        window.localStorage.getItem('render_panel_state') || 'half'
    );
    const [showSwitchExportPanel, setShowSwitchExportPanel] = useState(false);
    const [showSwitchModePanel, setShowSwitchModePanel] = useState(false);
    const [showAllRepo, setShowAllRepo] = useState(false);
    const [allowHiddenAllRepoViaEnter, setAllowHiddenAllRepoViaEnter] = useState(true);

    const [cursorInRender, setCursorInRender] = useState(false);
    const [editorScrollRatio, setEditorScrollRatio] = useState(0);
    const [renderScrollRatio, setRenderScrollRatio] = useState(0);

    const ExportNote = useCallback(
        (type: string) => {
            switch (type) {
                case 'html':
                    ipcRenderer.send('open-save-dialog', {
                        file_name: currentTitle,
                        file_types: ['html'],
                        response_event_name: 'saveNoteToHtml',
                    });
                    break;
                case 'md':
                    ipcRenderer.send('open-save-dialog', {
                        file_name: currentTitle,
                        file_types: ['md'],
                        response_event_name: 'saveNoteToPng',
                    });
                    break;
                case 'png':
                    ipcRenderer.send('open-save-dialog', {
                        file_name: currentTitle,
                        file_types: ['png'],
                        response_event_name: 'saveNoteToPng',
                    });
                    break;
                case 'default':
                    break;
            }
        },
        [currentTitle]
    );

    const ExportFolder = useCallback((type: string) => {
        switch (type) {
            case 'html':
                ipcRenderer.send('open-directory-dialog', {
                    response_event_name: 'saveFolderToHtml',
                });
                break;
            case 'default':
                break;
        }
    }, []);

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
            setEditorWidth('calc(50% - 6px)');
            setRenderWidth('calc(50% - 6px)');
            setRenderLeft('calc(50%)');
            window.localStorage.setItem('render_panel_state', 'half');
        } else if (renderPanelState === 'all') {
            setEditorWidth('100%');
            setRenderWidth('100%');
            setRenderLeft('0');
            window.localStorage.setItem('render_panel_state', 'all');
        }
    }, [renderPanelState]);

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
            <TopRow>
                <EditorTools></EditorTools>
                <SwitchExport>
                    <ExportBtn
                        className="btn-1-bg-color"
                        onClick={() => {
                            setShowSwitchExportPanel(
                                (_showSwitchExportPanel) => !_showSwitchExportPanel
                            );
                        }}
                    >
                        导出
                    </ExportBtn>
                    {showSwitchExportPanel ? (
                        <SwitchExportPanel className="float-panel-color">
                            <ModeOption
                                onClick={() => {
                                    setShowSwitchExportPanel(false);
                                    ExportFolder('html');
                                }}
                            >
                                Folder to .html
                            </ModeOption>
                            <ModeOption
                                onClick={() => {
                                    setShowSwitchExportPanel(false);
                                    ExportNote('html');
                                }}
                            >
                                Note to.html
                            </ModeOption>
                            <ModeOption
                                onClick={() => {
                                    setShowSwitchExportPanel(false);
                                    ExportNote('png');
                                }}
                            >
                                Note to .png
                            </ModeOption>
                            <ModeOption
                                onClick={() => {
                                    setShowSwitchExportPanel(false);
                                    ExportNote('md');
                                }}
                            >
                                Note to .md
                            </ModeOption>
                        </SwitchExportPanel>
                    ) : (
                        <></>
                    )}
                </SwitchExport>
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
                <RenderPanel topValue={renderLeft} widthValue={renderWidth}>
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
            <BottomRow>
                <BreakCrumb>
                    <CurRepoNameTag
                        className="btn-1-bg-color"
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
                        <AllRepo className="float-panel-color">
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
                        className="btn-1-bg-color"
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
                        <SwitchModePanel className="float-panel-color">
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
});

const TopRow = styled.div({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    height: '58px',
});

const EditorTools = styled.div({
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    minWidth: '0',
});

const SwitchExport = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'row-reverse',
    cursor: 'pointer',
});

const ExportBtn = styled.div({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '32px',
    lintHeight: '32px',
    boxSizing: 'border-box',
    padding: '0 10px',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
});

const SwitchExportPanel = styled.div({
    position: 'absolute',
    top: '34px',
    right: '0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '5px 0',
    borderRadius: '4px',
    zIndex: '4000',
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
    height: '69px',
    display: 'flex',
    alignItems: 'center',
    padding: '6px 10px 0 54px',
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
    borderRadius: '4px',
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
});

const AllRepo = styled.div({
    width: 'calc(100% - 20px)',
    position: 'absolute',
    left: '10px',
    bottom: '48px',
    padding: '10px',
    boxSizing: 'border-box',
    borderRadius: '8px',
    zIndex: '3000',
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
    borderRadius: '4px',
    zIndex: '4000',
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
    cursor: 'pointer',
});

export default CenterArea;
