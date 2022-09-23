import { useContext, useCallback, useRef, useState, useEffect } from 'react';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';
import { DndContext, MouseSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { Sortable } from '../../components/Sortable';
import useContextMenu from '../../lib/useContextMenu';
import newNoteIcon from '../../resources/icon/newNoteIcon.svg';
import { GlobalContext } from '../../GlobalProvider';
import { updateFor } from 'typescript';
const { ipcRenderer } = window.require('electron');

const NoteList: React.FC<NoteListProps> = ({ keySelect, setFocus, setKeySelect, width }) => {
    const {
        dataPath,
        noteSwitch,
        currentRepoKey,
        currentFolderKey,
        currentNoteKey,
        repos_obj,
        updateRepos,
        reorderNote,
        changeNotesAfterNew,
        numArray,
        setNumArray,
    } = useContext(GlobalContext);

    const notes_key = repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_key;
    const notes_obj = repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj;

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

    const newNote = useCallback(() => {
        const note_key = cryptoRandomString({
            length: 12,
            type: 'alphanumeric',
        });

        const folder_info = ipcRenderer.sendSync('readJson', {
            file_path: `${dataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
        });

        folder_info.notes_key.push(note_key);
        folder_info.notes_obj[note_key] = {
            title: '新建文档',
        };

        ipcRenderer.sendSync('writeJson', {
            file_path: `${dataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
            obj: folder_info,
        });

        const note_info = {
            createAt: new Date(),
            updatedAt: new Date(),
            type: 'markdown',
            content: '',
        };

        ipcRenderer.sendSync('writeCson', {
            file_path: `${dataPath}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
            obj: note_info,
        });

        updateRepos('note', {
            data_path: dataPath,
            repo_key: currentRepoKey,
            folder_key: currentFolderKey,
        });
        changeNotesAfterNew('note', {
            data_path: dataPath,
            repo_key: currentRepoKey,
            folder_key: currentFolderKey,
            note_key,
        });
        noteSwitch(note_key);
        setTimeout(() => {
            setFocus(
                cryptoRandomString({
                    length: 24,
                    type: 'alphanumeric',
                })
            );
        }, 0);
        setTimeout(() => {
            scrollToBottom();
        }, 0);
        setKeySelect(false);
    }, [
        dataPath,
        currentRepoKey,
        currentFolderKey,
        changeNotesAfterNew,
        noteSwitch,
        setFocus,
        setKeySelect,
        scrollToBottom,
        updateRepos,
    ]);

    const deleteNote = useCallback(
        (note_key: string) => {
            const folder_info = ipcRenderer.sendSync('readJson', {
                file_path: `${dataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
            });

            const note_info = ipcRenderer.sendSync('readCson', {
                file_path: `${dataPath}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
            });

            let trash = ipcRenderer.sendSync('readCson', {
                file_path: `${dataPath}/trash.cson`,
            });

            trash = trash ? trash : {};

            trash[
                `${currentRepoKey}-${currentFolderKey}-${note_key}-${folder_info.notes_obj[note_key].title}`
            ] = note_info.content;

            ipcRenderer.sendSync('writeCson', {
                file_path: `${dataPath}/trash.cson`,
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

            ipcRenderer.sendSync('writeJson', {
                file_path: `${dataPath}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
                obj: folder_info,
            });

            ipcRenderer.sendSync('remove', {
                file_path: `${dataPath}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
            });

            updateRepos('note', {
                data_path: dataPath,
                repo_key: currentRepoKey,
                folder_key: currentFolderKey,
            });

            noteSwitch(other_note_key);
        },
        [dataPath, currentRepoKey, currentFolderKey, noteSwitch, updateRepos]
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
        (index: number) => {
            notes_key?.forEach((key: string, i: number) => {
                if (index === i) {
                    noteSwitch(key);
                }
            });
        },
        [dataPath, notes_key, noteSwitch]
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
            // console.log(e.ctrlKey)
            // console.log(e.shiftKey)
            // console.log(e.altKey)
            // console.log(e.metaKey)
            // console.log(e.keyCode)
            if (process.platform === 'darwin') {
                //console.log('这是mac系统');
                if (e.keyCode === 78 && e.metaKey && !e.shiftKey) {
                    newNote();
                }

                // arrow bottom 40 or K 75
                if ((e.keyCode === 40 || e.keyCode === 75) && !e.metaKey && keySelect) {
                    nextNotePage();
                }

                // arrow bottom 38 or I 73
                if ((e.keyCode === 38 || e.keyCode === 73) && !e.metaKey && keySelect) {
                    preNotePage();
                }
            }
            if (process.platform === 'win32' || process.platform === 'linux') {
                //console.log('这是windows/linux系统');
                if (e.keyCode === 78 && e.ctrlKey && !e.shiftKey) {
                    newNote();
                }

                // arrow bottom 40 or K 75
                if ((e.keyCode === 40 || e.keyCode === 75) && !e.ctrlKey && keySelect) {
                    nextNotePage();
                }

                // arrow bottom 38 or I 73
                if ((e.keyCode === 38 || e.keyCode === 73) && !e.ctrlKey && keySelect) {
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
                reorderNote(dataPath, currentRepoKey, currentFolderKey, new_notes_key);
            }
        },
        [dataPath, currentRepoKey, currentFolderKey, currentNoteKey, notes_key, reorderNote]
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
            <NoteAddFloat className="btn-1-bg-color">
                {dataPath ? (
                    <NoteAddBtn onKeyDown={(e) => handleKeyDown(e)} onClick={() => newNote()}>
                        <img src={newNoteIcon} alt="" />
                    </NoteAddBtn>
                ) : (
                    <div></div>
                )}
            </NoteAddFloat>
            {notes_key && notes_obj ? (
                <DndContext
                    sensors={sensors}
                    modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={notes_key} strategy={verticalListSortingStrategy}>
                        <Notes ref={outerRef} className="notes-scroller notes-border">
                            {notes_key
                                .filter((key: string) => notes_obj && notes_obj[key])
                                .map((key: string, index: number) => {
                                    return (
                                        <Sortable key={key} id={key}>
                                            <NoteItem
                                                key={`item-${key}`}
                                                className={
                                                    currentNoteKey === key
                                                        ? 'item-selected-color item-hover-color'
                                                        : 'item-hover-color'
                                                }
                                                onClick={() => noteSwitch(key)}
                                                onContextMenu={() => {
                                                    if (currentNoteKey !== key) noteSwitch(key);
                                                }}
                                            >
                                                {notes_obj[key].title}
                                                {keySelect &&
                                                currentNoteKey !== key &&
                                                index < 22 * 21 ? (
                                                    <NoteKeyTab className="key-tab-color">
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
                                <AddNotesTips className="tips-1-bg-color tips-1-border-color">
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
                                <MenuUl top={yPos} left={xPos} className="menu-ui-color">
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
                                    className={
                                        currentNoteKey === activeId
                                            ? 'item-selected-color item-hover-color'
                                            : 'item-hover-color'
                                    }
                                    onClick={() => noteSwitch(activeId)}
                                    onContextMenu={() => {
                                        if (currentNoteKey !== activeId) noteSwitch(activeId);
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
    },
    (props: { width: number }) => ({
        width: props.width,
    })
);

const NoteAddFloat = styled.div({
    position: 'absolute',
    bottom: '16px',
    right: '16px',
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: '30px',
    zIndex: '9999',
});

const NoteAddBtn = styled.div({
    width: '20px',
    height: '20px',
    padding: '16px',
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
});

const Notes = styled.div({
    overflowY: 'auto',
    flex: '1',
    minHeight: '0',
    padding: '10px 0 70px 0',
    borderRadius: '8px',
    scrollBehavior: 'smooth',
});

const NoteItem = styled.div({
    position: 'relative',
    height: '36px',
    lineHeight: '36px',
    padding: '0 10px',
    margin: '0 10px',
    fontSize: '14px',
    cursor: 'pointer',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
});

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
});

const AddNotesTips = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '20px',
    fontSize: '14px',
    position: 'absolute',
    bottom: '80px',
    right: '20px',
    padding: '5px 10px',
    borderRadius: '5px',
});

const MenuUl = styled.ul(
    {
        listStyleType: 'none',
        position: 'fixed',
        padding: '4px 0',
        zIndex: '99999',
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

type NoteListProps = {
    keySelect: boolean;
    setFocus: (focus: string) => void;
    setKeySelect: (keySelect: boolean) => void;
    width: number;
};

export default NoteList;
