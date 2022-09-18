import produce from 'immer';

import { useReducer } from 'react';

const recordValueReducer = produce((state: renderTopTypes, action: any) => {
    switch (action.type) {
        case 'update': {
            state[action.repo_key] || (state[action.repo_key] = {});
            state[action.repo_key][action.folder_key] ||
                (state[action.repo_key][action.folder_key] = {});
            state[action.repo_key][action.folder_key][action.note_key] = action.render_top;
            return state;
        }
    }
});

export const useRecordValue = () => {
    const [state, dispatch] = useReducer(recordValueReducer, {});

    const updateRecordValue = (
        repo_key: string,
        folder_key: string,
        note_key: string,
        render_top: number
    ) => {
        if (repo_key && folder_key && note_key) {
            dispatch({
                type: 'update',
                repo_key,
                folder_key,
                note_key,
                render_top,
            });
        }
    };

    return [state, { updateRecordValue }] as const;
};

export type renderTopTypes = {
    [key: string]: {
        [key: string]: {
            [key: string]: any;
        };
    };
};
