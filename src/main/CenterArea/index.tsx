import { useCallback, useEffect, useState } from "react";
import cryptoRandomString from "crypto-random-string";
import styled from "@emotion/styled";
import RepoPanel from "./RepoPanel";
import { MarkdownEditor } from "./MarkdownEditor";
import { MarkdownRender } from "./MarkdownRender";
import { relative } from "node:path/win32";

const CenterArea: React.FC<CenterAreaProps> = ({
    data_path,
    repos_key,
    repos_obj,
    folders_key,
    folders_obj,
    notes_key,
    notes_obj,
    currentRepoKey,
    currentFolderKey,
    currentNoteKey,
    content,
    keySelect,
    repoSwitch,
    folderSwitch,
    noteSwitch,
    updateDxnote,
    updateRepos,
    changeNotesAfterNew,
    setDataPath,
    reorderRepo,
    reorderFolder,
    reorderNote,
    setFocus,
    setBlur,
    setKeySelect,
    cursorHead,
    fromPos,
    focus,
    blur,
    theme,
    updateNote,
    renameNote,
    updateCursorHead,
    updateFromPos,
}) => {
    const [editorHeight, setEditorHeight] = useState("calc(100vh - 40px - 20px)");
    const [renderHeight, setRenderHeight] = useState("0");
    const [renderTop, setRenderTop] = useState("calc(100vh - 20px)");

    const [renderPanelState, setRenderPanelState] = useState("hidden");

    let [showAllRepo, setShowAllRepo] = useState(false);
    let [allowHiddenAllRepoViaEnter, setAllowHiddenAllRepoViaEnter] = useState(true);

    const repoNameClickHandler = useCallback(() => {
        setShowAllRepo((showAllRepo) => !showAllRepo);
    }, [showAllRepo, keySelect]);

    useEffect(() => {
        if (renderPanelState === "hidden") {
            setEditorHeight("calc(100vh - 40px - 12px)");
            setRenderHeight("0");
            setRenderTop("calc(100vh - 20px)");
        } else if (renderPanelState === "half") {
            setEditorHeight("calc(50vh - 30px)");
            setRenderHeight("calc(50vh - 30px)");
            setRenderTop("calc(50vh - 20px)");
        } else if (renderPanelState === "all") {
            setEditorHeight("calc(100vh - 40px - 12px)");
            setRenderHeight("calc(100vh - 40px - 10px)");
            setRenderTop("0");
        }
    }, [renderPanelState]);

    const handleKeyDown = useCallback(
        (e: any) => {
            // console.log(e.ctrlKey)
            // console.log(e.shiftKey)
            // console.log(e.altKey)
            // console.log(e.metaKey)
            // console.log(e.keyCode)
            if (process.platform === "darwin") {
                //console.log('这是mac系统');

                // normal number 0 and extra number 0
                if ((e.keyCode === 48 || e.keyCode === 96) && e.metaKey) {
                    if (keySelect) {
                        setKeySelect(false);
                        setFocus(
                            cryptoRandomString({
                                length: 24,
                                type: "alphanumeric",
                            })
                        );
                    } else {
                        setKeySelect(true);
                        // 只有这里才会让它初始化为显示框框
                        setBlur(
                            cryptoRandomString({
                                length: 24,
                                type: "alphanumeric",
                            })
                        );
                    }
                }

                if (e.keyCode === 90 && !e.metaKey && keySelect) {
                    setShowAllRepo((showAllRepo) => !showAllRepo);
                }

                //nromal enter and extra enter
                if (
                    (e.keyCode === 13 || e.keyCode === 108) &&
                    keySelect &&
                    allowHiddenAllRepoViaEnter
                ) {
                    setKeySelect(false);
                    setTimeout(() => {
                        setFocus(
                            cryptoRandomString({
                                length: 24,
                                type: "alphanumeric",
                            })
                        );
                    }, 0);
                }

                if ((e.keyCode === 13 || e.keyCode === 108) && allowHiddenAllRepoViaEnter) {
                    setShowAllRepo(false);
                }

                // esc
                if (e.keyCode === 27) {
                    if (keySelect) {
                        setKeySelect(false);
                    } else {
                        setTimeout(() => {
                            setBlur(
                                cryptoRandomString({
                                    length: 24,
                                    type: "alphanumeric",
                                })
                            );
                        }, 0);
                    }
                    setShowAllRepo(false);
                }
            }
            if (process.platform === "win32" || process.platform === "linux") {
                //console.log('这是windows系统');

                // normal number 0 and extra number 0
                if ((e.keyCode === 48 || e.keyCode === 96) && e.ctrlKey) {
                    if (keySelect) {
                        setKeySelect(false);
                        setFocus(
                            cryptoRandomString({
                                length: 24,
                                type: "alphanumeric",
                            })
                        );
                    } else {
                        setKeySelect(true);
                        setBlur(
                            cryptoRandomString({
                                length: 24,
                                type: "alphanumeric",
                            })
                        );
                    }
                }

                if (e.keyCode === 90 && !e.ctrlKey && keySelect) {
                    setShowAllRepo((showAllRepo) => !showAllRepo);
                }

                //nromal enter and extra enter
                if ((e.keyCode === 13 || e.keyCode === 108) && keySelect) {
                    setKeySelect(false);
                    setTimeout(() => {
                        setFocus(
                            cryptoRandomString({
                                length: 24,
                                type: "alphanumeric",
                            })
                        );
                    }, 0);
                }

                if (e.keyCode === 13 || e.keyCode === 108) {
                    setShowAllRepo(false);
                }

                // esc
                if (e.keyCode === 27) {
                    if (keySelect) {
                        setKeySelect(false);
                    } else {
                        setTimeout(() => {
                            setBlur(
                                cryptoRandomString({
                                    length: 24,
                                    type: "alphanumeric",
                                })
                            );
                        }, 0);
                    }
                    setShowAllRepo(false);
                }
            }
        },
        [keySelect, allowHiddenAllRepoViaEnter, setBlur, setFocus, setKeySelect]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);

    return (
        <CenterAreaContainer>
            <EditorPanel heightValue={editorHeight}>
                <MarkdownEditor
                    data_path={data_path}
                    updateNote={updateNote}
                    renameNote={renameNote}
                    updateCursorHead={updateCursorHead}
                    updateFromPos={updateFromPos}
                    currentRepoKey={currentRepoKey}
                    currentFolderKey={currentFolderKey}
                    currentNoteKey={currentNoteKey}
                    content={content}
                    theme={theme}
                    cursorHead={cursorHead}
                    fromPos={fromPos}
                    focus={focus}
                    blur={blur}
                />
            </EditorPanel>
            <RenderPanel topValue={renderTop} heightValue={renderHeight}>
                {renderPanelState !== "hidden" ? (
                    <MarkdownRender
                        data_path={data_path}
                        currentRepoKey={currentRepoKey}
                        currentFolderKey={currentFolderKey}
                        currentNoteKey={currentNoteKey}
                        content={content}
                        theme={theme}
                    />
                ) : (
                    <></>
                )}
                {renderPanelState === "hidden" ? (
                    <HiddenToHalfBtn
                        onClick={() => {
                            setRenderPanelState("half");
                        }}
                    ></HiddenToHalfBtn>
                ) : (
                    <></>
                )}
                {renderPanelState === "hidden" ? (
                    <HiddenToAllBtn
                        onClick={() => {
                            setRenderPanelState("all");
                        }}
                    ></HiddenToAllBtn>
                ) : (
                    <></>
                )}
                {renderPanelState === "half" ? (
                    <HalfToHiddenBtn
                        onClick={() => {
                            setRenderPanelState("hidden");
                        }}
                    ></HalfToHiddenBtn>
                ) : (
                    <></>
                )}
                {renderPanelState === "half" ? (
                    <HalfToAllBtn
                        onClick={() => {
                            setRenderPanelState("all");
                        }}
                    ></HalfToAllBtn>
                ) : (
                    <></>
                )}
                {renderPanelState === "all" ? (
                    <AllToHalfBtn
                        onClick={() => {
                            setRenderPanelState("half");
                        }}
                    ></AllToHalfBtn>
                ) : (
                    <></>
                )}
                {renderPanelState === "all" ? (
                    <AllToHiddenBtn
                        onClick={() => {
                            setRenderPanelState("hidden");
                        }}
                    ></AllToHiddenBtn>
                ) : (
                    <></>
                )}
            </RenderPanel>
            <BreakCrumb>
                <CurRepoNameTag
                    onClick={() => {
                        repoNameClickHandler();
                    }}
                >
                    <RepoNameLabel>
                        {repos_obj && currentRepoKey && repos_obj[currentRepoKey]
                            ? repos_obj[currentRepoKey].repo_name
                            : ""}
                    </RepoNameLabel>
                </CurRepoNameTag>
                <AllRepo style={{ display: showAllRepo ? "block" : "none" }}>
                    <RepoPanel
                        data_path={data_path}
                        repos_key={repos_key}
                        repos_obj={repos_obj}
                        currentRepoKey={currentRepoKey}
                        currentFolderKey={currentFolderKey}
                        keySelect={keySelect}
                        showAllRepo={showAllRepo}
                        repoSwitch={repoSwitch}
                        folderSwitch={folderSwitch}
                        noteSwitch={noteSwitch}
                        updateDxnote={updateDxnote}
                        updateRepos={updateRepos}
                        changeNotesAfterNew={changeNotesAfterNew}
                        setDataPath={setDataPath}
                        reorderRepo={reorderRepo}
                        setFocus={setFocus}
                        setBlur={setBlur}
                        setKeySelect={setKeySelect}
                        setShowAllRepo={setShowAllRepo}
                        setAllowHiddenAllRepoViaEnter={setAllowHiddenAllRepoViaEnter}
                    />
                </AllRepo>
            </BreakCrumb>
        </CenterAreaContainer>
    );
};

