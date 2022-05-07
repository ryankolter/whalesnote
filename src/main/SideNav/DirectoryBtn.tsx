import styled from "@emotion/styled";
import { useMemo } from "react";
const { ipcRenderer } = window.require("electron");

const DirectoryBtn: React.FC<DirectoryBtnProps> = ({
  data_path,
  setDataPath,
  panelWidth,
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
        <PathOpenBtn>
          目录
          <PathPanel width={panelWidth} className="path_panel">
            <ShowPath>
              <PathValue>{data_path}</PathValue>
            </ShowPath>
            <BtnList>
              <OperationBtn onClick={openDataPath}>打开</OperationBtn>
              <OperationBtn onClick={addDataPath}>切换</OperationBtn>
              <OperationBtn>备份</OperationBtn>
            </BtnList>
          </PathPanel>
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
};

const PathOpenBtn = styled.div(
  operationBtnStyle,
  {
    position: "relative",
  },
  `
    &:hover .path_panel{
        display: block;
    }
`
);

const PathPanel = styled.div(
  {
    position: "absolute",
    bottom: "32px",
    left: "0",
    display: "none",
    fontSize: "14px",
    padding: "30px",
    boxSizing: "border-box",
    border: "1px solid rgb(58, 64, 76)",
    borderRadius: "16px",
    backgroundColor: "rgb(44, 48, 51)",
    zIndex: "99999",
  },
  (props: { width: number }) => ({
    width: props.width,
  })
);

const ShowPath = styled.div({
  width: "100%",
  lineHeight: "26px",
  fontSize: "16px",
});

const PathValue = styled.div({
  width: "100%",
  wordBreak: "break-all",
});

const BtnList = styled.div({
  display: "flex",
  justifyContent: "space-between",
  margin: "20px 0 0 0",
});

const OperationBtn = styled.div({
  fontSize: "16px",
  height: "26px",
  lineHeight: "26px",
  padding: "2px 14px",
  borderRadius: "4px",
  backgroundColor: "#3a404c",
  cursor: "pointer",
});

const PathAddBtn = styled.div(operationBtnStyle);

type DirectoryBtnProps = {
  data_path: string;
  setDataPath: (path: string) => void;
  panelWidth: number;
};

export default DirectoryBtn;
