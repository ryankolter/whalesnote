import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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

import { Sortable } from '../../components/Sortable';
import { TextInput } from '../../components/TextInput';
import { AlertPopUp } from '../../components/AlertPopUp';
import { InputPopUp } from '../../components/InputPopUp';
import { usePopUp } from '../../lib/usePopUp';
import useContextMenu from '../../lib/useContextMenu';
import { useDataContext } from '@/context/DataProvider';
import { activeWhaleIdAtom } from '@/atoms';
import { useAtomValue } from 'jotai';

const RepoPanel: React.FC<{}> = ({}) => {
    const {
        keySelectNumArray,
        platformName,
        showRepoPanel,
        showKeySelect,
        setShowKeySelect,
        setShowRepoPanel,
        setKeySelectNumArray,
    } = useContext(GlobalContext);

    const {
        whalesnote,
        newRepo,
        newFolder,
        newNote,
        renameRepo,
        reorderRepo,
        deleteRepo,
        curRepoKey,
        curFolderKey,
        switchRepo,
        switchFolder,
        switchNote,
        prepareContent,
    } = useDataContext();

    const id = useAtomValue(activeWhaleIdAtom);

    const { t } = useTranslation();

    const [dragActiveId, setDragActiveId] = useState<string | null>(null);
    const [newRepoKey, setNewRepoKey] = useState('');
    const [newRepoName, setNewRepoName] = useState('');
    const [curRepoName, setCurRepoName] = useState('');
    const [repoSelectedList, setRepoSelectedList] = useState(() => {
        let page = 0;
        whalesnote.repo_keys
            ?.filter((key) => whalesnote && whalesnote.repo_map && whalesnote.repo_map[key])
            .forEach((key, index) => {
                if (key === curRepoKey) page = Math.floor(index / 6.0);
            });
        return page;
    });
    const [renamePopup, setRenamePopUp, renameMask] = usePopUp(500);
    const [deletePopup, setDeletePopUp, deleteMask] = usePopUp(500);

    const allowNewRepo = useRef(true);
    const composing = useRef(false);
    const repoScrollRef = useRef<HTMLDivElement>(null);
    const outerRef = useRef(null);
    const { xPos, yPos, menu } = useContextMenu(outerRef);

    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));

    useEffect(() => {
        if (showKeySelect) {
            let page = 0;
            whalesnote.repo_keys
                ?.filter((key) => whalesnote && whalesnote.repo_map && whalesnote.repo_map[key])
                .forEach((key, index) => {
                    if (key === curRepoKey) page = Math.floor(index / 6.0);
                });
            if (page && repoScrollRef && repoScrollRef.current) {
                repoScrollRef.current.scrollLeft =
                    Math.floor(page / 5.0) * repoScrollRef.current.offsetWidth;
            }
        }
    }, []);

    //part1: switch repo in panel
    const changeRepoSelectedList = useCallback(
        (repo_key: string) => {
            whalesnote.repo_keys
                ?.filter((key) => whalesnote && whalesnote.repo_map && whalesnote.repo_map[key])
                .forEach((key, index) => {
                    if (key === repo_key) setRepoSelectedList(Math.floor(index / 6.0));
                });
        },
        [setRepoSelectedList],
    );

    const switchRepoInPanel = useCallback(
        async (repo_key: string) => {
            await switchRepo(repo_key);
            changeRepoSelectedList(repo_key);
        },
        [whalesnote, changeRepoSelectedList],
    );

    // part2 : new repo
    const handleAddRepoBtnClick = () => {
        const repo_key = cryptoRandomString({
            length: 12,
            type: 'alphanumeric',
        });
        setNewRepoKey(repo_key);
    };

    const newRepoSubmit = useCallback(
        async (e: any, repo_key: string) => {
            if (e.target.value === '') {
                setNewRepoKey('');
                setNewRepoName('');
                return;
            }

            if (!allowNewRepo.current) return;
            allowNewRepo.current = false;

            const default_folder_key = cryptoRandomString({
                length: 12,
                type: 'alphanumeric',
            });
            const default_note_key = cryptoRandomString({
                length: 12,
                type: 'alphanumeric',
            });

            await newRepo(id, repo_key, e.target.value);

            await newFolder(id, repo_key, default_folder_key, t('category.default_name'));

            await newNote(id, repo_key, default_folder_key, default_note_key, t('note.untitled'));
            await prepareContent(repo_key, default_folder_key, default_note_key);

            setTimeout(() => {
                changeRepoSelectedList(repo_key);
                switchNote(repo_key, default_folder_key, default_note_key);
            }, 0);

            setNewRepoKey('');
            setNewRepoName('');
            setRepoSelectedList(Math.ceil(whalesnote.repo_keys.length / 6) - 1);
            allowNewRepo.current = true;
        },
        [
            id,
            repoScrollRef,
            newRepo,
            newFolder,
            newNote,
            switchRepoInPanel,
            switchFolder,
            switchNote,
        ],
    );

    const handleNewRepoKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
                setNewRepoKey('');
                setNewRepoName('');
            } else if (!composing.current && e.key === 'Enter' && newRepoKey) {
                newRepoSubmit(e, newRepoKey);
            }
        },
        [newRepoKey, newRepoSubmit, setNewRepoKey, setNewRepoName],
    );

    // part3 : rename repo
    useEffect(() => {
        setCurRepoName(
            whalesnote && whalesnote.repo_map && curRepoKey && whalesnote.repo_map[curRepoKey]
                ? whalesnote.repo_map[curRepoKey].repo_name
                : '',
        );
    }, [curRepoKey, whalesnote]);

    const renameRepoConfirm = useCallback(async () => {
        if (curRepoKey) {
            await renameRepo(id, curRepoKey, curRepoName);
            setRenamePopUp(false);
        }
    }, [id, curRepoKey, curRepoName, renameRepo, setRenamePopUp]);

    const handleRenameRepoKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
                setRenamePopUp(false);
                setCurRepoName(
                    whalesnote &&
                        whalesnote.repo_map &&
                        curRepoKey &&
                        whalesnote.repo_map[curRepoKey]
                        ? whalesnote.repo_map[curRepoKey].repo_name
                        : '',
                );
            } else if (!composing.current && e.key === 'Enter') {
                renameRepoConfirm();
            }
        },
        [curRepoKey, whalesnote, renameRepoConfirm, setRenamePopUp, setCurRepoName],
    );

    // part4 : delete repo
    const deleteRepoConfirm = useCallback(async () => {
        if (curRepoKey) {
            const other_repo_key = await deleteRepo(id, curRepoKey);
            if (other_repo_key) {
                switchRepoInPanel(other_repo_key);
            }
            setRepoSelectedList(Math.ceil(whalesnote.repo_keys.length / 6) - 1);
            setDeletePopUp(false);
        }
    }, [id, curRepoKey, setDeletePopUp, switchRepoInPanel]);

    useEffect(() => {
        whalesnote.repo_keys
            ?.filter((key) => whalesnote && whalesnote.repo_map && whalesnote.repo_map[key])
            .forEach((key, index) => {
                if (key === curRepoKey) setRepoSelectedList(Math.floor(index / 6.0));
            });
    }, [curRepoKey]);

    const prevRepoList = useCallback(() => {
        const prevSelectedList = repoSelectedList - 1;
        if (prevSelectedList >= 0) {
            if (repoScrollRef && repoScrollRef.current) {
                repoScrollRef.current.scrollLeft =
                    Math.floor(prevSelectedList / 5.0) * repoScrollRef.current.offsetWidth;
            }
            setRepoSelectedList((repoSelectedList) => repoSelectedList - 1);
        }
    }, [repoSelectedList]);

    const nextRepoList = useCallback(() => {
        if (whalesnote.repo_keys && whalesnote.repo_keys.length > 6) {
            const nextSelectedList = repoSelectedList + 1;
            if (nextSelectedList <= (whalesnote.repo_keys.length - 1) / 6.0) {
                if (repoScrollRef && repoScrollRef.current) {
                    repoScrollRef.current.scrollLeft =
                        Math.floor(nextSelectedList / 5.0) * repoScrollRef.current.offsetWidth;
                }
                setRepoSelectedList((repoSelectedList) => repoSelectedList + 1);
            }
        }
    }, [repoSelectedList, whalesnote]);

    const prevRepoPage = useCallback(() => {
        const prevSelectedList = (Math.floor(repoSelectedList / 5) - 1) * 5;
        if (prevSelectedList >= 0) {
            if (repoScrollRef && repoScrollRef.current) {
                repoScrollRef.current.scrollLeft =
                    Math.floor(prevSelectedList / 5.0) * repoScrollRef.current.offsetWidth;
            }
            setRepoSelectedList((repoSelectedList) => (Math.floor(repoSelectedList / 5) - 1) * 5);
        }
    }, [repoSelectedList]);

    const nextRepoPage = useCallback(() => {
        if (whalesnote.repo_keys && whalesnote.repo_keys.length > 6) {
            const nextSelectedList = (Math.floor(repoSelectedList / 5) + 1) * 5;
            if (nextSelectedList <= (whalesnote.repo_keys.length - 1) / 6.0) {
                if (repoScrollRef && repoScrollRef.current) {
                    repoScrollRef.current.scrollLeft =
                        Math.floor(nextSelectedList / 5.0) * repoScrollRef.current.offsetWidth;
                }
                setRepoSelectedList(
                    (repoSelectedList) => (Math.floor(repoSelectedList / 5) + 1) * 5,
                );
            }
        }
    }, [whalesnote, repoSelectedList]);

    useEffect(() => {
        if (whalesnote.repo_keys && whalesnote.repo_keys.length <= 6) {
            setRepoSelectedList(0);
        }
    }, [whalesnote]);

    const handleKeyDown = useCallback(
        async (e: KeyboardEvent) => {
            if (platformName === 'darwin' || platformName === 'win32' || platformName === 'linux') {
                const modKey = platformName === 'darwin' ? e.metaKey : e.ctrlKey;

                // normal number 1-6
                const number_re = /^[1-6]$/;
                if (
                    e.key.match(number_re) &&
                    !modKey &&
                    keySelectNumArray.length === 0 &&
                    showRepoPanel &&
                    showKeySelect
                ) {
                    const index = Number(e.key) + 6 * repoSelectedList - 1;
                    if (whalesnote.repo_keys && index < whalesnote.repo_keys.length) {
                        switchRepoInPanel(whalesnote.repo_keys[index]);
                        setShowKeySelect(true);
                    }
                }

                // arrow left or J
                if ((e.key === 'ArrowLeft' || e.key === 'j') && !modKey) {
                    prevRepoList();
                }

                // arrow right or L
                if ((e.key === 'ArrowRight' || e.key === 'l') && !modKey) {
                    nextRepoList();
                }

                // arrow left or J with mod
                if ((e.key === 'ArrowLeft' || e.key === 'j') && modKey) {
                    prevRepoPage();
                }

                // arrow right or L with mod
                if ((e.key === 'ArrowRight' || e.key === 'l') && modKey) {
                    nextRepoPage();
                }

                //alpha z
                if (e.key === 'z' && !modKey && showKeySelect) {
                    setShowRepoPanel((_showRepoPanel) => !_showRepoPanel);
                }

                // esc
                if (e.key === 'Escape') {
                    if (showKeySelect) {
                        setShowKeySelect(false);
                        setKeySelectNumArray([]);
                    }
                    setShowRepoPanel(false);
                }
            }
        },
        [
            keySelectNumArray,
            repoSelectedList,
            showKeySelect,
            showRepoPanel,
            whalesnote,
            nextRepoList,
            nextRepoPage,
            prevRepoList,
            prevRepoPage,
            setShowKeySelect,
            setShowRepoPanel,
            setKeySelectNumArray,
            switchRepoInPanel,
        ],
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

    const handleWhell = useCallback((e: WheelEvent) => {
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

            if (active.id !== over.id && whalesnote.repo_keys && curRepoKey && curFolderKey) {
                const oldIndex = whalesnote.repo_keys.indexOf(String(active.id));
                const newIndex = whalesnote.repo_keys.indexOf(String(over.id));
                const new_repo_keys = arrayMove(
                    whalesnote.repo_keys,
                    oldIndex,
                    newIndex,
                ) as string[];
                reorderRepo(id, curRepoKey, new_repo_keys);
            }
        },
        [id, curRepoKey, curFolderKey, whalesnote, reorderRepo, setDragActiveId],
    );

    return (
        <RepoListContainer>
            <ReposScroll ref={repoScrollRef}>
                <Repos ref={outerRef}>
                    {whalesnote.repo_keys ? (
                        <DndContext
                            sensors={sensors}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={whalesnote.repo_keys}
                                strategy={verticalListSortingStrategy}
                            >
                                {whalesnote.repo_keys
                                    .filter(
                                        (key) =>
                                            whalesnote &&
                                            whalesnote.repo_map &&
                                            whalesnote.repo_map[key],
                                    )
                                    .map((key, index) => {
                                        if (index === repoSelectedList * 6) {
                                            return (
                                                <Sortable
                                                    key={key}
                                                    id={key}
                                                    className="repo-item-sort"
                                                >
                                                    <RepoItem
                                                        key={key}
                                                        onClick={() => switchRepoInPanel(key)}
                                                        onContextMenu={() => {
                                                            if (curRepoKey !== key)
                                                                switchRepoInPanel(key);
                                                        }}
                                                    >
                                                        <RepoItemName
                                                            style={{
                                                                backgroundColor:
                                                                    curRepoKey === key
                                                                        ? 'var(--second-selected-bg-color)'
                                                                        : '',
                                                            }}
                                                        >
                                                            {whalesnote.repo_map[key].repo_name}
                                                            {showKeySelect ? (
                                                                <RepoGroupItem
                                                                    style={{
                                                                        color:
                                                                            curRepoKey === key
                                                                                ? 'var(--main-text-selected-color)'
                                                                                : 'var(--main-text-color)',
                                                                    }}
                                                                >
                                                                    1
                                                                </RepoGroupItem>
                                                            ) : (
                                                                <></>
                                                            )}
                                                        </RepoItemName>
                                                        {showKeySelect ? (
                                                            <RepoGroupSelect></RepoGroupSelect>
                                                        ) : (
                                                            <></>
                                                        )}
                                                    </RepoItem>
                                                </Sortable>
                                            );
                                        } else if (
                                            index > repoSelectedList * 6 &&
                                            index < (repoSelectedList + 1) * 6
                                        ) {
                                            return (
                                                <Sortable
                                                    key={key}
                                                    id={key}
                                                    className="repo-item-sort"
                                                >
                                                    <RepoItem
                                                        key={key}
                                                        onClick={() => switchRepoInPanel(key)}
                                                        onContextMenu={() => {
                                                            if (curRepoKey !== key)
                                                                switchRepoInPanel(key);
                                                        }}
                                                    >
                                                        <RepoItemName
                                                            style={{
                                                                backgroundColor:
                                                                    curRepoKey === key
                                                                        ? 'var(--second-selected-bg-color)'
                                                                        : '',
                                                            }}
                                                        >
                                                            {whalesnote.repo_map[key].repo_name}
                                                            {showKeySelect ? (
                                                                <RepoGroupItem
                                                                    style={{
                                                                        color:
                                                                            curRepoKey === key
                                                                                ? 'var(--main-text-selected-color)'
                                                                                : 'var(--main-text-color)',
                                                                    }}
                                                                >
                                                                    {(index % 6) + 1}
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
                                                    className="repo-item-sort"
                                                >
                                                    <RepoItem
                                                        key={key}
                                                        onClick={() => switchRepoInPanel(key)}
                                                        onContextMenu={() => {
                                                            if (curRepoKey !== key)
                                                                switchRepoInPanel(key);
                                                        }}
                                                    >
                                                        <RepoItemName
                                                            style={{
                                                                backgroundColor:
                                                                    curRepoKey === key
                                                                        ? 'var(--second-selected-bg-color)'
                                                                        : '',
                                                            }}
                                                        >
                                                            {whalesnote.repo_map[key].repo_name}
                                                        </RepoItemName>
                                                    </RepoItem>
                                                </Sortable>
                                            );
                                        }
                                    })}
                                {menu && curRepoKey ? (
                                    <MenuUl top={yPos} left={xPos}>
                                        <MenuLi
                                            className="menu-li-color"
                                            onClick={() => setRenamePopUp(true)}
                                        >
                                            {t('repository.rename')}
                                        </MenuLi>
                                        <MenuLi
                                            className="menu-li-color"
                                            onClick={() => setDeletePopUp(true)}
                                        >
                                            {t('repository.delete')}
                                        </MenuLi>
                                    </MenuUl>
                                ) : (
                                    <></>
                                )}
                            </SortableContext>
                            {dragActiveId ? (
                                <DragOverlay>
                                    {whalesnote && whalesnote.repo_map ? (
                                        <RepoItem key={dragActiveId}>
                                            <RepoItemName
                                                style={{
                                                    backgroundColor:
                                                        curRepoKey === dragActiveId
                                                            ? 'var(--second-selected-bg-color)'
                                                            : '',
                                                }}
                                            >
                                                {whalesnote.repo_map[dragActiveId].repo_name}
                                            </RepoItemName>
                                        </RepoItem>
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
                    {id && !newRepoKey ? (
                        <RepoAdd>
                            <RepoAddBtn onClick={handleAddRepoBtnClick}>
                                +
                                {whalesnote.repo_keys?.filter(
                                    (key) =>
                                        whalesnote &&
                                        whalesnote.repo_map &&
                                        whalesnote.repo_map[key],
                                ).length <= 1 ? (
                                    <AddReposTips>
                                        <div>{t('tips.click_btn_to')}</div>
                                        <div>{t('tips.add_new_repository')}</div>
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
                            placeholder={t('repository.enter_a_name') || ''}
                            autoFocus={true}
                            onBlur={(e) => {
                                if (newRepoKey) newRepoSubmit(e, newRepoKey);
                            }}
                            onChange={(e: any) => {
                                setNewRepoName(e.target.value);
                            }}
                            onKeyDown={handleNewRepoKeyDown}
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
                content={`${t('repository.delete_tips_part_1')}${
                    whalesnote &&
                    whalesnote.repo_map &&
                    curRepoKey &&
                    whalesnote.repo_map[curRepoKey]
                        ? whalesnote.repo_map[curRepoKey].repo_name
                        : ''
                }${t('repository.delete_tips_part_2')}${t('repository.delete_tips_part_3')}`}
                onCancel={() => setDeletePopUp(false)}
                onConfirm={deleteRepoConfirm}
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
        background-color: inherit;
    }
    &::-webkit-scrollbar-thumb {
        background-color: var(--main-scroller-bg-color);
        border-radius: 3px;
    }
`,
);

const Repos = styled.div({
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    margin: '10px 0',
    height: 'calc(6 * (28px + 4px))',
});

const RepoItem = styled.div({
    position: 'relative',
    display: 'flex',
    width: '100%',
    height: '28px',
    lineHeight: '28px',
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
    height: 'calc(6 * (28px + 4px) + 5px)',
    width: 'calc(100% + 6px)',
    border: '2px dotted var(--float-panel-border-color)',
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
    backgroundColor: 'var(--second-selected-bg-color)',
});

const RepoItemPadding = styled.div({
    width: 'calc(100% / 5 * 4)',
    height: '100%',
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

const RepoAdd = styled.div({
    width: 'calc(20% - 20px)',
});

const RepoAddBtn = styled.div({
    position: 'relative',
    width: '26px',
    height: '26px',
    lineHeight: '22px',
    margin: '3px 10px 0 5px',
    fontSize: '22px',
    borderRadius: '5px',
    display: 'flex',
    alignItem: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    backgroundColor: 'var(--second-btn-bg-color)',
});

const AddReposTips = styled.div({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100px',
    marginTop: '20px',
    fontSize: '14px',
    position: 'absolute',
    bottom: '-50px',
    left: '35px',
    padding: '5px 10px',
    borderRadius: '5px',
    border: '1px dotted var(--main-tips-border-color)',
    backgroundColor: 'var(--main-tips-bg-color)',
});

export default RepoPanel;
