import styled from "@emotion/styled";
import { useState, useRef, useEffect, useCallback } from "react";
import cryptoRandomString from "crypto-random-string";
import { TextInput } from "../../components/TextInput";
import { AlertPopUp } from "../../components/AlertPopUp";
import { InputPopUp } from "../../components/InputPopUp";
import FolderBox from "./FolderBox";
import { usePopUp } from "../../lib/usePopUp";
import useContextMenu from "../../lib/useContextMenu";
const { ipcRenderer } = window.require("electron");

const RepoList: React.FC<RepoListProps> = ({
  data_path,
  repos_key,
  repos_obj,
  currentRepoKey,
  currentFolderKey,
  keySelect,
  repoSwitch,
  folderSwitch,
  noteSwitch,
  updateDxnote,
  updateRepos,
  changeNotesAfterNew,
  setDataPath,
  reorderFolder,
  setFocus,
  setBlur,
  setKeySelect,
}) => {
  let [newRepoKey, setNewRepoKey] = useState("");
  let [newRepoName, setNewRepoName] = useState("");

  let [curRepoName, setCurRepoName] = useState("");

  const [repoScrollPage, setRepoScrollPage] = useState(() => {
    let page = 0;
    repos_key
      ?.filter((key) => repos_obj && repos_obj[key])
      .map((key, index) => {
        if (key === currentRepoKey) page = Math.ceil((index + 1) / 9) - 1;
      });
    return page;
  });

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

  const outerRef = useRef(null);
  const { xPos, yPos, menu } = useContextMenu(outerRef);
  const [folderMenu, setFolderMenu] = useState(false);

  const newRepo = () => {
    const repo_key = cryptoRandomString({ length: 12, type: "alphanumeric" });
    setNewRepoKey(repo_key);
  };

  const newRepoInputChange = (e: any) => {
    setNewRepoName(e.target.value);
  };

  const newRepoInputEnter = (e: any, repo_key: string) => {
    if (e.keyCode === 13) {
      newRepoSubmit(e, repo_key);
    }
  };

  const newRepoSubmit = useCallback(
    (e: any, repo_key: string) => {
      console.log("newRepoSubmit");
      if (e.target.value === "") {
        setNewRepoKey("");
        setNewRepoName("");
        return;
      }

      const default_folder_key = cryptoRandomString({
        length: 12,
        type: "alphanumeric",
      });
      const default_note_key = cryptoRandomString({
        length: 12,
        type: "alphanumeric",
      });

      let dxnote_info = ipcRenderer.sendSync("readJson", {
        file_path: `${data_path}/dxnote_info.json`,
      });
      dxnote_info.repos_key.push(repo_key);
      dxnote_info.cur_repo_key = repo_key;
      dxnote_info.repos[repo_key] = {
        cur_folder_key: default_folder_key,
        folders: {},
      };
      ipcRenderer.sendSync("writeJson", {
        file_path: `${data_path}/dxnote_info.json`,
        obj: dxnote_info,
      });

      let repo_info = {
        repo_name: e.target.value,
        folders_key: [default_folder_key],
      };
      ipcRenderer.sendSync("writeJson", {
        file_path: `${data_path}/${repo_key}/repo_info.json`,
        obj: repo_info,
      });

      // default folder
      let folder_info = {
        folder_name: "默认文件夹",
        notes_key: [default_note_key],
        notes_obj: {},
      };

      folder_info.notes_obj[default_note_key] = {
        title: "空笔记",
      };

      ipcRenderer.sendSync("writeJson", {
        file_path: `${data_path}/${repo_key}/${default_folder_key}/folder_info.json`,
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
        file_path: `${data_path}/${repo_key}/${default_folder_key}/${default_note_key}.cson`,
        obj: note_info,
      });

      updateDxnote(data_path);
      updateRepos("repo", { data_path, repo_key });
      updateRepos("folder", {
        data_path,
        repo_key,
        folder_key: default_folder_key,
      });
      changeNotesAfterNew("repo", { data_path, repo_key });
      changeNotesAfterNew("folder", {
        data_path,
        repo_key,
        folder_key: default_folder_key,
      });
      changeNotesAfterNew("note", {
        data_path,
        repo_key,
        folder_key: default_folder_key,
        note_key: default_note_key,
      });

      setNewRepoKey("");
      setNewRepoName("");
      repoSwitch(repo_key);
      setRepoScrollPage(Math.ceil(dxnote_info.repos_key.length / 9) - 1);
      folderSwitch(data_path, default_folder_key);
      noteSwitch(data_path, default_note_key);
      setFocus(cryptoRandomString({ length: 24, type: "alphanumeric" }));
    },
    [data_path]
  );

  // part2 : rename repo
  useEffect(() => {
    setCurRepoName(
      repos_obj && currentRepoKey && repos_obj[currentRepoKey]
        ? repos_obj[currentRepoKey].repo_name
        : ""
    );
  }, [repos_obj, currentRepoKey]);

  const renameRepo = () => {
    showRenamePopup();
  };

  const handleRenameRepoKeyDown = (e: any) => {
    if (e.keyCode === 27) {
      hideRenamePopup();
    } else if (e.keyCode === 13) {
      renameRepoConfirm();
    }
  };

  const renameRepoConfirm = useCallback(() => {
    console.log(curRepoName);
    if (currentRepoKey) {
      let repo_info = ipcRenderer.sendSync("readJson", {
        file_path: `${data_path}/${currentRepoKey}/repo_info.json`,
      });
      repo_info.repo_name = curRepoName;
      ipcRenderer.sendSync("writeJson", {
        file_path: `${data_path}/${currentRepoKey}/repo_info.json`,
        obj: repo_info,
      });
      updateRepos("repo", { data_path, repo_key: currentRepoKey });
      hideRenamePopup();
    }
  }, [data_path, currentRepoKey, curRepoName]);

  // part3 : delete repo
  const deleteRepo = () => {
    showDeletePopup();
  };

  const handleDeleteRepoKeyDown = (e: any) => {
    if (e.keyCode === 13) {
      deleteRepoConfirm();
    } else if (e.keyCode === 27) {
      hideDeletePopup();
    }
  };

  const deleteRepoConfirm = useCallback(() => {
    if (currentRepoKey) {
      console.log("delete repo");
      let repo_info = ipcRenderer.sendSync("readJson", {
        file_path: `${data_path}/${currentRepoKey}/repo_info.json`,
      });

      let trash = ipcRenderer.sendSync("readCson", {
        file_path: `${data_path}/trash.cson`,
      });

      trash = trash ? trash : {};

      repo_info.folders_key.forEach((folder_key: string) => {
        let folder_info = ipcRenderer.sendSync("readJson", {
          file_path: `${data_path}/${currentRepoKey}/${folder_key}/folder_info.json`,
        });

        folder_info.notes_key.forEach((note_key: string) => {
          let note_info = ipcRenderer.sendSync("readCson", {
            file_path: `${data_path}/${currentRepoKey}/${folder_key}/${note_key}.cson`,
          });

          trash[
            `${currentRepoKey}-${folder_key}-${note_key}-${folder_info.notes_obj[note_key]?.title}`
          ] = note_info.content;
        });
      });

      ipcRenderer.sendSync("writeCson", {
        file_path: `${data_path}/trash.cson`,
        obj: trash,
      });

      let dxnote_info = ipcRenderer.sendSync("readJson", {
        file_path: `${data_path}/dxnote_info.json`,
      });

      let new_repos_key: string[] = [];
      let other_repo_key = undefined;

      dxnote_info.repos_key.forEach((key: string, index: number) => {
        if (key == currentRepoKey) {
          if (dxnote_info.repos_key.length > 1) {
            if (index == dxnote_info.repos_key.length - 1) {
              other_repo_key = dxnote_info.repos_key[index - 1];
            } else {
              other_repo_key = dxnote_info.repos_key[index + 1];
            }
          }
        } else {
          new_repos_key.push(key);
        }
      });

      dxnote_info.repos_key = new_repos_key;
      if (dxnote_info.repos[currentRepoKey]) {
        delete dxnote_info.repos[currentRepoKey];
      }

      ipcRenderer.sendSync("writeJson", {
        file_path: `${data_path}/dxnote_info.json`,
        obj: dxnote_info,
      });

      ipcRenderer.sendSync("remove", {
        file_path: `${data_path}/${currentRepoKey}`,
      });

      updateRepos("repo", { data_path, repo_key: currentRepoKey });
      repoSwitch(other_repo_key);
      setRepoScrollPage(Math.ceil(dxnote_info.repos_key.length / 9) - 1);
      hideDeletePopup();
    }
  }, [data_path, currentRepoKey]);

  const preRepoPage = useCallback(() => {
    if (repoScrollPage > 0) {
      setRepoScrollPage((repoScrollPage) => repoScrollPage - 1);
    }
  }, [repos_key, repoScrollPage]);

  const nextRepoPage = useCallback(() => {
    if (repos_key && repos_key.length > 9) {
      if (repoScrollPage <= (repos_key.length - 1) / 9.0 - 1) {
        setRepoScrollPage((repoScrollPage) => repoScrollPage + 1);
      }
    }
  }, [repos_key, repoScrollPage]);

  useEffect(() => {
    if (repos_key && repos_key.length <= 9) {
      setRepoScrollPage(0);
    }
  }, [repos_key]);

  const handleKeyDown = useCallback(
    (e: any) => {
      // console.log(e.ctrlKey)
      // console.log(e.shiftKey)
      // console.log(e.altKey)
      // console.log(e.metaKey)
      // console.log(e.keyCode)
      if (process.platform === "darwin") {
        //console.log('这是mac系统');

        // normal number 1-9
        if (e.keyCode >= 49 && e.keyCode <= 57 && e.metaKey) {
          const num = parseInt(e.keyCode) - 48;
          const index = num + 9 * repoScrollPage - 1;
          if (repos_key && index < repos_key.length) {
            repoSwitch(repos_key[index]);
            setKeySelect(true);
          }
          setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
        }

        // normal number 0
        if (e.keyCode === 48 && e.metaKey) {
          setKeySelect(true);
          setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
        }

        //nromal enter
        if (e.keyCode === 13 && keySelect) {
          console.log("gaga");
          setKeySelect(false);
          setTimeout(() => {
            setFocus(cryptoRandomString({ length: 24, type: "alphanumeric" }));
          }, 0);
        }

        // extra number 1-9
        if (e.keyCode >= 97 && e.keyCode <= 105 && e.metaKey) {
          const num = parseInt(e.keyCode) - 96;
          const index = num + 9 * repoScrollPage - 1;
          if (repos_key && index < repos_key.length) {
            repoSwitch(repos_key[index]);
            setKeySelect(true);
          }
          setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
        }

        // extra number 0
        if (e.keyCode === 96 && e.metaKey) {
          setKeySelect(true);
          setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
        }

        //extra enter
        if (e.keyCode === 108 && keySelect) {
          setKeySelect(false);
          setTimeout(() => {
            setFocus(cryptoRandomString({ length: 24, type: "alphanumeric" }));
          }, 0);
        }

        // esc
        if (e.keyCode === 27) {
          if (keySelect) {
            setKeySelect(false);
          } else {
            setTimeout(() => {
              setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
            }, 0);
          }
        }

        // arrow right 39 change to L 76
        if (e.keyCode === 76 && e.metaKey) {
          nextRepoPage();
        }

        // arrow left 37 change to J 74
        if (e.keyCode === 74 && e.metaKey) {
          preRepoPage();
        }
      }
      if (process.platform === "win32" || process.platform === "linux") {
        //console.log('这是windows系统');

        // normal number 1-9
        if (e.keyCode >= 49 && e.keyCode <= 57 && e.ctrlKey) {
          const num = parseInt(e.keyCode) - 48;
          const index = num + 9 * repoScrollPage - 1;
          if (repos_key && index < repos_key.length) {
            repoSwitch(repos_key[index]);
            setKeySelect(true);
          }
          setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
        }

        // normal number 0
        if (e.keyCode === 48 && e.ctrlKey) {
          setKeySelect(true);
        }

        //nromal enter
        if (e.keyCode === 13 && keySelect) {
          setKeySelect(false);
          setTimeout(() => {
            setFocus(cryptoRandomString({ length: 24, type: "alphanumeric" }));
          }, 0);
        }

        // extra number 1-9
        if (e.keyCode >= 97 && e.keyCode <= 105 && e.ctrlKey) {
          const num = parseInt(e.keyCode) - 96;
          const index = num + 9 * repoScrollPage - 1;
          if (repos_key && index < repos_key.length) {
            repoSwitch(repos_key[index]);
            setKeySelect(true);
          }
          setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
        }

        // extra number 0
        if (e.keyCode === 96 && e.ctrlKey) {
          setKeySelect(true);
        }

        //extra enter
        if (e.keyCode === 108 && keySelect) {
          setKeySelect(false);
          setTimeout(() => {
            setFocus(cryptoRandomString({ length: 24, type: "alphanumeric" }));
          }, 0);
        }

        // esc
        if (e.keyCode === 27) {
          if (keySelect) {
            setKeySelect(false);
          } else {
            setTimeout(() => {
              setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
            }, 0);
          }
        }

        // arrow right 39 change to L 76
        if (e.keyCode === 76 && e.ctrlKey) {
          nextRepoPage();
        }

        // arrow left 37 change to J 74
        if (e.keyCode === 74 && e.ctrlKey) {
          preRepoPage();
        }
      }
    },
    [keySelect, repos_key, repoScrollPage, nextRepoPage, preRepoPage]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <RepoListContainer>
      {repos_key && repos_obj ? (
        <Repos ref={outerRef}>
          {repos_key && repos_key.length > 9 ? (
            <RepoPreBtn onClick={() => preRepoPage()}>&lt;</RepoPreBtn>
          ) : (
            <></>
          )}
          {repos_key && repos_key.length > 9 ? (
            <RepoNextBtn onClick={() => nextRepoPage()}>&gt;</RepoNextBtn>
          ) : (
            <></>
          )}
          {repos_key
            .filter((key) => repos_obj && repos_obj[key])
            .map((key, index) => {
              if (
                index >= repoScrollPage * 9 &&
                index < (repoScrollPage + 1) * 9
              ) {
                return (
                  <RepoItem
                    key={key}
                    className="repoItem"
                    style={{
                      backgroundColor: currentRepoKey === key ? "#3a404c" : "",
                    }}
                  >
                    <RepoItemName
                      onClick={() => repoSwitch(key)}
                      onContextMenu={() => {
                        if (currentRepoKey !== key) repoSwitch(key);
                      }}
                    >
                      {repos_obj[key].repo_name}
                    </RepoItemName>
                    {currentRepoKey !== key ? (
                      <RepoItemContent className="repoItemContent">
                        <FolderBox
                          data_path={data_path}
                          currentRepoKey={key}
                          currentFolderKey={currentFolderKey}
                          folders_key={repos_obj[key]?.folders_key}
                          folders_obj={repos_obj[key]?.folders_obj}
                          repoSwitch={repoSwitch}
                          folderSwitch={folderSwitch}
                          reorderFolder={reorderFolder}
                          width={150}
                        />
                      </RepoItemContent>
                    ) : (
                      <></>
                    )}
                  </RepoItem>
                );
              }
            })}
          {menu && currentRepoKey && !folderMenu ? (
            <MenuUl top={yPos} left={xPos}>
              <MenuLi onClick={() => renameRepo()}>重命名</MenuLi>
              <MenuLi onClick={() => deleteRepo()}>删除仓库</MenuLi>
            </MenuUl>
          ) : (
            <></>
          )}
        </Repos>
      ) : (
        <></>
      )}
      {newRepoKey ? (
        <TextInput
          key={newRepoKey}
          value={newRepoName}
          className="repoNameInput"
          placeholder="输入仓库名后回车"
          autoFocus={true}
          onBlur={(e) => newRepoSubmit(e, newRepoKey)}
          onChange={(e) => newRepoInputChange(e)}
          onKeyUp={(e) => newRepoInputEnter(e, newRepoKey)}
        />
      ) : (
        <div></div>
      )}
      {data_path && !newRepoKey ? (
        <RepoAddBtn onClick={newRepo}>+</RepoAddBtn>
      ) : (
        <div></div>
      )}
      <AlertPopUp
        popupState={deletePopupState}
        maskState={getDeleteMaskState()}
        title="提示"
        content={`即将删除仓库「${
          repos_obj && currentRepoKey && repos_obj[currentRepoKey]
            ? repos_obj[currentRepoKey].repo_name
            : ""
        }」内所有笔记，不可撤销(但内容可在废纸篓找回)`}
        onCancel={() => hideDeletePopup()}
        onConfirm={deleteRepoConfirm}
        onKeyDown={handleDeleteRepoKeyDown}
      ></AlertPopUp>
      <InputPopUp
        popupState={renamePopupState}
        maskState={getRenameMaskState()}
        initValue={curRepoName}
        setValue={setCurRepoName}
        onCancel={hideRenamePopup}
        onConfirm={renameRepoConfirm}
        onKeyDown={handleRenameRepoKeyDown}
      ></InputPopUp>
    </RepoListContainer>
  );
};

