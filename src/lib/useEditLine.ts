import produce from "immer";

import { useReducer, useCallback } from "react";

const editLineReducer = produce((state: editLinesTypes, action: any) => {
  switch (action.type) {
    case "update": {
      state[action.repo_key] || (state[action.repo_key] = {});
      state[action.repo_key][action.folder_key] ||
        (state[action.repo_key][action.folder_key] = {});
      state[action.repo_key][action.folder_key][action.note_key] =
        action.edit_line;
      console.log(action.edit_line);
      return state;
    }
  }
});

export const useEditLine = () => {
  const [state, dispatch] = useReducer(editLineReducer, {});

  const updateEditLine = (
    repo_key: string,
    folder_key: string,
    note_key: string,
    edit_line: number
  ) => {
    if (repo_key && folder_key && note_key) {
      dispatch({
        type: "update",
        repo_key,
        folder_key,
        note_key,
        edit_line,
      });
    }
  };

  return [state, { updateEditLine }] as const;
};

export type editLinesTypes = {
  [key: string]: {
    [key: string]: {
      [key: string]: any;
    };
  };
};
