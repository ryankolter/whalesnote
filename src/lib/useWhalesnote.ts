import { useCallback, useRef, useState } from 'react';
import { produce } from 'immer';
import { WhaleObject } from '../commonType';

const useWhalesnote = () => {
    const [whales, setWhales] = useState<Record<string, WhaleObject>>({});

    const renameSaveTimerObj = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const addWhale = useCallback(
        (id: string, obj: WhaleObject) => {
            if (whales[id]) return;
            produce(whales, (draft) => {
                draft[id] = obj;
            });
        },
        [whales],
    );

    const fetchFolderMap = useCallback(
        async (id: string, repo_key: string | undefined, folder_key: string | undefined) => {
            if (!repo_key || !folder_key) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
            );
            if (!folderInfo) return;

            produce(whales, (draft) => {
                const folderMap = draft[id].repo_map[repo_key].folder_map;
                folderMap[folder_key] = {
                    folder_name: folderMap[folder_key].folder_name,
                    note_keys: folderInfo.notes_key,
                    note_map: folderInfo.notes_obj,
                };
            });
        },
        [whales],
    );

    const newRepo = useCallback(
        async (id: string, repo_key: string | undefined, repo_name: string) => {
            if (!repo_key) return;

            const whaleInfo = await window.electronAPI.readJsonSync(
                `${cur_data_path}/whaleInfo.json`,
            );
            if (!whaleInfo) return;

            whaleInfo.repos_key.push(repo_key);
            await window.electronAPI.writeJson(`${cur_data_path}/whaleInfo.json`, whaleInfo);

            const repoInfo = {
                repo_name,
                folders_key: [],
                folders_obj: {},
            };
            await window.electronAPI.writeJson(
                `${cur_data_path}/${repo_key}/repo_info.json`,
                repoInfo,
            );

            produce(whales, (draft) => {
                draft[id].repo_keys.push(repo_key);
                draft[id].repo_map[repo_key] = {
                    repo_name,
                    folder_keys: [],
                    folder_map: {},
                };
            });
        },
        [whales],
    );

    const renameRepo = useCallback(
        async (id: string, repo_key: string | undefined, new_repo_name: string) => {
            if (!repo_key) return;
            const repo_info = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/repo_info.json`,
            );
            repo_info.repo_name = new_repo_name;
            await window.electronAPI.writeJson(
                `${cur_data_path}/${repo_key}/repo_info.json`,
                repo_info,
            );

            produce(whales, (draft) => {
                draft[id].repo_map[repo_key].repo_name = new_repo_name;
            });
        },
        [whales],
    );

    const reorderRepo = useCallback(
        async (id: string, repo_key: string | undefined, new_repo_keys: string[]) => {
            if (!repo_key) return;
            const whaleInfo = await window.electronAPI.readJsonSync(
                `${cur_data_path}/whaleInfo.json`,
            );
            whaleInfo.repos_key = new_repo_keys;
            await window.electronAPI.writeJson(`${cur_data_path}/whaleInfo.json`, whaleInfo);

            produce(whales, (draft) => {
                draft[id].repo_keys = new_repo_keys;
            });
        },
        [whales],
    );

    const deleteRepo = useCallback(
        async (id: string, repo_key: string | undefined) => {
            if (!repo_key) return;
            const trash =
                (await window.electronAPI.readJsonSync(`${cur_data_path}/trash.json`)) || {};

            const repo_info = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/repo_info.json`,
            );
            for (const folder_key of repo_info.folder_keys) {
                const folderInfo = await window.electronAPI.readJsonSync(
                    `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
                );
                for (const note_key of folderInfo.note_keys) {
                    const note_content = await window.electronAPI.readMdSync(
                        `${cur_data_path}/${repo_key}/${folder_key}/${note_key}.md`,
                    );

                    trash[
                        `${repo_key}-${folder_key}-${note_key}-${folderInfo.notes_obj[note_key]?.title}`
                    ] = note_content;
                }
            }
            await window.electronAPI.writeJson(`${cur_data_path}/trash.json`, trash);

            const whaleInfo = await window.electronAPI.readJsonSync(
                `${cur_data_path}/whaleInfo.json`,
            );
            const remainRepoKeys: string[] = [];
            let otherRepoKey = undefined;
            whaleInfo.repos_key.forEach((key: string, index: number) => {
                if (key === repo_key) {
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
            await window.electronAPI.writeJson(`${cur_data_path}/whaleInfo.json`, whaleInfo);

            const history_info = await window.electronAPI.readJsonSync(
                `${cur_data_path}/history_info.json`,
            );
            if (history_info.repos_record[repo_key]) {
                delete history_info.repos_record[repo_key];
            }
            await window.electronAPI.writeJson(`${cur_data_path}/history_info.json`, history_info);

            await window.electronAPI.remove(`${cur_data_path}/${repo_key}`);

            produce(whales, (draft) => {
                draft[id].repo_keys = remainRepoKeys;
                delete draft[id].repo_map[repo_key];
            });

            return otherRepoKey;
        },
        [whales],
    );

    const newFolder = useCallback(
        async (
            id: string,
            repo_key: string | undefined,
            new_folder_key: string,
            new_folder_name: string,
        ) => {
            if (!repo_key) return;

            const repo_info = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/repo_info.json`,
            );
            repo_info.folder_keys.push(new_folder_key);
            repo_info.folders_obj[new_folder_key] = {
                folder_name: new_folder_name,
            };
            await window.electronAPI.writeJson(
                `${cur_data_path}/${repo_key}/repo_info.json`,
                repo_info,
            );

            const save_folder_info = {
                note_keys: [],
                note_map: {},
            };
            await window.electronAPI.writeJson(
                `${cur_data_path}/${repo_key}/${new_folder_key}/folderInfo.json`,
                save_folder_info,
            );

            const folderInfo = {
                ...save_folder_info,
                folder_name: new_folder_name,
            };

            produce(whales, (draft) => {
                draft[id].repo_map[repo_key].folder_keys.push(new_folder_key);
                draft[id].repo_map[repo_key].folder_map[new_folder_key] = folderInfo;
            });
        },
        [whales],
    );

    const renameFolder = useCallback(
        async (
            id: string,
            repo_key: string | undefined,
            folder_key: string | undefined,
            new_folder_name: string,
        ) => {
            if (!repo_key || !folder_key) return;

            const repo_info = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/repo_info.json`,
            );
            repo_info.folders_obj[folder_key].folder_name = new_folder_name;
            await window.electronAPI.writeJson(
                `${cur_data_path}/${repo_key}/repo_info.json`,
                repo_info,
            );
            produce(whales, (draft) => {
                draft[id].repo_map[repo_key].folder_map[folder_key].folder_name = new_folder_name;
            });
        },
        [whales],
    );

    const reorderFolder = useCallback(
        async (id: string, repo_key: string | undefined, new_folder_keys: string[]) => {
            if (!repo_key) return;
            const repo_info = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/repo_info.json`,
            );
            repo_info.folder_keys = new_folder_keys;
            await window.electronAPI.writeJson(
                `${cur_data_path}/${repo_key}/repo_info.json`,
                repo_info,
            );
            produce(whales, (draft) => {
                draft[id].repo_map[repo_key].folder_keys = new_folder_keys;
            });
        },
        [whales],
    );

    const deleteFolder = useCallback(
        async (id: string, repo_key: string | undefined, folder_key: string | undefined) => {
            if (!repo_key || !folder_key) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
            );

            const trash =
                (await window.electronAPI.readJsonSync(`${cur_data_path}/trash.json`)) ||
                ({} as Record<string, string>);

            for (const note_key of folderInfo.note_keys) {
                const note_content = await window.electronAPI.readMdSync(
                    `${cur_data_path}/${repo_key}/${folder_key}/${note_key}.md`,
                );
                trash[
                    `${repo_key}-${folder_key}-${note_key}-${folderInfo.notes_obj[note_key].title}`
                ] = note_content;
            }

            await window.electronAPI.writeJson(`${cur_data_path}/trash.json`, trash);

            const repo_info = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/repo_info.json`,
            );

            const remaining_folder_keys: string[] = [];
            let next_folder_key = undefined;

            repo_info.folder_keys.forEach((key: string, index: number) => {
                if (key === folder_key) {
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
            delete repo_info.folders_obj[folder_key];

            await window.electronAPI.writeJson(
                `${cur_data_path}/${repo_key}/repo_info.json`,
                repo_info,
            );

            await window.electronAPI.remove(`${cur_data_path}/${repo_key}/${folder_key}`);

            produce(whales, (draft) => {
                draft[id].repo_map[repo_key].folder_keys = remaining_folder_keys;
                delete draft[id].repo_map[repo_key].folder_map[folder_key];
            });

            return next_folder_key;
        },
        [whales],
    );

    const newNote = useCallback(
        async (
            id: string,
            repo_key: string | undefined,
            folder_key: string | undefined,
            new_note_key: string | undefined,
            new_note_title: string,
        ) => {
            if (!repo_key || !folder_key || !new_note_key) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
            );

            folderInfo.note_keys.push(new_note_key);
            folderInfo.notes_obj[new_note_key] = {
                title: new_note_title,
            };

            await window.electronAPI.writeJson(
                `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
                folderInfo,
            );

            const note_content = '';

            await window.electronAPI.writeStr(
                `${cur_data_path}/${repo_key}/${folder_key}/${new_note_key}.md`,
                note_content,
            );

            produce(whales, (draft) => {
                draft[id].repo_map[repo_key].folder_map[folder_key].note_keys.push(new_note_key);
                draft[id].repo_map[repo_key].folder_map[folder_key].note_map[new_note_key] = {
                    title: new_note_title,
                };
            });
        },
        [whales],
    );

    const renameSaveNow = useCallback(
        async (
            id: string,
            repo_key: string | undefined,
            folder_key: string | undefined,
            note_key: string,
            new_title: string,
        ) => {
            if (!repo_key || !folder_key || !note_key) return;

            const old_title =
                whales[id].repo_map[repo_key].folder_map[folder_key].note_map[note_key].title;
            if (old_title !== new_title) {
                const folderInfo = await window.electronAPI.readJsonSync(
                    `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
                );
                folderInfo.notes_obj[note_key].title = new_title;
                await window.electronAPI.writeJson(
                    `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
                    folderInfo,
                );

                produce(whales, (draft) => {
                    draft[id].repo_map[repo_key].folder_map[folder_key].note_map[note_key].title =
                        new_title;
                });
            }
        },
        [whales],
    );

    const renameNote = useCallback(
        async (
            id: string,
            repo_key: string | undefined,
            folder_key: string | undefined,
            note_key: string | undefined,
            new_title: string,
        ) => {
            if (!repo_key || !folder_key || !note_key) return;
            if (renameSaveTimerObj.current.has(note_key)) {
                clearTimeout(renameSaveTimerObj.current.get(note_key) as NodeJS.Timeout);
            }

            renameSaveTimerObj.current.set(
                note_key,
                setTimeout(async () => {
                    await renameSaveNow(cur_data_path, repo_key, folder_key, note_key, new_title);
                    renameSaveTimerObj.current.delete(note_key);
                }, 300),
            );
        },
        [whales],
    );

    const reorderNote = useCallback(
        async (
            id: string,
            repo_key: string | undefined,
            folder_key: string | undefined,
            new_note_keys: string[],
        ) => {
            if (!repo_key || !folder_key) return;
            const folderInfo = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
            );
            folderInfo.note_keys = new_note_keys;
            await window.electronAPI.writeJson(
                `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
                folderInfo,
            );

            produce(whales, (draft) => {
                draft[id].repo_map[repo_key].folder_map[folder_key].note_keys = new_note_keys;
            });
        },
        [whales],
    );

    const deleteNote = useCallback(
        async (
            id: string,
            repo_key: string | undefined,
            folder_key: string | undefined,
            note_key: string | undefined,
        ) => {
            if (!repo_key || !folder_key || !note_key) return;

            const folderInfo = await window.electronAPI.readJsonSync(
                `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
            );

            const note_content = await window.electronAPI.readMdSync(
                `${cur_data_path}/${repo_key}/${folder_key}/${note_key}.md`,
            );

            const trash =
                (await window.electronAPI.readJsonSync(`${cur_data_path}/trash.json`)) || {};

            trash[`${repo_key}-${folder_key}-${note_key}-${folderInfo.notes_obj[note_key].title}`] =
                note_content;

            await window.electronAPI.writeJson(`${cur_data_path}/trash.json`, trash);

            const remainNoteKeys: string[] = [];
            let next_note_key = undefined;

            folderInfo.note_keys.forEach((key: string, index: number) => {
                if (key === note_key) {
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
            delete folderInfo.notes_obj[note_key];

            await window.electronAPI.writeJson(
                `${cur_data_path}/${repo_key}/${folder_key}/folderInfo.json`,
                folderInfo,
            );

            await window.electronAPI.remove(
                `${cur_data_path}/${repo_key}/${folder_key}/${note_key}.md`,
            );

            produce(whales, (draft) => {
                draft[id].repo_map[repo_key].folder_map[folder_key].note_keys = remainNoteKeys;
                delete draft[id].repo_map[repo_key].folder_map[folder_key].note_map[note_key];
            });

            return next_note_key;
        },
        [],
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
