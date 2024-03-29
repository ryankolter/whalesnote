import { useCallback, useReducer, useRef } from 'react';
import produce from 'immer';
import { whalesnoteObjType } from '../commonType';

const whalesnoteReducer = produce((state: whalesnoteObjType, action: any) => {
    switch (action.type) {
        case 'init': {
            state = action.new_state;
            return state;
        }

        case 'fetch_note_into_in_folder': {
            state.repos_obj[action.repo_key].folders_obj[action.folder_key] = {
                ...state.repos_obj[action.repo_key].folders_obj[action.folder_key],
                ...action.folder_info,
            };
            return state;
        }

        case 'new_repo': {
            state.repos_key = [...state.repos_key, action.repo_key];
            state.repos_obj[action.repo_key] = {
                ...action.repo_info,
                folders_obj: {},
            };
            return state;
        }
        case 'rename_repo': {
            state.repos_obj[action.repo_key].repo_name = action.new_repo_name;
            return state;
        }
        case 'reorder_repo': {
            state.repos_key = action.new_repos_key;
            return state;
        }
        case 'delete_repo': {
            state.repos_key = action.remain_repos_key;
            state.repos_obj[action.repo_key] = {};
            return state;
        }

        case 'new_folder': {
            state.repos_obj[action.repo_key].folders_key = [
                ...state.repos_obj[action.repo_key].folders_key,
                action.new_folder_key,
            ];
            state.repos_obj[action.repo_key].folders_obj[action.new_folder_key] =
                action.folder_info;
            return state;
        }
        case 'rename_folder': {
            state.repos_obj[action.repo_key].folders_obj[action.folder_key].folder_name =
                action.new_folder_name;
            return state;
        }
        case 'reorder_folder': {
            state.repos_obj[action.repo_key].folders_key = action.new_folders_key;
            return state;
        }
        case 'delete_folder': {
            state.repos_obj[action.repo_key].folders_key = action.remaining_folders_key;
            state.repos_obj[action.repo_key].folders_obj[action.folder_key] = {};
            return state;
        }

        case 'new_note': {
            state.repos_obj[action.repo_key].folders_obj[action.folder_key].notes_key = [
                ...state.repos_obj[action.repo_key].folders_obj[action.folder_key].notes_key,
                action.new_note_key,
            ];
            state.repos_obj[action.repo_key].folders_obj[action.folder_key].notes_obj[
                action.new_note_key
            ] = {
                title: action.new_note_title,
            };

            return state;
        }
        case 'rename_note': {
            state.repos_obj[action.repo_key].folders_obj[action.folder_key].notes_obj[
                action.note_key
            ].title = action.new_title;
            return state;
        }
        case 'reorder_note': {
            state.repos_obj[action.repo_key].folders_obj[action.folder_key].notes_key =
                action.new_notes_key;
            return state;
        }
        case 'delete_note': {
            state.repos_obj[action.repo_key].folders_obj[action.folder_key].notes_key =
                action.remaining_notes_key;
            state.repos_obj[action.repo_key].folders_obj[action.folder_key].notes_obj[
                action.note_key
            ] = {};
            return state;
        }
    }
});

