import { useState, useMemo } from "react";
import styled from "@emotion/styled";

import { useRepos } from "./lib/useRepos";
import { useNotes } from "./lib/useNotes";
import { useDxnote } from "./lib/useDxnote";

import initData from "./lib/init";

import SideBar from "./main/SideBar";

import { MarkdownArea } from "./components/markdownArea";
//import SocketServerBtn from "./components/socketServerBtn";

//import SocketClientBtn from "./socketClientBtn";
import "./resources/css/font_awesome.css";
import "./resources/my_highlight_styles/editor/solarized-dark.min.css";
import "./resources/my_highlight_styles/preview/solarized-dark.min.css";
import { useLines } from "./lib/useLines";

// const { ipcRenderer } = window.require('electron')

const App = () => {
  const [dataPath, setDataPath] = useState<string>(
    window.localStorage.getItem("dxnote_data_path") || ""
  );
  const [focus, setFocus] = useState("");
  const [blur, setBlur] = useState("");
  const [keySelect, setKeySelect] = useState(false);
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
  const [
    repos,
    { updateRepos, initRepo, renameNote, reorderFolder, reorderNote },
  ] = useRepos();
  const [
    notes,
    {
      repoNotesFetch,
      folderNotesFetch,
      changeNotesAfterNew,
      initNotes,
      updateNote,
    },
  ] = useNotes();
  const [lines, { updateLine }] = useLines();

  useMemo(() => {
    let new_data = initData(dataPath);
    initDxnote(new_data.dxnote);
    initRepo(new_data.repos);
    initNotes(new_data.notes);
  }, [dataPath]);

  const repoSwitch = (repo_key: string | undefined) => {
    repoNotesFetch(dataPath, repos, repo_key);
    switchRepo(dataPath, repo_key);
  };

  return (
    <AppContainer>
      {/* <TopBar 
                data_path = {dataPath}
                repos_key = {dxnote.repos_key} 
                repos_obj = {repos} 
                currentRepoKey = {currentRepoKey} 
                currentFolderKey = {currentFolderKey}
                keySelect = {keySelect}
                repoSwitch = {repoSwitch}
                folderSwitch = {switchFolder}
                noteSwitch = {switchNote} 
                updateDxnote = {updateDxnote}
                updateRepos = {updateRepos}
                changeNotesAfterNew = {changeNotesAfterNew}
                setDataPath = {setDataPath}
                reorderFolder = {reorderFolder}
                setFocus = {setFocus}
                setBlur = {setBlur}
                setKeySelect = {setKeySelect}/> */}
      <RepoContent>
        <SideBar
          data_path={dataPath}
          repos_key={dxnote.repos_key}
          repos_obj={repos}
          currentRepoKey={currentRepoKey}
          currentFolderKey={currentFolderKey}
          currentNoteKey={currentNoteKey}
          folders_key={repos[currentRepoKey]?.folders_key}
          folders_obj={repos[currentRepoKey]?.folders_obj}
          notes_key={
            repos[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_key
          }
          notes_obj={
            repos[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj
          }
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
        <MarkdownArea
          data_path={dataPath}
          updateNote={updateNote}
          renameNote={renameNote}
          updateLine={updateLine}
          currentRepoKey={currentRepoKey}
          currentFolderKey={currentFolderKey}
          currentNoteKey={currentNoteKey}
          notes={notes}
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
          line={
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            lines[currentRepoKey] &&
            lines[currentRepoKey][currentFolderKey] &&
            lines[currentRepoKey][currentFolderKey][currentNoteKey]
              ? lines[currentRepoKey][currentFolderKey][currentNoteKey]
              : 0
          }
          focus={focus}
          blur={blur}
        />
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
