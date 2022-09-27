const { ipcRenderer } = window.require('electron');

export let notes = {};

const saveTimerObj = new Map();

export const allRepoNotesFetch = (data_path: string | null, dxnote: any, repos_obj: any) => {
    dxnote.repos_key.forEach((repo_key: string) => {
        if (repos_obj[repo_key]) {
            if (!notes[repo_key]) {
                notes[repo_key] = {};
            }
            repos_obj[repo_key].folders_key.forEach((folder_key: string) => {
                if (repos_obj[repo_key].folders_obj[folder_key]) {
                    if (!notes[repo_key][folder_key]) {
                        notes[repo_key][folder_key] = {};
                    }
                    repos_obj[repo_key].folders_obj[folder_key].notes_key.forEach(
                        (note_key: string) => {
                            if (notes[repo_key][folder_key][note_key] === undefined) {
                                const note_info = ipcRenderer.sendSync('readCson', {
                                    file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
                                });
                                if (note_info) {
                                    notes[repo_key][folder_key][note_key] = note_info.content;
                                }
                            }
                        }
                    );
                }
            });
        }
    });
    console.log(notes);
};

export const repoNotesFetch = (
    data_path: string | null,
    dxnote: any,
    repos: any,
    repo_key: string | undefined
) => {
    if (repo_key && !notes[repo_key]) {
        notes[repo_key] = {};
        const folders_key = repos[repo_key].folders_key;
        folders_key.forEach((folder_key: string, index: number) => {
            if (index === 0 || folder_key === dxnote.repos[repo_key].cur_folder_key) {
                const folder_info = ipcRenderer.sendSync('readJson', {
                    file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
                });
                if (folder_info && folder_info.notes_obj) {
                    notes[repo_key][folder_key] = {};
                    Object.keys(folder_info.notes_obj).forEach((note_key) => {
                        const note_info = ipcRenderer.sendSync('readCson', {
                            file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
                        });
                        if (note_info) {
                            notes[repo_key][folder_key][note_key] = note_info.content;
                        }
                    });
                }
            }
        });
    }
};

export const folderNotesFetch = (
    data_path: string | null,
    repo_key: string | undefined,
    folder_key: string | undefined
) => {
    if (repo_key && folder_key && !notes[repo_key][folder_key]) {
        const folder_info = ipcRenderer.sendSync('readJson', {
            file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
        });
        if (folder_info && folder_info.notes_obj) {
            notes[repo_key][folder_key] = {};
            Object.keys(folder_info.notes_obj).forEach((note_key) => {
                const note_info = ipcRenderer.sendSync('readCson', {
                    file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
                });
                if (note_info) {
                    notes[repo_key][folder_key][note_key] = note_info.content;
                }
            });
        }
    }
};

export const changeNotesAfterNew = (action_name: string, obj: any) => {
    switch (action_name) {
        case 'repo': {
            const { data_path, repo_key } = obj;
            if (!notes[repo_key]) {
                notes[repo_key] = {};
            }
            break;
        }
        case 'folder': {
            const { data_path, repo_key, folder_key } = obj;
            if (!notes[repo_key][folder_key]) {
                notes[repo_key][folder_key] = {};
            }
            break;
        }
        case 'note': {
            const { data_path, repo_key, folder_key, note_key } = obj;
            const note_info = ipcRenderer.sendSync('readCson', {
                file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
            });
            notes[repo_key][folder_key][note_key] = note_info.content;
            break;
        }
    }
};

export const initNotes = (_notes: notesTypes) => {
    notes = _notes;
};

export const saveNow = (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string,
    note_content: string
) => {
    const note_info = ipcRenderer.sendSync('readCson', {
        file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
    });

    if (note_info) {
        note_info.content = note_content;
        note_info.updatedAt = new Date();
        ipcRenderer.sendSync('writeCson', {
            file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
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
            file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
            obj: new_note_info,
        });
    }
};

export const updateNoteHandler = (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string,
    note_content: string
) => {
    if (repo_key && folder_key && note_key) {
        if (saveTimerObj.has(note_key)) {
            clearTimeout(saveTimerObj.get(note_key) as NodeJS.Timeout);
        }

        saveTimerObj.set(
            note_key,
            setTimeout(() => {
                saveNow(data_path, repo_key, folder_key, note_key, note_content);
                saveTimerObj.delete(note_key);
            }, 800)
        );

        notes[repo_key][folder_key][note_key] = note_content;
    }
};

export type notesTypes = {
    [key: string]: {
        [key: string]: {
            [key: string]: string;
        };
    };
};
