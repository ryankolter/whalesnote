import { useReducer, useCallback } from 'react';
import produce from 'immer';
import { whalenoteTypes } from '../commonType';

const whalenoteReducer = produce((state: whalenoteTypes, action: any) => {
    switch (action.type) {
        case 'init': {
            state = action.new_state;
            return state;
        }
    }
});

export const useWhalenote = () => {
    const [state, dispatch] = useReducer(whalenoteReducer, {
        id: '',
    });

    const updateWhalenote = useCallback(async (curDataPath: string | null) => {
        const whalenote_info = await window.electronAPI.readJson({
            file_path: `${curDataPath}/whalenote_info.json`,
        });

        dispatch({
            type: 'init',
            new_state: whalenote_info.id,
        });
    }, []);

    const initWhalenote = useCallback((new_whalenote: whalenoteTypes) => {
        dispatch({ type: 'init', new_state: new_whalenote.id });
    }, []);

    return [
        state,
        {
            initWhalenote,
            updateWhalenote,
        },
    ] as const;
};
