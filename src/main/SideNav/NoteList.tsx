import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import { DndContext, MouseSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from '@dnd-kit/modifiers';

import { Sortable } from '../../components/Sortable';
import useContextMenu from '../../lib/useContextMenu';
import newNoteIcon from '../../resources/icon/newNoteIcon.svg';

const NoteList: React.FC<{
    width: number;
}> = ({ width }) => {
    const {
        curDataPath,
        dataPathChangeFlag,
        noteSwitch,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        repos,
        reorderNote,
        changeNotesAfterNew,
        numArray,
        setNumArray,
        setFocus,
        keySelect,
        setKeySelect,
    } = useContext(GlobalContext);

    const notes_key = repos.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_key;
    const notes_obj = repos.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj;

    const [activeId, setActiveId] = useState(null);

    const [noteScrollTop, setNoteScrollTop] = useState(0);

    const outerRef = useRef<HTMLDivElement>(null);
    const { xPos, yPos, menu } = useContextMenu(outerRef);

    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));

    const notesEnd = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (notesEnd && notesEnd.current) {
            notesEnd.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const newNote = useCallback(async () => {
        const note_key = cryptoRandomString({
            length: 12,
            type: 'alphanumeric',
        });

        const folder_info = await window.electronAPI.readJson({
            file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
        });

        folder_info.notes_key.push(note_key);
        folder_info.notes_obj[note_key] = {
            title: '新建文档',
        };

        await window.electronAPI.writeJson({
            file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
            obj: folder_info,
        });

        const note_info = {
            createAt: new Date(),
            updatedAt: new Date(),
            type: 'markdown',
            content: '',
        };

        await window.electronAPI.writeCson({
            file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
            obj: note_info,
        });

        await changeNotesAfterNew('note', {
            data_path: curDataPath,
            repo_key: currentRepoKey,
            folder_key: currentFolderKey,
            note_key,
        });
        await noteSwitch(currentRepoKey, currentFolderKey, note_key);
        setTimeout(() => {
            setFocus(
                cryptoRandomString({
                    length: 24,
                    type: 'alphanumeric',
                })
            );
        }, 500);
        setTimeout(() => {
            scrollToBottom();
        }, 0);
        setKeySelect(false);
    }, [
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        changeNotesAfterNew,
        noteSwitch,
        setFocus,
        setKeySelect,
        scrollToBottom,
    ]);

    const deleteNote = useCallback(
        async (note_key: string) => {
            const folder_info = await window.electronAPI.readJson({
                file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
            });

            const note_info = await window.electronAPI.readCson({
                file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
            });

            let trash = await window.electronAPI.readCson({
                file_path: `${curDataPath}/trash.cson`,
            });

            trash = trash ? trash : {};

            trash[
                `${currentRepoKey}-${currentFolderKey}-${note_key}-${folder_info.notes_obj[note_key].title}`
            ] = note_info.content;

            await window.electronAPI.writeCson({
                file_path: `${curDataPath}/trash.cson`,
                obj: trash,
            });

            const new_notes_key: string[] = [];
            let other_note_key = undefined;

            folder_info.notes_key.forEach((key: string, index: number) => {
                if (key === note_key) {
                    if (folder_info.notes_key.length > 1) {
                        if (index === folder_info.notes_key.length - 1) {
                            other_note_key = folder_info.notes_key[index - 1];
                        } else {
                            other_note_key = folder_info.notes_key[index + 1];
                        }
                    }
                } else {
                    new_notes_key.push(key);
                }
            });

            folder_info.notes_key = new_notes_key;
            delete folder_info.notes_obj[note_key];

            await window.electronAPI.writeJson({
                file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
                obj: folder_info,
            });

            await window.electronAPI.remove({
                file_path: `${curDataPath}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
            });

            await noteSwitch(currentRepoKey, currentFolderKey, other_note_key);
        },
        [curDataPath, currentRepoKey, currentFolderKey, noteSwitch]
    );

    const preNotePage = useCallback(() => {
        if (outerRef && outerRef.current) {
            const height = outerRef.current.offsetHeight;
            const top = outerRef.current.scrollTop;
            if (top > height) {
                setNoteScrollTop(top - height + 28);
            } else {
                setNoteScrollTop(0);
            }
        }
    }, []);

    const nextNotePage = useCallback(() => {
        if (outerRef && outerRef.current) {
            const height = outerRef.current.offsetHeight;
            const top = outerRef.current.scrollTop;
            setNoteScrollTop(top + height - 28);
        }
    }, []);

    const noteSwitchByIndex = useCallback(
        async (index: number) => {
            for (const [i, key] of notes_key.entries()) {
                if (index === i) {
                    await noteSwitch(currentRepoKey, currentFolderKey, key);
                }
            }
        },
        [curDataPath, currentRepoKey, currentFolderKey, notes_key, noteSwitch]
    );

    useEffect(() => {
        if (outerRef && outerRef.current) {
            outerRef.current.scrollTop = noteScrollTop;
        }
    }, [noteScrollTop]);

    useEffect(() => {
        if (numArray.length === 2) {
            let new_index = -1;
            if (notes_key) {
                if (
                    numArray[0] >= 65 &&
                    numArray[0] <= 72 &&
                    numArray[0] < Math.ceil(notes_key.length / 22) + 65
                ) {
                    if (numArray[1] <= 72 && numArray[0] >= 65) {
                        new_index = (numArray[0] - 65) * 22 + (numArray[1] - 65);
                    } else if (numArray[1] >= 75 && numArray[1] <= 89) {
                        new_index = (numArray[0] - 65) * 22 + (numArray[1] - 65) - 4;
                    }
                } else if (
                    numArray[0] >= 75 &&
                    numArray[0] <= 89 &&
                    numArray[0] < Math.ceil(notes_key.length / 22) + 65 + 4
                ) {
                    if (numArray[1] <= 72 && numArray[1] >= 65) {
                        new_index = (numArray[0] - 65 - 4) * 22 + (numArray[1] - 65);
                    } else if (numArray[1] >= 75 && numArray[1] <= 89) {
                        new_index = (numArray[0] - 65 - 4) * 22 + (numArray[1] - 65) - 4;
                    }
                }
            }

            if (new_index !== -1) {
                noteSwitchByIndex(new_index);
                if (outerRef && outerRef.current) {
                    const height = outerRef.current.offsetHeight;
                    let offset = new_index * 36 - height / 4;
                    if (offset < 0) offset = 0;
                    setNoteScrollTop(offset);
                }
            }
            setNumArray([]);
        }
    }, [numArray, noteSwitchByIndex]);

    useEffect(() => {
        if (numArray.length === 1) {
            setNumArray([]);
        }
    }, [currentRepoKey, currentFolderKey, currentNoteKey]);

    const handleKeyDown = useCallback(
        (e: any) => {
            if (
                process.platform === 'darwin' ||
                process.platform === 'win32' ||
                process.platform === 'linux'
            ) {
                const modKey = process.platform === 'darwin' ? e.metaKey : e.ctrlKey;

                if (e.keyCode === 78 && modKey && !e.shiftKey) {
                    newNote();
                }

                // arrow bottom 40 or K 75
                if ((e.keyCode === 40 || e.keyCode === 75) && !modKey && keySelect) {
                    nextNotePage();
                }

                // arrow bottom 38 or I 73
                if ((e.keyCode === 38 || e.keyCode === 73) && !modKey && keySelect) {
                    preNotePage();
                }
            }
        },
        [keySelect, newNote, nextNotePage, preNotePage]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = useCallback(
        (event: any) => {
            setActiveId(null);
            const { active, over } = event;

            if (!over) return;

            if (
                active.id !== over.id &&
                notes_key &&
                currentRepoKey &&
                currentFolderKey &&
                currentNoteKey
            ) {
                const oldIndex = notes_key.indexOf(active.id);
                const newIndex = notes_key.indexOf(over.id);
                const new_notes_key: string[] = arrayMove(notes_key, oldIndex, newIndex);
                reorderNote(curDataPath, currentRepoKey, currentFolderKey, new_notes_key);
            }
        },
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, notes_key, reorderNote]
    );

    const genAlphaCode1 = (order: number): number => {
        if (order <= 8 * 22) {
            return Math.ceil(order / 22) + 64;
        } else {
            return 4 + Math.ceil(order / 22) + 64;
        }
    };

    const genAlphaCode2 = (order: number): number => {
        if (order % 22 <= 8) {
            return (order % 22 === 0 ? 26 : order % 22) + 64;
        } else {
            return (order % 22) + 4 + 64;
        }
    };

    return (
        <NoteListContainer width={width}>
            {dataPathChangeFlag > 0 ? (
                <NoteAddFloat>
                    <NoteAddBtn onKeyDown={(e) => handleKeyDown(e)} onClick={() => newNote()}>
                        <NewNoteIconImg src={newNoteIcon} alt="" />
                    </NoteAddBtn>
                </NoteAddFloat>
            ) : (
                <></>
            )}
            {notes_key && notes_obj ? (
                <DndContext
                    sensors={sensors}
                    modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={notes_key} strategy={verticalListSortingStrategy}>
                        <Notes ref={outerRef}>
                            {notes_key
                                .filter((key: string) => notes_obj && notes_obj[key])
                                .map((key: string, index: number) => {
                                    return (
                                        <Sortable key={key} id={key}>
                                            <NoteItem
                                                key={`item-${key}`}
                                                style={
                                                    currentNoteKey === key
                                                        ? {
                                                              backgroundColor:
                                                                  'var(--main-selected-bg-color)',
                                                          }
                                                        : {}
                                                }
                                                onClick={() =>
                                                    noteSwitch(
                                                        currentRepoKey,
                                                        currentFolderKey,
                                                        key
                                                    )
                                                }
                                                onContextMenu={() => {
                                                    if (currentNoteKey !== key)
                                                        noteSwitch(
                                                            currentRepoKey,
                                                            currentFolderKey,
                                                            key
                                                        );
                                                }}
                                            >
                                                {notes_obj[key].title}
                                                {keySelect &&
                                                currentNoteKey !== key &&
                                                index < 22 * 21 ? (
                                                    <NoteKeyTab>
                                                        <span
                                                            style={{
                                                                color:
                                                                    numArray.length >= 1 &&
                                                                    numArray[0] ===
                                                                        genAlphaCode1(index + 1)
                                                                        ? '#E9E9E9'
                                                                        : '',
                                                                width: '10px',
                                                                display: 'flex',
                                                                justifyContent: 'center',
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
                                                                        genAlphaCode2(index + 1)
                                                                        ? '#E9E9E9'
                                                                        : '',
                                                                width: '10px',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {String.fromCharCode(
                                                                genAlphaCode2(index + 1)
                                                            )}
                                                        </span>
                                                    </NoteKeyTab>
                                                ) : (
                                                    <></>
                                                )}
                                            </NoteItem>
                                        </Sortable>
                                    );
                                })}
                            {notes_key.filter((key: string) => notes_obj && notes_obj[key])
                                .length <= 1 ? (
                                <AddNotesTips>
                                    <div>点击按钮</div>
                                    <div>添加新文档</div>
                                </AddNotesTips>
                            ) : (
                                <></>
                            )}
                            <div
                                style={{
                                    clear: 'both',
                                    height: '1px',
                                    width: '100%',
                                }}
                                ref={notesEnd}
                            ></div>
                            {menu && currentNoteKey ? (
                                <MenuUl top={yPos} left={xPos}>
                                    <MenuLi
                                        className="menu-li-color"
                                        onClick={() => deleteNote(currentNoteKey)}
                                    >
                                        扔到废纸篓
                                    </MenuLi>
                                </MenuUl>
                            ) : (
                                <></>
                            )}
                        </Notes>
                    </SortableContext>
                    <DragOverlay>
                        <div>
                            {activeId && notes_obj ? (
                                <NoteItem
                                    key={activeId}
                                    style={
                                        currentNoteKey === activeId
                                            ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                            : {}
                                    }
                                    onClick={() =>
                                        noteSwitch(currentRepoKey, currentFolderKey, activeId)
                                    }
                                    onContextMenu={() => {
                                        if (currentNoteKey !== activeId)
                                            noteSwitch(currentRepoKey, currentFolderKey, activeId);
                                    }}
                                >
                                    {notes_obj[activeId].title}
                                </NoteItem>
                            ) : null}
                        </div>
                    </DragOverlay>
                </DndContext>
            ) : (
                <></>
            )}
            {/* <NoteBottomBar>
                <MoreNote><img src={moreBtnIcon} alt='' /></MoreNote>
            </NoteBottomBar> */}
        </NoteListContainer>
    );
};

const NoteListContainer = styled.div(
    {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minWidth: '100px',
    },
    (props: { width: number }) => ({
        width: props.width,
    })
);

const NoteAddFloat = styled.div({
    position: 'absolute',
    bottom: '40px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: '30px',
    zIndex: '2000',
    backgroundColor: 'var(--main-btn-bg-color)',
});

const NoteAddBtn = styled.div({
    width: '24px',
    height: '26px',
    padding: '13px 14px',
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
});

const NewNoteIconImg = styled.img({
    width: '24px',
    height: '26px',
});

const Notes = styled.div(
    {
        overflowY: 'auto',
        flex: '1',
        minHeight: '0',
        padding: '10px 0 70px 0',
        borderLeft: '1px solid var(--main-border-color)',
        borderRight: '1px solid var(--main-border-color)',
        scrollBehavior: 'smooth',
    },
    `
    &::-webkit-scrollbar {
        display: none;
    }
`
);

const NoteItem = styled.div(
    {
        position: 'relative',
        height: '36px',
        lineHeight: '36px',
        padding: '0 10px',
        margin: '0 10px',
        fontSize: '15px',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    `
    &:hover {
        color: var(--main-text-hover-color);
    }
`
);

const NoteKeyTab = styled.div({
    display: 'flex',
    alignItems: 'center',
    position: 'absolute',
    top: '4px',
    right: '8px',
    width: '20px',
    height: '13px',
    lineHeight: '13px',
    fontSize: '13px',
    letterSpacing: '1px',
    padding: '2px 4px',
    borderRadius: '4px',
    backgroundColor: 'var(--key-tab-bg-color)',
});

const AddNotesTips = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '20px',
    fontSize: '14px',
    position: 'absolute',
    bottom: '100px',
    right: '30px',
    padding: '5px 10px',
    borderRadius: '5px',
    border: '1px dotted var(--main-tips-border-color)',
    backgroundColor: 'var(--main-tips-bg-color)',
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

export default NoteList;
