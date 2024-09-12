import { useCallback, useReducer, useRef } from 'react';
import { produce } from 'immer';
import { WhaleObject } from '../commonType';

const whalesnoteReducer = produce((state: WhaleObject, action: any) => {
    switch (action.type) {
        case 'init': {
            state = action.new_state;
            return state;
        }

        case 'fetch_note_into_in_folder': {
            state.repo_map[action.repo_key].folder_map[action.folder_key] = {
                ...state.repo_map[action.repo_key].folder_map[action.folder_key],
                note_keys: action.folder_info.notes_key,
                note_map: action.folder_info.notes_obj,
            };
            return state;
        }

        case 'new_repo': {
            state.repo_keys = [...state.repo_keys, action.repo_key];
            state.repo_map[action.repo_key] = {
                ...action.repo_info,
                folder_map: {},
            };
            return state;
        }
        case 'rename_repo': {
            state.repo_map[action.repo_key].repo_name = action.new_repo_name;
            return state;
        }
        case 'reorder_repo': {
            state.repo_keys = action.new_repo_keys;
            return state;
        }
        case 'delete_repo': {
            state.repo_keys = action.remain_repo_keys;
            delete state.repo_map[action.repo_key];
            return state;
        }

        case 'new_folder': {
            state.repo_map[action.repo_key].folder_keys = [
                ...state.repo_map[action.repo_key].folder_keys,
                action.new_folder_key,
            ];
            state.repo_map[action.repo_key].folder_map[action.new_folder_key] = action.folder_info;
            return state;
        }
        case 'rename_folder': {
            state.repo_map[action.repo_key].folder_map[action.folder_key].folder_name =
                action.new_folder_name;
            return state;
        }
        case 'reorder_folder': {
            state.repo_map[action.repo_key].folder_keys = action.new_folder_keys;
            return state;
        }
        case 'delete_folder': {
            state.repo_map[action.repo_key].folder_keys = action.remaining_folder_keys;
            delete state.repo_map[action.repo_key].folder_map[action.folder_key];
            return state;
        }

        case 'new_note': {
            state.repo_map[action.repo_key].folder_map[action.folder_key].note_keys = [
                ...state.repo_map[action.repo_key].folder_map[action.folder_key].note_keys,
                action.new_note_key,
            ];
            state.repo_map[action.repo_key].folder_map[action.folder_key].note_map[
                action.new_note_key
            ] = {
                title: action.new_note_title,
            };

            return state;
        }
        case 'rename_note': {
            state.repo_map[action.repo_key].folder_map[action.folder_key].note_map[
                action.note_key
            ].title = action.new_title;
            return state;
        }
        case 'reorder_note': {
            state.repo_map[action.repo_key].folder_map[action.folder_key].note_keys =
                action.new_note_keys;
            return state;
        }
        case 'delete_note': {
            state.repo_map[action.repo_key].folder_map[action.folder_key].note_keys =
                action.remaining_note_keys;
            delete state.repo_map[action.repo_key].folder_map[action.folder_key].note_map[
                action.note_key
            ];
            return state;
        }
    }
});