const useWhalesnote = () => {
    const lastState = useRef<whalesnoteObjType>({
        repos_key: [],
        repos_obj: {},
    });
    const getState = useCallback(() => lastState.current, []);
    const [state, dispatch] = useReducer(
        (state: whalesnoteObjType, action: any) =>
            (lastState.current = whalesnoteReducer(state, action)),
        {
            repos_key: [],
            repos_obj: {},
        }
    );
    const renameSaveTimerObj = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const initwhalesnote = useCallback(
        (newWhalesnote: whalesnoteObjType) => dispatch({ type: 'init', new_state: newWhalesnote }),
        []
    );

    const fetchNotesInfoInFolder = useCallback(
        async (
            cur_data_path: string,
            repo_key: string | undefined,
            folder_key: string | undefined
        ) => {
            if (repo_key && folder_key) {
                if (!getState().repos_obj[repo_key].folders_obj[folder_key].notes_key) {
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
        []
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
                repo_name: repo_name,
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
        []
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
        []
    );

    const reorderRepo = useCallback(
        async (cur_data_path: string, repo_key: string, new_repos_key: string[]) => {
            if (repo_key) {
                const whalesnote_info = await window.electronAPI.readJsonSync({
                    file_path: `${cur_data_path}/whalesnote_info.json`,
                });
                whalesnote_info.repos_key = new_repos_key;
                await window.electronAPI.writeJson({
                    file_path: `${cur_data_path}/whalesnote_info.json`,
                    obj: whalesnote_info,
                });
                dispatch({
                    type: 'reorder_repo',
                    cur_data_path,
                    repo_key,
                    new_repos_key,
                });
            }
        },
        []
    );

    const deleteRepo = useCallback(async (cur_data_path: string, repo_key: string) => {
        let trash = await window.electronAPI.readJsonSync({
            file_path: `${cur_data_path}/trash.json`,
        });
        trash = trash ? trash : {};

        const repo_info = await window.electronAPI.readJsonSync({
            file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
        });
        for (const folder_key of repo_info.folders_key) {
            const folder_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
            });
            for (const note_key of folder_info.notes_key) {
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
        const remain_repos_key: string[] = [];
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
                remain_repos_key.push(key);
            }
        });
        whalesnote_info.repos_key = remain_repos_key;
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
            remain_repos_key,
        });

        return other_repo_key;
    }, []);

    const newFolder = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            new_folder_key: string,
            new_folder_name: string
        ) => {
            const repo_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
            });
            repo_info.folders_key.push(new_folder_key);
            repo_info.folders_obj[new_folder_key] = {
                folder_name: new_folder_name,
            };
            await window.electronAPI.writeJson({
                file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
                obj: repo_info,
            });

            const save_folder_info = {
                notes_key: [],
                notes_obj: {},
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
        []
    );

    const renameFolder = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            folder_key: string,
            new_folder_name: string
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
        []
    );

    const reorderFolder = useCallback(
        async (cur_data_path: string, repo_key: string, new_folders_key: string[]) => {
            if (repo_key) {
                const repo_info = await window.electronAPI.readJsonSync({
                    file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
                });
                repo_info.folders_key = new_folders_key;
                await window.electronAPI.writeJson({
                    file_path: `${cur_data_path}/${repo_key}/repo_info.json`,
                    obj: repo_info,
                });

                dispatch({
                    type: 'reorder_folder',
                    cur_data_path,
                    repo_key,
                    new_folders_key,
                });
            }
        },
        []
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

            for (const note_key of folder_info.notes_key) {
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

            const remaining_folders_key: string[] = [];
            let next_folder_key = undefined;

            repo_info.folders_key.forEach((key: string, index: number) => {
                if (key === folder_key) {
                    if (repo_info.folders_key.length > 1) {
                        if (index === repo_info.folders_key.length - 1) {
                            next_folder_key = repo_info.folders_key[index - 1];
                        } else {
                            next_folder_key = repo_info.folders_key[index + 1];
                        }
                    }
                } else {
                    remaining_folders_key.push(key);
                }
            });

            repo_info.folders_key = remaining_folders_key;
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
                remaining_folders_key,
            });

            return next_folder_key;
        },
        []
    );

    const newNote = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            folder_key: string,
            new_note_key: string,
            new_note_title: string
        ) => {
            const folder_info = await window.electronAPI.readJsonSync({
                file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
            });

            folder_info.notes_key.push(new_note_key);
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
        []
    );

    const renameSaveNow = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            folder_key: string,
            note_key: string,
            new_title: string
        ) => {
            const old_title =
                getState().repos_obj[repo_key].folders_obj[folder_key].notes_obj[note_key].title;
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
        []
    );

    const renameNote = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            folder_key: string,
            note_key: string,
            new_title: string
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
                            new_title
                        );
                        renameSaveTimerObj.current.delete(note_key);
                    }, 300)
                );
            }
        },
        []
    );

    const reorderNote = useCallback(
        async (
            cur_data_path: string,
            repo_key: string,
            folder_key: string,
            new_notes_key: string[]
        ) => {
            if (repo_key && folder_key) {
                const folder_info = await window.electronAPI.readJsonSync({
                    file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
                });
                folder_info.notes_key = new_notes_key;
                await window.electronAPI.writeJson({
                    file_path: `${cur_data_path}/${repo_key}/${folder_key}/folder_info.json`,
                    obj: folder_info,
                });

                dispatch({
                    type: 'reorder_note',
                    cur_data_path,
                    repo_key,
                    folder_key,
                    new_notes_key,
                });
            }
        },
        []
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

            const remaining_notes_key: string[] = [];
            let next_note_key = undefined;

            folder_info.notes_key.forEach((key: string, index: number) => {
                if (key === note_key) {
                    if (folder_info.notes_key.length > 1) {
                        if (index === folder_info.notes_key.length - 1) {
                            next_note_key = folder_info.notes_key[index - 1];
                        } else {
                            next_note_key = folder_info.notes_key[index + 1];
                        }
                    }
                } else {
                    remaining_notes_key.push(key);
                }
            });

            folder_info.notes_key = remaining_notes_key;
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
                remaining_notes_key,
            });

            return next_note_key;
        },
        []
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
