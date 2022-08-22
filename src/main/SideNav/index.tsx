import styled from "@emotion/styled";
import cryptoRandomString from "crypto-random-string";
import RepoPanel from "./RepoPanel";
import DirectoryBtn from "./DirectoryBtn";
import FolderList from "./FolderList";
import NoteList from "./NoteList";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
const { ipcRenderer } = window.require("electron");

const SideNav: React.FC<SideNavProps> = ({
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
}) => {
    let [folderWidth, setFolderWidth] = useState(130);
    let [noteWidth, setNoteWidth] = useState(200);

    let [showAllRepo, setShowAllRepo] = useState(false);
    let [allowHiddenAllRepoViaEnter, setAllowHiddenAllRepoViaEnter] = useState(true);

    useMemo(() => {
        ipcRenderer.on("selectedFolder", (event: any, path: string) => {
            window.localStorage.setItem("dxnote_data_path", path);
            setDataPath(path);
        });
    }, [setDataPath]);

    const addDataPath = () => {
        ipcRenderer.send("open-directory-dialog");
    };

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

    const repoNameClickHandler = useCallback(() => {
        setShowAllRepo((showAllRepo) => !showAllRepo);
    }, [showAllRepo, keySelect]);

    return (
        <LeftPanel>
            <ToolBar>
                <SearchInput placeholder='搜索' />
            </ToolBar>
            <SelectArea>
                <CurRepoNameTag
                    repoNameTagWidth={folderWidth + noteWidth}
                    onClick={() => {
                        repoNameClickHandler();
                    }}
                >
                    <RepoNameLabel>
                        {repos_obj && currentRepoKey && repos_obj[currentRepoKey]
                            ? repos_obj[currentRepoKey].repo_name
                            : ""}
                    </RepoNameLabel>
                    <RepoSwitchBtn>更多&gt;&gt;</RepoSwitchBtn>
                </CurRepoNameTag>
                <AllRepo
                    cutWidth={folderWidth + noteWidth}
                    style={{ display: showAllRepo ? "block" : "none" }}
                >
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
                <List>
                    <FolderList
                        data_path={data_path}
                        folders_key={folders_key}
                        folders_obj={folders_obj}
                        currentRepoKey={currentRepoKey}
                        currentFolderKey={currentFolderKey}
                        keySelect={keySelect}
                        repoSwitch={repoSwitch}
                        folderSwitch={folderSwitch}
                        noteSwitch={noteSwitch}
                        updateRepos={updateRepos}
                        changeNotesAfterNew={changeNotesAfterNew}
                        reorderFolder={reorderFolder}
                        setFocus={setFocus}
                        width={folderWidth}
                    />
                    <NoteList
                        data_path={data_path}
                        notes_key={notes_key}
                        notes_obj={notes_obj}
                        currentRepoKey={currentRepoKey}
                        currentFolderKey={currentFolderKey}
                        currentNoteKey={currentNoteKey}
                        keySelect={keySelect}
                        repoSwitch={repoSwitch}
                        folderSwitch={folderSwitch}
                        noteSwitch={noteSwitch}
                        updateRepos={updateRepos}
                        changeNotesAfterNew={changeNotesAfterNew}
                        reorderNote={reorderNote}
                        setFocus={setFocus}
                        setKeySelect={setKeySelect}
                        width={noteWidth}
                    />
                </List>
            </SelectArea>
            <RepoBar>
                <DirectoryBtnArea>
                    {data_path ? (
                        <DirectoryBtn
                            data_path={data_path}
                            addDataPath={addDataPath}
                            panelWidth={folderWidth + noteWidth}
                        />
                    ) : (
                        <PathAddBtn onClick={addDataPath}>添加目录</PathAddBtn>
                    )}
                </DirectoryBtnArea>
            </RepoBar>
        </LeftPanel>
    );
};

const LeftPanel = styled.div({
    display: "flex",
    flexDirection: "column",
    height: "100%",
});

const ToolBar = styled.div({
    margin: "4px 16px 0 16px",
});

const SearchInput = styled.input({
    border: "none",
    outline: "none",
    flex: "1",
    fontSize: "14px",
    lineHeight: "20px",
    letterSpacing: "1px",
    width: "100%",
    padding: "10px",
});

const SelectArea = styled.div({
    position: "relative",
    display: "flex",
    flexDirection: "column",
    flex: "1",
    minHeight: "0",
    margin: "4px 10px 0 10px",
});

const RepoBar = styled.div({
    display: "flex",
    justifyContent: "space-between",
});

const DirectoryBtnArea = styled.div();

const PathAddBtn = styled.div(
    {
        position: "relative",
        height: "32px",
        lineHeight: "32px",
        display: "flex",
        alignItem: "center",
        justifyContent: "center",
        padding: "0 10px",
        marginTop: "8px",
        color: "#939395",
        backgroundColor: "rgb(58, 64, 76)",
        cursor: "pointer",
    },
    `
  &::before {
      position: absolute;
      top: 0px;
      right: -32px;
      display: block;
      content: '';
      border-bottom: 16px solid rgb(58, 64, 76);
      border-top: 16px solid transparent;
      border-left: 16px solid rgb(58, 64, 76);
      border-right: 16px solid transparent;
      cursor: pointer;
  }
`
);

const CurRepoNameTag = styled.div(
    {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "40px",
        minWidth: "60px",
        lineHeight: "40px",
        paddingRight: "20px",
        borderRadius: "4px",
        backgroundColor: "rgb(58, 64, 76)",
        color: "#939395",
        cursor: "pointer",
        overflow: "hidden !important",
        textOverflow: "ellipsis",
        wordBreak: "break-all",
    },
    (props: { repoNameTagWidth: number }) => ({
        width: props.repoNameTagWidth,
    })
);

const RepoNameLabel = styled.div({
    flex: 1,
    textAlign: "center",
    fontSize: "16px",
    padding: "0 30px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
});

const RepoSwitchBtn = styled.div({
    height: "40px",
    lineHeight: "40px",
    fontSize: "14px",
});

const AllRepo = styled.div(
    {
        position: "absolute",
        top: "-40px",
        padding: "10px",
        boxSizing: "border-box",
        border: "1px solid rgba(58, 64, 76)",
        borderRadius: "8px",
        backgroundColor: "#2C3033",
        zIndex: "9999",
    },
    (props: { cutWidth: number }) => ({
        left: "calc( " + props.cutWidth + "px + 15px)",
        width: "calc( 100vw - " + props.cutWidth + "px - 35px)",
    })
);

const List = styled.div({
    display: "flex",
    alignItem: "center",
    flex: "1",
    minHeight: "0",
    borderBottomLeftRadius: "4px",
    padding: "0 0 0 5px",
});

type SideNavProps = {
    data_path: string;
    repos_key: string[] | undefined;
    repos_obj: object | undefined;
    folders_key: string[] | undefined;
    folders_obj: object | undefined;
    notes_key: string[] | undefined;
    notes_obj: object | undefined;
    currentRepoKey: string | undefined;
    currentFolderKey: string | undefined;
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
};

export default SideNav;
