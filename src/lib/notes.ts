import { notesTypes } from '../commonType';
export let notes: notesTypes = {};

export const fetchNotesInfolder = async (
    data_path: string | null,
    repo_key: string | undefined,
    folder_key: string | undefined,
) => {
    if (repo_key && folder_key) {
        if (!notes[repo_key]) notes[repo_key] = {};
        if (!notes[repo_key][folder_key]) {
            const folder_info = await window.electronAPI.readJsonSync(
                `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
            );
            if (folder_info && folder_info.notes_obj) {
                notes[repo_key][folder_key] = {};
                for (const note_key of Object.keys(folder_info.notes_obj)) {
                    const note_content = await window.electronAPI.readMdSync(
                        `${data_path}/${repo_key}/${folder_key}/${note_key}.md`,
                    );
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
    },
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
            const note_content = await window.electronAPI.readMdSync(
                `${data_path}/${repo_key}/${folder_key}/${note_key}.md`,
            );
            notes[repo_key][folder_key][note_key] = note_content;
            break;
        }
    }
};

export const initNotes = (_notes: notesTypes) => {
    notes = _notes;
};

const saveTimerObj = new Map();

const saveTask = async (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string,
) => {
    const new_note_content = notes[repo_key][folder_key][note_key];
    await window.electronAPI.writeStr(
        `${data_path}/${repo_key}/${folder_key}/${note_key}.md`,
        new_note_content,
    );
};

const addSaveTask = (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string,
    delay: number,
) => {
    if (saveTimerObj.has(note_key)) {
        clearTimeout(saveTimerObj.get(note_key) as NodeJS.Timeout);
    }

    saveTimerObj.set(
        note_key,
        setTimeout(async () => {
            await saveTask(data_path, repo_key, folder_key, note_key);
            saveTimerObj.delete(note_key);
        }, delay),
    );
};

export const updateNote = (
    data_path: string,
    repo_key: string,
    folder_key: string,
    note_key: string,
    new_note_str: string,
) => {
    if (repo_key && folder_key && note_key) {
        notes[repo_key][folder_key][note_key] = new_note_str;
        addSaveTask(data_path, repo_key, folder_key, note_key, 800);
    }
};
