import styled from "@emotion/styled";
const { ipcRenderer } = window.require("electron");

const DirectoryBtn: React.FC<DirectoryBtnProps> = ({ data_path, addDataPath, panelWidth }) => {
    const openDataPath = () => {
        ipcRenderer.send("open-folder", { folder_path: data_path });
    };

    return (
        <DirectoryBtnContainer>
            目录
            <PathPanel width={panelWidth} className='path_panel'>
                <ShowPath>
                    <PathValue>{data_path}</PathValue>
                </ShowPath>
                <BtnList>
                    <OperationBtn onClick={openDataPath}>打开</OperationBtn>
                    <OperationBtn onClick={addDataPath}>切换</OperationBtn>
                    <OperationBtn>备份</OperationBtn>
                </BtnList>
            </PathPanel>
        </DirectoryBtnContainer>
    );
};

const DirectoryBtnContainer = styled.div(
    {
        position: "relative",
        display: "flex",
        alignItem: "center",
        justifyContent: "center",
        height: "32px",
        lineHeight: "32px",
        fontSize: "16px",
        padding: "0 10px",
        marginTop: "8px",
        color: "#939395",
        backgroundColor: "rgb(58, 64, 76)",
    },
    `
  &:hover .path_panel{
      display: block;
  }
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

type DirectoryBtnProps = {
    data_path: string;
    addDataPath: () => void;
    panelWidth: number;
};

export default DirectoryBtn;
