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
import { parse as pathParse } from 'path-browserify';
import { activeWhaleIdAtom } from '@/atoms';
import { useAtomValue } from 'jotai';
import { useDataContext } from '@/context/DataProvider';

const FolderList: React.FC<{}> = ({}) => {
    const id = useAtomValue(activeWhaleIdAtom);

    const {
        keySelectNumArray,
        platformName,
        showKeySelect,
        manualFocus,
        setKeySelectNumArray,
        setShowRepoPanel,
    } = useContext(GlobalContext);

    const {
        curDataPath,
        whalesnote,
        newFolder,
        newNote,
        renameFolder,
        reorderFolder,
        deleteFolder,
        curRepoKey,
        curFolderKey,
        switchFolder,
        switchNote,
        prepareContent,
    } = useDataContext();

    const { t } = useTranslation();

    const folder_keys = useMemo(() => {
        return whalesnote.repo_map ? whalesnote.repo_map[curRepoKey]?.folder_keys : undefined;
    }, [whalesnote, curRepoKey, curFolderKey]);
    const folder_map = useMemo(() => {
        return whalesnote.repo_map ? whalesnote.repo_map[curRepoKey]?.folder_map : undefined;
    }, [whalesnote, curRepoKey, curFolderKey]);

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

            if (!curRepoKey) return;

            const note_key = cryptoRandomString({
                length: 12,
                type: 'alphanumeric',
            });

            await newFolder(id, curRepoKey, folder_key, e.target.value);
            await newNote(id, curRepoKey, folder_key, note_key, t('note.untitled'));
            await prepareContent(curRepoKey, folder_key, note_key);
            await switchNote(curRepoKey, folder_key, note_key);

            const note_content = '';

            await window.electronAPI.writeStr(
                `${id}/${curRepoKey}/${folder_key}/${note_key}.md`,
                note_content,
            );

            setNewFolderKey('');
            setNewFolderName('');
            manualFocus(500);
            allowNewFolder.current = true;
        },
        [id, curRepoKey, newFolder, newNote, prepareContent, switchNote, manualFocus],
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
        [setNewFolderKey, setNewFolderName, newFolderConfirm, newFolderKey],
    );

    // part2 : rename folder
    useEffect(() => {
        setCurFolderName(
            folder_map && curFolderKey && folder_map[curFolderKey]
                ? folder_map[curFolderKey].folder_name
                : '',
        );
    }, [folder_map, curFolderKey]);

    const handleRenameFolder = useCallback(() => {
        setRenamePopUp(true);
    }, [setRenamePopUp]);

    const renameFolderConfirm = useCallback(async () => {
        if (curRepoKey && curFolderKey) {
            await renameFolder(id, curRepoKey, curFolderKey, curFolderName);
            setRenamePopUp(false);
        }
    }, [id, curRepoKey, curFolderKey, curFolderName, setRenamePopUp]);

    // part3 : delete folder
    const handleDeleteFolder = () => {
        setDeletePopUp(true);
    };

    const deleteFolderConfirm = useCallback(async () => {
        if (curRepoKey && curFolderKey) {
            const next_folder_key = await deleteFolder(id, curRepoKey, curFolderKey);
            await switchFolder(curRepoKey, next_folder_key);
            setDeletePopUp(false);
        }
    }, [id, whalesnote, curRepoKey, curFolderKey, switchFolder, setDeletePopUp]);

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
            folder_keys?.forEach((key: string, i: number) => {
                if (index === i) {
                    switchFolder(curRepoKey, key);
                }
            });
        },
        [id, folder_keys, switchFolder],
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
    }, [curRepoKey, curFolderKey]);

    // part5 : batch import markdown file
    const loadMarkdowns = useCallback(
        async (paths: string[]) => {
            for await (const path of paths) {
                let content = await window.electronAPI.readMdSync(path);

                const file_name = pathParse(path).name;
                if (content) {
                    const index = content.indexOf('\n');
                    if (index !== -1) {
                        const new_note_key = cryptoRandomString({
                            length: 12,
                            type: 'alphanumeric',
                        });
                        let new_note_title = file_name;
                        const first_line = content.substring(0, index);
                        if (first_line.indexOf('# ') !== -1) {
                            new_note_title = first_line.replace(/^[#\-\_*>\s]+/g, '');
                        } else if (first_line.indexOf(file_name) === -1) {
                            content = '# ' + file_name + '\n\n' + content;
                        }

                        await newNote(id, curRepoKey, curFolderKey, new_note_key, new_note_title);
                        await updateNote(
                            id,
                            curDataPath,
                            curRepoKey,
                            curFolderKey,
                            new_note_key,
                            content,
                        );
                    }
                }
            }
        },
        [id, curDataPath, curRepoKey, curFolderKey, newNote, updateNote],
    );

    const handleBatchImport = useCallback(async () => {
        const paths = await window.electronAPI.openSelectMarkdownsDialog(['md']);
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
        [keySelectNumArray, showKeySelect, folder_keys, nextFolderPage, preFolderPage],
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
        [setDragActiveId],
    );

    const handleDragEnd = useCallback(
        (e: DragEndEvent) => {
            setDragActiveId(null);
            const { active, over } = e;
            if (!over) return;
            if (active.id !== over.id && folder_keys && curRepoKey) {
                const oldIndex = folder_keys.indexOf(active.id as string);
                const newIndex = folder_keys.indexOf(over.id as string);
                const new_folder_keys: string[] = arrayMove(folder_keys, oldIndex, newIndex);
                reorderFolder(id, curRepoKey, new_folder_keys);
            }
        },
        [id, curRepoKey, folder_keys, reorderFolder, setDragActiveId],
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
            {folder_keys && folder_map ? (
                <DndContext
                    sensors={sensors}
                    modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={folder_keys} strategy={verticalListSortingStrategy}>
                        <Folders ref={innerRef} key={curRepoKey}>
                            {folder_keys
                                .filter((key: string) => folder_map && folder_map[key])
                                .map((key: string, index: number) => {
                                    return (
                                        <Sortable key={key} id={key}>
                                            <FolderItemBox
                                                key={`item-${key}`}
                                                onClick={() => {
                                                    if (curFolderKey !== key) {
                                                        switchFolder(curRepoKey, key);
                                                    }
                                                }}
                                                onContextMenu={() => {
                                                    if (curFolderKey !== key) {
                                                        switchFolder(curRepoKey, key);
                                                    }
                                                }}
                                            >
                                                <FolderItem
                                                    className={
                                                        curFolderKey === key ? 'item-selected' : ''
                                                    }
                                                    style={
                                                        curFolderKey === key
                                                            ? {
                                                                  backgroundColor:
                                                                      'var(--second-selected-bg-color)',
                                                              }
                                                            : {}
                                                    }
                                                >
                                                    <FolderIcon>
                                                        <FolderIconImg src={folderIcon} alt="" />
                                                    </FolderIcon>
                                                    <FolderName>
                                                        {folder_map[key].folder_name}
                                                    </FolderName>
                                                    {showKeySelect &&
                                                    curFolderKey !== key &&
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
                                                                    genAlphaCode1(index + 1),
                                                                )}
                                                            </span>
                                                            <span
                                                                style={{
                                                                    color:
                                                                        keySelectNumArray.length ===
                                                                            2 &&
                                                                        keySelectNumArray[1] ===
                                                                            genNumberCode2(
                                                                                index + 1,
                                                                            )
                                                                            ? 'var(--main-text-selected-color)'
                                                                            : '',
                                                                }}
                                                            >
                                                                {String.fromCharCode(
                                                                    genNumberCode2(index + 1),
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
                            {menu && curFolderKey ? (
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
                            {id && !newFolderKey ? (
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
                            {folder_map && folder_map[dragActiveId as string] ? (
                                <FolderItemBox>
                                    <FolderItem
                                        key={dragActiveId}
                                        className={
                                            curFolderKey === dragActiveId ? 'item-selected' : ''
                                        }
                                        style={
                                            curFolderKey === dragActiveId
                                                ? {
                                                      backgroundColor:
                                                          'var(--second-selected-bg-color)',
                                                  }
                                                : {}
                                        }
                                    >
                                        <FolderIcon>
                                            <FolderIconImg src={folderIcon} alt="" />
                                        </FolderIcon>
                                        <FolderName>
                                            {folder_map[dragActiveId as string].folder_name}
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
                    folder_map && curFolderKey && folder_map[curFolderKey]
                        ? folder_map[curFolderKey].folder_name
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
`,
);

const FolderItemBox = styled.div(
    {
        padding: '3px 9px 2px 0',
        overflow: 'hidden',
    },
    `
    &:hover {
        color: var(--main-text-hover-color);
    }
`,
);

const FolderItem = styled.div({
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    height: '30px',
    lineHeight: '30px',
    fontSize: '14px',
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
    }),
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
`,
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
