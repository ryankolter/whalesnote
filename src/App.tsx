import { useState, useMemo, useCallback, useRef } from "react";
import styled from "@emotion/styled";
import cryptoRandomString from "crypto-random-string";
import MiniSearch from "minisearch";
import nodejieba from "nodejieba";

import { useRepos } from "./lib/useRepos";
import { useNotes } from "./lib/useNotes";
import { useDxnote } from "./lib/useDxnote";

import initData from "./lib/init";

import SideNav from "./main/SideNav";
import CenterArea from "./main/CenterArea/index";

import WaitingMask from "./components/WaitingMask";

import SocketServerBtn from "./components/socketServerBtn";

import SocketClientBtn from "./socketClientBtn";
import "./resources/my_highlight_styles/editor/solarized-dark.min.css";
import "./resources/my_highlight_styles/preview/solarized-dark.min.css";
import { useEditPos } from "./lib/useEditPos";
import { useEditLine } from "./lib/useEditLine";
import AssistantPanel from "./main/AssistantPanel";

const { ipcRenderer } = window.require("electron");

const App = () => {
    const [dataPath, setDataPath] = useState<string>(
        window.localStorage.getItem("dxnote_data_path") || ""
    );
    const [focus, setFocus] = useState("");
    const [blur, setBlur] = useState("");
    const [theme, setTheme] = useState("dark");
    const [keySelect, setKeySelect] = useState(false);
    const [showAddPathTips, setShowAddPathTips] = useState(false);
    const [showAssistantPanel, setShowAssistantPanel] = useState(false);
    const [
        dxnote,
        {
            switchRepo,
            switchFolder,
            switchNote,
            updateDxnote,
            currentRepoKey,
            currentFolderKey,
            currentNoteKey,
            reorderRepo,
            initDxnote,
        },
    ] = useDxnote();
    const [repos, { updateRepos, initRepo, renameNote, reorderFolder, reorderNote }] = useRepos();
    const [
        notes,
        {
            allRepoNotesFetch,
            repoNotesFetch,
            folderNotesFetch,
            changeNotesAfterNew,
            initNotes,
            updateNote,
        },
    ] = useNotes();
    const [cursorHeads, { updateCursorHead }] = useEditPos();
    const [fromPos, { updateFromPos }] = useEditLine();

    const miniSearch = useRef<any>();
    const [showUpdateIndexTips, setShowUpdateIndexTips] = useState(true);
    const [showWaitingMask, setShowWaitingMask] = useState(false);

    useMemo(() => {
        let new_data = initData(dataPath);
        if (new_data) {
            initDxnote(new_data.dxnote);
            initRepo(new_data.repos);
            initNotes(new_data.notes);
            let search = ipcRenderer.sendSync("readJson", {
                file_path: `${dataPath}/search.json`,
            });
            if (search) {
                setShowUpdateIndexTips(false);
                miniSearch.current = MiniSearch.loadJS(search, {
                    fields: ["title", "content"],
                    storeFields: ["id", "type", "title", "folder_name"],
                    tokenize: (string, _fieldName) => {
                        let result = ipcRenderer.sendSync("nodejieba", {
                            word: string,
                        });
                        return result;
                    },
                    searchOptions: {
                        boost: { title: 2 },
                        fuzzy: 0.2,
                        tokenize: (string: string) => {
                            let result = ipcRenderer.sendSync("nodejieba", {
                                word: string,
                            });
                            result = result.filter((w: string) => w !== " ");
                            return result;
                        },
                    },
                });
            } else {
                miniSearch.current = null;
            }
            setTimeout(() => {
                setFocus(
                    cryptoRandomString({
                        length: 24,
                        type: "alphanumeric",
                    })
                );
            }, 0);
        } else {
            setShowAddPathTips(true);
        }
    }, [dataPath, setShowAddPathTips, setShowUpdateIndexTips]);

    const repoSwitch = useCallback(
        (repo_key: string | undefined) => {
            repoNotesFetch(dataPath, dxnote, repos, repo_key);
            switchRepo(dataPath, repo_key);
        },
        [dataPath, dxnote, repos]
    );

    const folderSwitch = useCallback(
        (repo_key: string | undefined, folder_key: string | undefined) => {
            folderNotesFetch(dataPath, dxnote, repos, repo_key, folder_key);
            switchFolder(dataPath, folder_key);
        },
        [dataPath, dxnote, repos]
    );

    const noteSwitch = useCallback(
        (note_key: string | undefined) => {
            switchNote(dataPath, note_key);
        },
        [dataPath]
    );

    const updateMiniSearch = useCallback(() => {
        console.log("updateMiniSearch begin");
        setShowWaitingMask(true);

        let all_notes = {};
        let repos_key = dxnote.repos_key;
        repos_key.forEach((repo_key: string) => {
            if (!all_notes[repo_key]) {
                all_notes[repo_key] = {};
            }
            let folders_key = repos[repo_key].folders_key;
            folders_key.forEach((folder_key: string) => {
                if (!all_notes[repo_key][folder_key]) {
                    let folder_info = ipcRenderer.sendSync("readJson", {
                        file_path: `${dataPath}/${repo_key}/${folder_key}/folder_info.json`,
                    });
                    if (folder_info && folder_info.notes_obj) {
                        all_notes[repo_key][folder_key] = {};
                        Object.keys(folder_info.notes_obj).forEach((note_key) => {
                            let note_info = ipcRenderer.sendSync("readCson", {
                                file_path: `${dataPath}/${repo_key}/${folder_key}/${note_key}.cson`,
                            });
                            if (note_info) {
                                all_notes[repo_key][folder_key][note_key] = note_info.content;
                            }
                        });
                    }
                }
            });
        });

        let documents: any = [];
        Object.keys(all_notes).forEach((repo_key: string) => {
            let folders_obj = repos[repo_key].folders_obj;
            Object.keys(all_notes[repo_key]).forEach((folder_key: string) => {
                let folder_name = folders_obj[folder_key]["folder_name"];
                Object.keys(all_notes[repo_key][folder_key]).forEach((note_key: string) => {
                    let id = `${repo_key}-${folder_key}-${note_key}`;
                    let title = repos[repo_key].folders_obj[folder_key].notes_obj[note_key].title;
                    if (title === "新建文档") title = "";
                    let content = all_notes[repo_key][folder_key][note_key];
                    documents.push({
                        id,
                        type: "note",
                        title,
                        folder_name,
                        content,
                    });
                });
            });
        });

        miniSearch.current = new MiniSearch({
            fields: ["title", "content"],
            storeFields: ["id", "type", "title", "folder_name"],
            tokenize: (string, _fieldName) => {
                let result = ipcRenderer.sendSync("nodejieba", {
                    word: string,
                });
                return result;
            },
            searchOptions: {
                boost: { title: 2 },
                fuzzy: 0.2,
                tokenize: (string: string) => {
                    let result = ipcRenderer.sendSync("nodejieba", {
                        word: string,
                    });
                    result = result.filter((w: string) => w !== " ");
                    return result;
                },
            },
        });
        miniSearch.current.addAll(documents);

        ipcRenderer.sendSync("writeJsonStr", {
            file_path: `${dataPath}/search.json`,
            str: JSON.stringify(miniSearch.current),
        });

        setShowUpdateIndexTips(false);
        setShowWaitingMask(false);

        console.log("updateMiniSearch success");
    }, [dataPath, dxnote, repos, setShowUpdateIndexTips, setShowWaitingMask]);

    const searchNote = (word: string) => {
        if (!miniSearch.current) return [];
        return miniSearch.current.search(word, {
            filter: (result: any) => result.type === "note",
        });
    };

    return (
        <AppContainer>
            {/* <AddPathTips>

        </AddPathTips> */}
            <WaitingMask in={showWaitingMask} timeout={300}></WaitingMask>
            <RepoContent>
                <SideNav
                    data_path={dataPath}
                    currentRepoKey={currentRepoKey}
                    currentFolderKey={currentFolderKey}
                    currentNoteKey={currentNoteKey}
                    repos_key={dxnote.repos_key}
                    repos_obj={repos}
                    folders_key={repos[currentRepoKey]?.folders_key}
                    folders_obj={repos[currentRepoKey]?.folders_obj}
                    notes_key={repos[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_key}
                    notes_obj={repos[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj}
                    keySelect={keySelect}
                    showUpdateIndexTips={showUpdateIndexTips}
                    repoSwitch={repoSwitch}
                    folderSwitch={folderSwitch}
                    noteSwitch={noteSwitch}
                    updateDxnote={updateDxnote}
                    updateRepos={updateRepos}
                    changeNotesAfterNew={changeNotesAfterNew}
                    setDataPath={setDataPath}
                    reorderRepo={reorderRepo}
                    reorderFolder={reorderFolder}
                    reorderNote={reorderNote}
                    setFocus={setFocus}
                    setBlur={setBlur}
                    setKeySelect={setKeySelect}
                    updateMiniSearch={updateMiniSearch}
                    searchNote={searchNote}
                />
                {dataPath ? (
                    <CenterArea
                        data_path={dataPath}
                        currentRepoKey={currentRepoKey}
                        currentFolderKey={currentFolderKey}
                        currentNoteKey={currentNoteKey}
                        repos_key={dxnote.repos_key}
                        repos_obj={repos}
                        folders_key={repos[currentRepoKey]?.folders_key}
                        folders_obj={repos[currentRepoKey]?.folders_obj}
                        notes_key={repos[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_key}
                        notes_obj={repos[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj}
                        keySelect={keySelect}
                        repoSwitch={repoSwitch}
                        folderSwitch={folderSwitch}
                        noteSwitch={noteSwitch}
                        updateDxnote={updateDxnote}
                        updateRepos={updateRepos}
                        changeNotesAfterNew={changeNotesAfterNew}
                        setDataPath={setDataPath}
                        reorderRepo={reorderRepo}
                        reorderFolder={reorderFolder}
                        reorderNote={reorderNote}
                        setFocus={setFocus}
                        setBlur={setBlur}
                        setKeySelect={setKeySelect}
                        content={
                            currentRepoKey &&
                            currentFolderKey &&
                            currentNoteKey &&
                            notes[currentRepoKey] &&
                            notes[currentRepoKey][currentFolderKey] &&
                            notes[currentRepoKey][currentFolderKey][currentNoteKey]
                                ? notes[currentRepoKey][currentFolderKey][currentNoteKey]
                                : ""
                        }
                        cursorHead={
                            currentRepoKey &&
                            currentFolderKey &&
                            currentNoteKey &&
                            cursorHeads[currentRepoKey] &&
                            cursorHeads[currentRepoKey][currentFolderKey] &&
                            cursorHeads[currentRepoKey][currentFolderKey][currentNoteKey]
                                ? cursorHeads[currentRepoKey][currentFolderKey][currentNoteKey]
                                : -1
                        }
                        fromPos={
                            currentRepoKey &&
                            currentFolderKey &&
                            currentNoteKey &&
                            fromPos[currentRepoKey] &&
                            fromPos[currentRepoKey][currentFolderKey] &&
                            fromPos[currentRepoKey][currentFolderKey][currentNoteKey]
                                ? fromPos[currentRepoKey][currentFolderKey][currentNoteKey]
                                : 0
                        }
                        focus={focus}
                        blur={blur}
                        theme={theme}
                        updateNote={updateNote}
                        renameNote={renameNote}
                        updateCursorHead={updateCursorHead}
                        updateFromPos={updateFromPos}
                        showAssistantPanel={showAssistantPanel}
                        setShowAssistantPanel={setShowAssistantPanel}
                    />
                ) : (
                    <></>
                )}
                {showAssistantPanel ? <AssistantPanel /> : <></>}
            </RepoContent>
            {/* <SocketClientBtn/>
            <SocketServerBtn/> */}
        </AppContainer>
    );
};

const AppContainer = styled.div({
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
});

const RepoContent = styled.div({
    display: "flex",
    alignItem: "center",
    flex: "1",
    minHeight: "0",
    width: "100vw",
});

export default App;
