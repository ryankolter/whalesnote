import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import SearchBar from './SearchBar';

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

import { Sortable } from '../../components/Sortable';
import useContextMenu from '../../lib/useContextMenu';
import newNoteIcon from '../../resources/icon/newNoteIcon.svg';

const NoteList: React.FC<{
    width: number;
}> = ({ width }) => {
    const {
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        dataPathChangeFlag,
        keySelectNumArray,
        platformName,
        showKeySelect,
        whalenote,
        changeNotesAfterNew,
        deleteNote,
        manualFocus,
        newNote,
        reorderNote,
        setKeySelectNumArray,
        setShowKeySelect,
        switchNote,
    } = useContext(GlobalContext);

    const notes_key = useMemo(() => {
        return whalenote.repos_obj &&
            whalenote.repos_key.length > 0 &&
            whalenote.repos_obj[currentRepoKey]?.folders_obj &&
            whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_key
            ? whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_key
            : undefined;
    }, [whalenote, currentRepoKey, currentFolderKey]);
    const notes_obj = useMemo(() => {
        return whalenote.repos_obj &&
            whalenote.repos_key.length > 0 &&
            whalenote.repos_obj[currentRepoKey]?.folders_obj &&
            whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj
            ? whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj
            : undefined;
    }, [whalenote, currentRepoKey, currentFolderKey]);

    const [dragActiveId, setDragActiveId] = useState<string | null>(null);
    const [noteScrollTop, setNoteScrollTop] = useState(0);
    const notesEnd = useRef<HTMLDivElement>(null);
    const outerRef = useRef<HTMLDivElement>(null);
    const { xPos, yPos, menu } = useContextMenu(outerRef);
    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));

    const scrollToBottom = useCallback(() => {
        if (notesEnd && notesEnd.current) {
            notesEnd.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    const handleNewNote = useCallback(async () => {
        const new_note_key = cryptoRandomString({
            length: 12,
            type: 'alphanumeric',
        });
        const new_note_title = '空笔记';
        await newNote(curDataPath, currentRepoKey, currentFolderKey, new_note_key, new_note_title);
        await switchNote(currentRepoKey, currentFolderKey, new_note_key);
        manualFocus(500);
        setTimeout(() => {
            scrollToBottom();
        }, 50);
        setShowKeySelect(false);
    }, [
        curDataPath,
        currentRepoKey,
        currentFolderKey,
        changeNotesAfterNew,
        manualFocus,
        newNote,
        scrollToBottom,
        setShowKeySelect,
        switchNote,
    ]);

    const handleDeleteNote = useCallback(
        async (note_key: string) => {
            const next_note_key = await deleteNote(
                curDataPath,
                currentRepoKey,
                currentFolderKey,
                note_key
            );
            await switchNote(currentRepoKey, currentFolderKey, next_note_key);
        },
        [curDataPath, currentRepoKey, currentFolderKey, switchNote]
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
    }, [setNoteScrollTop]);

    const nextNotePage = useCallback(() => {
        if (outerRef && outerRef.current) {
            const height = outerRef.current.offsetHeight;
            const top = outerRef.current.scrollTop;
            setNoteScrollTop(top + height - 28);
        }
    }, [setNoteScrollTop]);

    const noteSwitchByIndex = useCallback(
        async (index: number) => {
            for (const [i, key] of notes_key.entries()) {
                if (index === i) {
                    await switchNote(currentRepoKey, currentFolderKey, key);
                }
            }
        },
        [currentRepoKey, currentFolderKey, notes_key, switchNote]
    );

    useEffect(() => {
        if (outerRef && outerRef.current) {
            outerRef.current.scrollTop = noteScrollTop;
        }
    }, [noteScrollTop]);

    useEffect(() => {
        if (keySelectNumArray.length === 2) {
            let new_index = -1;
            if (notes_key) {
                if (
                    keySelectNumArray[0] >= 65 &&
                    keySelectNumArray[0] <= 72 &&
                    keySelectNumArray[0] < Math.ceil(notes_key.length / 21) + 65
                ) {
                    if (keySelectNumArray[1] <= 72 && keySelectNumArray[0] >= 65) {
                        new_index = (keySelectNumArray[0] - 65) * 21 + (keySelectNumArray[1] - 65);
                    } else if (keySelectNumArray[1] >= 75 && keySelectNumArray[1] <= 89) {
                        new_index =
                            (keySelectNumArray[0] - 65) * 21 + (keySelectNumArray[1] - 65) - 4;
                    }
                } else if (
                    keySelectNumArray[0] >= 75 &&
                    keySelectNumArray[0] <= 89 &&
                    keySelectNumArray[0] < Math.ceil(notes_key.length / 21) + 65 + 4
                ) {
                    if (keySelectNumArray[1] <= 72 && keySelectNumArray[1] >= 65) {
                        new_index =
                            (keySelectNumArray[0] - 65 - 4) * 21 + (keySelectNumArray[1] - 65);
                    } else if (keySelectNumArray[1] >= 75 && keySelectNumArray[1] <= 89) {
                        new_index =
                            (keySelectNumArray[0] - 65 - 4) * 21 + (keySelectNumArray[1] - 65) - 4;
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
            setKeySelectNumArray([]);
        }
    }, [keySelectNumArray, noteSwitchByIndex, setKeySelectNumArray]);

    useEffect(() => {
        if (keySelectNumArray.length === 1) {
            setKeySelectNumArray([]);
        }
    }, [currentRepoKey, currentFolderKey, currentNoteKey]);

    const handleKeyDown = useCallback(
        async (e: any) => {
            if (platformName === 'darwin' || platformName === 'win32' || platformName === 'linux') {
                const modKey = platformName === 'darwin' ? e.metaKey : e.ctrlKey;

                if (e.key === 'n' && modKey && !e.shiftKey) {
                    handleNewNote();
                }

                // arrow down or K
                if ((e.key === 'ArrowDown' || e.key === 'k') && !modKey && showKeySelect) {
                    nextNotePage();
                }

                // arrow up or I
                if ((e.key === 'ArrowUp' || e.key === 'i') && !modKey && showKeySelect) {
                    preNotePage();
                }
            }
        },
        [showKeySelect, handleNewNote, nextNotePage, preNotePage]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const handleDragStart = useCallback(
        (event: DragStartEvent) => {
            setDragActiveId(String(event.active.id));
        },
        [setDragActiveId]
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setDragActiveId(null);
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
        [
            curDataPath,
            currentRepoKey,
            currentFolderKey,
            currentNoteKey,
            notes_key,
            reorderNote,
            setDragActiveId,
        ]
    );

    const genAlphaCode1 = useCallback((order: number): number => {
        if (order <= 8 * 21) {
            return Math.ceil(order / 21) + 64;
        } else {
            return 4 + Math.ceil(order / 21) + 64;
        }
    }, []);

    const genAlphaCode2 = useCallback((order: number): number => {
        if (order % 21 <= 8) {
            return (order % 21 === 0 ? 25 : order % 21) + 64;
        } else {
            return (order % 21) + 4 + 64;
        }
    }, []);

    return (
        <NoteListContainer width={width}>
            <SearchBar />
            {dataPathChangeFlag > 0 ? (
                <NoteAddFloat>
                    <NoteAddBtn onKeyDown={(e) => handleKeyDown(e)} onClick={() => handleNewNote()}>
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
                                                    switchNote(
                                                        currentRepoKey,
                                                        currentFolderKey,
                                                        key
                                                    )
                                                }
                                                onContextMenu={() => {
                                                    if (currentNoteKey !== key)
                                                        switchNote(
                                                            currentRepoKey,
                                                            currentFolderKey,
                                                            key
                                                        );
                                                }}
                                            >
                                                {notes_obj[key].title}
                                                {showKeySelect &&
                                                currentNoteKey !== key &&
                                                index < 21 * 21 ? (
                                                    <NoteKeyTab>
                                                        <span
                                                            style={{
                                                                color:
                                                                    keySelectNumArray.length >= 1 &&
                                                                    keySelectNumArray[0] ===
                                                                        genAlphaCode1(index + 1)
                                                                        ? 'var(--main-text-selected-color)'
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
                                                                    keySelectNumArray.length ===
                                                                        2 &&
                                                                    keySelectNumArray[1] ===
                                                                        genAlphaCode2(index + 1)
                                                                        ? 'var(--main-text-selected-color)'
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
                                    <div>添加新笔记</div>
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
                                        onClick={() => handleDeleteNote(currentNoteKey)}
                                    >
                                        扔到废纸篓
                                    </MenuLi>
                                </MenuUl>
                            ) : (
                                <></>
                            )}
                        </Notes>
                    </SortableContext>
                    {dragActiveId ? (
                        <DragOverlay>
                            {notes_obj ? (
                                <NoteItem
                                    key={dragActiveId}
                                    style={
                                        currentNoteKey === dragActiveId
                                            ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                            : {}
                                    }
                                    onClick={() =>
                                        switchNote(currentRepoKey, currentFolderKey, dragActiveId)
                                    }
                                    onContextMenu={() => {
                                        if (currentNoteKey !== dragActiveId)
                                            switchNote(
                                                currentRepoKey,
                                                currentFolderKey,
                                                dragActiveId
                                            );
                                    }}
                                >
                                    {notes_obj[dragActiveId].title}
                                </NoteItem>
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
        padding: '0 20px',
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
