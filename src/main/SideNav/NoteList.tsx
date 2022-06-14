import styled from "@emotion/styled";
import cryptoRandomString from "crypto-random-string";
import { useCallback, useRef, useState, useEffect } from "react";
import {
  DndContext,
  MouseSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  restrictToFirstScrollableAncestor,
  restrictToVerticalAxis,
} from "@dnd-kit/modifiers";
import { Sortable } from "../../components/Sortable";
import useContextMenu from "../../lib/useContextMenu";
import newNoteIcon from "../../resources/icon/newNoteIcon.svg";
const { ipcRenderer } = window.require("electron");

const NoteList: React.FC<NoteListProps> = ({
  data_path,
  notes_key,
  notes_obj,
  currentRepoKey,
  currentFolderKey,
  currentNoteKey,
  keySelect,
  repoSwitch,
  folderSwitch,
  noteSwitch,
  updateRepos,
  changeNotesAfterNew,
  reorderNote,
  setFocus,
  setKeySelect,
  width,
}) => {
  const [activeId, setActiveId] = useState(null);

  const [noteScrollTop, setNoteScrollTop] = useState(0);
  const [numArray, setNumArray] = useState<number[]>([]);

  const outerRef = useRef<HTMLDivElement>(null);
  const { xPos, yPos, menu } = useContextMenu(outerRef);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  );

  const notesEnd = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (notesEnd && notesEnd.current) {
      console.log(notesEnd.current);
      notesEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const newNote = useCallback(() => {
    const note_key = cryptoRandomString({ length: 12, type: "alphanumeric" });

    let folder_info = ipcRenderer.sendSync("readJson", {
      file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
    });

    folder_info.notes_key.push(note_key);
    folder_info.notes_obj[note_key] = {
      title: "空笔记",
    };

    ipcRenderer.sendSync("writeJson", {
      file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
      obj: folder_info,
    });

    let note_info = {
      createAt: new Date(),
      updatedAt: new Date(),
      type: "markdown",
      content: "",
    };

    ipcRenderer.sendSync("writeCson", {
      file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
      obj: note_info,
    });

    updateRepos("note", {
      data_path,
      repo_key: currentRepoKey,
      folder_key: currentFolderKey,
    });
    changeNotesAfterNew("note", {
      data_path,
      repo_key: currentRepoKey,
      folder_key: currentFolderKey,
      note_key,
    });
    noteSwitch(data_path, note_key);
    setFocus(cryptoRandomString({ length: 24, type: "alphanumeric" }));
    setTimeout(() => {
      scrollToBottom();
    }, 0);
    setKeySelect(false);
  }, [
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
      let folder_info = ipcRenderer.sendSync("readJson", {
        file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
      });

      let note_info = ipcRenderer.sendSync("readCson", {
        file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
      });

      let trash = ipcRenderer.sendSync("readCson", {
        file_path: `${data_path}/trash.cson`,
      });

      trash = trash ? trash : {};

      trash[
        `${currentRepoKey}-${currentFolderKey}-${note_key}-${folder_info.notes_obj[note_key].title}`
      ] = note_info.content;

      ipcRenderer.sendSync("writeCson", {
        file_path: `${data_path}/trash.cson`,
        obj: trash,
      });

      let new_notes_key: string[] = [];
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

      ipcRenderer.sendSync("writeJson", {
        file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
        obj: folder_info,
      });

      ipcRenderer.sendSync("remove", {
        file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
      });

      updateRepos("note", {
        data_path,
        repo_key: currentRepoKey,
        folder_key: currentFolderKey,
      });

      noteSwitch(data_path, other_note_key);
    },
    [data_path, currentRepoKey, currentFolderKey, noteSwitch, updateRepos]
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
      notes_key?.forEach((key, i) => {
        if (index === i) {
          noteSwitch(data_path, key);
        }
      });
    },
    [data_path, notes_key, noteSwitch]
  );

  useEffect(() => {
    if (outerRef && outerRef.current) {
      outerRef.current.scrollTop = noteScrollTop;
    }
  }, [noteScrollTop]);

  useEffect(() => {
    if (numArray.length === 2) {
      noteSwitchByIndex(numArray[0] * 26 + numArray[1]);
      setNumArray([]);
    }
  }, [numArray, noteSwitchByIndex]);

  const handleKeyDown = useCallback(
    (e: any) => {
      // console.log(e.ctrlKey)
      // console.log(e.shiftKey)
      // console.log(e.altKey)
      // console.log(e.metaKey)
      // console.log(e.keyCode)
      if (process.platform === "darwin") {
        //console.log('这是mac系统');
        if (e.keyCode === 78 && e.metaKey) {
          newNote();
        }

        // arrow bottom 40 change to K 75
        if (e.keyCode === 75 && !e.metaKey && keySelect) {
          nextNotePage();
        }

        // arrow bottom 38 change to I 73
        if (e.keyCode === 73 && !e.metaKey && keySelect) {
          preNotePage();
        }
        if (e.keyCode >= 65 && e.keyCode <= 90 && !e.metaKey && keySelect) {
          const num = parseInt(e.keyCode) - 65;
          if (numArray.length === 0) {
            if (notes_key && num < Math.ceil(notes_key.length / 26)) {
              setNumArray((state) => state.concat([num]));
            }
          } else {
            setNumArray((state) => state.concat([num]));
          }
        }
      }
      if (process.platform === "win32" || process.platform === "linux") {
        //console.log('这是windows/linux系统');
        if (e.keyCode === 78 && e.ctrlKey) {
          newNote();
        }

        // arrow bottom 40 change to K 75
        if (e.keyCode === 75 && !e.ctrlKey && keySelect) {
          nextNotePage();
        }

        // arrow bottom 38 change to I 73
        if (e.keyCode === 73 && !e.ctrlKey && keySelect) {
          preNotePage();
        }

        if (e.keyCode >= 65 && e.keyCode <= 90 && !e.ctrlKey && keySelect) {
          const num = parseInt(e.keyCode) - 65;
          if (numArray.length === 0) {
            if (notes_key && num < Math.ceil(notes_key.length / 26)) {
              setNumArray((state) => state.concat([num]));
            }
          } else {
            setNumArray((state) => state.concat([num]));
          }
        }
      }
    },
    [numArray, keySelect, notes_key, newNote, nextNotePage, preNotePage]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = useCallback(
    (event: any) => {
      setActiveId(null);
      const { active, over } = event;
      console.log(event);

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
        let new_notes_key = arrayMove(notes_key, oldIndex, newIndex);
        reorderNote(data_path, currentRepoKey, currentFolderKey, new_notes_key);
      }
    },
    [
      data_path,
      currentRepoKey,
      currentFolderKey,
      currentNoteKey,
      notes_key,
      reorderNote,
    ]
  );

  const genAlphaCode1 = (order: number): number => {
    return Math.ceil(order / 26) + 64;
  };

  const genAlphaCode2 = (order: number): number => {
    return (order % 26 === 0 ? 26 : order % 26) + 64;
  };

  return (
    <NoteListContainer width={width}>
      <ColumnHeader>
        {data_path ? (
          <NoteAddBtn
            onKeyDown={(e) => handleKeyDown(e)}
            onClick={() => newNote()}
          >
            <img src={newNoteIcon} alt="" />
          </NoteAddBtn>
        ) : (
          <div></div>
        )}
      </ColumnHeader>
      {notes_key && notes_obj ? (
        <DndContext
          sensors={sensors}
          modifiers={[
            restrictToVerticalAxis,
            restrictToFirstScrollableAncestor,
          ]}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={notes_key}
            strategy={verticalListSortingStrategy}
          >
            <Notes ref={outerRef}>
              {notes_key
                .filter((key) => notes_obj && notes_obj[key])
                .map((key, index) => {
                  return (
                    <Sortable key={key} id={key}>
                      <NoteItem
                        key={`item-${key}`}
                        style={{
                          backgroundColor:
                            currentNoteKey === key ? "#3a404c" : "",
                        }}
                        onClick={() => noteSwitch(data_path, key)}
                        onContextMenu={() => {
                          if (currentNoteKey !== key)
                            noteSwitch(data_path, key);
                        }}
                      >
                        {notes_obj[key]["title"]}
                        {keySelect &&
                        currentNoteKey !== key &&
                        index < 26 * 26 ? (
                          <NoteKeyTab>
                            <span
                              style={{
                                color:
                                  numArray.length >= 1 &&
                                  numArray[0] + 65 === genAlphaCode1(index + 1)
                                    ? "#E9E9E9"
                                    : "",
                              }}
                            >
                              {String.fromCharCode(genAlphaCode1(index + 1))}
                            </span>
                            <span
                              style={{
                                color:
                                  numArray.length === 2 &&
                                  numArray[1] + 65 === genAlphaCode2(index + 1)
                                    ? "#E9E9E9"
                                    : "",
                              }}
                            >
                              {String.fromCharCode(genAlphaCode2(index + 1))}
                            </span>
                          </NoteKeyTab>
                        ) : (
                          <></>
                        )}
                      </NoteItem>
                    </Sortable>
                  );
                })}
              <div
                style={{ clear: "both", height: "1px", width: "100%" }}
                ref={notesEnd}
              ></div>
              {menu && currentNoteKey ? (
                <MenuUl top={yPos} left={xPos}>
                  <MenuLi onClick={() => deleteNote(currentNoteKey)}>
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
                  style={{
                    backgroundColor:
                      currentNoteKey === activeId ? "#3a404c" : "",
                  }}
                  onClick={() => noteSwitch(data_path, activeId)}
                  onContextMenu={() => {
                    if (currentNoteKey !== activeId)
                      noteSwitch(data_path, activeId);
                  }}
                >
                  {notes_obj[activeId]["title"]}
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
    position: "relative",
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  (props: { width: number }) => ({
    width: props.width,
  })
);

const ColumnHeader = styled.div({
  display: "flex",
  alignItems: "center",
  flexDirection: "row",
  margin: "10px 16px",
});

const NoteAddBtn = styled.div({
  width: "16px",
  height: "16px; ",
  display: "flex",
  alignItem: "center",
  justifyContent: "center",
  color: "#939395",
  cursor: "pointer",
});

const Notes = styled.div(
  {
    overflowY: "scroll",
    flex: "1",
    minHeight: "0",
    paddingBottom: "50px",
    scrollBehavior: "smooth",
  },
  `
    &::-webkit-scrollbar {
        display: none;
    }
`
);

const NoteItem = styled.div`
  position: relative;
  height: 36px;
  line-height: 36px;
  padding: 0 5px;
  margin: 0 10px;
  font-size: 14px;
  color: #939395;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  &:hover {
    color: #ddd;
    background-color: rgba(47, 51, 56, 0.2);
  }
`;

const NoteKeyTab = styled.div({
  position: "absolute",
  top: "4px",
  right: "8px",
  width: "18px",
  height: "13px",
  lineHeight: "13px",
  fontSize: "13px",
  letterSpacing: "1px",
  padding: "2px 4px",
  borderRadius: "4px",
  backgroundColor: "rgb(58, 64, 76)",
});

const MenuUl = styled.ul(
  {
    listStyleType: "none",
    position: "fixed",
    padding: "4px 0",
    border: "1px solid #BABABA",
    color: "#000000",
    backgroundColor: "#FFFFFF",
    zIndex: "99999",
  },
  (props: { top: string; left: string }) => ({
    top: props.top,
    left: props.left,
  })
);

const MenuLi = styled.li(
  {
    padding: "0 22px",
    fontSize: "12px",
    lineHeight: "22px",
    cursor: "pointer",
  },
  `&:hover {
background-color: #EBEBEB; 
}`
);

type NoteListProps = {
  data_path: string;
  notes_key: string[] | undefined;
  notes_obj: object | undefined;
  currentRepoKey: string | undefined;
  currentFolderKey: string | undefined;
  currentNoteKey: string | undefined;
  keySelect: boolean;
  repoSwitch: (repo_key: string) => void;
  folderSwitch: (data_path: string | null, folder_key: string) => void;
  noteSwitch: (data_path: string | null, note_key: string | undefined) => void;
  updateRepos: (action_name: string, obj: object) => void;
  changeNotesAfterNew: (action_name: string, obj: object) => void;
  reorderNote: (
    data_path: string,
    repo_key: string,
    folder_key: string,
    new_notes_key: string[]
  ) => void;
  setFocus: (focus: string) => void;
  setKeySelect: (keySelect: boolean) => void;
  width: number;
};

export default NoteList;