const { ipcRenderer } = window.require('electron');
import { useCallback, useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import { usePopUp } from '../../lib/usePopUp';

const GlobalMenu: React.FC<{
    data_path: string;
    addDataPath: () => void;
    showGlobalMenu: boolean;
    setShowGlobalMenu: any;
}> = ({ data_path, addDataPath, showGlobalMenu, setShowGlobalMenu }) => {
    const { curDataPath, setCurDataPath, dataPathList } = useContext(GlobalContext);
    const [menuPopup, setMenuPopUp, mask] = usePopUp(500);
    const [showPathUl, setShowPathUl] = useState(false);

    const openDataPath = useCallback((data_path: string) => {
        ipcRenderer.send('open-folder', { folder_path: data_path });
    }, []);

    useEffect(() => {
        setMenuPopUp(showGlobalMenu);
        if (!showGlobalMenu) {
            setShowPathUl(false);
        }
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
                    <PartTitle className={'child-border-color'}>数据空间</PartTitle>
                    <ShowPath>
                        <PathContainer>
                            <Path>
                                <CurrentPath
                                    className="menu-select-color"
                                    onClick={() => setShowPathUl((showPathUl) => !showPathUl)}
                                >
                                    <PathValue>
                                        {curDataPath.indexOf('/whale_note/noteData') !== -1
                                            ? '默认 - '
                                            : ''}
                                        {curDataPath}
                                    </PathValue>
                                    <Triangle></Triangle>
                                </CurrentPath>

                                {showPathUl ? (
                                    <PathUl className="menu-select-color">
                                        {dataPathList.map((dataPath: string, index: number) => {
                                            return (
                                                <PathLi
                                                    key={index}
                                                    onClick={(e) => {
                                                        setShowPathUl(false);
                                                        setCurDataPath(dataPath);
                                                    }}
                                                >
                                                    {dataPath.indexOf('/whale_note/noteData') !== -1
                                                        ? '默认 - '
                                                        : ''}
                                                    {dataPath}
                                                </PathLi>
                                            );
                                        })}
                                        <PathAddBtn onClick={addDataPath}>添加</PathAddBtn>
                                    </PathUl>
                                ) : (
                                    <></>
                                )}
                            </Path>
                        </PathContainer>
                        <OpenDataPath>
                            <OpenDataPathBtn onClick={(e) => openDataPath(curDataPath)}>
                                打开
                            </OpenDataPathBtn>
                        </OpenDataPath>
                    </ShowPath>
                </ChildPart>
                <ChildPart>
                    <PartTitle className={'child-border-color'}>操作</PartTitle>
                    <OperationList>
                        <OperationBtn style={{ marginBottom: '15px' }}>一键备份</OperationBtn>
                        <OperationBtn style={{ marginBottom: '15px' }}>加密备份</OperationBtn>
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

const PathContainer = styled.div({
    position: 'relative',
    flex: '1',
    minWidth: '0',
});

const Path = styled.div({
    wordBreak: 'break-all',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
});

const CurrentPath = styled.div({
    display: ' flex',
    height: '40px',
    lineHeight: '40px',
    padding: '0 15px 0 10px',
    boxSizing: 'border-box',
});

const PathValue = styled.div({
    wordBreak: 'break-all',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
});

const Triangle = styled.div({
    display: 'block',
    height: '0',
    width: '0',
    marginLeft: '4px',
    transform: 'translateY(16px)',
    borderBottom: '10px solid transparent',
    borderTop: '10px solid #939395',
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
});

const PathUl = styled.div({
    width: '100%',
    position: 'absolute',
    padding: '5px 0',
});

const PathLi = styled.div({
    width: '100%',
    height: '40px',
    lineHeight: '40px',
    padding: '0 10px',
    boxSizing: 'border-box',
    wordBreak: 'break-all',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
});

const PathAddBtn = styled.div({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    height: '40px',
    lineHeight: '40px',
    boxSizing: 'border-box',
});

const OpenDataPath = styled.div({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    height: '40px',
    lineHeight: '40px',
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

export default GlobalMenu;
