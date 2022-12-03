import { historyTypes, whalenoteObjType } from '../commonType';

export let notes = {};

const saveTimerObj = new Map();

export const fetchNotesInAllRepo = async (
    data_path: string | null,
    whalenote: whalenoteObjType
) => {
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
                            const note_content = await window.electronAPI.readMdSync({
                                file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.md`,
                            });
                            if (note_content) {
                                notes[repo_key][folder_key][note_key] = note_content;
                            }
                        }
                    }
                }
            }
        }
    }
};

export const fetchNotesInfolder = async (
    data_path: string | null,
    repo_key: string | undefined,
    folder_key: string | undefined
) => {
    if (repo_key && folder_key) {
        if (!notes[repo_key]) notes[repo_key] = {};
        if (!notes[repo_key][folder_key]) {
            const folder_info = await window.electronAPI.readJsonSync({
                file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
            });
            if (folder_info && folder_info.notes_obj) {
                notes[repo_key][folder_key] = {};
                for (const note_key of Object.keys(folder_info.notes_obj)) {
                    const note_content = await window.electronAPI.readMdSync({
                        file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.md`,
                    });
                    if (note_content) {
                        notes[repo_key][folder_key][note_key] = note_content;
                    }
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
            const note_content = await window.electronAPI.readMdSync({
                file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.md`,
            });
            notes[repo_key][folder_key][note_key] = note_content;
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
    const new_note_content = notes[repo_key][folder_key][note_key];
    await window.electronAPI.writeMd({
        file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.md`,
        str: new_note_content,
    });
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

export const updateNote = (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string,
    new_note_str: string
) => {
    if (repo_key && folder_key && note_key) {
        notes[repo_key][folder_key][note_key] = new_note_str;
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
