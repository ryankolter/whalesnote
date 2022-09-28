const { ipcRenderer } = window.require('electron');
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import styled from '@emotion/styled';

import { usePopUp } from '../../lib/usePopUp';

const GlobalMenu: React.FC<GlobalMenuProps> = ({
    data_path,
    addDataPath,
    showGlobalMenu,
    setShowGlobalMenu,
}) => {
    const [menuPopup, setMenuPopUp, mask] = usePopUp(500);

    const openDataPath = useCallback(() => {
        ipcRenderer.send('open-folder', { folder_path: data_path });
    }, []);

    useEffect(() => {
        console.log(showGlobalMenu);
        setMenuPopUp(showGlobalMenu);
    }, [showGlobalMenu]);

    return (
        <GlobalMenuContainer>
            <div
                className={menuPopup ? 'show-alert-mask' : 'hide-alert-mask'}
                style={mask ? { display: 'block' } : { display: 'none' }}
                onClick={() => setShowGlobalMenu(false)}
            ></div>
            <MenuPanel
                className="float-panel-color no-scroller"
                style={{ transform: showGlobalMenu ? 'translate(0, 0)' : 'translate(-400px, 0)' }}
            >
                <ChildPart>
                    <PartTitle className={'child-border-color'}>当前数据目录</PartTitle>
                    <ShowPath>
                        <PathValue>{data_path}</PathValue>
                        <OpenDataPathBtn onClick={openDataPath}>打开</OpenDataPathBtn>
                    </ShowPath>
                </ChildPart>
                <ChildPart>
                    <PartTitle className={'child-border-color'}>操作</PartTitle>
                    <OperationList>
                        <OperationBtn style={{ marginBottom: '15px' }}>一键备份</OperationBtn>
                        <OperationBtn style={{ marginBottom: '15px' }}>加密备份</OperationBtn>
                        <OperationBtn onClick={addDataPath}>切换新数据目录</OperationBtn>
                    </OperationList>
                </ChildPart>
                <ChildPart>
                    <PartTitle className={'child-border-color'}>同步</PartTitle>
                </ChildPart>
            </MenuPanel>
        </GlobalMenuContainer>
    );
};

const GlobalMenuContainer = styled.div({});

const MenuPanel = styled.div({
    position: 'fixed',
    display: 'flex',
    flexDirection: 'column',
    width: '400px',
    height: 'calc(100vh)',
    padding: '15px',
    boxSizing: 'border-box',
    transition: 'all 400ms ease',
    zIndex: '9000',
    overflowY: 'auto',
});

const ChildPart = styled.div({
    padding: '10px',
});

const PartTitle = styled.div({
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '15px',
    paddingBottom: '2px',
    borderBottomWidth: '1.5px',
    borderBottomStyle: 'solid',
});

const ShowPath = styled.div({
    display: 'flex',
    width: '100%',
    lineHeight: '26px',
    fontSize: '16px',
    margin: '0 0 15px 0',
});

const PathValue = styled.div({
    flex: '1',
    minWidth: '0',
    wordBreak: 'break-all',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const OpenDataPathBtn = styled.div({
    fontSize: '16px',
    height: '26px',
    lineHeight: '26px',
    padding: '2px 14px',
    marginLeft: '10px',
    borderRadius: '4px',
    backgroundColor: '#3a404c',
    cursor: 'pointer',
});

const OperationList = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
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

type GlobalMenuProps = {
    data_path: string;
    addDataPath: () => void;
    showGlobalMenu: boolean;
    setShowGlobalMenu: any;
};

export default GlobalMenu;
