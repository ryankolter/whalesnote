const { ipcRenderer } = window.require('electron');
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import { DndContext, MouseSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { Sortable } from '../../components/Sortable';
import { TextInput } from '../../components/TextInput';
import { AlertPopUp } from '../../components/AlertPopUp';
import { InputPopUp } from '../../components/InputPopUp';
import { usePopUp } from '../../lib/usePopUp';
import useContextMenu from '../../lib/useContextMenu';

import categoryIcon from '../../resources/icon/categoryIcon.svg';
import folderIcon from '../../resources/icon/folderIcon.svg';
import newFolderIcon from '../../resources/icon/newFolderIcon.svg';

const FolderList: React.FC<{
    width: number;
}> = ({ width }) => {
    const {
        curDataPath,
        dataPathChangeFlag,
        repoSwitch,
        folderSwitch,
        noteSwitch,
        repos_obj,
        currentRepoKey,
        currentFolderKey,
        updateRepos,
        reorderFolder,
        changeNotesAfterNew,
        numArray,
        setNumArray,
        setFocus,
        keySelect,
    } = useContext(GlobalContext);

    const folders_key = repos_obj[currentRepoKey]?.folders_key;
    const folders_obj = repos_obj[currentRepoKey]?.folders_obj;

    const [activeId, setActiveId] = useState(null);
    const [newFolderKey, setNewFolderKey] = useState('');
    const [newFolderName, setNewFolderName] = useState('');

    const [curFolderName, setCurFolderName] = useState('');

    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));

    const [deletePopup, setDeletePopUp, deleteMask] = usePopUp(500);

    const [renamePopup, setRenamePopUp, renameMask] = usePopUp(500);

    const innerRef = useRef<HTMLDivElement>(null);
    const { xPos, yPos, menu } = useContextMenu(innerRef);

    const [folderScrollTop, setFolderScrollTop] = useState(0);

    // part1 : new folder
    const newFolder = () => {
        const folder_key = cryptoRandomString({
            length: 12,
            type: 'alphanumeric',
        });
        setNewFolderKey(folder_key);
    };

    const newFolderInputChange = (e: any) => {
        setNewFolderName(e.target.value);
    };

    const newFolderInputEnter = (e: any, folder_key: string) => {
        if (e.keyCode === 13) {
            newFolderConfirm(e, folder_key);
        }
    };

    const newFolderConfirm = useCallback(
        (e: any, folder_key: string) => {
            if (e.target.value === '') {
                setNewFolderKey('');
                setNewFolderName('');
                return;
            }

            if (!currentRepoKey) return;

            const note_key = cryptoRandomString({
                length: 12,
                type: 'alphanumeric',
            });

            const repo_info = ipcRenderer.sendSync('readJson', {
                file_path: `${curDataPath}/${currentRepoKey}/repo_info.json`,
            });
            repo_info.folders_key.push(folder_key);
            ipcRenderer.sendSync('writeJson', {
                file_path: `${curDataPath}/${currentRepoKey}/repo_info.json`,
                obj: repo_info,
            });

            const folder_info = {
                folder_name: e.target.value,
                notes_key: [note_key],
                notes_obj: {
                    [note_key]: {
                        title: '新建文档',
                    },
                },
            };

            ipcRenderer.sendSync('writeJson', {
                file_path: `${curDataPath}/${currentRepoKey}/${folder_key}/folder_info.json`,
                obj: folder_info,
            });

            updateRepos('folder', {
                data_path: curDataPath,
                repo_key: currentRepoKey,
                folder_key,
            });
            changeNotesAfterNew('folder', {
                data_path: curDataPath,
                repo_key: currentRepoKey,
                folder_key,
            });

            folderSwitch(currentRepoKey, folder_key);

            const note_info = {
                createAt: new Date(),
                updatedAt: new Date(),
                type: 'markdown',
                content: '',
            };

            ipcRenderer.sendSync('writeCson', {
                file_path: `${curDataPath}/${currentRepoKey}/${folder_key}/${note_key}.cson`,
                obj: note_info,
            });

            updateRepos('note', {
                data_path: curDataPath,
                repo_key: currentRepoKey,
                folder_key: folder_key,
            });
            changeNotesAfterNew('note', {
                data_path: curDataPath,
                repo_key: currentRepoKey,
                folder_key: folder_key,
                note_key,
            });
            noteSwitch(note_key);

            setNewFolderKey('');
            setNewFolderName('');
            setTimeout(() => {
                setFocus(
                    cryptoRandomString({
                        length: 24,
                        type: 'alphanumeric',
                    })
                );
            }, 0);
        },
        [
            curDataPath,
            currentRepoKey,
            changeNotesAfterNew,
            folderSwitch,
            repoSwitch,
            setFocus,
            updateRepos,
        ]
    );

    // part2 : rename folder
    useEffect(() => {
        setCurFolderName(
            folders_obj && currentFolderKey && folders_obj[currentFolderKey]
                ? folders_obj[currentFolderKey].folder_name
                : ''
        );
    }, [folders_obj, currentFolderKey]);

    const renameFolder = useCallback(() => {
        setRenamePopUp(true);
    }, [setRenamePopUp]);

    const handleRenameFolderKeyDown = (e: any) => {
        if (e.keyCode === 27) {
            setRenamePopUp(false);
        } else if (e.keyCode === 13) {
            renameFolderConfirm();
        }
    };

    const renameFolderConfirm = useCallback(() => {
        if (currentRepoKey && currentFolderKey) {
            const folder_info = ipcRenderer.sendSync('readJson', {
                file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
            });
            folder_info.folder_name = curFolderName;
            ipcRenderer.sendSync('writeJson', {
                file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
                obj: folder_info,
            });
            updateRepos('folder', {
                data_path: curDataPath,
                repo_key: currentRepoKey,
                folder_key: currentFolderKey,
            });
            setRenamePopUp(false);
        }
    }, [curDataPath, currentRepoKey, currentFolderKey, curFolderName, setRenamePopUp, updateRepos]);

    // part3 : delete folder
    const deleteFolder = () => {
        setDeletePopUp(true);
    };

    const deleteFolderConfirm = useCallback(() => {
        if (currentRepoKey && currentFolderKey) {
            const folder_info = ipcRenderer.sendSync('readJson', {
                file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
            });

            let trash = ipcRenderer.sendSync('readCson', {
                file_path: `${curDataPath}/trash.cson`,
            });

            trash = trash ? trash : {};

            folder_info.notes_key.forEach((note_key: string) => {
                const note_info = ipcRenderer.sendSync('readCson', {
                    file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
                });

                trash[
                    `${currentRepoKey}-${currentFolderKey}-${note_key}-${folder_info.notes_obj[note_key].title}`
                ] = note_info.content;
            });

            ipcRenderer.sendSync('writeCson', {
                file_path: `${curDataPath}/trash.cson`,
                obj: trash,
            });

            const repo_info = ipcRenderer.sendSync('readJson', {
                file_path: `${curDataPath}/${currentRepoKey}/repo_info.json`,
            });

            const new_folders_key: string[] = [];
            let other_folder_key = undefined;

            repo_info.folders_key.forEach((key: string, index: number) => {
                if (key === currentFolderKey) {
                    if (repo_info.folders_key.length > 1) {
                        if (index === repo_info.folders_key.length - 1) {
                            other_folder_key = repo_info.folders_key[index - 1];
                        } else {
                            other_folder_key = repo_info.folders_key[index + 1];
                        }
                    }
                } else {
                    new_folders_key.push(key);
                }
            });

            repo_info.folders_key = new_folders_key;

            ipcRenderer.sendSync('writeJson', {
                file_path: `${curDataPath}/${currentRepoKey}/repo_info.json`,
                obj: repo_info,
            });

            ipcRenderer.sendSync('remove', {
                file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}`,
            });

            updateRepos('repo', { data_path: curDataPath, repo_key: currentRepoKey });
            updateRepos('folder', {
                data_path: curDataPath,
                repo_key: currentRepoKey,
                folder_key: currentFolderKey,
            });
            repoSwitch(currentRepoKey);
            folderSwitch(currentRepoKey, other_folder_key);
            setDeletePopUp(false);
        }
    }, [
        curDataPath,
        repos_obj,
        currentRepoKey,
        currentFolderKey,
        updateRepos,
        repoSwitch,
        folderSwitch,
        setDeletePopUp,
    ]);

    const handleDeleteFolderKeyDown = useCallback(
        (e: any) => {
            if (e.keyCode === 13) {
                deleteFolderConfirm();
            } else if (e.keyCode === 27) {
                setDeletePopUp(false);
            }
        },
        [deleteFolderConfirm, setDeletePopUp]
    );

    // part4 : scroll folder
    const preFolderPage = useCallback(() => {
        if (innerRef && innerRef.current) {
            const height = innerRef.current.offsetHeight;
            const top = innerRef.current.scrollTop;
            if (top > height) {
                setFolderScrollTop(top - height + 28);
            } else {
                setFolderScrollTop(0);
            }
        }
    }, []);

    const nextFolderPage = useCallback(() => {
        if (innerRef && innerRef.current) {
            const height = innerRef.current.offsetHeight;
            const top = innerRef.current.scrollTop;
            setFolderScrollTop(top + height - 28);
        }
    }, []);

    const folderSwitchByIndex = useCallback(
        (index: number) => {
            folders_key?.forEach((key: string, i: number) => {
                if (index === i) {
                    folderSwitch(currentRepoKey, key);
                }
            });
        },
        [curDataPath, folders_key, folderSwitch]
    );

    useEffect(() => {
        if (innerRef && innerRef.current) {
            innerRef.current.scrollTop = folderScrollTop;
        }
    }, [folderScrollTop]);

    useEffect(() => {
        if (numArray.length === 2) {
            let new_index = -1;

            if (numArray[0] >= 65 && numArray[0] <= 72) {
                if (numArray[1] >= 48 && numArray[1] <= 57) {
                    new_index = (numArray[0] - 65) * 10 + (numArray[1] - 48);
                }
            } else if (numArray[0] >= 75 && numArray[0] <= 89) {
                if (numArray[1] >= 48 && numArray[1] <= 57) {
                    new_index = (numArray[0] - 65 - 4) * 10 + (numArray[1] - 48);
                }
            }

            if (new_index !== -1) {
                folderSwitchByIndex(new_index);
                if (innerRef && innerRef.current) {
                    const height = innerRef.current.offsetHeight;
                    let offset = new_index * 32 - height / 4;
                    if (offset < 0) offset = 0;
                    setFolderScrollTop(offset);
                }
            }
            setNumArray([]);
        }
    }, [numArray, folderSwitchByIndex]);

    useEffect(() => {
        if (numArray.length === 1) {
            setNumArray([]);
        }
    }, [currentRepoKey, currentFolderKey]);

    // part5 : key event
    const handleKeyDown = useCallback(
        (e: any) => {
            if (
                process.platform === 'darwin' ||
                process.platform === 'win32' ||
                process.platform === 'linux'
            ) {
                const modKey = process.platform === 'darwin' ? e.metaKey : e.ctrlKey;

                if (e.keyCode === 78 && modKey && e.shiftKey) {
                    newFolder();
                }

                // arrow bottom 40 or K 75
                if ((e.keyCode === 40 || e.keyCode === 75) && modKey && keySelect) {
                    nextFolderPage();
                }

                // arrow top 38 or I 73
                if ((e.keyCode === 38 || e.keyCode === 73) && modKey && keySelect) {
                    preFolderPage();
                }
            }
        },
        [numArray, keySelect, folders_key, nextFolderPage, preFolderPage]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    // part5 : drag sort
    const handleDragStart = (e: any) => {
        setActiveId(e.active.id);
    };

    const handleDragEnd = useCallback(
        (e: any) => {
            setActiveId(null);
            const { active, over } = e;

            if (!over) return;

            if (active.id !== over.id && folders_key && currentRepoKey) {
                const oldIndex = folders_key.indexOf(active.id);
                const newIndex = folders_key.indexOf(over.id);
                const new_folders_key: string[] = arrayMove(folders_key, oldIndex, newIndex);
                reorderFolder(curDataPath, currentRepoKey, new_folders_key);
            }
        },
        [curDataPath, currentRepoKey, folders_key, reorderFolder]
    );

    const genAlphaCode1 = (order: number): number => {
        if (order <= 8 * 10) {
            return Math.ceil(order / 10) + 64;
        } else {
            return 4 + Math.ceil(order / 10) + 64;
        }
    };

    const genNumberCode2 = (order: number): number => {
        return (order % 10 === 0 ? 10 : order % 10) + 47;
    };

    return (
        <FolderListContainer width={width}>
            {dataPathChangeFlag > 0 ? (
                <FolderTopBar>
                    <CategoryIcon>
                        <CategoryIconImg src={categoryIcon} alt="" />
                    </CategoryIcon>
                    <FolderTopTitle className="title-1-color">分类</FolderTopTitle>
                </FolderTopBar>
            ) : (
                <></>
            )}
            {folders_key && folders_obj ? (
                <DndContext
                    sensors={sensors}
                    modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={folders_key} strategy={verticalListSortingStrategy}>
                        <Folders ref={innerRef} key={currentRepoKey}>
                            {folders_key
                                .filter((key: string) => folders_obj && folders_obj[key])
                                .map((key: string, index: number) => {
                                    return (
                                        <Sortable key={key} id={key}>
                                            <FolderItem
                                                key={`item-${key}`}
                                                className={
                                                    currentFolderKey === key
                                                        ? 'item-selected item-selected-color item-hover-color'
                                                        : 'item-hover-color'
                                                }
                                                onClick={() => {
                                                    if (currentFolderKey !== key) {
                                                        folderSwitch(currentRepoKey, key);
                                                    }
                                                }}
                                                onContextMenu={() => {
                                                    if (currentFolderKey !== key) {
                                                        folderSwitch(currentRepoKey, key);
                                                    }
                                                }}
                                            >
                                                <FolderIcon>
                                                    <FolderIconImg src={folderIcon} alt="" />
                                                </FolderIcon>
                                                <FolderName>
                                                    {folders_obj[key].folder_name}
                                                </FolderName>
                                                {keySelect &&
                                                currentFolderKey !== key &&
                                                index < 21 * 10 ? (
                                                    <FolderKeyTab className="key-tab-color">
                                                        <span
                                                            style={{
                                                                color:
                                                                    numArray.length >= 1 &&
                                                                    numArray[0] ===
                                                                        genAlphaCode1(index + 1)
                                                                        ? '#E9E9E9'
                                                                        : '',
                                                            }}
                                                        >
                                                            {String.fromCharCode(
                                                                genAlphaCode1(index + 1)
                                                            )}
                                                        </span>
                                                        <span
                                                            style={{
                                                                color:
                                                                    numArray.length === 2 &&
                                                                    numArray[1] ===
                                                                        genNumberCode2(index + 1)
                                                                        ? '#E9E9E9'
                                                                        : '',
                                                            }}
                                                        >
                                                            {String.fromCharCode(
                                                                genNumberCode2(index + 1)
                                                            )}
                                                        </span>
                                                    </FolderKeyTab>
                                                ) : (
                                                    <></>
                                                )}
                                            </FolderItem>
                                        </Sortable>
                                    );
                                })}
                            {menu && currentFolderKey ? (
                                <MenuUl top={yPos} left={xPos} className="menu-ui-color">
                                    <MenuLi
                                        className="menu-li-color"
                                        onClick={() => renameFolder()}
                                    >
                                        重命名
                                    </MenuLi>
                                    <MenuLi
                                        className="menu-li-color"
                                        onClick={() => deleteFolder()}
                                    >
                                        删除文件夹
                                    </MenuLi>
                                </MenuUl>
                            ) : (
                                <></>
                            )}
                            {curDataPath && !newFolderKey ? (
                                <FolderAddBtn onClick={() => newFolder()}>
                                    <img src={newFolderIcon} alt="" />
                                </FolderAddBtn>
                            ) : (
                                <div></div>
                            )}
                            {newFolderKey ? (
                                <TextInput
                                    key={newFolderKey}
                                    value={newFolderName}
                                    className="folder-name-input"
                                    placeholder="输入新的分类名"
                                    autoFocus={true}
                                    onBlur={(e) => newFolderConfirm(e, newFolderKey)}
                                    onChange={(e) => newFolderInputChange(e)}
                                    onKeyDown={(e) => newFolderInputEnter(e, newFolderKey)}
                                />
                            ) : (
                                <div></div>
                            )}
                        </Folders>
                    </SortableContext>
                    <DragOverlay>
                        <div>
                            {activeId && folders_obj && folders_obj[activeId] ? (
                                <FolderItem
                                    key={activeId}
                                    className={
                                        currentFolderKey === activeId
                                            ? 'item-selected item-selected-color item-hover-color'
                                            : 'item-hover-color'
                                    }
                                >
                                    <FolderIcon>
                                        <FolderIconImg src={folderIcon} alt="" />
                                    </FolderIcon>
                                    <FolderName>
                                        {folders_obj[activeId as string].folder_name}
                                    </FolderName>
                                </FolderItem>
                            ) : null}
                        </div>
                    </DragOverlay>
                </DndContext>
            ) : (
                <></>
            )}
            <AlertPopUp
                popupState={deletePopup}
                maskState={deleteMask}
                title="提示"
                content={`即将删除文件夹「${
                    folders_obj && currentFolderKey && folders_obj[currentFolderKey]
                        ? folders_obj[currentFolderKey].folder_name
                        : ''
                }」内所有笔记，不可撤销(但内容可在废纸篓找回)`}
                onCancel={() => setDeletePopUp(false)}
                onConfirm={deleteFolderConfirm}
                onKeyDown={handleDeleteFolderKeyDown}
            ></AlertPopUp>
            <InputPopUp
                popupState={renamePopup}
                maskState={renameMask}
                initValue={curFolderName}
                setValue={setCurFolderName}
                onCancel={() => setRenamePopUp(false)}
                onConfirm={renameFolderConfirm}
                onKeyDown={handleRenameFolderKeyDown}
            ></InputPopUp>
        </FolderListContainer>
    );
};

const FolderListContainer = styled.div(
    {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: '60px',
        padding: '0 0 20px 16px',
        boxSizing: 'border-box',
    },
    (props: { width: number }) => ({
        width: props.width,
    })
);

const FolderTopBar = styled.div({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '30px 16px 20px 6px',
});

const CategoryIcon = styled.div({
    width: '18px',
    height: '18px',
    marginRight: '12px',
});

const CategoryIconImg = styled.img({
    width: '18px',
    height: '18px',
});

const FolderTopTitle = styled.div({
    height: '18px',
    lineHeight: '18px',
});

const Folders = styled.div(
    {
        width: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        flex: '1',
        minHeight: '0',
        paddingBottom: '56px',
        scrollBehavior: 'smooth',
    },
    `
    &::-webkit-scrollbar {
        display: none;
    }
`
);

const FolderItem = styled.div({
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    height: '30px',
    lineHeight: '30px',
    fontSize: '15px',
    margin: '0 10px 5px 0',
    padding: '0 0 0 8px',
    cursor: 'pointer',
});

const FolderIcon = styled.div({
    display: 'flex',
    width: '14px',
    height: '14px',
    marginRight: '12px',
});

const FolderIconImg = styled.img({
    width: '14px',
    height: '14px',
});

const FolderName = styled.div({
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

const FolderKeyTab = styled.div({
    position: 'absolute',
    top: '4px',
    right: '8px',
    width: '16px',
    height: '12px',
    lineHeight: '12px',
    fontSize: '12px',
    letterSpacing: '1px',
    padding: '2px 4px',
    borderRadius: '4px',
});

const MenuUl = styled.ul(
    {
        listStyleType: 'none',
        position: 'fixed',
        padding: '4px 0',
        zIndex: '4000',
    },
    (props: { top: string; left: string }) => ({
        top: props.top,
        left: props.left,
    })
);

const MenuLi = styled.li({
    padding: '0 22px',
    fontSize: '12px',
    lineHeight: '22px',
    cursor: 'pointer',
});

const FolderAddBtn = styled.div({
    width: '16px',
    height: '14px',
    margin: '6px 0 0 0',
    padding: '8px 10px 10px 8px',
    display: 'flex',
    alignItem: 'center',
    color: '#939395',
    cursor: 'pointer',
});

export default FolderList;
