import { useReducer, useRef, useMemo, useCallback } from 'react';
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
    const lastState = useRef<historyTypes>({
        cur_repo_key: '',
        repos_record: {},
    });
    const getState = useCallback(() => lastState.current, []);
    const [state, dispatch] = useReducer(
        (state: historyTypes, action: any) => (lastState.current = historyReducer(state, action)),
        {
            cur_repo_key: '',
            repos_record: {},
        }
    );

    const historySaveTimerObj = useRef<NodeJS.Timeout>();

    const initHistory = useCallback((new_history: historyTypes) => {
        dispatch({ type: 'init', new_state: new_history });
    }, []);

    const saveTask = useCallback(async (curDataPath: string) => {
        await window.electronAPI.writeJson({
            file_path: `${curDataPath}/history_info.json`,
            obj: getState(),
        });
    }, []);

    const addSaveTask = (data_path: string, delay: number) => {
        if (historySaveTimerObj.current) {
            clearTimeout(historySaveTimerObj.current);
        }

        historySaveTimerObj.current = setTimeout(async () => {
            await saveTask(data_path);
            historySaveTimerObj.current = undefined;
        }, delay);
    };

    const repoSwitch = useCallback(async (curDataPath: string, repoKey: string | undefined) => {
        dispatch({
            type: 'switch_repo',
            data_path: curDataPath,
            repo_key: repoKey,
        });

        await addSaveTask(curDataPath, 1200);
    }, []);

    const folderSwitch = useCallback(
        async (curDataPath: string, repoKey: string | undefined, folderKey: string | undefined) => {
            dispatch({
                type: 'switch_folder',
                data_path: curDataPath,
                repo_key: repoKey,
                folder_key: folderKey,
            });

            await addSaveTask(curDataPath, 1200);
        },
        []
    );

    const noteSwitch = useCallback(
        async (
            curDataPath: string,
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

            await addSaveTask(curDataPath, 1200);
        },
        []
    );

    return [
        state,
        {
            initHistory,
            repoSwitch,
            folderSwitch,
            noteSwitch,
        },
    ] as const;
};

export default useHistory;
