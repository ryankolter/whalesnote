import produce from 'immer';
import { dxnoteTypes } from '../commonType';
import { useReducer, useMemo, useCallback } from 'react';
const { ipcRenderer } = window.require('electron');

const dxnoteReducer = produce((state: dxnoteTypes, action: any) => {
    switch (action.type) {
        case 'switch_repo': {
            const dxnote_info = action.data_path
                ? ipcRenderer.sendSync('readJson', {
                      file_path: `${action.data_path}/dxnote_info.json`,
                  })
                : state;
            dxnote_info.cur_repo_key = action.repo_key;
            !dxnote_info.repos && (dxnote_info.repos = {});
            !dxnote_info.repos[action.repo_key] &&
                (dxnote_info.repos[action.repo_key] = {
                    cur_folder_key: '',
                    folders: {},
                });

            const result = action.data_path
                ? ipcRenderer.sendSync('writeJson', {
                      file_path: `${action.data_path}/dxnote_info.json`,
                      obj: dxnote_info,
                  })
                : true;

            if (result) {
                state = dxnote_info;
            }

            return state;
        }
        case 'switch_folder': {
            const dxnote_info = action.data_path
                ? ipcRenderer.sendSync('readJson', {
                      file_path: `${action.data_path}/dxnote_info.json`,
                  })
                : state;

            const cur_repo_key = action.repo_key ? action.repo_key : dxnote_info.cur_repo_key;
            !dxnote_info.repos && (dxnote_info.repos = {});
            !dxnote_info.repos[cur_repo_key] &&
                (dxnote_info.repos[cur_repo_key] = {
                    cur_folder_key: '',
                    folders: {},
                });
            dxnote_info.repos[cur_repo_key].cur_folder_key = action.folder_key;

            const result = action.data_path
                ? ipcRenderer.sendSync('writeJson', {
                      file_path: `${action.data_path}/dxnote_info.json`,
                      obj: dxnote_info,
                  })
                : true;

            if (result) {
                state = dxnote_info;
            }

            return state;
        }
        case 'switch_note': {
            const dxnote_info = action.data_path
                ? ipcRenderer.sendSync('readJson', {
                      file_path: `${action.data_path}/dxnote_info.json`,
                  })
                : state;

            const cur_repo_key = action.repo_key ? action.repo_key : dxnote_info.cur_repo_key;
            !dxnote_info.repos && (dxnote_info.repos = {});
            !dxnote_info.repos[cur_repo_key] &&
                (dxnote_info.repos[cur_repo_key] = {
                    cur_folder_key: action.folder_key,
                    folders: {},
                });

            const cur_folder_key = action.folder_key
                ? action.folder_key
                : dxnote_info.repos[cur_repo_key].cur_folder_key;
            dxnote_info.repos[cur_repo_key].folders[cur_folder_key] = action.note_key;

            const result = action.data_path
                ? ipcRenderer.sendSync('writeJson', {
                      file_path: `${action.data_path}/dxnote_info.json`,
                      obj: dxnote_info,
                  })
                : true;

            if (result) {
                state = dxnote_info;
            }

            return state;
        }
        case 'updateDxnote': {
            const dxnote_info = ipcRenderer.sendSync('readJson', {
                file_path: `${action.data_path}/dxnote_info.json`,
            });
            state = dxnote_info;
            return state;
        }
        case 'reorderRepo': {
            state.repos_key = action.new_repos_key;
            const repo_info = ipcRenderer.sendSync('readJson', {
                file_path: `${action.data_path}/dxnote_info.json`,
            });
            repo_info.repos_key = action.new_repos_key;
            ipcRenderer.sendSync('writeJson', {
                file_path: `${action.data_path}/dxnote_info.json`,
                obj: repo_info,
            });
            return state;
        }
        case 'init': {
            state = action.new_state;
            return state;
        }
    }
});

export const useDxnote = () => {
    const [state, dispatch] = useReducer(dxnoteReducer, {
        id: '',
        repos_key: [],
        cur_repo_key: '',
        repos: {},
    });

    const switchRepo = useCallback((dataPath: string, repoKey: string | undefined) => {
        repoKey = repoKey ? repoKey : undefined;
        dispatch({
            type: 'switch_repo',
            data_path: dataPath,
            repo_key: repoKey,
        });
    }, []);

    const switchFolder = useCallback((dataPath: string | null, folderKey: string | undefined) => {
        folderKey = folderKey ? folderKey : undefined;
        dispatch({
            type: 'switch_folder',
            data_path: dataPath,
            folder_key: folderKey,
        });
    }, []);

    const switchNote = useCallback((dataPath: string | null, noteKey: string | undefined) => {
        noteKey = noteKey ? noteKey : undefined;
        dispatch({
            type: 'switch_note',
            data_path: dataPath,
            note_key: noteKey,
        });
    }, []);

    const updateDxnote = useCallback((data_path: string | null) => {
        dispatch({
            type: 'updateDxnote',
            data_path: data_path,
        });
    }, []);

    // const currentRepoKey = state.cur_repo_key;
    // const currentFolderKey = state.repos[state.cur_repo_key]?.cur_folder_key;
    // const currentNoteKey = state.repos[state.cur_repo_key]?.folders?.cur_folder_key;

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

    const reorderRepo = (data_path: string, repo_key: string, new_repos_key: string[]) => {
        if (repo_key) {
            dispatch({
                type: 'reorderRepo',
                data_path,
                repo_key,
                new_repos_key,
            });
        }
    };

    const initDxnote = useCallback((new_dxnote: any) => {
        dispatch({ type: 'init', new_state: new_dxnote });
    }, []);

    return [
        state,
        {
            switchRepo,
            switchFolder,
            switchNote,
            updateDxnote,
            currentRepoKey,
            currentFolderKey,
            currentNoteKey,
            reorderRepo,
            initDxnote,
        },
    ] as const;
};
