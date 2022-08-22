import produce from "immer";

import { useReducer } from "react";

const editPosReducer = produce((state: cursorHeadTypes, action: any) => {
  switch (action.type) {
    case "update": {
      state[action.repo_key] || (state[action.repo_key] = {});
      state[action.repo_key][action.folder_key] ||
        (state[action.repo_key][action.folder_key] = {});
      state[action.repo_key][action.folder_key][action.note_key] =
        action.cursor_head;
      return state;
    }
  }
});

export const useEditPos = () => {
  const [state, dispatch] = useReducer(editPosReducer, {});

  const updateCursorHead = (
    repo_key: string,
    folder_key: string,
    note_key: string,
    cursor_head: number
  ) => {
    if (repo_key && folder_key && note_key) {
      dispatch({
        type: "update",
        repo_key,
        folder_key,
        note_key,
        cursor_head,
      });
    }
  };

  return [state, { updateCursorHead }] as const;
};

export type cursorHeadTypes = {
  [key: string]: {
    [key: string]: {
      [key: string]: any;
    };
  };
};
