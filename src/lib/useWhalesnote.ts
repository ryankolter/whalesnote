import { useCallback, useRef, useState } from 'react';
import { produce } from 'immer';
import { WhaleObject } from '../commonType';

const useWhalesnote = () => {
    const [whales, setWhales] = useState<Record<string, WhaleObject>>({});

    const renameSaveTimerObj = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const addWhale = useCallback(
        (id: string, obj: WhaleObject) => {
            if (whales[id]) return false;
            setWhales(
                produce(whales, (draft) => {
                    draft[id] = obj;
                }),
            );
            return true;
        },
        [whales],
    );

    const fetchFolderMap = useCallback(
        async (id: string, repoKey: string | undefined, folderKey: string | undefined) => {
            if (!whales[id]) return;
            if (!repoKey || !folderKey) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
            );
            if (!folderInfo) return;

            setWhales(
                produce(whales, (draft) => {
                    const folderMap = draft[id].repo_map[repoKey].folder_map;
                    folderMap[folderKey] = {
                        folder_name: folderMap[folderKey].folder_name,
                        note_keys: folderInfo.notes_key,
                        note_map: folderInfo.notes_obj,
                    };
                }),
            );
        },
        [whales],
    );

    const newRepo = useCallback(
        async (id: string, repoKey: string | undefined, repo_name: string) => {
            if (!whales[id]) return;
            if (!repoKey) return;

            const whaleInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/whaleInfo.json`,
            );
            if (!whaleInfo) return;

            whaleInfo.repos_key.push(repoKey);
            await window.electronAPI.writeJson(`${whales[id].path}/whaleInfo.json`, whaleInfo);

            const repoInfo = {
                repo_name,
                folders_key: [],
                folders_obj: {},
            };
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repoInfo,
            );
            setWhales(
                produce(whales, (draft) => {
                    draft[id].repo_keys.push(repoKey);
                    draft[id].repo_map[repoKey] = {
                        repo_name,
                        folder_keys: [],
                        folder_map: {},
                    };
                }),
            );
        },
        [whales],
    );

    const renameRepo = useCallback(
        async (id: string, repoKey: string | undefined, new_repo_name: string) => {
            if (!whales[id]) return;
            if (!repoKey) return;

            const repo_info = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );
            repo_info.repo_name = new_repo_name;
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repo_info,
            );

            setWhales(
                produce(whales, (draft) => {
                    draft[id].repo_map[repoKey].repo_name = new_repo_name;
                }),
            );
        },
        [whales],
    );

    const reorderRepo = useCallback(
        async (id: string, repoKey: string | undefined, new_repo_keys: string[]) => {
            if (!repoKey) return;
            const whaleInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/whaleInfo.json`,
            );
            whaleInfo.repos_key = new_repo_keys;
            await window.electronAPI.writeJson(`${whales[id].path}/whaleInfo.json`, whaleInfo);

            setWhales(
                produce(whales, (draft) => {
                    draft[id].repo_keys = new_repo_keys;
                }),
            );
        },
        [whales],
    );

    const deleteRepo = useCallback(
        async (id: string, repoKey: string | undefined) => {
            if (!whales[id]) return;
            if (!repoKey) return;

            const trash =
                (await window.electronAPI.readJsonSync(`${whales[id].path}/trash.json`)) || {};

            const repo_info = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );
            for (const folderKey of repo_info.folder_keys) {
                const folderInfo = await window.electronAPI.readJsonSync(
                    `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
                );
                for (const noteKey of folderInfo.note_keys) {
                    const note_content = await window.electronAPI.readMdSync(
                        `${whales[id].path}/${repoKey}/${folderKey}/${noteKey}.md`,
                    );

                    trash[
                        `${repoKey}-${folderKey}-${noteKey}-${folderInfo.notes_obj[noteKey]?.title}`
                    ] = note_content;
                }
            }
            await window.electronAPI.writeJson(`${whales[id].path}/trash.json`, trash);

            const whaleInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/whaleInfo.json`,
            );
            const remainRepoKeys: string[] = [];
            let otherRepoKey = undefined;
            whaleInfo.repos_key.forEach((key: string, index: number) => {
                if (key === repoKey) {
                    if (whaleInfo.repos_key.length > 1) {
                        if (index === whaleInfo.repos_key.length - 1) {
                            otherRepoKey = whaleInfo.repos_key[index - 1];
                        } else {
                            otherRepoKey = whaleInfo.repos_key[index + 1];
                        }
                    }
                } else {
                    remainRepoKeys.push(key);
                }
            });
            whaleInfo.repos_key = remainRepoKeys;
            await window.electronAPI.writeJson(`${whales[id].path}/whaleInfo.json`, whaleInfo);

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

            setWhales(
                produce(whales, (draft) => {
                    draft[id].repo_keys = remainRepoKeys;
                    delete draft[id].repo_map[repoKey];
                }),
            );

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

            const repo_info = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );
            repo_info.folder_keys.push(newFolderKey);
            repo_info.folders_obj[newFolderKey] = {
                folder_name: newFolderName,
            };
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repo_info,
            );

            const save_folder_info = {
                note_keys: [],
                note_map: {},
            };
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/${newFolderKey}/folderInfo.json`,
                save_folder_info,
            );

            const folderInfo = {
                ...save_folder_info,
                folder_name: newFolderName,
            };
            setWhales(
                produce(whales, (draft) => {
                    draft[id].repo_map[repoKey].folder_keys.push(newFolderKey);
                    draft[id].repo_map[repoKey].folder_map[newFolderKey] = folderInfo;
                }),
            );
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

            const repo_info = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );
            repo_info.folders_obj[folderKey].folder_name = newFolderName;
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repo_info,
            );
            setWhales(
                produce(whales, (draft) => {
                    draft[id].repo_map[repoKey].folder_map[folderKey].folder_name = newFolderName;
                }),
            );
        },
        [whales],
    );

    const reorderFolder = useCallback(
        async (id: string, repoKey: string | undefined, newFolderKeys: string[]) => {
            if (!whales[id]) return;
            if (!repoKey) return;

            const repo_info = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );
            repo_info.folder_keys = newFolderKeys;
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repo_info,
            );
            setWhales(
                produce(whales, (draft) => {
                    draft[id].repo_map[repoKey].folder_keys = newFolderKeys;
                }),
            );
        },
        [whales],
    );

    const deleteFolder = useCallback(
        async (id: string, repoKey: string | undefined, folderKey: string | undefined) => {
            if (!whales[id]) return;
            if (!repoKey || !folderKey) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
            );

            const trash =
                (await window.electronAPI.readJsonSync(`${whales[id].path}/trash.json`)) ||
                ({} as Record<string, string>);

            for (const noteKey of folderInfo.note_keys) {
                const note_content = await window.electronAPI.readMdSync(
                    `${whales[id].path}/${repoKey}/${folderKey}/${noteKey}.md`,
                );
                trash[`${repoKey}-${folderKey}-${noteKey}-${folderInfo.notes_obj[noteKey].title}`] =
                    note_content;
            }

            await window.electronAPI.writeJson(`${whales[id].path}/trash.json`, trash);

            const repo_info = await window.electronAPI.readJsonSync(
                `${whales[id].path}/${repoKey}/repo_info.json`,
            );

            const remaining_folder_keys: string[] = [];
            let next_folder_key = undefined;

            repo_info.folder_keys.forEach((key: string, index: number) => {
                if (key === folderKey) {
                    if (repo_info.folder_keys.length > 1) {
                        if (index === repo_info.folder_keys.length - 1) {
                            next_folder_key = repo_info.folder_keys[index - 1];
                        } else {
                            next_folder_key = repo_info.folder_keys[index + 1];
                        }
                    }
                } else {
                    remaining_folder_keys.push(key);
                }
            });

            repo_info.folder_keys = remaining_folder_keys;
            delete repo_info.folders_obj[folderKey];

            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/repo_info.json`,
                repo_info,
            );

            await window.electronAPI.remove(`${whales[id].path}/${repoKey}/${folderKey}`);

            setWhales(
                produce(whales, (draft) => {
                    draft[id].repo_map[repoKey].folder_keys = remaining_folder_keys;
                    delete draft[id].repo_map[repoKey].folder_map[folderKey];
                }),
            );

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
                `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
            );

            folderInfo.note_keys.push(newNoteKey);
            folderInfo.notes_obj[newNoteKey] = {
                title: newNoteTitle,
            };

            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
                folderInfo,
            );

            const note_content = '';

            await window.electronAPI.writeStr(
                `${whales[id].path}/${repoKey}/${folderKey}/${newNoteKey}.md`,
                note_content,
            );

            produce(whales, (draft) => {
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
                    `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
                );
                folderInfo.notes_obj[noteKey].title = newNoteTitle;
                await window.electronAPI.writeJson(
                    `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
                    folderInfo,
                );

                setWhales(
                    produce(whales, (draft) => {
                        draft[id].repo_map[repoKey].folder_map[folderKey].note_map[noteKey].title =
                            newNoteTitle;
                    }),
                );
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
                    await renameSaveNow(whales[id].path, repoKey, folderKey, noteKey, newNoteTitle);
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
                `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
            );
            folderInfo.note_keys = newNoteKeys;
            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
                folderInfo,
            );

            setWhales(
                produce(whales, (draft) => {
                    draft[id].repo_map[repoKey].folder_map[folderKey].note_keys = newNoteKeys;
                }),
            );
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
                `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
            );

            const note_content = await window.electronAPI.readMdSync(
                `${whales[id].path}/${repoKey}/${folderKey}/${noteKey}.md`,
            );

            const trash =
                (await window.electronAPI.readJsonSync(`${whales[id].path}/trash.json`)) || {};

            trash[`${repoKey}-${folderKey}-${noteKey}-${folderInfo.notes_obj[noteKey].title}`] =
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
            delete folderInfo.notes_obj[noteKey];

            await window.electronAPI.writeJson(
                `${whales[id].path}/${repoKey}/${folderKey}/folderInfo.json`,
                folderInfo,
            );

            await window.electronAPI.remove(
                `${whales[id].path}/${repoKey}/${folderKey}/${noteKey}.md`,
            );

            setWhales(
                produce(whales, (draft) => {
                    draft[id].repo_map[repoKey].folder_map[folderKey].note_keys = remainNoteKeys;
                    delete draft[id].repo_map[repoKey].folder_map[folderKey].note_map[noteKey];
                }),
            );

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

export default useWhalesnote;
