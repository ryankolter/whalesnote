import { historyTypes, whalenoteObjType } from '../commonType';

export let notes = {};

const saveTimerObj = new Map();

export const allRepoNotesFetch = async (data_path: string | null, whalenote: whalenoteObjType) => {
    for (const repo_key of whalenote.repos_key) {
        if (whalenote.repos_obj[repo_key]) {
            if (!notes[repo_key]) {
                notes[repo_key] = {};
            }
            for (const folder_key of whalenote.repos_obj[repo_key].folders_key) {
                if (whalenote.repos_obj[repo_key].folders_obj[folder_key]) {
                    if (!notes[repo_key][folder_key]) {
                        notes[repo_key][folder_key] = {};
                    }
                    for (const note_key of whalenote.repos_obj[repo_key].folders_obj[folder_key]
                        .notes_key) {
                        if (notes[repo_key][folder_key][note_key] === undefined) {
                            const note_info = await window.electronAPI.readCson({
                                file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
                            });
                            if (note_info) {
                                notes[repo_key][folder_key][note_key] = note_info.content;
                            }
                        }
                    }
                }
            }
        }
    }
};

export const repoNotesFetch = async (
    data_path: string | null,
    history: historyTypes,
    whalenote: whalenoteObjType,
    repo_key: string | undefined
) => {
    if (repo_key && !notes[repo_key]) {
        notes[repo_key] = {};
        const folders_key = whalenote.repos_obj[repo_key].folders_key;
        for (const [index, folder_key] of folders_key.entries()) {
            if (index === 0 || folder_key === history.repos_record[repo_key].cur_folder_key) {
                const folder_info = await window.electronAPI.readJson({
                    file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
                });
                if (folder_info && folder_info.notes_obj) {
                    notes[repo_key][folder_key] = {};
                    for (const note_key of Object.keys(folder_info.notes_obj)) {
                        const note_info = await window.electronAPI.readCson({
                            file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
                        });
                        if (note_info) {
                            notes[repo_key][folder_key][note_key] = note_info.content;
                        }
                    }
                }
            }
        }
    }
};

export const folderNotesFetch = async (
    data_path: string | null,
    repo_key: string | undefined,
    folder_key: string | undefined
) => {
    if (repo_key && folder_key && !notes[repo_key][folder_key]) {
        const folder_info = await window.electronAPI.readJson({
            file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
        });
        if (folder_info && folder_info.notes_obj) {
            notes[repo_key][folder_key] = {};
            for (const note_key of Object.keys(folder_info.notes_obj)) {
                const note_info = await window.electronAPI.readCson({
                    file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
                });
                if (note_info) {
                    notes[repo_key][folder_key][note_key] = note_info.content;
                }
            }
        }
    }
};

export const changeNotesAfterNew = async (
    action_name: string,
    obj: {
        data_path: string;
        repo_key: string;
        folder_key?: string;
        note_key?: string;
    }
) => {
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
            const note_info = await window.electronAPI.readCson({
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

const saveTask = async (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string
) => {
    const note_info = await window.electronAPI.readCson({
        file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
    });

    if (note_info) {
        note_info.content = notes[repo_key][folder_key][note_key];
        note_info.updatedAt = new Date();
        await window.electronAPI.writeCson({
            file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
            obj: note_info,
        });
    } else {
        const new_note_info = {
            createAt: new Date(),
            updatedAt: new Date(),
            type: 'markdown',
            content: notes[repo_key][folder_key][note_key],
        };
        await window.electronAPI.writeCson({
            file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
            obj: new_note_info,
        });
    }
};

const addSaveTask = (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string,
    delay: number
) => {
    if (saveTimerObj.has(note_key)) {
        clearTimeout(saveTimerObj.get(note_key) as NodeJS.Timeout);
    }

    saveTimerObj.set(
        note_key,
        setTimeout(async () => {
            await saveTask(data_path, repo_key, folder_key, note_key);
            saveTimerObj.delete(note_key);
        }, delay)
    );
};

export const updateNoteHandler = (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string,
    note_content: string
) => {
    if (repo_key && folder_key && note_key) {
        notes[repo_key][folder_key][note_key] = note_content;
        addSaveTask(data_path, repo_key, folder_key, note_key, 800);
    }
};

export type notesTypes = {
    [key: string]: {
        [key: string]: {
            [key: string]: string;
        };
    };
};
