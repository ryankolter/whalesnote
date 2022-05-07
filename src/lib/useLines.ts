import produce from "immer";

import { useReducer, useCallback } from "react";

const linesReducer = produce((state: linesTypes, action: any) => {
  switch (action.type) {
    case "update": {
      state[action.repo_key] || (state[action.repo_key] = {});
      state[action.repo_key][action.folder_key] ||
        (state[action.repo_key][action.folder_key] = {});
      state[action.repo_key][action.folder_key][action.note_key] = action.line;
      console.log(action.line);
      return state;
    }
  }
});

export const useLines = () => {
  const [state, dispatch] = useReducer(linesReducer, {});

  const updateLine = (
    repo_key: string,
    folder_key: string,
    note_key: string,
    line: number
  ) => {
    if (repo_key && folder_key && note_key) {
      dispatch({
        type: "update",
        repo_key,
        folder_key,
        note_key,
        line,
      });
    }
  };

  return [state, { updateLine }] as const;
};

export type linesTypes = {
  [key: string]: {
    [key: string]: {
      [key: string]: number;
    };
  };
};
