const { ipcRenderer } = window.require('electron');
import { KeyboardEvent, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';
import cryptoRandomString from 'crypto-random-string';

import { DndContext, MouseSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Sortable } from '../../components/Sortable';
import { TextInput } from '../../components/TextInput';
import { AlertPopUp } from '../../components/AlertPopUp';
import { InputPopUp } from '../../components/InputPopUp';
import { usePopUp } from '../../lib/usePopUp';
import useContextMenu from '../../lib/useContextMenu';

const RepoPanel: React.FC<{
    repos_key: string[] | undefined;
    showAllRepo: boolean;
    setShowAllRepo: (state: boolean) => void;
    setAllowHiddenAllRepoViaEnter: (state: boolean) => void;
}> = ({ repos_key, showAllRepo, setShowAllRepo, setAllowHiddenAllRepoViaEnter }) => {
    const {
        curDataPath,
        updateDxnote,
        reorderRepo,
        repoSwitch,
        folderSwitch,
        noteSwitch,
        currentRepoKey,
        currentFolderKey,
        repos_obj,
        updateRepos,
        changeNotesAfterNew,
        numArray,
        setFocus,
        keySelect,
        setKeySelect,
    } = useContext(GlobalContext);

    const [activeId, setActiveId] = useState(null);
    const [newRepoKey, setNewRepoKey] = useState('');
    const [newRepoName, setNewRepoName] = useState('');

    const [curRepoName, setCurRepoName] = useState('');

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

    const [deletePopup, setDeletePopUp, deleteMask] = usePopUp(500);

    const [renamePopup, setRenamePopUp, renameMask] = usePopUp(500);

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
        [curDataPath, repos_key, repoSwitch]
    );

    // part2 : new repo
    const newRepo = () => {
        const repo_key = cryptoRandomString({
            length: 12,
            type: 'alphanumeric',
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
            if (e.target.value === '') {
                setNewRepoKey('');
                setNewRepoName('');
                return;
            }

            const default_folder_key = cryptoRandomString({
                length: 12,
                type: 'alphanumeric',
            });

            const default_note_key = cryptoRandomString({
                length: 12,
                type: 'alphanumeric',
            });

            const dxnote_info = ipcRenderer.sendSync('readJson', {
                file_path: `${curDataPath}/dxnote_info.json`,
            });
            dxnote_info.repos_key.push(repo_key);
            dxnote_info.cur_repo_key = repo_key;
            dxnote_info.repos[repo_key] = {
                cur_folder_key: default_folder_key,
                folders: {},
            };
            ipcRenderer.sendSync('writeJson', {
                file_path: `${curDataPath}/dxnote_info.json`,
                obj: dxnote_info,
            });

            const repo_info = {
                repo_name: e.target.value,
                folders_key: [default_folder_key],
            };
            ipcRenderer.sendSync('writeJson', {
                file_path: `${curDataPath}/${repo_key}/repo_info.json`,
                obj: repo_info,
            });

            // default folder
            const folder_info = {
                folder_name: '默认分类',
                notes_key: [default_note_key],
                notes_obj: {
                    [default_note_key]: {
                        title: '新建文档',
                    },
                },
            };

            ipcRenderer.sendSync('writeJson', {
                file_path: `${curDataPath}/${repo_key}/${default_folder_key}/folder_info.json`,
                obj: folder_info,
            });

            updateDxnote(curDataPath);
            updateRepos('repo', { data_path: curDataPath, repo_key });
            updateRepos('folder', {
                data_path: curDataPath,
                repo_key,
                folder_key: default_folder_key,
            });
            changeNotesAfterNew('repo', { data_path: curDataPath, repo_key });
            changeNotesAfterNew('folder', {
                data_path: curDataPath,
                repo_key,
                folder_key: default_folder_key,
            });

            setNewRepoKey('');
            setNewRepoName('');
            repoSwitchInPanel(repo_key);
            setRepoScrollPage(Math.ceil(dxnote_info.repos_key.length / 9) - 1);
            folderSwitch(repo_key, default_folder_key);
            noteSwitch(default_note_key);
            setAllowHiddenAllRepoViaEnter(true);
            scrollToRight();
            setShowAllRepo(false);
            setTimeout(() => {
                setFocus(
                    cryptoRandomString({
                        length: 24,
                        type: 'alphanumeric',
                    })
                );
            }, 0);
        },
        [
            curDataPath,
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
                : ''
        );
    }, [repos_obj, currentRepoKey]);

    const renameRepo = () => {
        setRenamePopUp(true);
        setAllowHiddenAllRepoViaEnter(false);
    };

    const renameRepoConfirm = useCallback(() => {
        if (currentRepoKey) {
            const repo_info = ipcRenderer.sendSync('readJson', {
                file_path: `${curDataPath}/${currentRepoKey}/repo_info.json`,
            });
            repo_info.repo_name = curRepoName;
            ipcRenderer.sendSync('writeJson', {
                file_path: `${curDataPath}/${currentRepoKey}/repo_info.json`,
                obj: repo_info,
            });
            updateRepos('repo', { data_path: curDataPath, repo_key: currentRepoKey });
            setRenamePopUp(false);
            setAllowHiddenAllRepoViaEnter(true);
        }
    }, [
        curDataPath,
        currentRepoKey,
        curRepoName,
        setRenamePopUp,
        setAllowHiddenAllRepoViaEnter,
        updateRepos,
    ]);

    const handleRenameRepoKeyDown = useCallback(
        (e: any) => {
            if (e.keyCode === 27) {
                setRenamePopUp(false);
                setCurRepoName(
                    repos_obj && currentRepoKey && repos_obj[currentRepoKey]
                        ? repos_obj[currentRepoKey].repo_name
                        : ''
                );
            } else if (e.keyCode === 13) {
                renameRepoConfirm();
            }
        },
        [setRenamePopUp, setCurRepoName, repos_obj, currentRepoKey, renameRepoConfirm]
    );

    // part4 : delete repo
    const deleteRepo = () => {
        setDeletePopUp(true);
        setAllowHiddenAllRepoViaEnter(false);
    };

    const deleteRepoConfirm = useCallback(() => {
        if (currentRepoKey) {
            const repo_info = ipcRenderer.sendSync('readJson', {
                file_path: `${curDataPath}/${currentRepoKey}/repo_info.json`,
            });

            let trash = ipcRenderer.sendSync('readCson', {
                file_path: `${curDataPath}/trash.cson`,
            });

            trash = trash ? trash : {};

            repo_info.folders_key.forEach((folder_key: string) => {
                const folder_info = ipcRenderer.sendSync('readJson', {
                    file_path: `${curDataPath}/${currentRepoKey}/${folder_key}/folder_info.json`,
                });

                folder_info.notes_key.forEach((note_key: string) => {
                    const note_info = ipcRenderer.sendSync('readCson', {
                        file_path: `${curDataPath}/${currentRepoKey}/${folder_key}/${note_key}.cson`,
                    });

                    trash[
                        `${currentRepoKey}-${folder_key}-${note_key}-${folder_info.notes_obj[note_key]?.title}`
                    ] = note_info.content;
                });
            });

            ipcRenderer.sendSync('writeCson', {
                file_path: `${curDataPath}/trash.cson`,
                obj: trash,
            });

            const dxnote_info = ipcRenderer.sendSync('readJson', {
                file_path: `${curDataPath}/dxnote_info.json`,
            });

            const new_repos_key: string[] = [];
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

            ipcRenderer.sendSync('writeJson', {
                file_path: `${curDataPath}/dxnote_info.json`,
                obj: dxnote_info,
            });

            ipcRenderer.sendSync('remove', {
                file_path: `${curDataPath}/${currentRepoKey}`,
            });

            updateRepos('repo', { data_path: curDataPath, repo_key: currentRepoKey });
            if (other_repo_key) {
                repoSwitchInPanel(other_repo_key);
            }
            setRepoScrollPage(Math.ceil(dxnote_info.repos_key.length / 9) - 1);
            setDeletePopUp(false);
            setAllowHiddenAllRepoViaEnter(true);
        }
    }, [
        curDataPath,
        currentRepoKey,
        setDeletePopUp,
        repoSwitchInPanel,
        setAllowHiddenAllRepoViaEnter,
        updateRepos,
    ]);

    const handleDeleteRepoKeyDown = useCallback(
        (e: any) => {
            if (e.keyCode === 27) {
                setDeletePopUp(false);
            } else if (e.keyCode === 13) {
                deleteRepoConfirm();
            }
        },
        [setDeletePopUp, deleteRepoConfirm]
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
            if (process.platform === 'darwin') {
                // normal number 1-9
                if (e.keyCode >= 49 && e.keyCode <= 57 && !e.metaKey && numArray.length === 0) {
                    const num = parseInt(e.keyCode) - 48;
                    const index = num + 9 * repoScrollPage - 1;
                    if (repos_key && index < repos_key.length) {
                        repoSwitchInPanel(repos_key[index]);
                        setKeySelect(true);
                    }
                }

                // extra number 1-9
                if (e.keyCode >= 97 && e.keyCode <= 105 && !e.metaKey && numArray.length === 0) {
                    const num = parseInt(e.keyCode) - 96;
                    const index = num + 9 * repoScrollPage - 1;
                    if (repos_key && index < repos_key.length) {
                        repoSwitchInPanel(repos_key[index]);
                        setKeySelect(true);
                    }
                }

                // arrow right 39 change to L 76
                if ((e.keyCode === 39 || e.keyCode === 76) && !e.metaKey) {
                    nextRepoPage();
                }

                // arrow left 37 change to J 74
                if ((e.keyCode === 37 || e.keyCode === 74) && !e.metaKey) {
                    preRepoPage();
                }
            }
            if (process.platform === 'win32' || process.platform === 'linux') {
                // normal number 1-9
                if (e.keyCode >= 49 && e.keyCode <= 57 && !e.ctrlKey && numArray.length === 0) {
                    const num = parseInt(e.keyCode) - 48;
                    const index = num + 9 * repoScrollPage - 1;
                    if (repos_key && index < repos_key.length) {
                        repoSwitchInPanel(repos_key[index]);
                        setKeySelect(true);
                    }
                }

                // extra number 1-9
                if (e.keyCode >= 97 && e.keyCode <= 105 && !e.ctrlKey && numArray.length === 0) {
                    const num = parseInt(e.keyCode) - 96;
                    const index = num + 9 * repoScrollPage - 1;
                    if (repos_key && index < repos_key.length) {
                        repoSwitchInPanel(repos_key[index]);
                        setKeySelect(true);
                    }
                }

                // arrow right 39 change to L 76
                if ((e.keyCode === 39 || e.keyCode === 76) && !e.ctrlKey) {
                    nextRepoPage();
                }

                // arrow left 37 change to J 74
                if ((e.keyCode === 37 || e.keyCode === 74) && !e.ctrlKey) {
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
            setKeySelect,
            numArray,
        ]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const handleWhell = useCallback((e: any) => {
        e.preventDefault();
        const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        if (repoScrollRef && repoScrollRef.current) {
            repoScrollRef.current.scrollLeft += delta;
        }
    }, []);

    useEffect(() => {
        if (repoScrollRef && repoScrollRef.current) {
            repoScrollRef.current.addEventListener('wheel', handleWhell);
            return () => {
                repoScrollRef.current?.removeEventListener('wheel', handleWhell);
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
                const new_repos_key = arrayMove(repos_key, oldIndex, newIndex);
                reorderRepo(curDataPath, currentRepoKey, new_repos_key);
            }
        },
        [curDataPath, currentRepoKey, currentFolderKey, repos_key, reorderRepo]
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
                                                    className="repoItemSort"
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
                                                                        ? '#3a404c'
                                                                        : '',
                                                            }}
                                                        >
                                                            {repos_obj[key].repo_name}
                                                            {keySelect ? (
                                                                <RepoGroupItem
                                                                    style={{
                                                                        color:
                                                                            currentRepoKey === key
                                                                                ? '#E9E9E9'
                                                                                : '#939395',
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
                                                    className="repoItemSort"
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
                                                                        ? '#3a404c'
                                                                        : '',
                                                            }}
                                                        >
                                                            {repos_obj[key].repo_name}
                                                            {keySelect ? (
                                                                <RepoGroupItem
                                                                    style={{
                                                                        color:
                                                                            currentRepoKey === key
                                                                                ? '#E9E9E9'
                                                                                : '#939395',
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
                                                    className="repoItemSort"
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
                                                                        ? '#3a404c'
                                                                        : '',
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
                                    <MenuUl top={yPos} left={xPos} className="menu-ui-color">
                                        <MenuLi
                                            className="menu-li-color"
                                            onClick={() => renameRepo()}
                                        >
                                            重命名
                                        </MenuLi>
                                        <MenuLi
                                            className="menu-li-color"
                                            onClick={() => deleteRepo()}
                                        >
                                            删除仓库
                                        </MenuLi>
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
                                                            ? '#3a404c'
                                                            : '',
                                                }}
                                            >
                                                {repos_obj[activeId].repo_name}
                                            </RepoItemName>
                                        </RepoItem>
                                    ) : null}
                                </div>
                            </DragOverlay>
                        </DndContext>
                    ) : (
                        <></>
                    )}
                    {curDataPath && !newRepoKey ? (
                        <RepoAdd>
                            <RepoAddBtn className="btn-1-bg-color" onClick={newRepo}>
                                +
                                {repos_key &&
                                repos_key.filter((key) => repos_obj && repos_obj[key]).length ==
                                    1 ? (
                                    <AddReposTips className="tips-1-bg-color tips-1-border-color">
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
                            className="repo-name-input"
                            placeholder="输入新的资料库名"
                            autoFocus={true}
                            onBlur={(e) => newRepoSubmit(e, newRepoKey)}
                            onChange={(e) => newRepoInputChange(e)}
                            onKeyDown={(e) => newRepoInputEnter(e, newRepoKey)}
                        />
                    ) : (
                        <div></div>
                    )}
                    <RepoItemPadding></RepoItemPadding>
                </Repos>
            </ReposScroll>
            <AlertPopUp
                popupState={deletePopup}
                maskState={deleteMask}
                title="提示"
                content={`即将删除仓库「${
                    repos_obj && currentRepoKey && repos_obj[currentRepoKey]
                        ? repos_obj[currentRepoKey].repo_name
                        : ''
                }」内所有笔记，不可撤销(但内容可在废纸篓找回)`}
                onCancel={() => setDeletePopUp(false)}
                onConfirm={deleteRepoConfirm}
                onKeyDown={handleDeleteRepoKeyDown}
            ></AlertPopUp>
            <InputPopUp
                popupState={renamePopup}
                maskState={renameMask}
                initValue={curRepoName}
                setValue={setCurRepoName}
                onCancel={() => setRenamePopUp(false)}
                onConfirm={renameRepoConfirm}
                onKeyDown={handleRenameRepoKeyDown}
            ></InputPopUp>
        </RepoListContainer>
    );
};

const RepoListContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minWidth: '0',
});

const CloseRepoListBtn = styled.div({
    width: '20px',
    height: '20px',
    lineHeight: '18px',
    fontSize: '20px',
    padding: '5px 10px',
    margin: '0 0 2px 0',
    cursor: 'pointer',
});

const ReposScroll = styled.div(
    {
        overflow: 'auto',
    },
    `
    &::-webkit-scrollbar {
        height: 9px;
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
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    margin: '8px 0',
    height: 'calc(9 * (28px + 4px) + 5px)',
});

const RepoItem = styled.div({
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '28px',
    lineHeight: '28px',
    margin: '0 10px 4px 10px',
    cursor: 'pointer',
});

const RepoItemName = styled.div({
    padding: '0 10px',
    borderRadius: '5px',
    overflow: 'hidden !important',
    textOverflow: 'ellipsis',
    wordBreak: 'break-all',
});

const RepoGroupSelect = styled.div({
    position: 'absolute',
    top: '-7px',
    left: '-5px',
    height: 'calc(9 * (28px + 4px) + 5px)',
    width: 'calc(100% + 6px)',
    border: '2px dotted rgb(58, 64, 76)',
    borderRadius: '5px',
    color: 'transparent',
});

const RepoGroupItem = styled.div({
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '14px',
    height: '14px',
    lineHeight: '14px',
    fontSize: '12px',
    textAlign: 'center',
    letterSpacing: '1px',
    padding: '2px',
    borderRadius: '8px',
    backgroundColor: 'rgb(58, 64, 76)',
});

const RepoItemPadding = styled.div({
    width: 'calc(100% / 5 * 4)',
    height: '100%',
});

const MenuUl = styled.ul(
    {
        listStyleType: 'none',
        position: 'fixed',
        padding: '4px 0',
        zIndex: '4000',
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

const RepoAdd = styled.div({
    width: 'calc(20% - 20px)',
});

const RepoAddBtn = styled.div({
    position: 'relative',
    width: '28px',
    height: '28px',
    lineHeight: '24px',
    margin: '5px 10px 0 20px',
    fontSize: '28px',
    borderRadius: '5px',
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
});

const AddReposTips = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '90px',
    marginTop: '20px',
    fontSize: '14px',
    position: 'absolute',
    bottom: '-80px',
    left: '10px',
    padding: '5px 10px',
    borderRadius: '5px',
});

export default RepoPanel;
