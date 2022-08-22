import produce from "immer";

import { useReducer } from "react";

const editLineReducer = produce((state: editLinesTypes, action: any) => {
    switch (action.type) {
        case "update": {
            state[action.repo_key] || (state[action.repo_key] = {});
            state[action.repo_key][action.folder_key] ||
                (state[action.repo_key][action.folder_key] = {});
            state[action.repo_key][action.folder_key][action.note_key] = action.from_pos;
            console.log(action.from_pos);
            return state;
        }
    }
});

export const useEditLine = () => {
    const [state, dispatch] = useReducer(editLineReducer, {});

    const updateFromPos = (
        repo_key: string,
        folder_key: string,
        note_key: string,
        from_pos: number
    ) => {
        if (repo_key && folder_key && note_key) {
            dispatch({
                type: "update",
                repo_key,
                folder_key,
                note_key,
                from_pos,
            });
        }
    };

    return [state, { updateFromPos }] as const;
};

export type editLinesTypes = {
    [key: string]: {
        [key: string]: {
            [key: string]: any;
        };
    };
};
