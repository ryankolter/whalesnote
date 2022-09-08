import produce from 'immer';

import { useReducer, useState, useCallback, useRef } from 'react';
import { forEachChild } from 'typescript';
const { ipcRenderer } = window.require('electron');

const notesReducer = produce((state: notesTypes, action: any) => {
    switch (action.type) {
        case 'fetchNotesInAllRepos': {
            const repos_key = action.dxnote.repos_key;
            repos_key.forEach((repo_key: string) => {
                if (!state[repo_key]) {
                    state[repo_key] = {};
                }
                const folders_key = action.repos[repo_key].folders_key;
                folders_key.forEach((folder_key: string) => {
                    if (!state[repo_key][folder_key]) {
                        const folder_info = ipcRenderer.sendSync('readJson', {
                            file_path: `${action.data_path}/${repo_key}/${folder_key}/folder_info.json`,
                        });
                        if (folder_info && folder_info.notes_obj) {
                            state[repo_key][folder_key] = {};
                            Object.keys(folder_info.notes_obj).forEach((note_key) => {
                                const note_info = ipcRenderer.sendSync('readCson', {
                                    file_path: `${action.data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
                                });
                                if (note_info) {
                                    state[repo_key][folder_key][note_key] = note_info.content;
                                }
                            });
                        }
                    }
                });
            });
            return state;
        }
        case 'fetchNotesInOneRepo': {
            if (!state[action.repo_key]) {
                state[action.repo_key] = {};
                const folders_key = action.repos[action.repo_key].folders_key;
                folders_key.forEach((folder_key: string, index: number) => {
                    if (
                        index === 0 ||
                        folder_key === action.dxnote.repos[action.repo_key].cur_folder_key
                    ) {
                        const folder_info = ipcRenderer.sendSync('readJson', {
                            file_path: `${action.data_path}/${action.repo_key}/${folder_key}/folder_info.json`,
                        });
                        if (folder_info && folder_info.notes_obj) {
                            state[action.repo_key][folder_key] = {};
                            Object.keys(folder_info.notes_obj).forEach((note_key) => {
                                const note_info = ipcRenderer.sendSync('readCson', {
                                    file_path: `${action.data_path}/${action.repo_key}/${folder_key}/${note_key}.cson`,
                                });
                                if (note_info) {
                                    state[action.repo_key][folder_key][note_key] =
                                        note_info.content;
                                }
                            });
                        }
                    }
                });
            }
            return state;
        }
        case 'fetchNotesInOneFolder': {
            if (!state[action.repo_key][action.folder_key]) {
                const folder_info = ipcRenderer.sendSync('readJson', {
                    file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/folder_info.json`,
                });
                if (folder_info && folder_info.notes_obj) {
                    state[action.repo_key][action.folder_key] = {};
                    Object.keys(folder_info.notes_obj).forEach((note_key) => {
                        const note_info = ipcRenderer.sendSync('readCson', {
                            file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/${note_key}.cson`,
                        });
                        if (note_info) {
                            state[action.repo_key][action.folder_key][note_key] = note_info.content;
                        }
                    });
                }
            }
            return state;
        }
        case 'addRepo': {
            if (!state[action.repo_key]) {
                state[action.repo_key] = {};
            }
            return state;
        }
        case 'addFolder': {
            if (!state[action.repo_key][action.folder_key]) {
                state[action.repo_key][action.folder_key] = {};
            }
            return state;
        }
        case 'addNote': {
            const note_info = ipcRenderer.sendSync('readCson', {
                file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/${action.note_key}.cson`,
            });
            state[action.repo_key][action.folder_key][action.note_key] = note_info.content;
            return state;
        }
        case 'init': {
            state = action.new_state;
            return state;
        }
        case 'update': {
            state[action.repo_key][action.folder_key][action.note_key] = action.note_content;
            return state;
        }
    }
});

export const useNotes = () => {
    const [state, dispatch] = useReducer(notesReducer, {});

    const saveTimerObj = useRef<Map<string, NodeJS.Timeout>>(new Map());

    const allRepoNotesFetch = (data_path: string | null, dxnote: any, repos: any) => {
        dispatch({
            type: 'fetchNotesInAllRepos',
            data_path,
            dxnote,
            repos,
        });
    };

    const repoNotesFetch = useCallback(
        (data_path: string | null, dxnote: any, repos: any, repo_key: string | undefined) => {
            if (!repo_key) return;
            dispatch({
                type: 'fetchNotesInOneRepo',
                data_path,
                dxnote,
                repos,
                repo_key,
            });
        },
        []
    );

    const folderNotesFetch = useCallback(
        (
            data_path: string | null,
            repo_key: string | undefined,
            folder_key: string | undefined
        ) => {
            dispatch({
                type: 'fetchNotesInOneFolder',
                data_path,
                repo_key,
                folder_key,
            });
        },
        []
    );

    const changeNotesAfterNew = useCallback((action_name: string, obj: any) => {
        switch (action_name) {
            case 'repo': {
                const { data_path, repo_key } = obj;
                dispatch({
                    type: 'addRepo',
                    data_path,
                    repo_key,
                });
                break;
            }
            case 'folder': {
                const { data_path, repo_key, folder_key } = obj;
                dispatch({
                    type: 'addFolder',
                    data_path,
                    repo_key,
                    folder_key,
                });
                break;
            }
            case 'note': {
                const { data_path, repo_key, folder_key, note_key } = obj;
                dispatch({
                    type: 'addNote',
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
        (folder: any) => dispatch({ type: 'init', new_state: folder }),
        []
    );

    const saveNow = useCallback(
        (
            data_path: string,
            repo_key: string,
            folder_key: string,
            note_key: string,
            note_content: string
        ) => {
            const action = {
                data_path,
                repo_key,
                folder_key,
                note_key,
                note_content,
            };
            const note_info = ipcRenderer.sendSync('readCson', {
                file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/${action.note_key}.cson`,
            });

            if (note_info) {
                note_info.content = note_content;
                note_info.updatedAt = new Date();
                ipcRenderer.sendSync('writeCson', {
                    file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/${action.note_key}.cson`,
                    obj: note_info,
                });
            } else {
                const new_note_info = {
                    createAt: new Date(),
                    updatedAt: new Date(),
                    type: 'markdown',
                    content: note_content,
                };
                ipcRenderer.sendSync('writeCson', {
                    file_path: `${action.data_path}/${action.repo_key}/${action.folder_key}/${action.note_key}.cson`,
                    obj: new_note_info,
                });
            }
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
            if (saveTimerObj.current.has(note_key)) {
                clearTimeout(saveTimerObj.current.get(note_key) as NodeJS.Timeout);
            }

            saveTimerObj.current.set(
                note_key,
                setTimeout(() => {
                    saveNow(data_path, repo_key, folder_key, note_key, note_content);
                    saveTimerObj.current.delete(note_key);
                }, 800)
            );

            dispatch({
                type: 'update',
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
            allRepoNotesFetch,
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
