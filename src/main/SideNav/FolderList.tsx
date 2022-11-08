import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
        folderSwitch,
        noteSwitch,
        whalenote,
        newFolder,
        newNote,
        renameFolder,
        deleteFolder,
        currentRepoKey,
        currentFolderKey,
        reorderFolder,
        changeNotesAfterNew,
        numArray,
        setNumArray,
        setFocus,
        keySelect,
        platformName,
    } = useContext(GlobalContext);

    const folders_key = useMemo(() => {
        return whalenote.repos_obj ? whalenote.repos_obj[currentRepoKey]?.folders_key : undefined;
    }, [whalenote, currentRepoKey, currentFolderKey]);
    const folders_obj = useMemo(() => {
        return whalenote.repos_obj ? whalenote.repos_obj[currentRepoKey]?.folders_obj : undefined;
    }, [whalenote, currentRepoKey, currentFolderKey]);

    const [activeId, setActiveId] = useState(null);
    const [newFolderKey, setNewFolderKey] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [curFolderName, setCurFolderName] = useState('');
    const [folderScrollTop, setFolderScrollTop] = useState(0);
    const allowNewFolder = useRef(true);
    const composing = useRef(false);

    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));
    const [deletePopup, setDeletePopUp, deleteMask] = usePopUp(500);
    const [renamePopup, setRenamePopUp, renameMask] = usePopUp(500);

    const innerRef = useRef<HTMLDivElement>(null);
    const { xPos, yPos, menu } = useContextMenu(innerRef);

    // part1 : new folder
    const handleNewFolder = () => {
        const folder_key = cryptoRandomString({
            length: 12,
            type: 'alphanumeric',
        });
        setNewFolderKey(folder_key);
    };

    const newFolderConfirm = useCallback(
        async (e: any, folder_key: string) => {
            if (e.target.value === '') {
                setNewFolderKey('');
                setNewFolderName('');
                return;
            }
            if (!allowNewFolder.current) return;
            allowNewFolder.current = false;

            if (!currentRepoKey) return;

            const note_key = cryptoRandomString({
                length: 12,
                type: 'alphanumeric',
            });

            await newFolder(curDataPath, currentRepoKey, folder_key, e.target.value);
            await changeNotesAfterNew('folder', {
                data_path: curDataPath,
                repo_key: currentRepoKey,
                folder_key,
            });

            await newNote(curDataPath, currentRepoKey, folder_key, note_key, '新建文档');
            await changeNotesAfterNew('note', {
                data_path: curDataPath,
                repo_key: currentRepoKey,
                folder_key,
                note_key,
            });

            await noteSwitch(currentRepoKey, folder_key, note_key);

            const note_info = {
                createAt: new Date(),
                updatedAt: new Date(),
                type: 'markdown',
                content: '',
            };

            await window.electronAPI.writeCson({
                file_path: `${curDataPath}/${currentRepoKey}/${folder_key}/${note_key}.cson`,
                obj: note_info,
            });

            setNewFolderKey('');
            setNewFolderName('');
            setTimeout(() => {
                setFocus(
                    cryptoRandomString({
                        length: 24,
                        type: 'alphanumeric',
                    })
                );
            }, 500);
            allowNewFolder.current = true;
        },
        [curDataPath, currentRepoKey, newFolder, changeNotesAfterNew, folderSwitch, setFocus]
    );

    const handleNewFolderKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
                setNewFolderKey('');
                setNewFolderName('');
            } else if (!composing.current && e.key === 'Enter') {
                newFolderConfirm(e, newFolderKey);
            }
        },
        [setNewFolderKey, setNewFolderName, newFolderConfirm, newFolderKey]
    );

    // part2 : rename folder
    useEffect(() => {
        setCurFolderName(
            folders_obj && currentFolderKey && folders_obj[currentFolderKey]
                ? folders_obj[currentFolderKey].folder_name
                : ''
        );
    }, [folders_obj, currentFolderKey]);

    const handleRenameFolder = useCallback(() => {
        setRenamePopUp(true);
    }, [setRenamePopUp]);

    const renameFolderConfirm = useCallback(async () => {
        if (currentRepoKey && currentFolderKey) {
            await renameFolder(curDataPath, currentRepoKey, currentFolderKey, curFolderName);
            setRenamePopUp(false);
        }
    }, [curDataPath, currentRepoKey, currentFolderKey, curFolderName, setRenamePopUp]);

    // part3 : delete folder
    const handleDeleteFolder = () => {
        setDeletePopUp(true);
    };

    const deleteFolderConfirm = useCallback(async () => {
        if (currentRepoKey && currentFolderKey) {
            const next_folder_key = await deleteFolder(
                curDataPath,
                currentRepoKey,
                currentFolderKey
            );
            await folderSwitch(currentRepoKey, next_folder_key);
            setDeletePopUp(false);
        }
    }, [curDataPath, whalenote, currentRepoKey, currentFolderKey, folderSwitch, setDeletePopUp]);

    const handleDeleteFolderKeyDown = useCallback(
        (e: any) => {
            if (e.key === 'Enter') {
                deleteFolderConfirm();
            } else if (e.key === 'Escape') {
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
        async (e: any) => {
            if (platformName === 'darwin' || platformName === 'win32' || platformName === 'linux') {
                const modKey = platformName === 'darwin' ? e.metaKey : e.ctrlKey;

                if (e.keyCode === 78 && modKey && e.shiftKey) {
                    handleNewFolder();
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
        document.addEventListener('compositionstart', () => {
            composing.current = true;
        });
        document.addEventListener('compositionend', () => {
            composing.current = false;
        });
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('compositionstart', () => {
                composing.current = true;
            });
            document.removeEventListener('compositionend', () => {
                composing.current = false;
            });
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
                    <FolderTopTitle>分类</FolderTopTitle>
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
                                                    currentFolderKey === key ? 'item-selected' : ''
                                                }
                                                style={
                                                    currentFolderKey === key
                                                        ? {
                                                              backgroundColor:
                                                                  'var(--main-selected-bg-color)',
                                                          }
                                                        : {}
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
                                                    <FolderKeyTab>
                                                        <span
                                                            style={{
                                                                color:
                                                                    numArray.length >= 1 &&
                                                                    numArray[0] ===
                                                                        genAlphaCode1(index + 1)
                                                                        ? 'var(--main-text-selected-color)'
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
                                                                        ? 'var(--main-text-selected-color)'
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
                                <MenuUl top={yPos} left={xPos}>
                                    <MenuLi
                                        className="menu-li-color"
                                        onClick={() => handleRenameFolder()}
                                    >
                                        重命名
                                    </MenuLi>
                                    <MenuLi
                                        className="menu-li-color"
                                        onClick={() => handleDeleteFolder()}
                                    >
                                        删除文件夹
                                    </MenuLi>
                                </MenuUl>
                            ) : (
                                <></>
                            )}
                            {curDataPath && !newFolderKey ? (
                                <FolderAddBtn onClick={() => handleNewFolder()}>
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
                                    onChange={(e: any) => {
                                        setNewFolderName(e.target.value);
                                    }}
                                    onKeyDown={handleNewFolderKeyDown}
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
                                    className={currentFolderKey === activeId ? 'item-selected' : ''}
                                    style={
                                        currentFolderKey === activeId
                                            ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                            : {}
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
                onKeyDown={(e: any) => {
                    if (e.key === 'Escape') {
                        setRenamePopUp(false);
                    } else if (!composing.current && e.key === 'Enter') {
                        renameFolderConfirm();
                    }
                }}
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
    color: 'var(--main-text-title-color)',
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

const FolderItem = styled.div(
    {
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        height: '30px',
        lineHeight: '30px',
        fontSize: '15px',
        margin: '0 10px 5px 0',
        padding: '0 0 0 8px',
        cursor: 'pointer',
    },
    `
    &:hover {
        color: var(--main-text-hover-color);
    }
`
);

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
    backgroundColor: 'var(--key-tab-bg-color)',
});

const MenuUl = styled.ul(
    {
        listStyleType: 'none',
        position: 'fixed',
        padding: '4px',
        borderRadius: '5px',
        zIndex: '4000',
        border: '1px solid var(--menu-border-color)',
        color: 'var(--menu-text-color)',
        backgroundColor: 'var(--menu-bg-color)',
    },
    (props: { top: string; left: string }) => ({
        top: props.top,
        left: props.left,
    })
);

const MenuLi = styled.li(
    {
        padding: '0 10px',
        fontSize: '13px',
        fontWeight: '500',
        lineHeight: '22px',
        letterSpacing: '1px',
        cursor: 'pointer',
    },
    `
    &:hover {
        border-radius: 4px;
        background-color: var(--menu-hover-color);
    }
`
);

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
