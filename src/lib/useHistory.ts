import { useReducer, useMemo, useCallback } from 'react';
import produce from 'immer';
import { historyTypes } from '../commonType';

const historyReducer = produce((state: historyTypes, action: any) => {
    switch (action.type) {
        case 'init': {
            state = action.new_state;
            return state;
        }
        case 'switch_repo': {
            if (action.repo_key) {
                state.cur_repo_key = action.repo_key;
            }
            return state;
        }
        case 'switch_folder': {
            if (action.repo_key) {
                if (!state.repos_record) {
                    state.repos_record = {};
                }
                if (!state.repos_record[action.repo_key]) {
                    state.repos_record[action.repo_key] = {
                        cur_folder_key: action.folder_key,
                        folders: {},
                    };
                } else {
                    state.repos_record[action.repo_key].cur_folder_key = action.folder_key;
                }
            }
            return state;
        }
        case 'switch_note': {
            if (action.repo_key && action.folder_key) {
                state.cur_repo_key = action.repo_key;
                if (!state.repos_record) {
                    state.repos_record = {};
                }
                if (!state.repos_record[action.repo_key]) {
                    state.repos_record[action.repo_key] = {
                        cur_folder_key: action.folder_key,
                        folders: {
                            [action.folder_key]: action.note_key,
                        },
                    };
                } else {
                    state.repos_record[action.repo_key].cur_folder_key = action.folder_key;
                    state.repos_record[action.repo_key].folders[action.folder_key] =
                        action.note_key;
                }
            }
            return state;
        }
    }
});

const useHistory = () => {
    const [state, dispatch] = useReducer(historyReducer, {
        cur_repo_key: '',
        repos_record: {},
    });

    const initHistory = useCallback((new_history: historyTypes) => {
        dispatch({ type: 'init', new_state: new_history });
    }, []);

    const switchRepo = useCallback(async (curDataPath: string, repoKey: string | undefined) => {
        dispatch({
            type: 'switch_repo',
            data_path: curDataPath,
            repo_key: repoKey,
        });

        if (curDataPath && repoKey) {
            const history = await window.electronAPI.readJson({
                file_path: `${curDataPath}/history_info.json`,
            });

            history.cur_repo_key = repoKey;

            await window.electronAPI.writeJson({
                file_path: `${curDataPath}/history_info.json`,
                obj: history,
            });
        }
    }, []);

    const switchFolder = useCallback(
        async (
            curDataPath: string | null,
            repoKey: string | undefined,
            folderKey: string | undefined
        ) => {
            if (curDataPath && repoKey) {
                dispatch({
                    type: 'switch_folder',
                    data_path: curDataPath,
                    repo_key: repoKey,
                    folder_key: folderKey,
                });

                const history = await window.electronAPI.readJson({
                    file_path: `${curDataPath}/history_info.json`,
                });

                if (!history.repos_record) {
                    history.repos_record = {};
                }
                if (!history.repos_record[repoKey]) {
                    history.repos_record[repoKey] = {
                        cur_folder_key: folderKey,
                        folders: {},
                    };
                } else {
                    history.repos_record[repoKey].cur_folder_key = folderKey;
                }

                await window.electronAPI.writeJson({
                    file_path: `${curDataPath}/history_info.json`,
                    obj: history,
                });
            }
        },
        []
    );

    const switchNote = useCallback(
        async (
            curDataPath: string | null,
            repoKey: string | undefined,
            folderKey: string | undefined,
            noteKey: string | undefined
        ) => {
            noteKey = noteKey ? noteKey : undefined;
            dispatch({
                type: 'switch_note',
                repo_key: repoKey,
                folder_key: folderKey,
                note_key: noteKey,
            });

            if (curDataPath && repoKey && folderKey && noteKey) {
                const history = await window.electronAPI.readJson({
                    file_path: `${curDataPath}/history_info.json`,
                });

                history.cur_repo_key = repoKey;
                if (!history.repos_record) {
                    history.repos_record = {};
                }
                if (!history.repos_record[repoKey]) {
                    history.repos_record[repoKey] = {
                        cur_folder_key: folderKey,
                        folders: {},
                    };
                } else {
                    history.repos_record[repoKey].cur_folder_key = folderKey;
                    history.repos_record[repoKey].folders[folderKey] = noteKey;
                }

                await window.electronAPI.writeJson({
                    file_path: `${curDataPath}/history_info.json`,
                    obj: history,
                });
            }
        },
        []
    );

    return [
        state,
        {
            initHistory,
            switchRepo,
            switchFolder,
            switchNote,
        },
    ] as const;
};

export default useHistory;
