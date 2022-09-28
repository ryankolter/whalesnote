const { ipcRenderer } = window.require('electron');
import { useCallback, useReducer, useRef } from 'react';
import produce from 'immer';

const reposReducer = produce((state: object, action: any) => {
    switch (action.type) {
        case 'fetchRepo': {
            const repo_info = ipcRenderer.sendSync('readJson', {
                file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
            });
            if (!state[action.repo_key]) {
                state[action.repo_key] = {
                    ...repo_info,
                    folders_obj: {},
                };
            } else {
                state[action.repo_key] = {
                    ...repo_info,
                    folders_obj: state[action.repo_key].folders_obj
                        ? state[action.repo_key].folders_obj
                        : {},
                };
            }

            return state;
        }
        case 'fetchFolder': {
            if (!state[action.repo_key]) return state;

            console.log(action.repo_key);
            console.log(action.data_path);

            const repo_info = ipcRenderer.sendSync('readJson', {
                file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
            });
            console.log(repo_info);
            state[action.repo_key].folders_key = repo_info.folders_key;

            const folder_info = ipcRenderer.sendSync('readJson', {
                file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
            });

            if (folder_info) {
                state[action.repo_key].folders_obj[action.folder_key] = folder_info;
            } else {
                state[action.repo_key].folders_obj[action.folder_key] = {};
            }

            return state;
        }
        case 'fetchNote': {
            if (!state[action.repo_key]) return state;
            if (!state[action.repo_key].folders_obj[action.folder_key]) return state;

            const folder_info = ipcRenderer.sendSync('readJson', {
                file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
            });

            if (folder_info) {
                state[action.repo_key].folders_obj[action.folder_key] = folder_info;
            }

            return state;
        }
        case 'init': {
            state = action.new_state;
            return state;
        }
        case 'rename': {
            const old_title =
                state[action.repo_key].folders_obj[action.folder_key].notes_obj[action.note_key]
                    .title;
            if (old_title !== action.new_title) {
                state[action.repo_key].folders_obj[action.folder_key].notes_obj[
                    action.note_key
                ].title = action.new_title;
                const folder_info = ipcRenderer.sendSync('readJson', {
                    file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
                });
                folder_info.notes_obj[action.note_key].title = action.new_title;
                ipcRenderer.sendSync('writeJson', {
                    file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
                    obj: folder_info,
                });
            }

            return state;
        }
        case 'reorderFolder': {
            state[action.repo_key].folders_key = action.new_folders_key;
            const repo_info = ipcRenderer.sendSync('readJson', {
                file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
            });
            repo_info.folders_key = action.new_folders_key;
            ipcRenderer.sendSync('writeJson', {
                file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
                obj: repo_info,
            });
            return state;
        }
        case 'reorderNote': {
            state[action.repo_key].folders_obj[action.folder_key].notes_key = action.new_notes_key;
            const folder_info = ipcRenderer.sendSync('readJson', {
                file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
            });
            folder_info.notes_key = action.new_notes_key;
            ipcRenderer.sendSync('writeJson', {
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

    const updateRepos = useCallback((action_name: string, obj: any) => {
        switch (action_name) {
            case 'repo': {
                const { data_path, repo_key } = obj;
                dispatch({
                    type: 'fetchRepo',
                    data_path,
                    repo_key,
                });
                break;
            }
            case 'folder': {
                const { data_path, repo_key, folder_key } = obj;
                dispatch({
                    type: 'fetchFolder',
                    data_path,
                    repo_key,
                    folder_key,
                });
                break;
            }
            case 'note': {
                const { data_path, repo_key, folder_key } = obj;
                dispatch({
                    type: 'fetchNote',
                    data_path,
                    repo_key,
                    folder_key,
                });
                break;
            }
        }
    }, []);

    const initRepo = useCallback(
        (newRepo: any) => dispatch({ type: 'init', new_state: newRepo }),
        []
    );

    const renameSaveNow = useCallback(
        (
            data_path: string,
            repo_key: string,
            folder_key: string,
            note_key: string,
            new_title: string
        ) => {
            dispatch({
                type: 'rename',
                data_path,
                repo_key,
                folder_key,
                note_key,
                new_title,
            });
        },
        []
    );

    const renameNote = (
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
                setTimeout(() => {
                    renameSaveNow(data_path, repo_key, folder_key, note_key, new_title);
                    renameSaveTimerObj.current.delete(note_key);
                }, 500)
            );
        }
    };

    const reorderFolder = (data_path: string, repo_key: string, new_folders_key: string[]) => {
        if (repo_key) {
            dispatch({
                type: 'reorderFolder',
                data_path,
                repo_key,
                new_folders_key,
            });
        }
    };

    const reorderNote = (
        data_path: string,
        repo_key: string,
        folder_key: string,
        new_notes_key: string[]
    ) => {
        if (repo_key && folder_key) {
            dispatch({
                type: 'reorderNote',
                data_path,
                repo_key,
                folder_key,
                new_notes_key,
            });
        }
    };

    return [state, { updateRepos, initRepo, renameNote, reorderFolder, reorderNote }] as const;
};
