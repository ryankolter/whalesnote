import styled from "@emotion/styled";
import { useMemo } from "react";
const { ipcRenderer } = window.require("electron");

const DirectoryBtn: React.FC<DirectoryBtnProps> = ({
  data_path,
  setDataPath,
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
    <DirectoryBtnContainer>
      {data_path ? (
        <PathOpenBtn onClick={openDataPath}>
          目录
          <RepoPathTips className="repo_path_tips">{data_path}</RepoPathTips>
        </PathOpenBtn>
      ) : (
        <PathAddBtn onClick={addDataPath}>添加目录</PathAddBtn>
      )}
    </DirectoryBtnContainer>
  );
};

const DirectoryBtnContainer = styled.div({
  display: "flex",
  color: "#939395",
  fontSize: "16px",
});

const operationBtnStyle = {
  height: "32px",
  lineHeight: "32px",
  display: "flex",
  alignItem: "center",
  justifyContent: "center",
  padding: "0 10px",
  marginTop: "8px",
  backgroundColor: "rgb(58, 64, 76)",
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
  top: "-32px",
  left: "0",
  display: "none",
  whiteSpace: "nowrap",
  fontSize: "14px",
});

const PathAddBtn = styled.div(operationBtnStyle);

type DirectoryBtnProps = {
  data_path: string;
  setDataPath: (path: string) => void;
};

export default DirectoryBtn;