const RepoListContainer = styled.div({
  display: "flex",
  flex: "1",
  minWidth: "0",
});

const Repos = styled.div({
  display: "flex",
  minWidth: "0",
});

const RepoItem = styled.div`
  position: relative;
  display: flex;
  height: 32px;
  line-height: 32px;
  margin-right: 10px;
  border-radius: 5px;
  color: #939395;
  background-color: rgba(58, 64, 76, 0.3);
  cursor: pointer;
`;

const RepoItemName = styled.div({
  padding: "0 10px",
  overflow: "hidden !important",
  textOverflow: "ellipsis",
  wordBreak: "break-all",
});

const RepoItemContent = styled.div({
  position: "absolute",
  top: "30px",
  left: "-10px",
  height: "calc(100vh - 60px)",
  backgroundColor: "#2c3033",
  zIndex: "9999",
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

const RepoPreBtn = styled.div`
  min-width: 32px;
  height: 32px;
  line-height: 30px;
  margin-right: 10px;
  font-size: 20px;
  border-radius: 5px;
  display: flex;
  align-item: center;
  justify-content: center;
  color: #939395;
  background-color: rgba(58, 64, 76, 0.3);
  cursor: pointer;
`;

const RepoNextBtn = styled.div`
  min-width: 32px;
  height: 32px;
  line-height: 30px;
  margin-right: 10px;
  font-size: 20px;
  border-radius: 5px;
  display: flex;
  align-item: center;
  justify-content: center;
  color: #939395;
  background-color: rgba(58, 64, 76, 0.3);
  cursor: pointer;
`;

const RepoAddBtn = styled.div`
  min-width: 32px;
  height: 32px;
  line-height: 26px;
  margin: 0 10px 0 20px;
  font-size: 28px;
  border-radius: 5px;
  display: flex;
  align-item: center;
  justify-content: center;
  color: #939395;
  background-color: rgba(58, 64, 76, 0.3);
  cursor: pointer;
`;

// const MoreRepo = styled.div({
//     width: '26px',
//     height: '26px',
//     padding: '3px',
//     margin: '0 8px',
//     display: 'flex',
//     alignItem: 'center',
//     justifyContent: 'center',
//     color: '#939395',
//     cursor: 'pointer'
// })

type RepoListProps = {
  data_path: string;
  repos_key: string[] | undefined;
  repos_obj: object | undefined;
  currentRepoKey: string;
  currentFolderKey: string;
  keySelect: boolean;
  repoSwitch: (id: string | undefined) => void;
  folderSwitch: (
    dataPath: string | null,
    folderKey: string | undefined
  ) => void;
  noteSwitch: (data_path: string | null, note_key: string | undefined) => void;
  updateDxnote: (data_path: string) => void;
  updateRepos: (action_name: string, obj: object) => void;
  changeNotesAfterNew: (action_name: string, obj: object) => void;
  setDataPath: (path: string) => void;
  reorderFolder: (
    data_path: string,
    repo_key: string,
    new_folders_key: string[]
  ) => void;
  setFocus: (focus: string) => void;
  setBlur: (focus: string) => void;
  setKeySelect: (keySelect: boolean) => void;
};

export default RepoList;
