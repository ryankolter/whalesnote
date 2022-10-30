import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import WaitingMaskStatic from '../../components/WaitingMaskStatic';

const DataSpace: React.FC<{ closeAssistantPanel: () => void }> = ({ closeAssistantPanel }) => {
    const {
        curDataPath,
        setCurDataPath,
        switchingData,
        setSwitchingData,
        dataPathList,
        removeDataPathFromList,
    } = useContext(GlobalContext);
    const [showPathUl, setShowPathUl] = useState(false);
    const pathUlRef = useRef<HTMLDivElement>(null);

    const addDataPath = useCallback(async () => {
        const filePath = await window.electronAPI.openDirectoryDialog();
        setShowPathUl(false);
        if (filePath !== curDataPath) {
            setSwitchingData(true);
            setTimeout(() => {
                setCurDataPath(filePath);
            }, 50);
        }
    }, []);

    const openDataPath = useCallback(async (data_path: string) => {
        await window.electronAPI.openParentFolder({ folder_path: data_path });
    }, []);

    const handleClick = useCallback(
        (event: MouseEvent) => {
            event.preventDefault();
            if (pathUlRef && pathUlRef.current?.contains(event.target as Node)) {
                setShowPathUl((showPathUl) => !showPathUl);
            } else {
                setShowPathUl(false);
            }
        },
        [setShowPathUl]
    );

    useEffect(() => {
        document.addEventListener('click', handleClick);
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [handleClick]);

    return (
        <DataSpaceContainer>
            <TopRow>
                <CloseDataSpaceBtn
                    onClick={() => {
                        closeAssistantPanel();
                    }}
                >
                    x
                </CloseDataSpaceBtn>
            </TopRow>
            <ChildPart>
                <PartTitle>数据空间</PartTitle>
                <ShowPath>
                    <PathContainer ref={pathUlRef}>
                        <Path>
                            <CurrentPath>
                                <PathValue>
                                    <UnicodeSpan>{curDataPath}</UnicodeSpan>
                                    {curDataPath.indexOf('/whale_note/noteData') !== -1
                                        ? ' - 默认'
                                        : ''}
                                </PathValue>
                                <Triangle></Triangle>
                            </CurrentPath>
                            {showPathUl ? (
                                <PathUl>
                                    {dataPathList.map((dataPath: string, index: number) => {
                                        if (curDataPath !== dataPath) {
                                            return (
                                                <PathLi
                                                    key={index}
                                                    onClick={(e) => {
                                                        setShowPathUl(false);
                                                        setSwitchingData(true);
                                                        setTimeout(() => {
                                                            setCurDataPath(dataPath);
                                                        }, 200);
                                                    }}
                                                >
                                                    <UnicodeSpan>{dataPath}</UnicodeSpan>
                                                    {dataPath.indexOf('/whale_note/noteData') !== -1
                                                        ? ' - 默认'
                                                        : ''}
                                                    <RemovePathBtn
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            removeDataPathFromList(dataPath);
                                                        }}
                                                    >
                                                        x
                                                    </RemovePathBtn>
                                                </PathLi>
                                            );
                                        }
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
            {/* <ChildPart>
                <PartTitle>操作</PartTitle>
                <OperationList>
                    <OperationBtn style={{ marginBottom: '15px' }}>一键备份</OperationBtn>
                    <OperationBtn style={{ marginBottom: '15px' }}>加密备份</OperationBtn>
                </OperationList>
            </ChildPart> */}
            <ChildPart>
                <PartTitle>同步</PartTitle>
            </ChildPart>
            <WaitingMaskStatic show={switchingData} word={'载入中......'}></WaitingMaskStatic>
        </DataSpaceContainer>
    );
};

const DataSpaceContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    padding: '5px',
});

const TopRow = styled.div({
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'flex-end',
});

const CloseDataSpaceBtn = styled.div({
    width: '20px',
    height: '20px',
    lineHeight: '18px',
    fontSize: '20px',
    padding: '5px 10px',
    margin: '0 0 2px 0',
    cursor: 'pointer',
});

const ChildPart = styled.div({
    padding: '10px',
});

const PartTitle = styled.div({
    fontSize: '18px',
    fontWeight: '500',
    marginBottom: '15px',
    paddingBottom: '4px',
    borderBottom: '1px solid var(--main-border-color)',
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
    justifyContent: 'space-between',
    height: '40px',
    lineHeight: '40px',
    padding: '0 8px 0 10px',
    boxSizing: 'border-box',
    border: '1px solid var(--main-border-color)',
    backgroundColor: 'var(--main-bg-color)',
});

const PathValue = styled.div({
    wordBreak: 'break-all',
    direction: 'rtl',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
});

const UnicodeSpan = styled.span({
    direction: 'ltr',
    unicodeBidi: 'bidi-override',
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
    border: '1px solid var(--main-border-color)',
    backgroundColor: 'var(--main-bg-color)',
});

const PathLi = styled.div({
    position: 'relative',
    width: '100%',
    height: '40px',
    lineHeight: '40px',
    padding: '0 30px 0 5px',
    boxSizing: 'border-box',
    wordBreak: 'break-all',
    direction: 'rtl',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
});

const RemovePathBtn = styled.div({
    position: 'absolute',
    top: '0',
    right: '12px',
    padding: '0 10px',
    margin: '0 -10px',
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

export default DataSpace;
