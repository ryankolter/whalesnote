import { useCallback, useReducer, useRef } from 'react';
import produce from 'immer';
import { reposObjTypes } from '../commonType';

const reposReducer = produce((state: any, action: any) => {
    switch (action.type) {
        case 'new_repo': {
            state.repos_key = [...state.repos_key, action.repo_key];
            state.repos_obj[action.repo_key] = {
                ...action.repo_info,
                folders_obj: {
                    [action.default_folder_key]: action.folder_info,
                },
            };
            return state;
        }

        case 'rename_repo': {
            state.repos_obj[action.repo_key].repo_name = action.new_repo_name;
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

        case 'delete_folder': {
            state.repos_obj[action.repo_key].folders_key = action.remain_folders_key;
            state.repos_obj[action.repo_key].folders_obj[action.folder_key] = {};
            return state;
        }

        // case 'fetch_folder': {
        //     if (!state[action.repo_key]) return state;

        //     const repo_info = window.electronAPI.readJson({
        //         file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
        //     });
        //     state[action.repo_key].folders_key = repo_info.folders_key;

        //     const folder_info = window.electronAPI.readJson({
        //         file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
        //     });

        //     if (folder_info) {
        //         state.repos_obj[action.repo_key].folders_obj[action.folder_key] = folder_info;
        //     } else {
        //         state.repos_obj[action.repo_key].folders_obj[action.folder_key] = {};
        //     }

        //     return state;
        // }
        // case 'fetch_note': {
        //     if (!state[action.repo_key]) return state;
        //     if (!state[action.repo_key].folders_obj[action.folder_key]) return state;

        //     const folder_info = window.electronAPI.readJson({
        //         file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
        //     });

        //     if (folder_info) {
        //         state[action.repo_key].folders_obj[action.folder_key] = folder_info;
        //     }

        //     return state;
        // }
        case 'init': {
            state = action.new_state;
            return state;
        }
        case 'rename': {
            state.repos_obj[action.repo_key].folders_obj[action.folder_key].notes_obj[
                action.note_key
            ].title = action.new_title;
            return state;
        }
        case 'reorder_repo': {
            state.repos_key = action.new_repos_key;
            return state;
        }
        case 'reorder_folder': {
            state[action.repo_key].folders_key = action.new_folders_key;
            const repo_info = window.electronAPI.readJson({
                file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
            });
            repo_info.folders_key = action.new_folders_key;
            window.electronAPI.writeJson({
                file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
                obj: repo_info,
            });
            return state;
        }
        case 'reorder_note': {
            state[action.repo_key].folders_obj[action.folder_key].notes_key = action.new_notes_key;
            const folder_info = window.electronAPI.readJson({
                file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
            });
            folder_info.notes_key = action.new_notes_key;
            window.electronAPI.writeJson({
                file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
                obj: folder_info,
            });
            return state;
        }
    }
});

export const useRepos = () => {
    const [state, dispatch] = useReducer(reposReducer, {});
    const renameSaveTimerObj = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const newRepo = useCallback(
        async (
            curDataPath: string,
            repo_key: string,
            repo_name: string,
            default_folder_key: string,
            default_note_key: string
        ) => {
            const whalenote_info = await window.electronAPI.readJson({
                file_path: `${curDataPath}/whalenote_info.json`,
            });
            whalenote_info.repos_key.push(repo_key);
            await window.electronAPI.writeJson({
                file_path: `${curDataPath}/whalenote_info.json`,
                obj: whalenote_info,
            });

            const repo_info = {
                repo_name: repo_name,
                folders_key: [default_folder_key],
            };
            await window.electronAPI.writeJson({
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
            await window.electronAPI.writeJson({
                file_path: `${curDataPath}/${repo_key}/${default_folder_key}/folder_info.json`,
                obj: folder_info,
            });

            dispatch({
                type: 'new_repo',
                repo_info,
                folder_info,
                repo_key,
                default_folder_key,
            });
        },
        []
    );

    const renameRepo = useCallback(
        async (curDataPath: string, repo_key: string, new_repo_name: string) => {
            const repo_info = await window.electronAPI.readJson({
                file_path: `${curDataPath}/${repo_key}/repo_info.json`,
            });
            repo_info.repo_name = new_repo_name;
            await window.electronAPI.writeJson({
                file_path: `${curDataPath}/${repo_key}/repo_info.json`,
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

    const deleteRepo = useCallback(async (curDataPath: string, repo_key: string) => {
        const repo_info = await window.electronAPI.readJson({
            file_path: `${curDataPath}/${repo_key}/repo_info.json`,
        });

        let trash = await window.electronAPI.readCson({
            file_path: `${curDataPath}/trash.cson`,
        });

        trash = trash ? trash : {};

        for (const folder_key of repo_info.folders_key) {
            const folder_info = await window.electronAPI.readJson({
                file_path: `${curDataPath}/${repo_key}/${folder_key}/folder_info.json`,
            });
            for (const note_key of folder_info.notes_key) {
                const note_info = await window.electronAPI.readCson({
                    file_path: `${curDataPath}/${repo_key}/${folder_key}/${note_key}.cson`,
                });

                trash[
                    `${repo_key}-${folder_key}-${note_key}-${folder_info.notes_obj[note_key]?.title}`
                ] = note_info.content;
            }
        }

        await window.electronAPI.writeCson({
            file_path: `${curDataPath}/trash.cson`,
            obj: trash,
        });

        const whalenote_info = await window.electronAPI.readJson({
            file_path: `${curDataPath}/whalenote_info.json`,
        });

        const remain_repos_key: string[] = [];
        let other_repo_key = undefined;

        whalenote_info.repos_key.forEach((key: string, index: number) => {
            if (key === repo_key) {
                if (whalenote_info.repos_key.length > 1) {
                    if (index === whalenote_info.repos_key.length - 1) {
                        other_repo_key = whalenote_info.repos_key[index - 1];
                    } else {
                        other_repo_key = whalenote_info.repos_key[index + 1];
                    }
                }
            } else {
                remain_repos_key.push(key);
            }
        });

        whalenote_info.repos_key = remain_repos_key;
        if (whalenote_info.repos[repo_key]) {
            delete whalenote_info.repos[repo_key];
        }

        await window.electronAPI.writeJson({
            file_path: `${curDataPath}/whalenote_info.json`,
            obj: whalenote_info,
        });

        await window.electronAPI.remove({
            file_path: `${curDataPath}/${repo_key}`,
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
            curDataPath: string,
            repo_key: string,
            new_folder_key: string,
            new_folder_name: string,
            new_note_key: string
        ) => {
            const repo_info = await window.electronAPI.readJson({
                file_path: `${curDataPath}/${repo_key}/repo_info.json`,
            });
            repo_info.folders_key.push(new_folder_key);
            await window.electronAPI.writeJson({
                file_path: `${curDataPath}/${repo_key}/repo_info.json`,
                obj: repo_info,
            });

            const folder_info = {
                folder_name: new_folder_name,
                notes_key: [new_note_key],
                notes_obj: {
                    [new_note_key]: {
                        title: '新建文档',
                    },
                },
            };

            await window.electronAPI.writeJson({
                file_path: `${curDataPath}/${repo_key}/${new_folder_key}/folder_info.json`,
                obj: folder_info,
            });

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
            curDataPath: string,
            repo_key: string,
            folder_key: string,
            new_folder_name: string
        ) => {
            const folder_info = await window.electronAPI.readJson({
                file_path: `${curDataPath}/${repo_key}/${folder_key}/folder_info.json`,
            });
            folder_info.folder_name = new_folder_name;
            await window.electronAPI.writeJson({
                file_path: `${curDataPath}/${repo_key}/${folder_key}/folder_info.json`,
                obj: folder_info,
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

    const deleteFolder = useCallback(
        async (curDataPath: string, repo_key: string, folder_key: string) => {
            const folder_info = await window.electronAPI.readJson({
                file_path: `${curDataPath}/${repo_key}/${folder_key}/folder_info.json`,
            });

            let trash = await window.electronAPI.readCson({
                file_path: `${curDataPath}/trash.cson`,
            });

            trash = trash ? trash : {};

            for (const note_key of folder_info.notes_key) {
                const note_info = await window.electronAPI.readCson({
                    file_path: `${curDataPath}/${repo_key}/${folder_key}/${note_key}.cson`,
                });
                trash[
                    `${repo_key}-${folder_key}-${note_key}-${folder_info.notes_obj[note_key].title}`
                ] = note_info.content;
            }

            await window.electronAPI.writeCson({
                file_path: `${curDataPath}/trash.cson`,
                obj: trash,
            });

            const repo_info = await window.electronAPI.readJson({
                file_path: `${curDataPath}/${repo_key}/repo_info.json`,
            });

            const remain_folders_key: string[] = [];
            let other_folder_key = undefined;

            repo_info.folders_key.forEach((key: string, index: number) => {
                if (key === repo_key) {
                    if (repo_info.folders_key.length > 1) {
                        if (index === repo_info.folders_key.length - 1) {
                            other_folder_key = repo_info.folders_key[index - 1];
                        } else {
                            other_folder_key = repo_info.folders_key[index + 1];
                        }
                    }
                } else {
                    remain_folders_key.push(key);
                }
            });

            repo_info.folders_key = remain_folders_key;

            await window.electronAPI.writeJson({
                file_path: `${curDataPath}/${repo_key}/repo_info.json`,
                obj: repo_info,
            });

            await window.electronAPI.remove({
                file_path: `${curDataPath}/${repo_key}/${folder_key}`,
            });

            dispatch({
                type: 'delete_folder',
                repo_key,
                folder_key,
                remain_folders_key,
            });

            return other_folder_key;
        },
        []
    );

    const initRepos = useCallback(
        (newRepo: reposObjTypes) => dispatch({ type: 'init', new_state: newRepo }),
        []
    );

    const renameSaveNow = useCallback(
        async (
            data_path: string,
            repo_key: string,
            folder_key: string,
            note_key: string,
            new_title: string
        ) => {
            const old_title =
                state.repos_obj[repo_key].folders_obj[folder_key].notes_obj[note_key].title;
            if (old_title !== new_title) {
                const folder_info = await window.electronAPI.readJson({
                    file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
                });
                folder_info.notes_obj[note_key].title = new_title;
                await window.electronAPI.writeJson({
                    file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
                    obj: folder_info,
                });

                dispatch({
                    type: 'rename',
                    data_path,
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
        (
            data_path: string,
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
                        await renameSaveNow(data_path, repo_key, folder_key, note_key, new_title);
                        renameSaveTimerObj.current.delete(note_key);
                    }, 500)
                );
            }
        },
        []
    );

    const reorderRepo = useCallback(
        async (data_path: string, repo_key: string, new_repos_key: string[]) => {
            if (repo_key) {
                const whalenote_info = await window.electronAPI.readJson({
                    file_path: `${data_path}/whalenote_info.json`,
                });
                whalenote_info.repos_key = new_repos_key;
                await window.electronAPI.writeJson({
                    file_path: `${data_path}/whalenote_info.json`,
                    obj: whalenote_info,
                });
                dispatch({
                    type: 'reorder_repo',
                    data_path,
                    repo_key,
                    new_repos_key,
                });
            }
        },
        []
    );

    const reorderFolder = useCallback(
        (data_path: string, repo_key: string, new_folders_key: string[]) => {
            if (repo_key) {
                dispatch({
                    type: 'reorder_folder',
                    data_path,
                    repo_key,
                    new_folders_key,
                });
            }
        },
        []
    );

    const reorderNote = useCallback(
        (data_path: string, repo_key: string, folder_key: string, new_notes_key: string[]) => {
            if (repo_key && folder_key) {
                dispatch({
                    type: 'reorder_note',
                    data_path,
                    repo_key,
                    folder_key,
                    new_notes_key,
                });
            }
        },
        []
    );

    return [
        state,
        {
            newRepo,
            renameRepo,
            deleteRepo,
            newFolder,
            renameFolder,
            deleteFolder,
            initRepos,
            renameNote,
            reorderRepo,
            reorderFolder,
            reorderNote,
        },
    ] as const;
};
