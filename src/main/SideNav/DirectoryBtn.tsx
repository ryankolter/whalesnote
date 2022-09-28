const { ipcRenderer } = window.require('electron');
import styled from '@emotion/styled';

const DirectoryBtn: React.FC<{
    data_path: string;
    addDataPath: () => void;
    panelWidth: number;
}> = ({ data_path, addDataPath, panelWidth }) => {
    const openDataPath = () => {
        ipcRenderer.send('open-folder', { folder_path: data_path });
    };

    return (
        <DirectoryBtnContainer className="btn-1-bg-color">
            目录
            <PathPanel width={panelWidth} className="path_panel float-panel-color ">
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
        position: 'relative',
        display: 'flex',
        alignItem: 'center',
        justifyContent: 'center',
        height: '32px',
        lineHeight: '32px',
        fontSize: '16px',
        padding: '0 10px',
        margin: '0 10px 0 0',
        borderRadius: ' 4px',
    },
    `
  &:hover .path_panel{
      display: block;
  }
`
);

const PathPanel = styled.div(
    {
        position: 'absolute',
        top: '32px',
        left: '0',
        display: 'none',
        fontSize: '14px',
        padding: '30px',
        boxSizing: 'border-box',
        borderRadius: '16px',
        zIndex: '4000',
    },
    (props: { width: number }) => ({
        width: props.width,
    })
);

const ShowPath = styled.div({
    width: '100%',
    lineHeight: '26px',
    fontSize: '16px',
});

const PathValue = styled.div({
    width: '100%',
    wordBreak: 'break-all',
});

const BtnList = styled.div({
    display: 'flex',
    justifyContent: 'space-between',
    margin: '20px 0 0 0',
});

const OperationBtn = styled.div({
    fontSize: '16px',
    height: '26px',
    lineHeight: '26px',
    padding: '2px 14px',
    borderRadius: '4px',
    backgroundColor: '#3a404c',
    cursor: 'pointer',
});

export default DirectoryBtn;
