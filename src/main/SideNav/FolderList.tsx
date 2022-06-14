import styled from "@emotion/styled";
import { useState, useRef, useCallback, useEffect } from "react";
import cryptoRandomString from "crypto-random-string";
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
import { TextInput } from "../../components/TextInput";
import { AlertPopUp } from "../../components/AlertPopUp";
import { InputPopUp } from "../../components/InputPopUp";
import newFolderIcon from "../../resources/icon/newFolderIcon.svg";
import { usePopUp } from "../../lib/usePopUp";
import useContextMenu from "../../lib/useContextMenu";
const { ipcRenderer } = window.require("electron");

const FolderList: React.FC<FolderListProps> = ({
  data_path,
  folders_key,
  folders_obj,
  currentRepoKey,
  currentFolderKey,
  keySelect,
  repoSwitch,
  folderSwitch,
  noteSwitch,
  updateRepos,
  changeNotesAfterNew,
  reorderFolder,
  setFocus,
  width,
}) => {
  const [activeId, setActiveId] = useState(null);
  let [newFolderKey, setNewFolderKey] = useState("");
  let [newFolderName, setNewFolderName] = useState("");

  let [curFolderName, setCurFolderName] = useState("");

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } })
  );

  const [
    deletePopupState,
    {
      getMaskState: getDeleteMaskState,
      showPopup: showDeletePopup,
      hidePopup: hideDeletePopup,
    },
  ] = usePopUp(500);

  const [
    renamePopupState,
    {
      getMaskState: getRenameMaskState,
      showPopup: showRenamePopup,
      hidePopup: hideRenamePopup,
    },
  ] = usePopUp(500);

  const innerRef = useRef<HTMLDivElement>(null);
  const { xPos, yPos, menu } = useContextMenu(innerRef);

  const [folderScrollTop, setFolderScrollTop] = useState(0);
  const [numArray, setNumArray] = useState<number[]>([]);

  // part1 : new folder
  const newFolder = () => {
    const folder_key = cryptoRandomString({ length: 12, type: "alphanumeric" });
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
      console.log("newFolderConfirm");
      if (e.target.value === "") {
        setNewFolderKey("");
        setNewFolderName("");
        return;
      }

      if (!currentRepoKey) return;

      const default_note_key = cryptoRandomString({
        length: 12,
        type: "alphanumeric",
      });

      let repo_info = ipcRenderer.sendSync("readJson", {
        file_path: `${data_path}/${currentRepoKey}/repo_info.json`,
      });
      repo_info.folders_key.push(folder_key);
      ipcRenderer.sendSync("writeJson", {
        file_path: `${data_path}/${currentRepoKey}/repo_info.json`,
        obj: repo_info,
      });

      let folder_info = {
        folder_name: e.target.value,
        notes_key: [default_note_key],
        notes_obj: {},
      };

      folder_info.notes_obj[default_note_key] = {
        title: "空笔记",
      };

      ipcRenderer.sendSync("writeJson", {
        file_path: `${data_path}/${currentRepoKey}/${folder_key}/folder_info.json`,
        obj: folder_info,
      });

      //default note
      let note_info = {
        createAt: new Date(),
        updatedAt: new Date(),
        type: "markdown",
        content: "",
      };

      ipcRenderer.sendSync("writeCson", {
        file_path: `${data_path}/${currentRepoKey}/${folder_key}/${default_note_key}.cson`,
        obj: note_info,
      });

      updateRepos("folder", {
        data_path,
        repo_key: currentRepoKey,
        folder_key,
      });
      changeNotesAfterNew("folder", {
        data_path,
        repo_key: currentRepoKey,
        folder_key,
      });
      changeNotesAfterNew("note", {
        data_path,
        repo_key: currentRepoKey,
        folder_key,
        note_key: default_note_key,
      });
      setNewFolderKey("");
      setNewFolderName("");
      repoSwitch(currentRepoKey);
      folderSwitch(data_path, folder_key);
      noteSwitch(data_path, default_note_key);
      setFocus(cryptoRandomString({ length: 24, type: "alphanumeric" }));
    },
    [
      data_path,
      currentRepoKey,
      changeNotesAfterNew,
      folderSwitch,
      noteSwitch,
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
        : ""
    );
  }, [folders_obj, currentFolderKey]);

  const renameFolder = () => {
    showRenamePopup();
  };

  const handleRenameFolderKeyDown = (e: any) => {
    if (e.keyCode === 27) {
      hideRenamePopup();
    } else if (e.keyCode === 13) {
      renameFolderConfirm();
    }
  };

  const renameFolderConfirm = useCallback(() => {
    console.log(curFolderName);
    if (currentRepoKey && currentFolderKey) {
      let folder_info = ipcRenderer.sendSync("readJson", {
        file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
      });
      folder_info.folder_name = curFolderName;
      ipcRenderer.sendSync("writeJson", {
        file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
        obj: folder_info,
      });
      updateRepos("folder", {
        data_path,
        repo_key: currentRepoKey,
        folder_key: currentFolderKey,
      });
      hideRenamePopup();
    }
  }, [
    data_path,
    currentRepoKey,
    currentFolderKey,
    curFolderName,
    hideRenamePopup,
    updateRepos,
  ]);

  // part3 : delete folder
  const deleteFolder = () => {
    showDeletePopup();
  };

  const handleDeleteFolderKeyDown = (e: any) => {
    if (e.keyCode === 13) {
      deleteFolderConfirm();
    } else if (e.keyCode === 27) {
      hideDeletePopup();
    }
  };

  const deleteFolderConfirm = useCallback(() => {
    if (currentRepoKey && currentFolderKey) {
      let folder_info = ipcRenderer.sendSync("readJson", {
        file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/folder_info.json`,
      });

      let trash = ipcRenderer.sendSync("readCson", {
        file_path: `${data_path}/trash.cson`,
      });

      trash = trash ? trash : {};

      folder_info.notes_key.forEach((note_key: string) => {
        let note_info = ipcRenderer.sendSync("readCson", {
          file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}/${note_key}.cson`,
        });

        trash[
          `${currentRepoKey}-${currentFolderKey}-${note_key}-${folder_info.notes_obj[note_key].title}`
        ] = note_info.content;
      });

      ipcRenderer.sendSync("writeCson", {
        file_path: `${data_path}/trash.cson`,
        obj: trash,
      });

      let repo_info = ipcRenderer.sendSync("readJson", {
        file_path: `${data_path}/${currentRepoKey}/repo_info.json`,
      });

      let new_folders_key: string[] = [];
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

      ipcRenderer.sendSync("writeJson", {
        file_path: `${data_path}/${currentRepoKey}/repo_info.json`,
        obj: repo_info,
      });

      ipcRenderer.sendSync("remove", {
        file_path: `${data_path}/${currentRepoKey}/${currentFolderKey}`,
      });

      updateRepos("repo", { data_path, repo_key: currentRepoKey });
      updateRepos("folder", {
        data_path,
        repo_key: currentRepoKey,
        folder_key: currentFolderKey,
      });
      repoSwitch(currentRepoKey);
      folderSwitch(data_path, other_folder_key);
      hideDeletePopup();
    }
  }, [
    data_path,
    currentRepoKey,
    currentFolderKey,
    updateRepos,
    repoSwitch,
    folderSwitch,
    hideDeletePopup,
  ]);

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
      folders_key?.forEach((key, i) => {
        if (index === i) {
          folderSwitch(data_path, key);
        }
      });
    },
    [data_path, folders_key, folderSwitch]
  );

  useEffect(() => {
    if (innerRef && innerRef.current) {
      innerRef.current.scrollTop = folderScrollTop;
    }
  }, [folderScrollTop]);

  useEffect(() => {
    console.log(numArray);
    if (numArray.length === 2) {
      folderSwitchByIndex(numArray[0] * 10 + numArray[1]);
      setNumArray([]);
    }
  }, [numArray, folderSwitchByIndex]);

  // part5 : key event
  const handleKeyDown = useCallback(
    (e: any) => {
      // console.log(e.ctrlKey)
      // console.log(e.shiftKey)
      // console.log(e.altKey)
      // console.log(e.metaKey)
      // console.log(e.keyCode)
      if (process.platform === "darwin") {
        //console.log('这是mac系统');

        // arrow bottom 40 change to K 75
        if (e.keyCode === 75 && e.metaKey && keySelect) {
          nextFolderPage();
        }
        // arrow bottom 38 change to I 73
        if (e.keyCode === 73 && e.metaKey && keySelect) {
          preFolderPage();
        }
        // if(e.keyCode >= 48 && e.keyCode <= 57  && !e.metaKey && true){
        //     const num = (parseInt(e.keyCode) - 49 + 10) % 10 + 1;
        //     switchFolderByNum(num)
        // }05
        if (e.keyCode >= 48 && e.keyCode <= 57 && !e.metaKey && keySelect) {
          const num = parseInt(e.keyCode) - 48;
          if (numArray.length === 0) {
            if (folders_key && num < Math.ceil(folders_key.length / 10)) {
              setNumArray((state) => state.concat([num]));
            }
          } else {
            setNumArray((state) => state.concat([num]));
          }
        }
      }
      if (process.platform === "win32" || process.platform === "linux") {
        //console.log('这是windows/linux系统');

        // arrow bottom 40 change to K 75
        if (e.keyCode === 75 && e.ctrlKey && keySelect) {
          nextFolderPage();
        }

        // arrow bottom 38 change to I 73
        if (e.keyCode === 73 && e.ctrlKey && keySelect) {
          preFolderPage();
        }
        if (e.keyCode >= 48 && e.keyCode <= 57 && !e.ctrlKey && keySelect) {
          const num = parseInt(e.keyCode) - 48;
          if (numArray.length === 0) {
            if (folders_key && num < Math.ceil(folders_key.length / 10)) {
              setNumArray((state) => state.concat([num]));
            }
          } else {
            setNumArray((state) => state.concat([num]));
          }
        }
      }
    },
    [numArray, keySelect, folders_key, nextFolderPage, preFolderPage]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // part5 : drag sort
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = useCallback(
    (event: any) => {
      setActiveId(null);
      const { active, over } = event;

      if (!over) return;

      if (active.id !== over.id && folders_key && currentRepoKey) {
        const oldIndex = folders_key.indexOf(active.id);
        const newIndex = folders_key.indexOf(over.id);
        let new_folders_key = arrayMove(folders_key, oldIndex, newIndex);
        reorderFolder(data_path, currentRepoKey, new_folders_key);
      }
    },
    [data_path, currentRepoKey, folders_key, reorderFolder]
  );

  const genNumberCode1 = (order: number): number => {
    return Math.ceil(order / 10) + 47;
  };

  const genNumberCode2 = (order: number): number => {
    return (order % 10 === 0 ? 10 : order % 10) + 47;
  };

  return (
    <FolderListContainer width={width}>
      <FolderTopBar>
        {data_path ? (
          <FolderAddBtn onClick={() => newFolder()}>
            <img src={newFolderIcon} alt="" />
          </FolderAddBtn>
        ) : (
          <div></div>
        )}
      </FolderTopBar>
      {folders_key && folders_obj ? (
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
            items={folders_key}
            strategy={verticalListSortingStrategy}
          >
            <Folders ref={innerRef} key={currentRepoKey}>
              {folders_key
                .filter((key) => folders_obj && folders_obj[key])
                .map((key, index) => {
                  return (
                    <Sortable key={key} id={key}>
                      <FolderItem
                        key={`item-${key}`}
                        style={{
                          backgroundColor:
                            currentFolderKey === key ? "#3a404c" : "",
                        }}
                        onClick={() => {
                          if (currentFolderKey !== key) {
                            folderSwitch(data_path, key);
                          }
                        }}
                        onContextMenu={() => {
                          if (currentFolderKey !== key) {
                            folderSwitch(data_path, key);
                          }
                        }}
                      >
                        {folders_obj[key]["folder_name"]}
                        {keySelect &&
                        currentFolderKey !== key &&
                        index < 10 * 10 ? (
                          <FolderKeyTab>
                            <span
                              style={{
                                color:
                                  numArray.length >= 1 &&
                                  numArray[0] + 48 === genNumberCode1(index + 1)
                                    ? "#E9E9E9"
                                    : "",
                              }}
                            >
                              {String.fromCharCode(genNumberCode1(index + 1))}
                            </span>
                            <span
                              style={{
                                color:
                                  numArray.length === 2 &&
                                  numArray[1] + 48 === genNumberCode2(index + 1)
                                    ? "#E9E9E9"
                                    : "",
                              }}
                            >
                              {String.fromCharCode(genNumberCode2(index + 1))}
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
                  <MenuLi onClick={() => renameFolder()}>重命名</MenuLi>
                  <MenuLi onClick={() => deleteFolder()}>删除文件夹</MenuLi>
                </MenuUl>
              ) : (
                <></>
              )}
              {newFolderKey ? (
                <TextInput
                  key={newFolderKey}
                  value={newFolderName}
                  className="folderNameInput"
                  placeholder="输入文件夹名后回车"
                  autoFocus={true}
                  onBlur={(e) => newFolderConfirm(e, newFolderKey)}
                  onChange={(e) => newFolderInputChange(e)}
                  onKeyUp={(e) => newFolderInputEnter(e, newFolderKey)}
                />
              ) : (
                <div></div>
              )}
            </Folders>
          </SortableContext>
          <DragOverlay>
            <div>
              {activeId && folders_obj ? (
                <FolderItem
                  key={activeId}
                  style={{
                    backgroundColor:
                      currentFolderKey === activeId ? "#3a404c" : "",
                  }}
                >
                  {folders_obj[activeId]["folder_name"]}
                </FolderItem>
              ) : null}
            </div>
          </DragOverlay>
        </DndContext>
      ) : (
        <></>
      )}
      {/* <FolderBottomBar>
                <MoreFolder><img src={moreBtnIcon} alt='' /></MoreFolder>
            </FolderBottomBar> */}
      <AlertPopUp
        popupState={deletePopupState}
        maskState={getDeleteMaskState()}
        title="提示"
        content={`即将删除文件夹「${
          folders_obj && currentFolderKey && folders_obj[currentFolderKey]
            ? folders_obj[currentFolderKey].folder_name
            : ""
        }」内所有笔记，不可撤销(但内容可在废纸篓找回)`}
        onCancel={() => hideDeletePopup()}
        onConfirm={deleteFolderConfirm}
        onKeyDown={handleDeleteFolderKeyDown}
      ></AlertPopUp>
      <InputPopUp
        popupState={renamePopupState}
        maskState={getRenameMaskState()}
        initValue={curFolderName}
        setValue={setCurFolderName}
        onCancel={hideRenamePopup}
        onConfirm={renameFolderConfirm}
        onKeyDown={handleRenameFolderKeyDown}
      ></InputPopUp>
    </FolderListContainer>
  );
};

const FolderListContainer = styled.div(
  {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    borderRight: "1px solid rgba(58,64,76,0.8)",
    minWidth: "100px",
  },
  (props: { width: number }) => ({
    width: props.width,
  })
);

const FolderTopBar = styled.div({
  display: "flex",
  alignItems: "center",
  flexDirection: "row",
  margin: "10px 16px",
});

const FolderAddBtn = styled.div({
  width: "18px",
  height: "18px; ",
  display: "flex",
  alignItem: "center",
  justifyContent: "center",
  color: "#939395",
  cursor: "pointer",
});

const Folders = styled.div(
  {
    width: "100%",
    overflowY: "auto",
    overflowX: "hidden",
    flex: "1",
    minHeight: "0",
    paddingBottom: "56px",
    scrollBehavior: "smooth",
  },
  `
    &::-webkit-scrollbar {
        display: none;
    }
`
);

// &::-webkit-scrollbar {
//     width: 8px;
// }
// &::-webkit-scrollbar-track {
//     background-color: #2C3033;
// }
// &::-webkit-scrollbar-thumb {
//     background-color: hsla(0,0%,78%,.2);
//     border-radius: 3px;
// }

const FolderItem = styled.div`
  position: relative;
  height: 28px;
  line-height: 28px;
  font-size: 14px;
  padding: 0 16px;
  color: #939395;
  cursor: pointer;
  white-space: nowrap;
  &:hover {
    color: #ddd;
    background-color: rgba(47, 51, 56, 0.2);
  }
`;

const FolderKeyTab = styled.div({
  position: "absolute",
  top: "4px",
  right: "8px",
  width: "16px",
  height: "12px",
  lineHeight: "12px",
  fontSize: "12px",
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

// const FolderBottomBar = styled.div({
//     display: 'flex',
//     alignItems: 'center',
//     flexDirection: 'row-reverse',
//     padding: '8px'
// })

// const MoreFolder = styled.div({
//     width: '26px',
//     height: '26px',
//     padding: '3px',
//     display: 'flex',
//     alignItem: 'center',
//     justifyContent: 'center',
//     color: '#939395',
//     cursor: 'pointer'
// })

type FolderListProps = {
  data_path: string;
  folders_key: string[] | undefined;
  folders_obj: object | undefined;
  currentRepoKey: string | undefined;
  currentFolderKey: string | undefined;
  keySelect: boolean;
  repoSwitch: (id: string | undefined) => void;
  folderSwitch: (
    dataPath: string | null,
    folderKey: string | undefined
  ) => void;
  noteSwitch: (data_path: string | null, note_key: string | undefined) => void;
  updateRepos: (action_name: string, obj: object) => void;
  changeNotesAfterNew: (action_name: string, obj: object) => void;
  reorderFolder: (
    data_path: string,
    repo_key: string,
    new_folders_key: string[]
  ) => void;
  setFocus: (focus: string) => void;
  width: number;
};

export default FolderList;