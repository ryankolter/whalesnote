import produce from "immer";

import { useReducer, useCallback } from "react";
const { ipcRenderer } = window.require("electron");

const notesReducer = produce((state: notesTypes, action: any) => {
  switch (action.type) {
    case "fetchNotesInOneRepo": {
      if (!state[action.repo_key]) {
        state[action.repo_key] = {};
        let folders_key = action.repos[action.repo_key].folders_key;
        folders_key.forEach((folder_key: string) => {
          let folder_info = ipcRenderer.sendSync("readJson", {
            file_path: `${action.data_path}/${action.repo_key}/${folder_key}/folder_info.json`,
          });
          if (folder_info && folder_info.notes_obj) {
            state[action.repo_key][folder_key] = {};
            Object.keys(folder_info.notes_obj).forEach((note_key) => {
              let note_info = ipcRenderer.sendSync("readCson", {
                file_path: `${action.data_path}/${action.repo_key}/${folder_key}/${note_key}.cson`,
              });
              if (note_info) {
                state[action.repo_key][folder_key][note_key] =
                  note_info.content;
              }
            });
          }
        });
      }
      return state;
    }
    case "fetchNotesInOneFolder": {
      // if(!state[action.repo_key]){
      //     state[action.repo_key] = {}
      //     let folders_key = action.repos[action.repo_key].folders_key;
      //     folders_key.forEach((folder_key: string) => {
      //         let folder_info = ipcRenderer.sendSync('readJson', {
      //             file_path: `${action.data_path}/${action.repo_key}/${folder_key}/folder_info.json`,
      //         })
      //         if(folder_info && folder_info.notes_obj){
      //             state[action.repo_key][folder_key] = {}
      //             Object.keys(folder_info.notes_obj).forEach((note_key) => {
      //                 let note_info = ipcRenderer.sendSync('readCson', {
      //                     file_path: `${action.data_path}/${action.repo_key}/${folder_key}/${note_key}.cson`,
      //                 })
      //                 if(note_info){
      //                     state[action.repo_key][folder_key][note_key] = note_info.content
      //                 }
      //             })
      //         }
      //     })
      // }
      return state;
    }
    case "addRepo": {
      !state[action.repo_key] && (state[action.repo_key] = {});
      return state;
    }
    case "addFolder": {
      !state[action.repo_key][action.folder_key] &&
        (state[action.repo_key][action.folder_key] = {});
      return state;
    }
    case "addNote": {
      let note_info = ipcRenderer.sendSync("readCson", {
        file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/${action.note_key}.cson`,
      });
      state[action.repo_key][action.folder_key][action.note_key] =
        note_info.content;
      return state;
    }
    case "init": {
      state = action.new_state;
      return state;
    }
    case "update": {
      state[action.repo_key][action.folder_key][action.note_key] =
        action.note_content;
      return state;
    }
    case "save": {
      let note_info = ipcRenderer.sendSync("readCson", {
        file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/${action.note_key}.cson`,
      });

      if (note_info) {
        note_info.content =
          state[action.repo_key][action.folder_key][action.note_key];
        note_info.updatedAt = new Date();
      }

      ipcRenderer.sendSync("writeCson", {
        file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/${action.note_key}.cson`,
        obj: note_info,
      });

      return state;
    }
  }
});

export const useNotes = () => {
  const [state, dispatch] = useReducer(notesReducer, {});
  let saveTimer: NodeJS.Timeout | null = null;

  const repoNotesFetch = useCallback((data_path, repos, repo_key) => {
    if (!repo_key) return;
    dispatch({
      type: "fetchNotesInOneRepo",
      data_path,
      repos,
      repo_key,
    });
  }, []);

  const folderNotesFetch = useCallback((data_path, repos, repo_key) => {
    dispatch({
      type: "fetchNotesInOneFolder",
      data_path,
      repos,
      repo_key,
    });
  }, []);

  const changeNotesAfterNew = useCallback((action_name, obj) => {
    switch (action_name) {
      case "repo": {
        let { data_path, repo_key } = obj;
        dispatch({
          type: "addRepo",
          data_path,
          repo_key,
        });
        break;
      }
      case "folder": {
        let { data_path, repo_key, folder_key } = obj;
        dispatch({
          type: "addFolder",
          data_path,
          repo_key,
          folder_key,
        });
        break;
      }
      case "note": {
        let { data_path, repo_key, folder_key, note_key } = obj;
        dispatch({
          type: "addNote",
          data_path,
          repo_key,
          folder_key,
          note_key,
        });
        break;
      }
    }
  }, []);

  const initNotes = useCallback(
    (folder) => dispatch({ type: "init", new_state: folder }),
    []
  );

  const saveNow = useCallback(
    (
      data_path: string,
      repo_key: string,
      folder_key: string,
      note_key: string
    ) => {
      dispatch({
        type: "save",
        data_path,
        repo_key,
        folder_key,
        note_key,
      });
    },
    []
  );

  const updateNote = (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string,
    note_content: string
  ) => {
    if (repo_key && folder_key && note_key) {
      if (saveTimer) {
        clearTimeout(saveTimer);
      }

      saveTimer = setTimeout(() => {
        saveNow(data_path, repo_key, folder_key, note_key);
      }, 800);

      dispatch({
        type: "update",
        repo_key,
        folder_key,
        note_key,
        note_content,
      });
    }
  };

  return [
    state,
    {
      repoNotesFetch,
      folderNotesFetch,
      changeNotesAfterNew,
      initNotes,
      updateNote,
    },
  ] as const;
};

export type notesTypes = {
  [key: string]: {
    [key: string]: {
      [key: string]: string;
    };
  };
};
