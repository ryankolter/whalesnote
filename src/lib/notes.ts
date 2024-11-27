import { ContentMap } from '@/interface';
export let notes: Record<string, ContentMap> = {};

export const addContentMap = (id: string, contentMap: ContentMap) => {
    notes[id] = contentMap;
};
export const removeContentMap = (id: string) => {
    delete notes[id];
};

export const fetchContentInFolder = async (
    id: string,
    dataPath: string,
    repoKey: string | undefined,
    folderKey: string | undefined,
) => {
    if (!repoKey || !folderKey) return;

    const cMap = notes[id];
    if (!cMap) return;

    if (!cMap[repoKey]) cMap[repoKey] = {};
    if (!cMap[repoKey][folderKey]) {
        const folder_info = await window.electronAPI.readJsonSync(
            `${dataPath}/${repoKey}/${folderKey}/folder_info.json`,
        );
        if (folder_info && folder_info.note_map) {
            cMap[repoKey][folderKey] = {};
            for (const noteKey of Object.keys(folder_info.note_map)) {
                const note_content = await window.electronAPI.readMdSync(
                    `${dataPath}/${repoKey}/${folderKey}/${noteKey}.md`,
                );
                if (note_content) cMap[repoKey][folderKey][noteKey] = note_content;
            }
        }
    }
};

export const fetchContentAfterNew = async (
    id: string,
    dataPath: string,
    repoKey: string,
    folderKey: string,
    noteKey: string,
) => {
    const cMap = notes[id];
    if (!cMap) return;

    const note_content = await window.electronAPI.readMdSync(
        `${dataPath}/${repoKey}/${folderKey}/${noteKey}.md`,
    );
    if (!cMap[repoKey]) cMap[repoKey] = {};
    if (!cMap[repoKey][folderKey]) cMap[repoKey][folderKey] = {};

    if (note_content === false) return;
    cMap[repoKey][folderKey][noteKey] = note_content;
};

const saveTimerObj = new Map();

const saveTask = async (
    id: string,
    dataPath: string,
    repoKey: string,
    folderKey: string,
    noteKey: string,
) => {
    const cMap = notes[id];
    if (!cMap) return;

    const new_note_content = cMap[repoKey][folderKey][noteKey];
    await window.electronAPI.writeStr(
        `${dataPath}/${repoKey}/${folderKey}/${noteKey}.md`,
        new_note_content,
    );
};

const addSaveTask = (
    id: string,
    dataPath: string,
    repoKey: string,
    folderKey: string,
    noteKey: string,
    delay: number,
) => {
    if (saveTimerObj.has(noteKey)) {
        clearTimeout(saveTimerObj.get(noteKey) as NodeJS.Timeout);
    }

    saveTimerObj.set(
        noteKey,
        setTimeout(async () => {
            await saveTask(id, dataPath, repoKey, folderKey, noteKey);
            saveTimerObj.delete(noteKey);
        }, delay),
    );
};

export const updateNote = (
    id: string,
    dataPath: string,
    repoKey: string,
    folderKey: string,
    noteKey: string,
    newNoteStr: string,
) => {
    const cMap = notes[id];
    if (!cMap) return;

    if (repoKey && folderKey && noteKey) {
        cMap[repoKey][folderKey][noteKey] = newNoteStr;
        addSaveTask(id, dataPath, repoKey, folderKey, noteKey, 800);
    }
};