const useWhalesnote = () => {
    const lastState = useRef<WhaleObject>({
        repo_keys: [],
        repo_map: {},
    });
    const getState = useCallback(() => lastState.current, []);
    const [state, dispatch] = useReducer(
        (state: WhaleObject, action: any) => (lastState.current = whalesnoteReducer(state, action)),
        {
            repo_keys: [],
            repo_map: {},
        },
    );
    const renameSaveTimerObj = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const initwhalesnote = useCallback(
        (newWhalesnote: WhaleObject) => dispatch({ type: 'init', new_state: newWhalesnote }),
        [],
    );

    const fetchNotesInfoInFolder = useCallback(
        async (
            cur_data_path: string,
            repo_key: string | undefined,
            folder_key: string | undefined,
        ) => {
            if (repo_key && folder_key) {
                if (!getState().repo_map[repo_key].folder_map[folder_key].note_keys) {
                    const folder_info = await window.electronAPI.readJsonSync({
                        file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
                    });

                    dispatch({
                        type: 'fetch_note_into_in_folder',
                        repo_key,
                        folder_key,
                        folder_info,
                    });
                }
            }
        },
        [],
    );

    const newRepo = useCallback(
        async (cur_data_path: string, repo_key: string, repo_name: string) => {
            const whalesnote_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/whalesnote_info.json`,
            });
            whalesnote_info.repos_key.push(repo_key);
            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/whalesnote_info.json`,
                obj: whalesnote_info,
            });

            const repo_info = {
                repo_name,
                folders_key: [],
                folders_obj: {},
            };
            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
                obj: repo_info,
            });

            dispatch({
                type: 'new_repo',
                repo_info,
                repo_key,
            });
        },
        [],
    );

    const renameRepo = useCallback(
        async (cur_data_path: string, repo_key: string, new_repo_name: string) => {
            const repo_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
            });
            repo_info.repo_name = new_repo_name;
            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
                obj: repo_info,
            });

            dispatch({
                type: 'rename_repo',
                repo_key,
                new_repo_name,
            });
        },
        [],
    );

    const reorderRepo = useCallback(
        async (cur_data_path: string, repo_key: string, new_repo_keys: string[]) => {
            if (repo_key) {
                const whalesnote_info = await window.electronAPI.readJsonSync({
                    file_path: `${cur_data_path}/whalesnote_info.json`,
                });
                whalesnote_info.repos_key = new_repo_keys;
                await window.electronAPI.writeJson({
                    file_path: `${cur_data_path}/whalesnote_info.json`,
                    obj: whalesnote_info,
                });
                dispatch({
                    type: 'reorder_repo',
                    cur_data_path,
                    repo_key,
                    new_repo_keys,
                });
            }
        },
        [],
    );

    const deleteRepo = useCallback(async (cur_data_path: string, repo_key: string) => {
        let trash = await window.electronAPI.readJsonSync({
            file_path: `${cur_data_path}/trash.json`,
        });
        trash = trash ? trash : {};

        const repo_info = await window.electronAPI.readJsonSync({
            file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
        });
        for (const folder_key of repo_info.folder_keys) {
            const folder_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
            });
            for (const note_key of folder_info.note_keys) {
                const note_content = await window.electronAPI.readMdSync({
                    file_path: `${cur_data_path}/${repo_key}/${folder_key}/${note_key}.md`,
                });

                trash[
                    `${repo_key}-${folder_key}-${note_key}-${folder_info.notes_obj[note_key]?.title}`
                ] = note_content;
            }
        }
        await window.electronAPI.writeJson({
            file_path: `${cur_data_path}/trash.json`,
            obj: trash,
        });

        const whalesnote_info = await window.electronAPI.readJsonSync({
            file_path: `${cur_data_path}/whalesnote_info.json`,
        });
        const remain_repo_keys: string[] = [];
        let other_repo_key = undefined;
        whalesnote_info.repos_key.forEach((key: string, index: number) => {
            if (key === repo_key) {
                if (whalesnote_info.repos_key.length > 1) {
                    if (index === whalesnote_info.repos_key.length - 1) {
                        other_repo_key = whalesnote_info.repos_key[index - 1];
                    } else {
                        other_repo_key = whalesnote_info.repos_key[index + 1];
                    }
                }
            } else {
                remain_repo_keys.push(key);
            }
        });
        whalesnote_info.repos_key = remain_repo_keys;
        await window.electronAPI.writeJson({
            file_path: `${cur_data_path}/whalesnote_info.json`,
            obj: whalesnote_info,
        });

        const history_info = await window.electronAPI.readJsonSync({
            file_path: `${cur_data_path}/history_info.json`,
        });
        if (history_info.repos_record[repo_key]) {
            delete history_info.repos_record[repo_key];
        }
        await window.electronAPI.writeJson({
            file_path: `${cur_data_path}/history_info.json`,
            obj: history_info,
        });

        await window.electronAPI.remove({
            file_path: `${cur_data_path}/${repo_key}`,
        });

        dispatch({
            type: 'delete_repo',
            repo_key,
            remain_repo_keys,
        });

        return other_repo_key;
    }, []);

    const newFolder = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            new_folder_key: string,
            new_folder_name: string,
        ) => {
            const repo_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
            });
            repo_info.folder_keys.push(new_folder_key);
            repo_info.folders_obj[new_folder_key] = {
                folder_name: new_folder_name,
            };
            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
                obj: repo_info,
            });

            const save_folder_info = {
                note_keys: [],
                note_map: {},
            };
            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/${repo_key}/${new_folder_key}/folder_info.json`,
                obj: save_folder_info,
            });

            const folder_info = {
                ...save_folder_info,
                folder_name: new_folder_name,
            };

            dispatch({
                type: 'new_folder',
                repo_key,
                new_folder_key,
                folder_info,
            });
        },
        [],
    );

    const renameFolder = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            folder_key: string,
            new_folder_name: string,
        ) => {
            const repo_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
            });
            repo_info.folders_obj[folder_key].folder_name = new_folder_name;
            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
                obj: repo_info,
            });
            dispatch({
                type: 'rename_folder',
                repo_key,
                folder_key,
                new_folder_name,
            });
        },
        [],
    );

    const reorderFolder = useCallback(
        async (cur_data_path: string, repo_key: string, new_folder_keys: string[]) => {
            if (repo_key) {
                const repo_info = await window.electronAPI.readJsonSync({
                    file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
                });
                repo_info.folder_keys = new_folder_keys;
                await window.electronAPI.writeJson({
                    file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
                    obj: repo_info,
                });

                dispatch({
                    type: 'reorder_folder',
                    cur_data_path,
                    repo_key,
                    new_folder_keys,
                });
            }
        },
        [],
    );

    const deleteFolder = useCallback(
        async (cur_data_path: string, repo_key: string, folder_key: string) => {
            const folder_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
            });

            let trash = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/trash.json`,
            });

            trash = trash ? trash : {};

            for (const note_key of folder_info.note_keys) {
                const note_content = await window.electronAPI.readMdSync({
                    file_path: `${cur_data_path}/${repo_key}/${folder_key}/${note_key}.md`,
                });
                trash[
                    `${repo_key}-${folder_key}-${note_key}-${folder_info.notes_obj[note_key].title}`
                ] = note_content;
            }

            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/trash.json`,
                obj: trash,
            });

            const repo_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
            });

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

            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
                obj: repo_info,
            });

            await window.electronAPI.remove({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}`,
            });

            dispatch({
                type: 'delete_folder',
                repo_key,
                folder_key,
                remaining_folder_keys,
            });

            return next_folder_key;
        },
        [],
    );

    const newNote = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            folder_key: string,
            new_note_key: string,
            new_note_title: string,
        ) => {
            const folder_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
            });

            folder_info.note_keys.push(new_note_key);
            folder_info.notes_obj[new_note_key] = {
                title: new_note_title,
            };

            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
                obj: folder_info,
            });

            const note_content = '';

            await window.electronAPI.writeMd({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/${new_note_key}.md`,
                str: note_content,
            });

            dispatch({
                type: 'new_note',
                repo_key,
                folder_key,
                new_note_key,
                new_note_title,
            });
        },
        [],
    );

    const renameSaveNow = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            folder_key: string,
            note_key: string,
            new_title: string,
        ) => {
            const old_title =
                getState().repo_map[repo_key].folder_map[folder_key].note_map[note_key].title;
            if (old_title !== new_title) {
                const folder_info = await window.electronAPI.readJsonSync({
                    file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
                });
                folder_info.notes_obj[note_key].title = new_title;
                await window.electronAPI.writeJson({
                    file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
                    obj: folder_info,
                });

                dispatch({
                    type: 'rename_note',
                    cur_data_path,
                    repo_key,
                    folder_key,
                    note_key,
                    new_title,
                });
            }
        },
        [],
    );

    const renameNote = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            folder_key: string,
            note_key: string,
            new_title: string,
        ) => {
            if (repo_key && folder_key && note_key) {
                if (renameSaveTimerObj.current.has(note_key)) {
                    clearTimeout(renameSaveTimerObj.current.get(note_key) as NodeJS.Timeout);
                }

                renameSaveTimerObj.current.set(
                    note_key,
                    setTimeout(async () => {
                        await renameSaveNow(
                            cur_data_path,
                            repo_key,
                            folder_key,
                            note_key,
                            new_title,
                        );
                        renameSaveTimerObj.current.delete(note_key);
                    }, 300),
                );
            }
        },
        [],
    );

    const reorderNote = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            folder_key: string,
            new_note_keys: string[],
        ) => {
            if (repo_key && folder_key) {
                const folder_info = await window.electronAPI.readJsonSync({
                    file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
                });
                folder_info.note_keys = new_note_keys;
                await window.electronAPI.writeJson({
                    file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
                    obj: folder_info,
                });

                dispatch({
                    type: 'reorder_note',
                    cur_data_path,
                    repo_key,
                    folder_key,
                    new_note_keys,
                });
            }
        },
        [],
    );

    const deleteNote = useCallback(
        async (cur_data_path: string, repo_key: string, folder_key: string, note_key: string) => {
            const folder_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
            });

            const note_content = await window.electronAPI.readMdSync({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/${note_key}.md`,
            });

            let trash = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/trash.json`,
            });

            trash = trash ? trash : {};

            trash[
                `${repo_key}-${folder_key}-${note_key}-${folder_info.notes_obj[note_key].title}`
            ] = note_content;

            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/trash.json`,
                obj: trash,
            });

            const remaining_note_keys: string[] = [];
            let next_note_key = undefined;

            folder_info.note_keys.forEach((key: string, index: number) => {
                if (key === note_key) {
                    if (folder_info.note_keys.length > 1) {
                        if (index === folder_info.note_keys.length - 1) {
                            next_note_key = folder_info.note_keys[index - 1];
                        } else {
                            next_note_key = folder_info.note_keys[index + 1];
                        }
                    }
                } else {
                    remaining_note_keys.push(key);
                }
            });

            folder_info.note_keys = remaining_note_keys;
            delete folder_info.notes_obj[note_key];

            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
                obj: folder_info,
            });

            await window.electronAPI.remove({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/${note_key}.md`,
            });

            dispatch({
                type: 'delete_note',
                repo_key,
                folder_key,
                note_key,
                remaining_note_keys,
            });

            return next_note_key;
        },
        [],
    );

    return [
        state,
        {
            initwhalesnote,
            fetchNotesInfoInFolder,
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
        },
    ] as const;
};

export default useWhalesnote;