const CenterAreaContainer = styled.div({
    position: "relative",
    flex: "1",
    minWidth: "0",
    margin: "10px 10px 0 0",
});

const EditorPanel = styled.div(
    {
        width: "100%",
    },
    (props: { heightValue: string }) => ({
        height: props.heightValue,
    })
);

const RenderPanel = styled.div(
    {
        position: "absolute",
        width: "100%",
    },
    (props: { topValue: string; heightValue: string }) => ({
        top: props.topValue,
        height: props.heightValue,
    })
);

const HiddenToHalfBtn = styled.div({
    height: "25px",
    width: "40px",
    position: "absolute",
    right: "40px",
    top: "-15px",
    backgroundColor: "#000",
    zIndex: "99999",
});

const HiddenToAllBtn = styled.div({
    height: "40px",
    width: "40px",
    position: "absolute",
    right: "0",
    top: "-30px",
    backgroundColor: "#999",
    zIndex: "99999",
});

const HalfToHiddenBtn = styled.div({
    height: "25px",
    width: "40px",
    position: "absolute",
    right: "40px",
    top: "0",
    backgroundColor: "#000",
    zIndex: "99999",
});

const HalfToAllBtn = styled.div({
    height: "40px",
    width: "40px",
    position: "absolute",
    right: "0",
    top: "-40px",
    backgroundColor: "#999",
    zIndex: "99999",
});

