import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import WaitingMaskStatic from '../../components/WaitingMaskStatic';
import { usePopUp } from '../../lib/usePopUp';
import { AlertPopUp } from '../../components/AlertPopUp';

const DataSpace: React.FC<{}> = ({}) => {
    const {
        curDataPath,
        dataPathList,
        removeDataPathFromList,
        setCurDataPath,
        setDataSwitchingFlag,
    } = useContext(GlobalContext);
    const [showPathUl, setShowPathUl] = useState(false);
    const [removeDataSpacePath, setRemoveDataSpacePath] = useState('');
    const pathUlRef = useRef<HTMLDivElement>(null);

    const [removePopUp, setRemovePopUp, removeMask] = usePopUp(500);

    const addDataPath = useCallback(async () => {
        const filePath = await window.electronAPI.openDirectoryDialog();
        setShowPathUl(false);
        if (filePath !== '' && filePath !== curDataPath) {
            setDataSwitchingFlag(true);
            setTimeout(() => {
                setCurDataPath(filePath);
            }, 50);
        }
    }, []);

    const openDataPath = useCallback(async (data_path: string) => {
        await window.electronAPI.openParentFolder({ folder_path: data_path });
    }, []);

    const removeDataSpaceConfirm = useCallback(() => {
        removeDataPathFromList(removeDataSpacePath);
        setRemovePopUp(false);
    }, [removeDataPathFromList, removeDataSpacePath]);

    const handleRemoveDataSpaceKeyDown = useCallback(
        (e: any) => {
            if (e.key === 'Enter') {
                removeDataSpaceConfirm();
            } else if (e.key === 'Escape') {
                setRemovePopUp(false);
            }
        },
        [removeDataSpaceConfirm, setRemovePopUp]
    );

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
            <ChildPart>
                <PartTitle>存储空间</PartTitle>
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
                                                        setDataSwitchingFlag(true);
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
                                                            setRemoveDataSpacePath(dataPath);
                                                            setRemovePopUp(true);
                                                        }}
                                                    >
                                                        x
                                                    </RemovePathBtn>
                                                </PathLi>
                                            );
                                        }
                                    })}
                                    <PathAddBtnBox onClick={addDataPath}>
                                        <PathAddBtn className="ri-add-box-line"></PathAddBtn>
                                    </PathAddBtnBox>
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
                <AlertPopUp
                    popupState={removePopUp}
                    maskState={removeMask}
                    title="提示"
                    content={`即将移除数据目录\n${removeDataSpacePath}(不会删除目录内容)`}
                    onCancel={() => setRemovePopUp(false)}
                    onConfirm={removeDataSpaceConfirm}
                    onKeyDown={handleRemoveDataSpaceKeyDown}
                ></AlertPopUp>
            </ChildPart>
            {/* <ChildPart>
                <PartTitle>操作</PartTitle>
                <OperationList>
                    <OperationBtn style={{ marginBottom: '15px' }}>一键备份</OperationBtn>
                    <OperationBtn style={{ marginBottom: '15px' }}>加密备份</OperationBtn>
                </OperationList>
            </ChildPart> */}
        </DataSpaceContainer>
    );
};

const DataSpaceContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    padding: '5px',
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

const PathAddBtnBox = styled.div({
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
    height: '40px',
    lineHeight: '40px',
    boxSizing: 'border-box',
});

const PathAddBtn = styled.div({
    fontSize: '20px',
    height: '20px',
    width: '20px',
    color: 'var(--main-text-color)',
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
    backgroundColor: 'var(--main-btn-bg-color)',
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
