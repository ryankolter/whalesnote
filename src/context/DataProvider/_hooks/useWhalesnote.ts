import { useCallback, useRef, useState } from 'react';
import { Draft, produce } from 'immer';
import { WhaleObject } from '@/interface';

export const useWhalesnote = () => {
    const [whales, setWhales] = useState<Record<string, WhaleObject>>({});

    const renameSaveTimerObj = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const produceWhales = useCallback(
        (draftFn: (draft: Draft<Record<string, WhaleObject>>) => void) => {
            setWhales((_whales) => {
                return produce(_whales, draftFn);
            });
        },
        [],
    );

    const addWhale = useCallback(
        (id: string, obj: WhaleObject) => {
            if (whales[id]) return false;
            produceWhales((draft) => {
                draft[id] = obj;
            });
            return true;
        },
        [whales],
    );

    const fetchFolderMap = useCallback(
        async (id: string, repoKey: string | undefined, folderKey: string | undefined) => {
            if (!whales[id]) return;
            if (!repoKey || !folderKey) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
            );
            if (!folderInfo) return;

            produceWhales((draft) => {
                const folderMap = draft[id].repo_map[repoKey].folder_map;
                folderMap[folderKey] = {
                    folder_name: folderMap[folderKey].folder_name,
                    note_keys: folderInfo.note_keys,
                    note_map: folderInfo.note_map,
                };
            });
        },
        [whales],
    );

    const newRepo = useCallback(
        async (id: string, repoKey: string | undefined, repo_name: string) => {
            if (!whales[id]) return;
            if (!repoKey) return;

            const whaleInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/whalesnote_info.json`,
            );
            if (!whaleInfo) return;

            whaleInfo.repo_keys.push(repoKey);
            await window.electronAPI.writeJson(
                `${whales[id].path}/whalesnote_info.json`,
                whaleInfo,
            );

            const repoInfo = {
                repo_name,
                folder_keys: [],
                folder_map: {},
            };
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repoInfo,
            );
            produceWhales((draft) => {
                draft[id].repo_keys.push(repoKey);
                draft[id].repo_map[repoKey] = {
                    repo_name,
                    folder_keys: [],
                    folder_map: {},
                };
            });
        },
        [whales],
    );

    const renameRepo = useCallback(
        async (id: string, repoKey: string | undefined, new_repo_name: string) => {
            if (!whales[id]) return;
            if (!repoKey) return;

            const repoInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );
            repoInfo.repo_name = new_repo_name;
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repoInfo,
            );

            produceWhales((draft) => {
                draft[id].repo_map[repoKey].repo_name = new_repo_name;
            });
        },
        [whales],
    );

    const reorderRepo = useCallback(
        async (id: string, repoKey: string | undefined, new_repo_keys: string[]) => {
            if (!repoKey) return;
            const whaleInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/whalesnote_info.json`,
            );
            whaleInfo.repo_keys = new_repo_keys;
            await window.electronAPI.writeJson(
                `${whales[id].path}/whalesnote_info.json`,
                whaleInfo,
            );

            produceWhales((draft) => {
                draft[id].repo_keys = new_repo_keys;
            });
        },
        [whales],
    );

    const deleteRepo = useCallback(
        async (id: string, repoKey: string | undefined) => {
            if (!whales[id]) return;
            if (!repoKey) return;

            const trash =
                (await window.electronAPI.readJsonSync(`${whales[id].path}/trash.json`)) || {};

            const repoInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );
            for (const folderKey of repoInfo.folder_keys) {
                const folderInfo = await window.electronAPI.readJsonSync(
                    `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
                );
                for (const noteKey of folderInfo.note_keys) {
                    const note_content = await window.electronAPI.readMdSync(
                        `${whales[id].path}/${repoKey}/${folderKey}/${noteKey}.md`,
                    );

                    trash[
                        `${repoKey}-${folderKey}-${noteKey}-${folderInfo.note_map[noteKey]?.title}`
                    ] = note_content;
                }
            }
            await window.electronAPI.writeJson(`${whales[id].path}/trash.json`, trash);

            const whaleInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/whalesnote_info.json`,
            );
            const remainRepoKeys: string[] = [];
            let otherRepoKey = undefined;
            whaleInfo.repo_keys.forEach((key: string, index: number) => {
                if (key === repoKey) {
                    if (whaleInfo.repo_keys.length > 1) {
                        if (index === whaleInfo.repo_keys.length - 1) {
                            otherRepoKey = whaleInfo.repo_keys[index - 1];
                        } else {
                            otherRepoKey = whaleInfo.repo_keys[index + 1];
                        }
                    }
                } else {
                    remainRepoKeys.push(key);
                }
            });
            whaleInfo.repo_keys = remainRepoKeys;
            await window.electronAPI.writeJson(
                `${whales[id].path}/whalesnote_info.json`,
                whaleInfo,
            );

            const history_info = await window.electronAPI.readJsonSync(
                `${whales[id].path}/history_info.json`,
            );
            if (history_info.repos_record[repoKey]) {
                delete history_info.repos_record[repoKey];
            }
            await window.electronAPI.writeJson(
                `${whales[id].path}/history_info.json`,
                history_info,
            );

            await window.electronAPI.remove(`${whales[id].path}/${repoKey}`);

            produceWhales((draft) => {
                draft[id].repo_keys = remainRepoKeys;
                delete draft[id].repo_map[repoKey];
            });

            return otherRepoKey;
        },
        [whales],
    );

    const newFolder = useCallback(
        async (
            id: string,
            repoKey: string | undefined,
            newFolderKey: string,
            newFolderName: string,
        ) => {
            if (!whales[id]) return;
            if (!repoKey) return;

            const repoInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );
            repoInfo.folder_keys.push(newFolderKey);
            repoInfo.folder_map[newFolderKey] = {
                folder_name: newFolderName,
            };
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repoInfo,
            );

            const saveFolderInfo = {
                note_keys: [],
                note_map: {},
            };
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/${newFolderKey}/folder_info.json`,
                saveFolderInfo,
            );

            const folderInfo = {
                note_keys: saveFolderInfo.note_keys,
                note_map: saveFolderInfo.note_map,
                folder_name: newFolderName,
            };
            produceWhales((draft) => {
                draft[id].repo_map[repoKey].folder_keys.push(newFolderKey);
                draft[id].repo_map[repoKey].folder_map[newFolderKey] = folderInfo;
            });
        },
        [whales],
    );

    const renameFolder = useCallback(
        async (
            id: string,
            repoKey: string | undefined,
            folderKey: string | undefined,
            newFolderName: string,
        ) => {
            if (!whales[id]) return;
            if (!repoKey || !folderKey) return;

            const repoInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );
            repoInfo.folder_map[folderKey].folder_name = newFolderName;
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repoInfo,
            );
            produceWhales((draft) => {
                draft[id].repo_map[repoKey].folder_map[folderKey].folder_name = newFolderName;
            });
        },
        [whales],
    );

    const reorderFolder = useCallback(
        async (id: string, repoKey: string | undefined, newFolderKeys: string[]) => {
            if (!whales[id]) return;
            if (!repoKey) return;

            const repoInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );
            repoInfo.folder_keys = newFolderKeys;
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repoInfo,
            );
            produceWhales((draft) => {
                draft[id].repo_map[repoKey].folder_keys = newFolderKeys;
            });
        },
        [whales],
    );

    const deleteFolder = useCallback(
        async (id: string, repoKey: string | undefined, folderKey: string | undefined) => {
            if (!whales[id]) return;
            if (!repoKey || !folderKey) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
            );

            const trash =
                (await window.electronAPI.readJsonSync(`${whales[id].path}/trash.json`)) ||
                ({} as Record<string, string>);

            for (const noteKey of folderInfo.note_keys) {
                const note_content = await window.electronAPI.readMdSync(
                    `${whales[id].path}/${repoKey}/${folderKey}/${noteKey}.md`,
                );
                trash[`${repoKey}-${folderKey}-${noteKey}-${folderInfo.note_map[noteKey].title}`] =
                    note_content;
            }

            await window.electronAPI.writeJson(`${whales[id].path}/trash.json`, trash);

            const repoInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );

            const remaining_folder_keys: string[] = [];
            let next_folder_key = undefined;

            repoInfo.folder_keys.forEach((key: string, index: number) => {
                if (key === folderKey) {
                    if (repoInfo.folder_keys.length > 1) {
                        if (index === repoInfo.folder_keys.length - 1) {
                            next_folder_key = repoInfo.folder_keys[index - 1];
                        } else {
                            next_folder_key = repoInfo.folder_keys[index + 1];
                        }
                    }
                } else {
                    remaining_folder_keys.push(key);
                }
            });

            repoInfo.folder_keys = remaining_folder_keys;
            delete repoInfo.folder_map[folderKey];

            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repoInfo,
            );

            await window.electronAPI.remove(`${whales[id].path}/${repoKey}/${folderKey}`);

            produceWhales((draft) => {
                draft[id].repo_map[repoKey].folder_keys = remaining_folder_keys;
                delete draft[id].repo_map[repoKey].folder_map[folderKey];
            });

            return next_folder_key;
        },
        [whales],
    );

    const newNote = useCallback(
        async (
            id: string,
            repoKey: string | undefined,
            folderKey: string | undefined,
            newNoteKey: string | undefined,
            newNoteTitle: string,
        ) => {
            if (!whales[id]) return;
            if (!repoKey || !folderKey || !newNoteKey) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
            );
            folderInfo.note_keys.push(newNoteKey);
            folderInfo.note_map[newNoteKey] = {
                title: newNoteTitle,
            };

            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
                folderInfo,
            );

            const note_content = '';
            await window.electronAPI.writeStr(
                `${whales[id].path}/${repoKey}/${folderKey}/${newNoteKey}.md`,
                note_content,
            );

            produceWhales((draft) => {
                draft[id].repo_map[repoKey].folder_map[folderKey].note_keys.push(newNoteKey);
                draft[id].repo_map[repoKey].folder_map[folderKey].note_map[newNoteKey] = {
                    title: newNoteTitle,
                };
            });
        },
        [whales],
    );

    const renameSaveNow = useCallback(
        async (
            id: string,
            repoKey: string | undefined,
            folderKey: string | undefined,
            noteKey: string,
            newNoteTitle: string,
        ) => {
            if (!whales[id]) return;
            if (!repoKey || !folderKey || !noteKey) return;

            const old_title =
                whales[id].repo_map[repoKey].folder_map[folderKey].note_map[noteKey].title;
            if (old_title !== newNoteTitle) {
                const folderInfo = await window.electronAPI.readJsonSync(
                    `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
                );
                folderInfo.note_map[noteKey].title = newNoteTitle;
                await window.electronAPI.writeJson(
                    `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
                    folderInfo,
                );

                produceWhales((draft) => {
                    draft[id].repo_map[repoKey].folder_map[folderKey].note_map[noteKey].title =
                        newNoteTitle;
                });
            }
        },
        [whales],
    );

    const renameNote = useCallback(
        async (
            id: string,
            repoKey: string | undefined,
            folderKey: string | undefined,
            noteKey: string | undefined,
            newNoteTitle: string,
        ) => {
            if (!whales[id]) return;
            if (!repoKey || !folderKey || !noteKey) return;

            if (renameSaveTimerObj.current.has(noteKey)) {
                clearTimeout(renameSaveTimerObj.current.get(noteKey) as NodeJS.Timeout);
            }

            renameSaveTimerObj.current.set(
                noteKey,
                setTimeout(async () => {
                    await renameSaveNow(id, repoKey, folderKey, noteKey, newNoteTitle);
                    renameSaveTimerObj.current.delete(noteKey);
                }, 300),
            );
        },
        [whales],
    );

    const reorderNote = useCallback(
        async (
            id: string,
            repoKey: string | undefined,
            folderKey: string | undefined,
            newNoteKeys: string[],
        ) => {
            if (!whales[id]) return;
            if (!repoKey || !folderKey) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
            );
            folderInfo.note_keys = newNoteKeys;
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
                folderInfo,
            );

            produceWhales((draft) => {
                draft[id].repo_map[repoKey].folder_map[folderKey].note_keys = newNoteKeys;
            });
        },
        [whales],
    );

    const deleteNote = useCallback(
        async (
            id: string,
            repoKey: string | undefined,
            folderKey: string | undefined,
            noteKey: string | undefined,
        ) => {
            if (!whales[id]) return;
            if (!repoKey || !folderKey || !noteKey) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
            );

            const note_content = await window.electronAPI.readMdSync(
                `${whales[id].path}/${repoKey}/${folderKey}/${noteKey}.md`,
            );

            const trash =
                (await window.electronAPI.readJsonSync(`${whales[id].path}/trash.json`)) || {};

            trash[`${repoKey}-${folderKey}-${noteKey}-${folderInfo.note_map[noteKey].title}`] =
                note_content;

            await window.electronAPI.writeJson(`${whales[id].path}/trash.json`, trash);

            const remainNoteKeys: string[] = [];
            let next_note_key = undefined;

            folderInfo.note_keys.forEach((key: string, index: number) => {
                if (key === noteKey) {
                    if (folderInfo.note_keys.length > 1) {
                        if (index === folderInfo.note_keys.length - 1) {
                            next_note_key = folderInfo.note_keys[index - 1];
                        } else {
                            next_note_key = folderInfo.note_keys[index + 1];
                        }
                    }
                } else {
                    remainNoteKeys.push(key);
                }
            });

            folderInfo.note_keys = remainNoteKeys;
            delete folderInfo.note_map[noteKey];

            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/${folderKey}/folder_info.json`,
                folderInfo,
            );

            await window.electronAPI.remove(
                `${whales[id].path}/${repoKey}/${folderKey}/${noteKey}.md`,
            );

            produceWhales((draft) => {
                draft[id].repo_map[repoKey].folder_map[folderKey].note_keys = remainNoteKeys;
                delete draft[id].repo_map[repoKey].folder_map[folderKey].note_map[noteKey];
            });

            return next_note_key;
        },
        [whales],
    );

    return {
        whales,
        addWhale,
        fetchFolderMap,
        newRepo,
        renameRepo,
        reorderRepo,
        deleteRepo,
        newFolder,
        renameFolder,
        reorderFolder,
        deleteFolder,
        newNote,
        renameNote,
        reorderNote,
        deleteNote,
    };
};
