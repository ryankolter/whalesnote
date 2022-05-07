import produce from "immer";
import { useReducer, useCallback } from "react";
const { ipcRenderer } = window.require("electron");

const reposReducer = produce((state: object, action: any) => {
  switch (action.type) {
    case "fetchRepo": {
      let repo_info = ipcRenderer.sendSync("readJson", {
        file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
      });
      if (!state[action.repo_key]) {
        state[action.repo_key] = {
          ...repo_info,
          folders_obj: {},
        };
      } else {
        state[action.repo_key] = {
          ...repo_info,
          folders_obj: state[action.repo_key].folders_obj
            ? state[action.repo_key].folders_obj
            : {},
        };
      }

      return state;
    }
    case "fetchFolder": {
      if (!state[action.repo_key]) return state;

      let repo_info = ipcRenderer.sendSync("readJson", {
        file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
      });
      state[action.repo_key].folders_key = repo_info.folders_key;

      let folder_info = ipcRenderer.sendSync("readJson", {
        file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
      });

      if (folder_info) {
        state[action.repo_key].folders_obj[action.folder_key] = folder_info;
      } else {
        state[action.repo_key].folders_obj[action.folder_key] = {};
      }

      return state;
    }
    case "fetchNote": {
      if (!state[action.repo_key]) return state;
      if (!state[action.repo_key].folders_obj[action.folder_key]) return state;

      let folder_info = ipcRenderer.sendSync("readJson", {
        file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
      });

      if (folder_info) {
        state[action.repo_key].folders_obj[action.folder_key] = folder_info;
      }

      return state;
    }
    case "init": {
      state = action.new_state;
      return state;
    }
    case "rename": {
      let old_title =
        state[action.repo_key].folders_obj[action.folder_key].notes_obj[
          action.note_key
        ].title;
      if (old_title !== action.new_title) {
        state[action.repo_key].folders_obj[action.folder_key].notes_obj[
          action.note_key
        ].title = action.new_title;
        let folder_info = ipcRenderer.sendSync("readJson", {
          file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
        });
        folder_info.notes_obj[action.note_key].title = action.new_title;
        ipcRenderer.sendSync("writeJson", {
          file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
          obj: folder_info,
        });
      }

      return state;
    }
    case "reorderFolder": {
      state[action.repo_key].folders_key = action.new_folders_key;
      let repo_info = ipcRenderer.sendSync("readJson", {
        file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
      });
      repo_info.folders_key = action.new_folders_key;
      ipcRenderer.sendSync("writeJson", {
        file_path: `${action.data_path}/${action.repo_key}/repo_info.json`,
        obj: repo_info,
      });
      return state;
    }
    case "reorderNote": {
      state[action.repo_key].folders_obj[action.folder_key].notes_key =
        action.new_notes_key;
      let folder_info = ipcRenderer.sendSync("readJson", {
        file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
      });
      folder_info.notes_key = action.new_notes_key;
      ipcRenderer.sendSync("writeJson", {
        file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
        obj: folder_info,
      });
      return state;
    }
  }
});

export const useRepos = () => {
  const [state, dispatch] = useReducer(reposReducer, {});
  let renameSaveTimer: NodeJS.Timeout | null = null;

  const updateRepos = useCallback((action_name, obj) => {
    switch (action_name) {
      case "repo": {
        let { data_path, repo_key } = obj;
        dispatch({
          type: "fetchRepo",
          data_path,
          repo_key,
        });
        break;
      }
      case "folder": {
        let { data_path, repo_key, folder_key } = obj;
        dispatch({
          type: "fetchFolder",
          data_path,
          repo_key,
          folder_key,
        });
        break;
      }
      case "note": {
        let { data_path, repo_key, folder_key } = obj;
        dispatch({
          type: "fetchNote",
          data_path,
          repo_key,
          folder_key,
        });
        break;
      }
    }
  }, []);

  // const updateRepos = useCallback((action_name, obj) => {
  //     switch(action_name) {
  //         case 'delete_repo':
  //             {
  //                 let {data_path, repo_key} = obj;
  //                 dispatch({
  //                     type: "fetchRepo",
  //                     data_path,
  //                     repo_key
  //                 })
  //                 break;
  //             }
  //         case 'delete_folder':
  //             {
  //                 let {data_path, repo_key, folder_key} = obj;
  //                 dispatch({
  //                     type: "fetchFolder",
  //                     data_path,
  //                     repo_key,
  //                     folder_key
  //                 })
  //                 break;
  //             }
  //         case 'delete_note':
  //             {
  //                 let {data_path, repo_key, folder_key} = obj;
  //                 dispatch({
  //                     type: "fetchNote",
  //                     data_path,
  //                     repo_key,
  //                     folder_key
  //                 })
  //                 break;
  //             }
  //     }
  // },[])

  const initRepo = useCallback(
    (newRepo) => dispatch({ type: "init", new_state: newRepo }),
    []
  );

  const renameSaveNow = useCallback(
    (
      data_path: string,
      repo_key: string,
      folder_key: string,
      note_key: string,
      new_title: string
    ) => {
      dispatch({
        type: "rename",
        data_path,
        repo_key,
        folder_key,
        note_key,
        new_title,
      });
    },
    []
  );

  const renameNote = (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string,
    new_title: string
  ) => {
    if (repo_key && folder_key && note_key) {
      if (renameSaveTimer) {
        clearTimeout(renameSaveTimer);
      }

      renameSaveTimer = setTimeout(() => {
        renameSaveNow(data_path, repo_key, folder_key, note_key, new_title);
      }, 500);
    }
  };

  const reorderFolder = (
    data_path: string,
    repo_key: string,
    new_folders_key: string[]
  ) => {
    if (repo_key) {
      dispatch({
        type: "reorderFolder",
        data_path,
        repo_key,
        new_folders_key,
      });
    }
  };

  const reorderNote = (
    data_path: string,
    repo_key: string,
    folder_key: string,
    new_notes_key: string[]
  ) => {
    if (repo_key && folder_key) {
      dispatch({
        type: "reorderNote",
        data_path,
        repo_key,
        folder_key,
        new_notes_key,
      });
    }
  };

  return [
    state,
    { updateRepos, initRepo, renameNote, reorderFolder, reorderNote },
  ] as const;
};
