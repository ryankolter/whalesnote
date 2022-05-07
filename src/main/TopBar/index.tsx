import styled from "@emotion/styled";
import { useMemo } from "react";
import RepoList from "./RepoList";
const { ipcRenderer } = window.require("electron");

const TopBar: React.FC<TopBarProps> = ({
  data_path,
  repos_key,
  repos_obj,
  currentRepoKey,
  currentFolderKey,
  keySelect,
  repoSwitch,
  folderSwitch,
  noteSwitch,
  updateDxnote,
  updateRepos,
  changeNotesAfterNew,
  setDataPath,
  reorderFolder,
  setFocus,
  setBlur,
  setKeySelect,
}) => {
  useMemo(() => {
    ipcRenderer.on("selectedFolder", (event: any, path: string) => {
      window.localStorage.setItem("dxnote_data_path", path);
      setDataPath(path);
    });
  }, [setDataPath]);

  const addDataPath = () => {
    ipcRenderer.send("open-directory-dialog");
  };

  const openDataPath = () => {
    ipcRenderer.send("open-folder", { folder_path: data_path });
  };

  return (
    <RepoListContainer>
      {data_path ? (
        <PathOpenBtn onClick={openDataPath}>
          目录
          <RepoPathTips className="repo_path_tips">{data_path}</RepoPathTips>
        </PathOpenBtn>
      ) : (
        <PathAddBtn onClick={addDataPath}>添加目录</PathAddBtn>
      )}
      {data_path ? <SubmitLocationBtn>二维码</SubmitLocationBtn> : <div></div>}
      <Separator />
      <RepoList
        data_path={data_path}
        repos_key={repos_key}
        repos_obj={repos_obj}
        currentRepoKey={currentRepoKey}
        currentFolderKey={currentFolderKey}
        keySelect={keySelect}
        repoSwitch={repoSwitch}
        folderSwitch={folderSwitch}
        noteSwitch={noteSwitch}
        updateDxnote={updateDxnote}
        updateRepos={updateRepos}
        changeNotesAfterNew={changeNotesAfterNew}
        setDataPath={setDataPath}
        reorderFolder={reorderFolder}
        setFocus={setFocus}
        setBlur={setBlur}
        setKeySelect={setKeySelect}
      />
      {/* {
                <MoreRepo><img src={moreBtnIcon} alt='' /></MoreRepo>
            } */}
    </RepoListContainer>
  );
};

const Separator = styled.i`
  display: inline-block;
  width: 0;
  border-left: 1px solid #3b4042;
  border-right: 1px solid #303436;
  text-indent: -10px;
  margin-left: 8px;
  margin-right: 18px;
`;

const RepoListContainer = styled.div({
  display: "flex",
  color: "#939395",
  fontSize: "16px",
  margin: "10px",
});

const operationBtnStyle = {
  height: "32px",
  lineHeight: "32px",
  display: "flex",
  alignItem: "center",
  justifyContent: "center",
  padding: "0 10px",
  marginRight: "10px",
  backgroundColor: "rgba(58,64,76,0.3)",
  cursor: "pointer",
};

const PathOpenBtn = styled.div(
  operationBtnStyle,
  {
    position: "relative",
  },
  `
    &:hover .repo_path_tips{
        display: block;
    }
`
);

const RepoPathTips = styled.div({
  position: "absolute",
  top: "25px",
  left: "0",
  display: "none",
  whiteSpace: "nowrap",
  fontSize: "14px",
});

const PathAddBtn = styled.div(operationBtnStyle);

const SubmitLocationBtn = styled.div(operationBtnStyle);

const MoreRepo = styled.div({
  width: "26px",
  height: "26px",
  padding: "3px",
  margin: "0 8px",
  display: "flex",
  alignItem: "center",
  justifyContent: "center",
  color: "#939395",
  cursor: "pointer",
});

type TopBarProps = {
  data_path: string;
  repos_key: string[] | undefined;
  repos_obj: object | undefined;
  currentRepoKey: string;
  currentFolderKey: string;
  keySelect: boolean;
  repoSwitch: (id: string | undefined) => void;
  folderSwitch: (
    dataPath: string | null,
    folderKey: string | undefined
  ) => void;
  noteSwitch: (data_path: string | null, note_key: string | undefined) => void;
  updateDxnote: (data_path: string) => void;
  updateRepos: (action_name: string, obj: object) => void;
  changeNotesAfterNew: (action_name: string, obj: object) => void;
  setDataPath: (path: string) => void;
  reorderFolder: (
    data_path: string,
    repo_key: string,
    new_folders_key: string[]
  ) => void;
  setFocus: (focus: string) => void;
  setBlur: (focus: string) => void;
  setKeySelect: (keySelect: boolean) => void;
};

export default TopBar;
