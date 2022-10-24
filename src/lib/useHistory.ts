const { ipcRenderer } = window.require('electron');
import { useReducer, useMemo, useCallback } from 'react';
import produce from 'immer';
import { historyTypes } from '../commonType';

const historyReducer = produce((state: historyTypes, action: any) => {
    switch (action.type) {
        case 'switch_repo': {
            const history = action.data_path
                ? ipcRenderer.sendSync('readJson', {
                      file_path: `${action.data_path}/history_info.json`,
                  })
                : state;
            history.cur_repo_key = action.repo_key;
            !history.repos && (history.repos = {});
            !history.repos[action.repo_key] &&
                (history.repos[action.repo_key] = {
                    cur_folder_key: '',
                    folders: {},
                });

            const result = action.data_path
                ? ipcRenderer.sendSync('writeJson', {
                      file_path: `${action.data_path}/history_info.json`,
                      obj: history,
                  })
                : true;

            if (result) {
                state = history;
            }

            return state;
        }
        case 'switch_folder': {
            const history = action.data_path
                ? ipcRenderer.sendSync('readJson', {
                      file_path: `${action.data_path}/history_info.json`,
                  })
                : state;

            const cur_repo_key = action.repo_key ? action.repo_key : history.cur_repo_key;
            !history.repos && (history.repos = {});
            !history.repos[cur_repo_key] &&
                (history.repos[cur_repo_key] = {
                    cur_folder_key: '',
                    folders: {},
                });
            history.repos[cur_repo_key].cur_folder_key = action.folder_key;

            const result = action.data_path
                ? ipcRenderer.sendSync('writeJson', {
                      file_path: `${action.data_path}/history_info.json`,
                      obj: history,
                  })
                : true;

            if (result) {
                state = history;
            }

            return state;
        }
        case 'switch_note': {
            const history = action.data_path
                ? ipcRenderer.sendSync('readJson', {
                      file_path: `${action.data_path}/history_info.json`,
                  })
                : state;

            const cur_repo_key = action.repo_key ? action.repo_key : history.cur_repo_key;
            !history.repos && (history.repos = {});
            !history.repos[cur_repo_key] &&
                (history.repos[cur_repo_key] = {
                    cur_folder_key: action.folder_key,
                    folders: {},
                });

            const cur_folder_key = action.folder_key
                ? action.folder_key
                : history.repos[cur_repo_key].cur_folder_key;
            history.repos[cur_repo_key].folders[cur_folder_key] = action.note_key;

            const result = action.data_path
                ? ipcRenderer.sendSync('writeJson', {
                      file_path: `${action.data_path}/history_info.json`,
                      obj: history,
                  })
                : true;

            if (result) {
                state = history;
            }

            return state;
        }
        case 'init': {
            state = action.new_state;
            return state;
        }
    }
});

export const useHistory = () => {
    const [state, dispatch] = useReducer(historyReducer, {
        cur_repo_key: '',
        repos: {},
    });

    const switchRepo = useCallback((curDataPath: string, repoKey: string | undefined) => {
        repoKey = repoKey ? repoKey : undefined;
        dispatch({
            type: 'switch_repo',
            data_path: curDataPath,
            repo_key: repoKey,
        });
    }, []);

    const switchFolder = useCallback(
        (curDataPath: string | null, folderKey: string | undefined) => {
            folderKey = folderKey ? folderKey : undefined;
            dispatch({
                type: 'switch_folder',
                data_path: curDataPath,
                folder_key: folderKey,
            });
        },
        []
    );

    const switchNote = useCallback((curDataPath: string | null, noteKey: string | undefined) => {
        noteKey = noteKey ? noteKey : undefined;
        dispatch({
            type: 'switch_note',
            data_path: curDataPath,
            note_key: noteKey,
        });
    }, []);

    const currentRepoKey = useMemo(() => {
        const cur_repo_key = state.cur_repo_key;
        console.log('cur_repo_key: ' + cur_repo_key);
        return cur_repo_key;
    }, [state]);

    const currentFolderKey = useMemo(() => {
        const cur_folder_key = state.repos[state.cur_repo_key]?.cur_folder_key;
        console.log('cur_folder_key: ' + cur_folder_key);
        return cur_folder_key;
    }, [state]);

    const currentNoteKey = useMemo(() => {
        const cur_folder_key = state.repos[state.cur_repo_key]?.cur_folder_key;
        const cur_note_key = state.repos[state.cur_repo_key]?.folders[cur_folder_key];
        console.log('cur_note_key: ' + cur_note_key);
        return cur_note_key;
    }, [state]);

    const initHistory = useCallback((new_history: any) => {
        dispatch({ type: 'init', new_state: new_history });
    }, []);

    return [
        state,
        {
            switchRepo,
            switchFolder,
            switchNote,
            currentRepoKey,
            currentFolderKey,
            currentNoteKey,
            initHistory,
        },
    ] as const;
};
