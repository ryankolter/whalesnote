import produce from "immer";

import { useReducer, useCallback } from "react";

const editPosReducer = produce((state: editPosTypes, action: any) => {
  switch (action.type) {
    case "update": {
      state[action.repo_key] || (state[action.repo_key] = {});
      state[action.repo_key][action.folder_key] ||
        (state[action.repo_key][action.folder_key] = {});
      state[action.repo_key][action.folder_key][action.note_key] =
        action.edit_pos;
      console.log(action.edit_pos);
      return state;
    }
  }
});

export const useEditPos = () => {
  const [state, dispatch] = useReducer(editPosReducer, {});

  const updateEditPos = (
    repo_key: string,
    folder_key: string,
    note_key: string,
    edit_pos: { cursor_line: number; cursor_ch: number }
  ) => {
    if (repo_key && folder_key && note_key) {
      dispatch({
        type: "update",
        repo_key,
        folder_key,
        note_key,
        edit_pos,
      });
    }
  };

  return [state, { updateEditPos }] as const;
};

export type editPosTypes = {
  [key: string]: {
    [key: string]: {
      [key: string]: any;
    };
  };
};
