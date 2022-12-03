import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import { useTranslation } from 'react-i18next';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';
import {
    DndContext,
    MouseSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { updateNote } from '../../lib/notes';

import { Sortable } from '../../components/Sortable';
import { TextInput } from '../../components/TextInput';
import { AlertPopUp } from '../../components/AlertPopUp';
import { InputPopUp } from '../../components/InputPopUp';
import { usePopUp } from '../../lib/usePopUp';
import useContextMenu from '../../lib/useContextMenu';
import categoryIcon from '../../resources/icon/categoryIcon.svg';
import folderIcon from '../../resources/icon/folderIcon.svg';

const FolderList: React.FC<{}> = ({}) => {
    const {
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        keySelectNumArray,
        platformName,
        showKeySelect,
        whalesnote,
        changeNotesAfterNew,
        deleteFolder,
        manualFocus,
        newFolder,
        newNote,
        renameFolder,
        reorderFolder,
        setKeySelectNumArray,
        switchFolder,
        switchNote,
        setShowRepoPanel,
    } = useContext(GlobalContext);
    const { t } = useTranslation();

    const folders_key = useMemo(() => {
        return whalesnote.repos_obj ? whalesnote.repos_obj[currentRepoKey]?.folders_key : undefined;
    }, [whalesnote, currentRepoKey, currentFolderKey]);
    const folders_obj = useMemo(() => {
        return whalesnote.repos_obj ? whalesnote.repos_obj[currentRepoKey]?.folders_obj : undefined;
    }, [whalesnote, currentRepoKey, currentFolderKey]);

    const [dragActiveId, setDragActiveId] = useState<string | null>(null);
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

            await newNote(curDataPath, currentRepoKey, folder_key, note_key, t('note.untitled'));
            await changeNotesAfterNew('note', {
                data_path: curDataPath,
                repo_key: currentRepoKey,
                folder_key,
                note_key,
            });

            await switchNote(currentRepoKey, folder_key, note_key);

            const note_content = '';

            await window.electronAPI.writeMd({
                file_path: `${curDataPath}/${currentRepoKey}/${folder_key}/${note_key}.md`,
                str: note_content,
            });

            setNewFolderKey('');
            setNewFolderName('');
            manualFocus(500);
            allowNewFolder.current = true;
        },
        [curDataPath, currentRepoKey, newFolder, changeNotesAfterNew, switchFolder, manualFocus]
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
            await switchFolder(currentRepoKey, next_folder_key);
            setDeletePopUp(false);
        }
    }, [curDataPath, whalesnote, currentRepoKey, currentFolderKey, switchFolder, setDeletePopUp]);

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
                    switchFolder(currentRepoKey, key);
                }
            });
        },
        [curDataPath, folders_key, switchFolder]
    );

    useEffect(() => {
        if (innerRef && innerRef.current) {
            innerRef.current.scrollTop = folderScrollTop;
        }
    }, [folderScrollTop]);

    useEffect(() => {
        if (keySelectNumArray.length === 2) {
            let new_index = -1;

            if (keySelectNumArray[0] >= 65 && keySelectNumArray[0] <= 72) {
                if (keySelectNumArray[1] >= 48 && keySelectNumArray[1] <= 57) {
                    new_index = (keySelectNumArray[0] - 65) * 10 + (keySelectNumArray[1] - 48);
                }
            } else if (keySelectNumArray[0] >= 75 && keySelectNumArray[0] <= 89) {
                if (keySelectNumArray[1] >= 48 && keySelectNumArray[1] <= 57) {
                    new_index = (keySelectNumArray[0] - 65 - 4) * 10 + (keySelectNumArray[1] - 48);
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
            setKeySelectNumArray([]);
        }
    }, [keySelectNumArray, folderSwitchByIndex]);

    useEffect(() => {
        if (keySelectNumArray.length === 1) {
            setKeySelectNumArray([]);
        }
    }, [currentRepoKey, currentFolderKey]);

    // part5 : batch import markdown file
    const loadMarkdowns = useCallback(
        async (paths: string[]) => {
            for await (const path of paths) {
                const content = await window.electronAPI.readMdSync({
                    file_path: path,
                });
                if (content) {
                    const index = content.indexOf('\n');
                    if (index !== -1) {
                        const new_note_key = cryptoRandomString({
                            length: 12,
                            type: 'alphanumeric',
                        });
                        const new_note_title = content
                            .substring(0, index)
                            .replace(/^[#\-\_*>\s]+/g, '');
                        await newNote(
                            curDataPath,
                            currentRepoKey,
                            currentFolderKey,
                            new_note_key,
                            new_note_title
                        );
                        await updateNote(
                            curDataPath,
                            currentRepoKey,
                            currentFolderKey,
                            new_note_key,
                            content
                        );
                    }
                }
            }
        },
        [curDataPath, currentRepoKey, currentFolderKey, newNote, updateNote]
    );

    const handleBatchImport = useCallback(async () => {
        const paths = await window.electronAPI.openSelectMarkdownsDialog({
            file_types: ['md'],
        });
        if (paths.length > 0) await loadMarkdowns(paths);
    }, [loadMarkdowns]);

    // part6 : key event
    const handleKeyDown = useCallback(
        async (e: KeyboardEvent) => {
            if (platformName === 'darwin' || platformName === 'win32' || platformName === 'linux') {
                const modKey = platformName === 'darwin' ? e.metaKey : e.ctrlKey;

                if (e.key === 'n' && modKey && e.shiftKey) {
                    handleNewFolder();
                }

                // arrow down or K
                if ((e.key === 'ArrowDown' || e.key === 'k') && modKey && showKeySelect) {
                    nextFolderPage();
                }

                // arrow up or I
                if ((e.key === 'ArrowUp' || e.key === 'i') && modKey && showKeySelect) {
                    preFolderPage();
                }
            }
        },
        [keySelectNumArray, showKeySelect, folders_key, nextFolderPage, preFolderPage]
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
    const handleDragStart = useCallback(
        (e: DragStartEvent) => {
            setDragActiveId(String(e.active.id));
        },
        [setDragActiveId]
    );

    const handleDragEnd = useCallback(
        (e: DragEndEvent) => {
            setDragActiveId(null);
            const { active, over } = e;
            if (!over) return;
            if (active.id !== over.id && folders_key && currentRepoKey) {
                const oldIndex = folders_key.indexOf(active.id);
                const newIndex = folders_key.indexOf(over.id);
                const new_folders_key: string[] = arrayMove(folders_key, oldIndex, newIndex);
                reorderFolder(curDataPath, currentRepoKey, new_folders_key);
            }
        },
        [curDataPath, currentRepoKey, folders_key, reorderFolder, setDragActiveId]
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
        <FolderListContainer>
            <FolderTopBar>
                <CategoryIcon>
                    <CategoryIconImg src={categoryIcon} alt="" />
                </CategoryIcon>
                <FolderTopTitle>{t('category.title')}</FolderTopTitle>
            </FolderTopBar>
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
                                            <FolderItemBox
                                                key={`item-${key}`}
                                                onClick={() => {
                                                    if (currentFolderKey !== key) {
                                                        switchFolder(currentRepoKey, key);
                                                    }
                                                }}
                                                onContextMenu={() => {
                                                    if (currentFolderKey !== key) {
                                                        switchFolder(currentRepoKey, key);
                                                    }
                                                }}
                                            >
                                                <FolderItem
                                                    className={
                                                        currentFolderKey === key
                                                            ? 'item-selected'
                                                            : ''
                                                    }
                                                    style={
                                                        currentFolderKey === key
                                                            ? {
                                                                  backgroundColor:
                                                                      'var(--main-selected-bg-color)',
                                                              }
                                                            : {}
                                                    }
                                                >
                                                    <FolderIcon>
                                                        <FolderIconImg src={folderIcon} alt="" />
                                                    </FolderIcon>
                                                    <FolderName>
                                                        {folders_obj[key].folder_name}
                                                    </FolderName>
                                                    {showKeySelect &&
                                                    currentFolderKey !== key &&
                                                    index < 21 * 10 ? (
                                                        <FolderKeyTab>
                                                            <span
                                                                style={{
                                                                    color:
                                                                        keySelectNumArray.length >=
                                                                            1 &&
                                                                        keySelectNumArray[0] ===
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
                                                                        keySelectNumArray.length ===
                                                                            2 &&
                                                                        keySelectNumArray[1] ===
                                                                            genNumberCode2(
                                                                                index + 1
                                                                            )
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
                                            </FolderItemBox>
                                        </Sortable>
                                    );
                                })}
                            {menu && currentFolderKey ? (
                                <MenuUl top={yPos} left={xPos}>
                                    <MenuLi
                                        className="menu-li-color"
                                        onClick={() => handleRenameFolder()}
                                    >
                                        {t('category.rename')}
                                    </MenuLi>
                                    <MenuLi
                                        className="menu-li-color"
                                        onClick={() => handleDeleteFolder()}
                                    >
                                        {t('category.delete')}
                                    </MenuLi>
                                    <MenuLi
                                        className="menu-li-color"
                                        onClick={() => handleBatchImport()}
                                    >
                                        {t('category.batch_import_md')}
                                    </MenuLi>
                                </MenuUl>
                            ) : (
                                <></>
                            )}
                            {curDataPath && !newFolderKey ? (
                                <FolderAddBtn
                                    className="ri-folder-add-fill"
                                    onClick={() => handleNewFolder()}
                                ></FolderAddBtn>
                            ) : (
                                <div></div>
                            )}
                            {newFolderKey ? (
                                <TextInput
                                    key={newFolderKey}
                                    value={newFolderName}
                                    className="folder-name-input"
                                    placeholder={t('category.enter_a_name') || ''}
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
                            <FoldersInnerFixedBox
                                onClick={() => {
                                    setShowRepoPanel(false);
                                }}
                            ></FoldersInnerFixedBox>
                        </Folders>
                        <FoldersBottomFlexBox
                            onClick={() => {
                                setShowRepoPanel(false);
                            }}
                        ></FoldersBottomFlexBox>
                        <FoldersBottomFixedBox
                            onClick={() => {
                                setShowRepoPanel(false);
                            }}
                        ></FoldersBottomFixedBox>
                    </SortableContext>
                    {dragActiveId ? (
                        <DragOverlay>
                            {folders_obj && folders_obj[dragActiveId as string] ? (
                                <FolderItemBox>
                                    <FolderItem
                                        key={dragActiveId}
                                        className={
                                            currentFolderKey === dragActiveId ? 'item-selected' : ''
                                        }
                                        style={
                                            currentFolderKey === dragActiveId
                                                ? {
                                                      backgroundColor:
                                                          'var(--main-selected-bg-color)',
                                                  }
                                                : {}
                                        }
                                    >
                                        <FolderIcon>
                                            <FolderIconImg src={folderIcon} alt="" />
                                        </FolderIcon>
                                        <FolderName>
                                            {folders_obj[dragActiveId as string].folder_name}
                                        </FolderName>
                                    </FolderItem>
                                </FolderItemBox>
                            ) : (
                                <></>
                            )}
                        </DragOverlay>
                    ) : (
                        <></>
                    )}
                </DndContext>
            ) : (
                <></>
            )}
            <AlertPopUp
                popupState={deletePopup}
                maskState={deleteMask}
                content={`${t('category.delete_tips_part_1')}${
                    folders_obj && currentFolderKey && folders_obj[currentFolderKey]
                        ? folders_obj[currentFolderKey].folder_name
                        : ''
                }${t('category.delete_tips_part_2')}${t('category.delete_tips_part_3')}`}
                onCancel={() => setDeletePopUp(false)}
                onConfirm={deleteFolderConfirm}
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

const FolderListContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    minWidth: '60px',
    boxSizing: 'border-box',
});

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
        boxSizing: 'border-box',
        padding: '0 0 0 16px',
        scrollBehavior: 'smooth',
    },
    `
    &::-webkit-scrollbar {
        display: none;
    }
`
);

const FolderItemBox = styled.div(
    {
        padding: '3px 10px 2px 0',
        overflow: 'hidden',
    },
    `
    &:hover {
        color: var(--main-text-hover-color);
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
    backgroundColor: 'var(--key-tab-bg-color)',
});

const FoldersInnerFixedBox = styled.div({
    height: '56px',
    minHeight: '56px',
});

const FoldersBottomFlexBox = styled.div({
    flex: '1',
    minHeight: '0',
    width: '100%',
});

const FoldersBottomFixedBox = styled.div({
    height: '70px',
    minHeight: '70px',
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
    width: '20px',
    height: '18px',
    fontSize: '17px',
    margin: '4px 0 0 2px',
    padding: '8px 10px 10px 4px',
    display: 'flex',
    alignItem: 'center',
    color: 'var(--main-folder-add-bg-color)',
    cursor: 'pointer',
});

export default FolderList;
