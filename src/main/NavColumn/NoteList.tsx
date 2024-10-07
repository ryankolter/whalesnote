import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

import { Sortable } from '@/components/Sortable';
import { useContextMenu } from '@/lib';
import NewNoteIcon from '@/resources/icon/newNoteIcon.svg?react';
import { useDataContext } from '@/context/DataProvider';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
    activeWhaleIdAtom,
    editorRefAtom,
    keySelectActiveAtom,
    keySelectNumArrAtom,
    platformAtom,
    repoPanelVisibleAtom,
    searchPanelVisibleAtom,
} from '@/atoms';

const NoteList: React.FC<{}> = ({}) => {
    const { t } = useTranslation();

    const {
        whalesnote,
        newNote,
        reorderNote,
        deleteNote,
        curRepoKey,
        curFolderKey,
        curNoteKey,
        switchNote,
    } = useDataContext();

    const platform = useAtomValue(platformAtom);
    const id = useAtomValue(activeWhaleIdAtom);
    const searchPanelVisible = useAtomValue(searchPanelVisibleAtom);
    const setRepoPanelVisible = useSetAtom(repoPanelVisibleAtom);
    const [keySelectActive, setKeySelectActive] = useAtom(keySelectActiveAtom);
    const [keySelectNumArr, setKeySelectNumArr] = useAtom(keySelectNumArrAtom);
    const editorRef = useAtomValue(editorRefAtom);

    const note_keys = useMemo(() => {
        return whalesnote.repo_map &&
            whalesnote.repo_keys.length > 0 &&
            whalesnote.repo_map[curRepoKey]?.folder_map &&
            whalesnote.repo_map[curRepoKey]?.folder_map[curFolderKey]?.note_keys
            ? whalesnote.repo_map[curRepoKey]?.folder_map[curFolderKey]?.note_keys
            : [];
    }, [whalesnote, curRepoKey, curFolderKey]);
    const note_map = useMemo(() => {
        return whalesnote.repo_map &&
            whalesnote.repo_keys.length > 0 &&
            whalesnote.repo_map[curRepoKey]?.folder_map &&
            whalesnote.repo_map[curRepoKey]?.folder_map[curFolderKey]?.note_map
            ? whalesnote.repo_map[curRepoKey]?.folder_map[curFolderKey]?.note_map
            : undefined;
    }, [whalesnote, curRepoKey, curFolderKey]);

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
        const new_note_title = t('note.untitled');
        await newNote(id, curRepoKey, curFolderKey, new_note_key, new_note_title);
        await switchNote(curRepoKey, curFolderKey, new_note_key);
        setTimeout(() => {
            editorRef.current?.focus();
        }, 300);
        setTimeout(() => {
            scrollToBottom();
        }, 50);
        setKeySelectActive(false);
    }, [
        id,
        curRepoKey,
        curFolderKey,
        editorRef,
        newNote,
        scrollToBottom,
        setKeySelectActive,
        switchNote,
    ]);

    const handleDeleteNote = useCallback(
        async (note_key: string) => {
            const next_note_key = await deleteNote(id, curRepoKey, curFolderKey, note_key);
            await switchNote(curRepoKey, curFolderKey, next_note_key);
        },
        [id, curRepoKey, curFolderKey, switchNote],
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
            for (const [i, key] of note_keys.entries()) {
                if (index === i) {
                    await switchNote(curRepoKey, curFolderKey, key);
                }
            }
        },
        [curRepoKey, curFolderKey, note_keys, switchNote],
    );

    useEffect(() => {
        if (outerRef && outerRef.current) {
            outerRef.current.scrollTop = noteScrollTop;
        }
    }, [noteScrollTop]);

    useEffect(() => {
        if (keySelectNumArr.length === 2) {
            let new_index = -1;
            if (note_keys) {
                if (
                    keySelectNumArr[0] >= 65 &&
                    keySelectNumArr[0] <= 72 &&
                    keySelectNumArr[0] < Math.ceil(note_keys.length / 21) + 65
                ) {
                    if (keySelectNumArr[1] <= 72 && keySelectNumArr[0] >= 65) {
                        new_index = (keySelectNumArr[0] - 65) * 21 + (keySelectNumArr[1] - 65);
                    } else if (keySelectNumArr[1] >= 75 && keySelectNumArr[1] <= 89) {
                        new_index = (keySelectNumArr[0] - 65) * 21 + (keySelectNumArr[1] - 65) - 4;
                    }
                } else if (
                    keySelectNumArr[0] >= 75 &&
                    keySelectNumArr[0] <= 89 &&
                    keySelectNumArr[0] < Math.ceil(note_keys.length / 21) + 65 + 4
                ) {
                    if (keySelectNumArr[1] <= 72 && keySelectNumArr[1] >= 65) {
                        new_index = (keySelectNumArr[0] - 65 - 4) * 21 + (keySelectNumArr[1] - 65);
                    } else if (keySelectNumArr[1] >= 75 && keySelectNumArr[1] <= 89) {
                        new_index =
                            (keySelectNumArr[0] - 65 - 4) * 21 + (keySelectNumArr[1] - 65) - 4;
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
            setKeySelectNumArr([]);
        }
    }, [keySelectNumArr, noteSwitchByIndex, setKeySelectNumArr]);

    useEffect(() => {
        if (keySelectNumArr.length === 1) {
            setKeySelectNumArr([]);
        }
    }, [curRepoKey, curFolderKey, curNoteKey]);

    const handleKeyDown = useCallback(
        async (e: any) => {
            if (platform === 'darwin' || platform === 'win32' || platform === 'linux') {
                const modKey = platform === 'darwin' ? e.metaKey : e.ctrlKey;

                if (e.key === 'n' && modKey && !e.shiftKey) {
                    handleNewNote();
                }

                // arrow down or K
                if (
                    (e.key === 'ArrowDown' || e.key === 'k') &&
                    !modKey &&
                    keySelectActive &&
                    !searchPanelVisible
                ) {
                    nextNotePage();
                }

                // arrow up or I
                if (
                    (e.key === 'ArrowUp' || e.key === 'i') &&
                    !modKey &&
                    keySelectActive &&
                    !searchPanelVisible
                ) {
                    preNotePage();
                }
            }
        },
        [keySelectActive, searchPanelVisible, handleNewNote, nextNotePage, preNotePage],
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
        [setDragActiveId],
    );

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            setDragActiveId(null);
            const { active, over } = event;
            if (!over) return;
            if (active.id !== over.id && note_keys && curRepoKey && curFolderKey && curNoteKey) {
                const oldIndex = note_keys.indexOf(active.id as string);
                const newIndex = note_keys.indexOf(over.id as string);
                const new_note_keys: string[] = arrayMove(note_keys, oldIndex, newIndex);
                reorderNote(id, curRepoKey, curFolderKey, new_note_keys);
            }
        },
        [id, curRepoKey, curFolderKey, curNoteKey, note_keys, reorderNote, setDragActiveId],
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
        <NoteListContainer>
            <NoteAddFloat>
                <div
                    className="w-9 h-9 flex items-center justify-center cursor-pointer"
                    onKeyDown={(e) => handleKeyDown(e)}
                    onClick={() => handleNewNote()}
                >
                    <NewNoteIcon width={18} height={20} />
                </div>
            </NoteAddFloat>
            {note_keys && note_map ? (
                <DndContext
                    sensors={sensors}
                    modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={note_keys} strategy={verticalListSortingStrategy}>
                        <Notes ref={outerRef}>
                            {note_keys
                                .filter((key: string) => note_map && note_map[key])
                                .map((key: string, index: number) => {
                                    return (
                                        <Sortable key={key} id={key}>
                                            <NoteItem
                                                key={`item-${key}`}
                                                style={
                                                    curNoteKey === key
                                                        ? {
                                                              backgroundColor:
                                                                  'var(--main-selected-bg-color)',
                                                          }
                                                        : {}
                                                }
                                                onClick={() =>
                                                    switchNote(curRepoKey, curFolderKey, key)
                                                }
                                                onContextMenu={() => {
                                                    if (curNoteKey !== key)
                                                        switchNote(curRepoKey, curFolderKey, key);
                                                }}
                                            >
                                                {note_map[key].title}
                                                {keySelectActive &&
                                                curNoteKey !== key &&
                                                index < 21 * 21 ? (
                                                    <NoteKeyTab>
                                                        <span
                                                            style={{
                                                                color:
                                                                    keySelectNumArr.length >= 1 &&
                                                                    keySelectNumArr[0] ===
                                                                        genAlphaCode1(index + 1)
                                                                        ? 'var(--main-text-selected-color)'
                                                                        : '',
                                                                width: '10px',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {String.fromCharCode(
                                                                genAlphaCode1(index + 1),
                                                            )}
                                                        </span>
                                                        <span
                                                            style={{
                                                                color:
                                                                    keySelectNumArr.length === 2 &&
                                                                    keySelectNumArr[1] ===
                                                                        genAlphaCode2(index + 1)
                                                                        ? 'var(--main-text-selected-color)'
                                                                        : '',
                                                                width: '10px',
                                                                display: 'flex',
                                                                justifyContent: 'center',
                                                            }}
                                                        >
                                                            {String.fromCharCode(
                                                                genAlphaCode2(index + 1),
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
                            {note_keys.filter((key: string) => note_map && note_map[key]).length <=
                            1 ? (
                                <AddNotesTips>
                                    <div>{t('tips.click_btn_to')}</div>
                                    <div>{t('tips.add_new_note')}</div>
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
                            {menu && curNoteKey ? (
                                <MenuUl top={yPos} left={xPos}>
                                    <MenuLi
                                        className="menu-li-color"
                                        onClick={() => handleDeleteNote(curNoteKey)}
                                    >
                                        {t('note.delete')}
                                    </MenuLi>
                                </MenuUl>
                            ) : (
                                <></>
                            )}
                            <NotesInnerFixedBox
                                onClick={() => {
                                    setRepoPanelVisible(false);
                                }}
                            />
                        </Notes>
                        <NotesBottomFlexBox
                            onClick={() => {
                                setRepoPanelVisible(false);
                            }}
                        />
                    </SortableContext>
                    {dragActiveId ? (
                        <DragOverlay>
                            {note_map ? (
                                <NoteItem
                                    key={dragActiveId}
                                    style={
                                        curNoteKey === dragActiveId
                                            ? { backgroundColor: 'var(--main-selected-bg-color)' }
                                            : {}
                                    }
                                    onClick={() =>
                                        switchNote(curRepoKey, curFolderKey, dragActiveId)
                                    }
                                    onContextMenu={() => {
                                        if (curNoteKey !== dragActiveId)
                                            switchNote(curRepoKey, curFolderKey, dragActiveId);
                                    }}
                                >
                                    {note_map[dragActiveId].title}
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

const NoteListContainer = styled.div({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
});

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

// const NoteAddBtn = styled.div({
//     width: '36px',
//     height: '36px',
//     display: 'flex',
//     alignItem: 'center',
//     justifyContent: 'center',
//     cursor: 'pointer',
// });

const Notes = styled.div(
    {
        overflowY: 'auto',
        padding: '10px 0 0 0',
        borderRight: '0.5px solid var(--main-border-color)',
        scrollBehavior: 'smooth',
    },
    `
    &::-webkit-scrollbar {
        display: none;
    }
`,
);

const NoteItem = styled.div(
    {
        position: 'relative',
        height: '36px',
        lineHeight: '36px',
        padding: '0 20px',
        fontSize: '14px',
        cursor: 'pointer',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    `
    &:hover {
        color: var(--main-text-hover-color);
    }
`,
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

const NotesInnerFixedBox = styled.div({
    height: '270px',
    minHeight: '270px',
});

const NotesBottomFlexBox = styled.div({
    flex: '1',
    minHeight: '0',
    width: '100%',
    boxSizing: 'border-box',
    borderRight: '0.5px solid var(--main-border-color)',
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

export default NoteList;
