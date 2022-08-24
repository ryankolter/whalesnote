import styled from "@emotion/styled";
import { useState, useRef, useEffect, useCallback } from "react";
import cryptoRandomString from "crypto-random-string";
import { DndContext, MouseSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Sortable } from "../../components/Sortable";
import { TextInput } from "../../components/TextInput";
import { AlertPopUp } from "../../components/AlertPopUp";
import { InputPopUp } from "../../components/InputPopUp";
import { usePopUp } from "../../lib/usePopUp";
import useContextMenu from "../../lib/useContextMenu";
const { ipcRenderer } = window.require("electron");

const RepoPanel: React.FC<RepoListProps> = ({
    data_path,
    repos_key,
    repos_obj,
    currentRepoKey,
    currentFolderKey,
    keySelect,
    showAllRepo,
    repoSwitch,
    folderSwitch,
    noteSwitch,
    updateDxnote,
    updateRepos,
    changeNotesAfterNew,
    setDataPath,
    reorderRepo,
    setFocus,
    setBlur,
    setKeySelect,
    setShowAllRepo,
    setAllowHiddenAllRepoViaEnter,
}) => {
    const [activeId, setActiveId] = useState(null);
    let [newRepoKey, setNewRepoKey] = useState("");
    let [newRepoName, setNewRepoName] = useState("");

    let [curRepoName, setCurRepoName] = useState("");

    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));

    const [repoScrollPage, setRepoScrollPage] = useState(() => {
        let page = 0;
        repos_key
            ?.filter((key) => repos_obj && repos_obj[key])
            .forEach((key, index) => {
                if (key === currentRepoKey) page = Math.floor(index / 9.0);
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

    const repoScrollRef = useRef<HTMLDivElement>(null);

    const closeRepoList = useCallback(() => {
        setShowAllRepo(false);
    }, [keySelect, setKeySelect, setShowAllRepo]);

    const handleKeySelectShow = useCallback(() => {
        if (keySelect) {
            let page = 0;
            repos_key
                ?.filter((key) => repos_obj && repos_obj[key])
                .forEach((key, index) => {
                    if (key === currentRepoKey) page = Math.floor(index / 9.0);
                });
            if (page && repoScrollRef && repoScrollRef.current) {
                repoScrollRef.current.scrollLeft =
                    Math.floor(page / 5.0) * repoScrollRef.current.offsetWidth;
            }
        }
    }, [keySelect, repos_obj, currentRepoKey, repos_key]);

    useEffect(() => {
        if (showAllRepo) {
            handleKeySelectShow();
        }
    }, [showAllRepo, handleKeySelectShow]);

    //part1: switch repo in panel
    const repoSwitchInPanel = useCallback(
        (repo_key: string) => {
            repoSwitch(repo_key);
            repos_key
                ?.filter((key) => repos_obj && repos_obj[key])
                .forEach((key, index) => {
                    if (key === repo_key) setRepoScrollPage(Math.floor(index / 9.0));
                });
        },
        [repos_key, repoSwitch, repos_obj]
    );

    // part2 : new repo
    const newRepo = () => {
        const repo_key = cryptoRandomString({
            length: 12,
            type: "alphanumeric",
        });
        setNewRepoKey(repo_key);
        setAllowHiddenAllRepoViaEnter(false);
    };

    const newRepoInputChange = (e: any) => {
        setNewRepoName(e.target.value);
    };

    const newRepoInputEnter = (e: any, repo_key: string) => {
        if (e.keyCode === 13) {
            newRepoSubmit(e, repo_key);
        }
    };

    const scrollToRight = useCallback(() => {
        if (repoScrollRef && repoScrollRef.current) {
            repoScrollRef.current.scrollLeft = repoScrollRef.current.scrollWidth;
        }
    }, [repoScrollRef]);

    const newRepoSubmit = useCallback(
        (e: any, repo_key: string) => {
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
                folder_name: "默认分类",
                notes_key: [default_note_key],
                notes_obj: {
                    [default_note_key]: {
                        title: "新建文档",
                    },
                },
            };

            ipcRenderer.sendSync("writeJson", {
                file_path: `${data_path}/${repo_key}/${default_folder_key}/folder_info.json`,
                obj: folder_info,
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

            setNewRepoKey("");
            setNewRepoName("");
            repoSwitchInPanel(repo_key);
            setRepoScrollPage(Math.ceil(dxnote_info.repos_key.length / 9) - 1);
            folderSwitch(data_path, default_folder_key);
            noteSwitch(data_path, default_note_key);
            setAllowHiddenAllRepoViaEnter(true);
            scrollToRight();
            setShowAllRepo(false);
            setTimeout(() => {
                setFocus(
                    cryptoRandomString({
                        length: 24,
                        type: "alphanumeric",
                    })
                );
            }, 0);
        },
        [
            data_path,
            changeNotesAfterNew,
            folderSwitch,
            repoSwitchInPanel,
            scrollToRight,
            setAllowHiddenAllRepoViaEnter,
            setFocus,
            updateDxnote,
            updateRepos,
        ]
    );

    // part3 : rename repo
    useEffect(() => {
        setCurRepoName(
            repos_obj && currentRepoKey && repos_obj[currentRepoKey]
                ? repos_obj[currentRepoKey].repo_name
                : ""
        );
    }, [repos_obj, currentRepoKey]);

    const renameRepo = () => {
        showRenamePopup();
        setAllowHiddenAllRepoViaEnter(false);
    };

    const renameRepoConfirm = useCallback(() => {
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
            setAllowHiddenAllRepoViaEnter(true);
        }
    }, [
        data_path,
        currentRepoKey,
        curRepoName,
        hideRenamePopup,
        setAllowHiddenAllRepoViaEnter,
        updateRepos,
    ]);

    const handleRenameRepoKeyDown = useCallback(
        (e: any) => {
            if (e.keyCode === 27) {
                hideRenamePopup();
                setCurRepoName(
                    repos_obj && currentRepoKey && repos_obj[currentRepoKey]
                        ? repos_obj[currentRepoKey].repo_name
                        : ""
                );
            } else if (e.keyCode === 13) {
                renameRepoConfirm();
            }
        },
        [hideRenamePopup, setCurRepoName, repos_obj, currentRepoKey, renameRepoConfirm]
    );

    // part4 : delete repo
    const deleteRepo = () => {
        showDeletePopup();
        setAllowHiddenAllRepoViaEnter(false);
    };

    const deleteRepoConfirm = useCallback(() => {
        if (currentRepoKey) {
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
                if (key === currentRepoKey) {
                    if (dxnote_info.repos_key.length > 1) {
                        if (index === dxnote_info.repos_key.length - 1) {
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
            if (other_repo_key) {
                repoSwitchInPanel(other_repo_key);
            }
            setRepoScrollPage(Math.ceil(dxnote_info.repos_key.length / 9) - 1);
            hideDeletePopup();
            setAllowHiddenAllRepoViaEnter(true);
        }
    }, [
        data_path,
        currentRepoKey,
        hideDeletePopup,
        repoSwitchInPanel,
        setAllowHiddenAllRepoViaEnter,
        updateRepos,
    ]);

    const handleDeleteRepoKeyDown = useCallback(
        (e: any) => {
            if (e.keyCode === 27) {
                hideDeletePopup();
            } else if (e.keyCode === 13) {
                deleteRepoConfirm();
            }
        },
        [hideDeletePopup, deleteRepoConfirm]
    );

    const preRepoPage = useCallback(() => {
        if (repoScrollPage > 0) {
            if (repoScrollRef && repoScrollRef.current) {
                repoScrollRef.current.scrollLeft =
                    Math.floor((repoScrollPage - 1) / 5.0) * repoScrollRef.current.offsetWidth;
            }
            setRepoScrollPage((repoScrollPage) => repoScrollPage - 1);
        }
    }, [repoScrollPage]);

    const nextRepoPage = useCallback(() => {
        if (repos_key && repos_key.length > 9) {
            if (repoScrollPage <= (repos_key.length - 1) / 9.0 - 1) {
                if (repoScrollRef && repoScrollRef.current) {
                    repoScrollRef.current.scrollLeft =
                        Math.floor((repoScrollPage + 1) / 5.0) * repoScrollRef.current.offsetWidth;
                }
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
                        repoSwitchInPanel(repos_key[index]);
                        setKeySelect(true);
                    }
                    setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
                }

                // extra number 1-9
                if (e.keyCode >= 97 && e.keyCode <= 105 && e.metaKey) {
                    const num = parseInt(e.keyCode) - 96;
                    const index = num + 9 * repoScrollPage - 1;
                    if (repos_key && index < repos_key.length) {
                        repoSwitchInPanel(repos_key[index]);
                        setKeySelect(true);
                    }
                    setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
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
                        repoSwitchInPanel(repos_key[index]);
                        setKeySelect(true);
                    }
                    setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
                }

                // extra number 1-9
                if (e.keyCode >= 97 && e.keyCode <= 105 && e.ctrlKey) {
                    const num = parseInt(e.keyCode) - 96;
                    const index = num + 9 * repoScrollPage - 1;
                    if (repos_key && index < repos_key.length) {
                        repoSwitchInPanel(repos_key[index]);
                        setKeySelect(true);
                    }
                    setBlur(cryptoRandomString({ length: 24, type: "alphanumeric" }));
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
        [
            repos_key,
            repoScrollPage,
            repoSwitchInPanel,
            nextRepoPage,
            preRepoPage,
            setBlur,
            setKeySelect,
        ]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [handleKeyDown]);

    const handleWhell = useCallback((e: any) => {
        e.preventDefault();
        if (repoScrollRef && repoScrollRef.current) {
            repoScrollRef.current.scrollLeft += e.deltaY;
        }
    }, []);

    useEffect(() => {
        if (repoScrollRef && repoScrollRef.current) {
            repoScrollRef.current.addEventListener("wheel", handleWhell);
            return () => {
                repoScrollRef.current?.removeEventListener("wheel", handleWhell);
            };
        }
    }, [handleWhell]);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = useCallback(
        (event: any) => {
            setActiveId(null);
            const { active, over } = event;

            if (!over) return;

            if (active.id !== over.id && repos_key && currentRepoKey && currentFolderKey) {
                const oldIndex = repos_key.indexOf(active.id);
                const newIndex = repos_key.indexOf(over.id);
                let new_repos_key = arrayMove(repos_key, oldIndex, newIndex);
                reorderRepo(data_path, currentRepoKey, new_repos_key);
            }
        },
        [data_path, currentRepoKey, currentFolderKey, repos_key, reorderRepo]
    );

    return (
        <RepoListContainer>
            <CloseRepoListBtn
                onClick={() => {
                    closeRepoList();
                }}
            >
                x
            </CloseRepoListBtn>
            <ReposScroll ref={repoScrollRef}>
                <Repos ref={outerRef}>
                    {repos_key && repos_obj ? (
                        <DndContext
                            sensors={sensors}
                            // modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={repos_key}
                                strategy={verticalListSortingStrategy}
                            >
                                {repos_key
                                    .filter((key) => repos_obj && repos_obj[key])
                                    .map((key, index) => {
                                        if (index === repoScrollPage * 9) {
                                            return (
                                                <Sortable
                                                    key={key}
                                                    id={key}
                                                    className='repoItemSort'
                                                >
                                                    <RepoItem
                                                        key={key}
                                                        onClick={() => repoSwitchInPanel(key)}
                                                        onContextMenu={() => {
                                                            if (currentRepoKey !== key)
                                                                repoSwitchInPanel(key);
                                                        }}
                                                    >
                                                        <RepoItemName
                                                            style={{
                                                                backgroundColor:
                                                                    currentRepoKey === key
                                                                        ? "#3a404c"
                                                                        : "",
                                                            }}
                                                        >
                                                            {repos_obj[key].repo_name}
                                                            {keySelect ? (
                                                                <RepoGroupItem
                                                                    style={{
                                                                        color:
                                                                            currentRepoKey === key
                                                                                ? "#E9E9E9"
                                                                                : "#939395",
                                                                    }}
                                                                >
                                                                    1
                                                                </RepoGroupItem>
                                                            ) : (
                                                                <></>
                                                            )}
                                                        </RepoItemName>
                                                        {keySelect ? (
                                                            <RepoGroupSelect></RepoGroupSelect>
                                                        ) : (
                                                            <></>
                                                        )}
                                                    </RepoItem>
                                                </Sortable>
                                            );
                                        } else if (
                                            index > repoScrollPage * 9 &&
                                            index < (repoScrollPage + 1) * 9
                                        ) {
                                            return (
                                                <Sortable
                                                    key={key}
                                                    id={key}
                                                    className='repoItemSort'
                                                >
                                                    <RepoItem
                                                        key={key}
                                                        onClick={() => repoSwitchInPanel(key)}
                                                        onContextMenu={() => {
                                                            if (currentRepoKey !== key)
                                                                repoSwitchInPanel(key);
                                                        }}
                                                    >
                                                        <RepoItemName
                                                            style={{
                                                                backgroundColor:
                                                                    currentRepoKey === key
                                                                        ? "#3a404c"
                                                                        : "",
                                                            }}
                                                        >
                                                            {repos_obj[key].repo_name}
                                                            {keySelect ? (
                                                                <RepoGroupItem
                                                                    style={{
                                                                        color:
                                                                            currentRepoKey === key
                                                                                ? "#E9E9E9"
                                                                                : "#939395",
                                                                    }}
                                                                >
                                                                    {(index % 9) + 1}
                                                                </RepoGroupItem>
                                                            ) : (
                                                                <></>
                                                            )}
                                                        </RepoItemName>
                                                    </RepoItem>
                                                </Sortable>
                                            );
                                        } else {
                                            return (
                                                <Sortable
                                                    key={key}
                                                    id={key}
                                                    className='repoItemSort'
                                                >
                                                    <RepoItem
                                                        key={key}
                                                        onClick={() => repoSwitchInPanel(key)}
                                                        onContextMenu={() => {
                                                            if (currentRepoKey !== key)
                                                                repoSwitchInPanel(key);
                                                        }}
                                                    >
                                                        <RepoItemName
                                                            style={{
                                                                backgroundColor:
                                                                    currentRepoKey === key
                                                                        ? "#3a404c"
                                                                        : "",
                                                            }}
                                                        >
                                                            {repos_obj[key].repo_name}
                                                        </RepoItemName>
                                                    </RepoItem>
                                                </Sortable>
                                            );
                                        }
                                        // }
                                    })}
                                {menu && currentRepoKey && !folderMenu ? (
                                    <MenuUl top={yPos} left={xPos}>
                                        <MenuLi onClick={() => renameRepo()}>重命名</MenuLi>
                                        <MenuLi onClick={() => deleteRepo()}>删除仓库</MenuLi>
                                    </MenuUl>
                                ) : (
                                    <></>
                                )}
                            </SortableContext>
                            <DragOverlay>
                                <div>
                                    {activeId && repos_obj ? (
                                        <RepoItem key={activeId}>
                                            <RepoItemName
                                                style={{
                                                    backgroundColor:
                                                        currentRepoKey === activeId
                                                            ? "#3a404c"
                                                            : "",
                                                }}
                                            >
                                                {repos_obj[activeId]["repo_name"]}
                                            </RepoItemName>
                                        </RepoItem>
                                    ) : null}
                                </div>
                            </DragOverlay>
                        </DndContext>
                    ) : (
                        <></>
                    )}
                    {data_path && !newRepoKey ? (
                        <RepoAdd>
                            <RepoAddBtn onClick={newRepo}>
                                +
                                {repos_key &&
                                repos_key.filter((key) => repos_obj && repos_obj[key]).length ==
                                    1 ? (
                                    <AddReposTips>
                                        <div>点击按钮</div>
                                        <div>添加新资料库</div>
                                    </AddReposTips>
                                ) : (
                                    <></>
                                )}
                            </RepoAddBtn>
                        </RepoAdd>
                    ) : (
                        <div></div>
                    )}
                    {newRepoKey ? (
                        <TextInput
                            key={newRepoKey}
                            value={newRepoName}
                            className='repoNameInput'
                            placeholder='输入新的资料库名'
                            autoFocus={true}
                            onBlur={(e) => newRepoSubmit(e, newRepoKey)}
                            onChange={(e) => newRepoInputChange(e)}
                            onKeyUp={(e) => newRepoInputEnter(e, newRepoKey)}
                        />
                    ) : (
                        <div></div>
                    )}
                    <RepoItemPadding></RepoItemPadding>
                </Repos>
            </ReposScroll>
            <AlertPopUp
                popupState={deletePopupState}
                maskState={getDeleteMaskState()}
                title='提示'
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
    flexDirection: "column",
    flex: "1",
    minWidth: "0",
});

const CloseRepoListBtn = styled.div({
    width: "20px",
    height: "20px",
    lineHeight: "18px",
    fontSize: "20px",
    color: "#939395",
    padding: "5px 10px",
    margin: "0 0 2px 0",
    cursor: "pointer",
});

const ReposScroll = styled.div(
    {
        overflow: "auto",
    },
    `
    &::-webkit-scrollbar {
        height: 10px;
    }
    &::-webkit-scrollbar-track {
        background-color: #2C3033;
    }
    &::-webkit-scrollbar-thumb {
        background-color: hsla(0,0%,78%,.2);
        border-radius: 3px;
    }
`
);

const Repos = styled.div({
    display: "flex",
    flexDirection: "column",
    flexWrap: "wrap",
    margin: "8px 0",
    height: "calc(9 * (28px + 4px) + 5px)",
});

const RepoItem = styled.div({
    position: "relative",
    display: "flex",
    width: "100%",
    height: "28px",
    lineHeight: "28px",
    margin: "0 10px 4px 10px",
    color: "#939395",
    cursor: "pointer",
});

const RepoItemName = styled.div({
    padding: "0 10px",
    borderRadius: "5px",
    overflow: "hidden !important",
    textOverflow: "ellipsis",
    wordBreak: "break-all",
});

const RepoGroupSelect = styled.div({
    position: "absolute",
    top: "-7px",
    left: "-5px",
    height: "calc(9 * (28px + 4px) + 5px)",
    width: "calc(100% + 6px)",
    border: "2px dotted rgb(58, 64, 76)",
    borderRadius: "5px",
    color: "transparent",
});

const RepoGroupItem = styled.div({
    position: "absolute",
    top: "4px",
    right: "4px",
    width: "14px",
    height: "14px",
    lineHeight: "14px",
    fontSize: "12px",
    textAlign: "center",
    letterSpacing: "1px",
    padding: "2px",
    borderRadius: "8px",
    backgroundColor: "rgb(58, 64, 76)",
});

const RepoItemPadding = styled.div({
    width: "calc(100% / 5 * 4)",
    height: "100%",
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

const RepoAdd = styled.div({
    width: "calc(20% - 20px)",
});

const RepoAddBtn = styled.div({
    position: "relative",
    width: "28px",
    height: "28px",
    lineHeight: "24px",
    margin: "5px 10px 0 20px",
    fontSize: "28px",
    borderRadius: "5px",
    display: "flex",
    alignItem: "center",
    justifyContent: "center",
    color: "#939395",
    backgroundColor: "rgba(58, 64, 76, 0.3)",
    cursor: "pointer",
});

const AddReposTips = styled.div({
    color: "#939395",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "90px",
    marginTop: "20px",
    fontSize: "14px",
    position: "absolute",
    bottom: "-80px",
    left: "10px",
    border: "1px dotted rgba(58, 64, 76)",
    padding: "5px 10px",
    borderRadius: "5px",
    background: "rgba(47, 51, 56)",
});

type RepoListProps = {
    data_path: string;
    repos_key: string[] | undefined;
    repos_obj: object | undefined;
    currentRepoKey: string | undefined;
    currentFolderKey: string | undefined;
    keySelect: boolean;
    showAllRepo: boolean;
    repoSwitch: (id: string | undefined) => void;
    folderSwitch: (dataPath: string | null, folderKey: string | undefined) => void;
    noteSwitch: (data_path: string | null, note_key: string | undefined) => void;
    updateDxnote: (data_path: string) => void;
    updateRepos: (action_name: string, obj: object) => void;
    changeNotesAfterNew: (action_name: string, obj: object) => void;
    setDataPath: (path: string) => void;
    reorderRepo: (data_path: string, repo_key: string, new_repos_key: string[]) => void;
    setFocus: (focus: string) => void;
    setBlur: (focus: string) => void;
    setKeySelect: (state: boolean) => void;
    setShowAllRepo: (state: boolean) => void;
    setAllowHiddenAllRepoViaEnter: (state: boolean) => void;
};

export default RepoPanel;
