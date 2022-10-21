const { ipcRenderer } = window.require('electron');
import { useReducer, useCallback } from 'react';
import produce from 'immer';
import { whalenoteTypes } from '../commonType';

const whalenoteReducer = produce((state: whalenoteTypes, action: any) => {
    switch (action.type) {
        case 'update_whalenote': {
            const whalenote_info = ipcRenderer.sendSync('readJson', {
                file_path: `${action.data_path}/whalenote_info.json`,
            });
            state = whalenote_info;
            return state;
        }
        case 'reorder_repo': {
            state.repos_key = action.new_repos_key;
            const whalenote_info = ipcRenderer.sendSync('readJson', {
                file_path: `${action.data_path}/whalenote_info.json`,
            });
            whalenote_info.repos_key = action.new_repos_key;
            ipcRenderer.sendSync('writeJson', {
                file_path: `${action.data_path}/whalenote_info.json`,
                obj: whalenote_info,
            });
            return state;
        }
        case 'init': {
            state = action.new_state;
            return state;
        }
    }
});

export const useWhalenote = () => {
    const [state, dispatch] = useReducer(whalenoteReducer, {
        id: '',
        repos_key: [],
    });

    const updateWhalenote = useCallback((data_path: string | null) => {
        dispatch({
            type: 'update_whalenote',
            data_path: data_path,
        });
    }, []);

    const reorderRepo = useCallback(
        (data_path: string, repo_key: string, new_repos_key: string[]) => {
            if (repo_key) {
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

    const initWhalenote = useCallback((new_whalenote: any) => {
        dispatch({ type: 'init', new_state: new_whalenote });
    }, []);

    return [
        state,
        {
            updateWhalenote,
            reorderRepo,
            initWhalenote,
        },
    ] as const;
};