const AllToHalfBtn = styled.div({
    height: "25px",
    width: "40px",
    position: "absolute",
    right: "40px",
    top: "0",
    backgroundColor: "#000",
    zIndex: "99999",
});

const AllToHiddenBtn = styled.div({
    height: "40px",
    width: "40px",
    position: "absolute",
    right: "0",
    top: "0",
    backgroundColor: "#999",
    zIndex: "99999",
});

const BreakCrumb = styled.div({
    width: "100%",
    height: "32px",
    position: "absolute",
    left: "0",
    bottom: "0",
    display: "flex",
    alignItems: "center",
    padding: "4px",
    zIndex: "9999",
});

const CurRepoNameTag = styled.div({
    height: "32px",
    minWidth: "60px",
    lineHeight: "32px",
    borderRadius: "4px",
    backgroundColor: "rgb(58, 64, 76)",
    color: "#939395",
    cursor: "pointer",
    overflow: "hidden !important",
    textOverflow: "ellipsis",
    wordBreak: "break-all",
});

const RepoNameLabel = styled.div({
    flex: 1,
    textAlign: "center",
    fontSize: "16px",
    padding: "0 30px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
});

const AllRepo = styled.div({
    width: "85%",
    position: "absolute",
    bottom: "40px",
    padding: "10px",
    boxSizing: "border-box",
    border: "1px solid rgba(58, 64, 76)",
    borderRadius: "8px",
    backgroundColor: "#2C3033",
    zIndex: "9999",
});

type CenterAreaProps = {
    data_path: string;
    repos_key: string[] | undefined;
    repos_obj: object | undefined;
    folders_key: string[] | undefined;
    folders_obj: object | undefined;
    notes_key: string[] | undefined;
    notes_obj: object | undefined;
    currentRepoKey: string;
    currentFolderKey: string;
    currentNoteKey: string;
    keySelect: boolean;
    repoSwitch: (repoKey: string | undefined) => void;
    folderSwitch: (dataPath: string | null, folderKey: string | undefined) => void;
    noteSwitch: (data_path: string | null, note_key: string | undefined) => void;
    updateDxnote: (data_path: string) => void;
    updateRepos: (action_name: string, obj: object) => void;
    changeNotesAfterNew: (action_name: string, obj: object) => void;
    setDataPath: (path: string) => void;
    reorderRepo: (data_path: string, repo_key: string, new_repos_key: string[]) => void;
    reorderFolder: (data_path: string, repo_key: string, new_folders_key: string[]) => void;
    reorderNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        new_notes_key: string[]
    ) => void;
    setFocus: (focus: string) => void;
    setBlur: (focus: string) => void;
    setKeySelect: (keySelect: boolean) => void;
    content: string;
    cursorHead: number;
    fromPos: number;
    focus: string;
    blur: string;
    theme: string;
    updateNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        content: string
    ) => void;
    renameNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        new_title: string
    ) => void;
    updateCursorHead: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        cursor_head: number
    ) => void;
    updateFromPos: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        from_pos: number
    ) => void;
};

export default CenterArea;
