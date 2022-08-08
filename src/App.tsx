import { useState, useMemo } from "react";
import styled from "@emotion/styled";

import { useRepos } from "./lib/useRepos";
import { useNotes } from "./lib/useNotes";
import { useDxnote } from "./lib/useDxnote";

import initData from "./lib/init";

import SideNav from "./main/SideNav";
import CenterArea from "./main/CenterArea";

import { MarkdownArea } from "./main/CenterArea/MarkdownArea";
import SocketServerBtn from "./components/socketServerBtn";

import SocketClientBtn from "./socketClientBtn";
import "./resources/css/font_awesome.css";
import "./resources/my_highlight_styles/editor/solarized-dark.min.css";
import "./resources/my_highlight_styles/preview/solarized-dark.min.css";
import { useEditPos } from "./lib/useEditPos";
import { useEditLine } from "./lib/useEditLine";

const App = () => {
  const [dataPath, setDataPath] = useState<string>(
    window.localStorage.getItem("dxnote_data_path") || ""
  );
  const [focus, setFocus] = useState("");
  const [blur, setBlur] = useState("");
  const [keySelect, setKeySelect] = useState(false);
  const [showAddPathTips, setShowAddPathTips] = useState(false);
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
  const [editPos, { updateEditPos }] = useEditPos();
  const [editLine, { updateEditLine }] = useEditLine();

  useMemo(() => {
    if (!window.localStorage.getItem("view_mode")) {
      window.localStorage.setItem("view_mode", "sidebyside");
    }
    let new_data = initData(dataPath);
    if (new_data) {
      initDxnote(new_data.dxnote);
      initRepo(new_data.repos);
      initNotes(new_data.notes);
    } else {
      console.log("no data path");
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
        <CenterArea
          data_path={dataPath}
          updateNote={updateNote}
          renameNote={renameNote}
          updateEditPos={updateEditPos}
          updateEditLine={updateEditLine}
          currentRepoKey={currentRepoKey}
          currentFolderKey={currentFolderKey}
          currentNoteKey={currentNoteKey}
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
          editPos={editPos}
          editLine={editLine}
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
