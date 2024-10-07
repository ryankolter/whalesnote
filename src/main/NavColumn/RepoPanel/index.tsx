import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import styled from '@emotion/styled';
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

import { Sortable } from '@/components/Sortable';
import { TextInput } from '@/components/TextInput';
import { AlertPopUp } from '@/components/AlertPopUp';
import { InputPopUp } from '@/components/InputPopUp';
import { usePopUp, useContextMenu } from '@/lib';
import { useDataContext } from '@/context/DataProvider';
import { activeWhaleIdAtom, keySelectActiveAtom } from '@/atoms';
import { useAtom, useAtomValue } from 'jotai';
import { useKeySelect } from './useKeySelect';
import { useManageRepo } from './useManageRepo';
import clsx from 'clsx';

const RepoPanel: React.FC<{}> = ({}) => {
    const { t } = useTranslation();

    const { whalesnote, reorderRepo, curRepoKey, curFolderKey, switchRepo, workspaceItemList } =
        useDataContext();

    const [id, setId] = useAtom(activeWhaleIdAtom);
    const keySelectActive = useAtomValue(keySelectActiveAtom);

    const { adjustKSRepoColumn, ksRepoColumn, repoScrollRef } = useKeySelect();
    const {
        newRepoName,
        setNewRepoName,
        confirmNewRepo,
        curRepoName,
        setCurRepoName,
        confirmRenameRepo,
        resetCurRepoName,
        confirmDeleteRepo,
    } = useManageRepo();

    const [repoNameInputVisible, setRepoNameInputVisible] = useState(false);
    const [renamePopup, setRenamePopUp, renameMask] = usePopUp(500);
    const [deletePopup, setDeletePopUp, deleteMask] = usePopUp(500);
    const composing = useRef(false);

    const [dragActiveId, setDragActiveId] = useState<string | null>(null);
    const outerRef = useRef(null);
    const { xPos, yPos, menu } = useContextMenu(outerRef);
    const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 5 } }));

    const switchRepoInPanel = useCallback(
        async (repoKey: string) => {
            await switchRepo(repoKey);
            adjustKSRepoColumn(repoKey);
        },
        [adjustKSRepoColumn, switchRepo],
    );

    const handleNewRepoKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
                setRepoNameInputVisible(false);
                setNewRepoName('');
            } else if (!composing.current && e.key === 'Enter') {
                confirmNewRepo((repoKey: string) => {
                    adjustKSRepoColumn(repoKey);
                    setRepoNameInputVisible(false);
                });
            }
        },
        [adjustKSRepoColumn, composing, confirmNewRepo],
    );

    const handleRenameRepoKeyDown = useCallback(
        async (e: React.KeyboardEvent) => {
            e.stopPropagation();
            if (e.key === 'Escape') {
                resetCurRepoName();
                setRenamePopUp(false);
            } else if (!composing.current && e.key === 'Enter') {
                await confirmRenameRepo();
                setRenamePopUp(false);
            }
        },
        [confirmRenameRepo, resetCurRepoName, setRenamePopUp],
    );

    useEffect(() => {
        document.addEventListener('compositionstart', () => {
            composing.current = true;
        });
        document.addEventListener('compositionend', () => {
            composing.current = false;
        });
        return () => {
            document.removeEventListener('compositionstart', () => {
                composing.current = true;
            });
            document.removeEventListener('compositionend', () => {
                composing.current = false;
            });
        };
    }, []);

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
            <div className="flex items-center gap-3 px-3 justify-end">
                {workspaceItemList.map((item) => {
                    return (
                        <div
                            key={item.id}
                            className="pb-0.5 relative cursor-pointer shrink overflow-hidden text-ellipsis whitespace-nowrap"
                            onClick={() => {
                                setId(item.id);
                            }}
                        >
                            {item.id === id && (
                                <div className="absolute bottom-0 right-1/2 w-3/4 h-0.5 rounded translate-x-1/2 bg-gray-500"></div>
                            )}
                            {item.name}
                        </div>
                    );
                })}
            </div>
            <ReposScroll ref={repoScrollRef}>
                <Repos ref={outerRef}>
                    {whalesnote.repo_keys && (
                        <DndContext
                            sensors={sensors}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={whalesnote.repo_keys}
                                strategy={verticalListSortingStrategy}
                            >
                                {whalesnote.repo_keys.map((key, index) => {
                                    if (index === ksRepoColumn * 6) {
                                        return (
                                            <Sortable key={key} id={key} className="repo-item-sort">
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
                                                        {keySelectActive && (
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
                                                        )}
                                                    </RepoItemName>
                                                    {keySelectActive && <RepoGroupSelect />}
                                                </RepoItem>
                                            </Sortable>
                                        );
                                    } else if (
                                        index > ksRepoColumn * 6 &&
                                        index < (ksRepoColumn + 1) * 6
                                    ) {
                                        return (
                                            <Sortable key={key} id={key} className="repo-item-sort">
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
                                                        {keySelectActive ? (
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
                                            <Sortable key={key} id={key} className="repo-item-sort">
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
                                                        {whalesnote.repo_map[key]?.repo_name}
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
                                    <RepoItem key={dragActiveId}>
                                        <RepoItemName
                                            style={{
                                                backgroundColor:
                                                    curRepoKey === dragActiveId
                                                        ? 'var(--second-selected-bg-color)'
                                                        : '',
                                            }}
                                        >
                                            {whalesnote.repo_map[dragActiveId]?.repo_name}
                                        </RepoItemName>
                                    </RepoItem>
                                </DragOverlay>
                            ) : (
                                <></>
                            )}
                        </DndContext>
                    )}
                    {repoNameInputVisible ? (
                        <TextInput
                            value={newRepoName}
                            className="repo-name-input"
                            placeholder={t('repository.enter_a_name') || ''}
                            autoFocus={true}
                            onBlur={(e) => {
                                if (newRepoName === '') {
                                    setRepoNameInputVisible(false);
                                    return;
                                }
                                confirmNewRepo((repoKey: string) => {
                                    setRepoNameInputVisible(false);
                                    adjustKSRepoColumn(repoKey);
                                });
                            }}
                            onChange={(e: any) => {
                                setNewRepoName(e.target.value);
                            }}
                            onKeyDown={handleNewRepoKeyDown}
                        />
                    ) : (
                        <RepoAdd>
                            <RepoAddBtn onClick={() => setRepoNameInputVisible(true)}>
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
                    )}
                    <RepoItemPadding />
                </Repos>
            </ReposScroll>
            <AlertPopUp
                popupState={deletePopup}
                maskState={deleteMask}
                content={`${t('repository.delete_tips_part_1')}${
                    curRepoKey && whalesnote.repo_map[curRepoKey]
                        ? whalesnote.repo_map[curRepoKey].repo_name
                        : ''
                }${t('repository.delete_tips_part_2')}${t('repository.delete_tips_part_3')}`}
                onCancel={() => setDeletePopUp(false)}
                onConfirm={() => {
                    confirmDeleteRepo((successorRepoKey: string) => {
                        if (successorRepoKey) {
                            switchRepoInPanel(successorRepoKey);
                        }
                        setDeletePopUp(false);
                    });
                }}
            />
            <InputPopUp
                popupState={renamePopup}
                maskState={renameMask}
                initValue={curRepoName}
                setValue={setCurRepoName}
                onCancel={() => setRenamePopUp(false)}
                onConfirm={() => {
                    confirmRenameRepo();
                    setRenamePopUp(false);
                }}
                onKeyDown={handleRenameRepoKeyDown}
            />
        </RepoListContainer>
    );
};

const RepoListContainer = styled.div({
    display: 'flex',
    flexDirection: 'column',
    flex: '1',
    minWidth: '0',
});

const ReposScroll = styled.div(
    {
        overflow: 'auto',
    },
    `
    &::-webkit-scrollbar {
        height: 7px;
    }
    &::-webkit-scrollbar-track {
        background-color: inherit;
    }
    &::-webkit-scrollbar-thumb {
        background-color: var(--main-scroller-bg-color);
        border-radius: 4px;
    }
`,
);

const Repos = styled.div({
    display: 'flex',
    flexDirection: 'column',
    flexWrap: 'wrap',
    margin: '10px 0 5px 0',
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
