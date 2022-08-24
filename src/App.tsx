import { useState, useMemo } from "react";
import styled from "@emotion/styled";
import cryptoRandomString from "crypto-random-string";

import { useRepos } from "./lib/useRepos";
import { useNotes } from "./lib/useNotes";
import { useDxnote } from "./lib/useDxnote";

import initData from "./lib/init";

import SideNav from "./main/SideNav";
import CenterArea from "./main/CenterArea/index";

import SocketServerBtn from "./components/socketServerBtn";

import SocketClientBtn from "./socketClientBtn";
import "./resources/css/font_awesome.css";
import "./resources/my_highlight_styles/editor/solarized-dark.min.css";
import "./resources/my_highlight_styles/preview/solarized-dark.min.css";
import { useEditPos } from "./lib/useEditPos";
import { useEditLine } from "./lib/useEditLine";
import AssistantPanel from "./main/AssistantPanel";

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
        { repoNotesFetch, folderNotesFetch, changeNotesAfterNew, initNotes, updateNote },
    ] = useNotes();
    const [cursorHeads, { updateCursorHead }] = useEditPos();
    const [fromPos, { updateFromPos }] = useEditLine();

    useMemo(() => {
        let new_data = initData(dataPath);
        if (new_data) {
            initDxnote(new_data.dxnote);
            initRepo(new_data.repos);
            initNotes(new_data.notes);
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
    }, [dataPath, setShowAddPathTips]);

    const repoSwitch = (repo_key: string | undefined) => {
        repoNotesFetch(dataPath, repos, repo_key);
        switchRepo(dataPath, repo_key);
    };

    return (
        <AppContainer>
            {/* <AddPathTips>

      </AddPathTips> */}
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
                    repoSwitch={repoSwitch}
                    folderSwitch={switchFolder}
                    noteSwitch={switchNote}
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
                        folderSwitch={switchFolder}
                        noteSwitch={switchNote}
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
