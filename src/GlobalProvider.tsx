import { createContext, useCallback, useState, useMemo } from 'react';

import { useRepos } from './lib/useRepos';
import { useDxnote } from './lib/useDxnote';
import { useEditPos } from './lib/useEditPos';
import { useEditLine } from './lib/useEditLine';
import { useRecordValue } from './lib/useRecordValue';

import {
    notes,
    allRepoNotesFetch,
    repoNotesFetch,
    folderNotesFetch,
    changeNotesAfterNew,
    initNotes,
    updateNote,
} from './lib/notes';

const initContext: {
    dataPath: string;
    setDataPath: (path: string) => void;
    dxnote: any;
    initDxnote: (new_dxnote: any) => void;
    updateDxnote: (data_path: string) => void;
    reorderRepo: (data_path: string, repo_key: string, new_repos_key: string[]) => void;
    repoSwitch: (repo_key: string | undefined) => void;
    folderSwitch: (repo_key: string | undefined, folderKey: string | undefined) => void;
    noteSwitch: (note_key: string | undefined) => void;
    currentRepoKey: string;
    currentFolderKey: string;
    currentNoteKey: string;
    repos_obj: any;
    initRepo: (newRepo: any) => void;
    updateRepos: (action_name: string, obj: object) => void;
    renameNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        new_title: string
    ) => void;
    reorderFolder: (data_path: string, repo_key: string, new_folders_key: string[]) => void;
    reorderNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        new_notes_key: string[]
    ) => void;
    notes: any;
    initNotes: (folder: any) => void;
    updateNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        content: string
    ) => void;
    allRepoNotesFetch: any;
    repoNotesFetch: any;
    folderNotesFetch: any;
    changeNotesAfterNew: (action_name: string, obj: object) => void;
    title: string;
    content: string;
    cursorHead: number;
    fromPos: number;
    renderTop: number;
    updateCursorHead: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        cursor_head: number
    ) => void;
    updateFromPos: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        from_pos: number
    ) => void;
    updateRenderTop: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        render_scroll_value: number
    ) => void;
    numArray: number[];
    setNumArray: any;
} = {
    dataPath: '',
    setDataPath: () => {},
    dxnote: null,
    initDxnote: () => {},
    updateDxnote: () => {},
    reorderRepo: () => {},
    repoSwitch: () => {},
    folderSwitch: () => {},
    noteSwitch: () => {},
    currentRepoKey: '',
    currentFolderKey: '',
    currentNoteKey: '',
    repos_obj: null,
    initRepo: () => {},
    updateRepos: () => {},
    renameNote: () => {},
    reorderFolder: () => {},
    reorderNote: () => {},
    notes: null,
    initNotes: () => {},
    updateNote: () => {},
    allRepoNotesFetch: null,
    repoNotesFetch: null,
    folderNotesFetch: null,
    changeNotesAfterNew: () => {},
    title: '',
    content: '',
    cursorHead: 0,
    fromPos: 0,
    renderTop: 0,
    updateCursorHead: () => {},
    updateFromPos: () => {},
    updateRenderTop: () => {},
    numArray: [],
    setNumArray: () => {},
};
export const GlobalContext = createContext(initContext);

export const GlobalProvider = ({ children }: { children: any }) => {
    const [dataPath, setDataPath] = useState<string>(
        window.localStorage.getItem('dxnote_data_path') || ''
    );
    const [
        dxnote,
        {
            switchRepo,
            switchFolder,
            switchNote,
            updateDxnote,
            currentRepoKey,
            currentFolderKey,
            currentNoteKey,
            reorderRepo,
            initDxnote,
        },
    ] = useDxnote();
    const [repos_obj, { updateRepos, initRepo, renameNote, reorderFolder, reorderNote }] =
        useRepos();
    const [cursorHeads, { updateCursorHead }] = useEditPos();
    const [fromPoses, { updateFromPos }] = useEditLine();
    const [renderTops, { updateRecordValue: updateRenderTop }] = useRecordValue();

    const [numArray, setNumArray] = useState<number[]>([]);

    const repoSwitch = useCallback(
        (repo_key: string | undefined) => {
            repoNotesFetch(dataPath, dxnote, repos_obj, repo_key);
            switchRepo(dataPath, repo_key);
        },
        [dataPath, dxnote, repos_obj]
    );

    const folderSwitch = useCallback(
        (repo_key: string | undefined, folder_key: string | undefined) => {
            folderNotesFetch(dataPath, repo_key, folder_key);
            switchFolder(dataPath, folder_key);
        },
        [dataPath]
    );

    const noteSwitch = useCallback(
        (note_key: string | undefined) => {
            switchNote(dataPath, note_key);
        },
        [dataPath]
    );
    console.log('render');

    const title = useMemo(
        () =>
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj[currentNoteKey]
                ?.title
                ? repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj[
                      currentNoteKey
                  ].title
                : '新建文档',
        [currentRepoKey, currentFolderKey, currentNoteKey, repos_obj]
    );

    const content = useMemo(
        () =>
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            notes[currentRepoKey] &&
            notes[currentRepoKey][currentFolderKey] &&
            notes[currentRepoKey][currentFolderKey][currentNoteKey]
                ? notes[currentRepoKey][currentFolderKey][currentNoteKey]
                : '',
        [currentRepoKey, currentFolderKey, currentNoteKey, notes]
    );

    const cursorHead = useMemo(
        () =>
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            cursorHeads[currentRepoKey] &&
            cursorHeads[currentRepoKey][currentFolderKey] &&
            cursorHeads[currentRepoKey][currentFolderKey][currentNoteKey]
                ? cursorHeads[currentRepoKey][currentFolderKey][currentNoteKey]
                : -1,
        [currentRepoKey, currentFolderKey, currentNoteKey, cursorHeads]
    );

    const fromPos = useMemo(
        () =>
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            fromPoses[currentRepoKey] &&
            fromPoses[currentRepoKey][currentFolderKey] &&
            fromPoses[currentRepoKey][currentFolderKey][currentNoteKey]
                ? fromPoses[currentRepoKey][currentFolderKey][currentNoteKey]
                : 0,
        [currentRepoKey, currentFolderKey, currentNoteKey, fromPoses]
    );

    const renderTop = useMemo(
        () =>
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            renderTops[currentRepoKey] &&
            renderTops[currentRepoKey][currentFolderKey] &&
            renderTops[currentRepoKey][currentFolderKey][currentNoteKey]
                ? renderTops[currentRepoKey][currentFolderKey][currentNoteKey]
                : 0,
        [currentRepoKey, currentFolderKey, currentNoteKey, renderTops]
    );

    return (
        <GlobalContext.Provider
            value={{
                dataPath,
                setDataPath,
                dxnote,
                initDxnote,
                updateDxnote,
                reorderRepo,
                repoSwitch,
                folderSwitch,
                noteSwitch,
                currentRepoKey,
                currentFolderKey,
                currentNoteKey,
                repos_obj,
                initRepo,
                updateRepos,
                renameNote,
                reorderFolder,
                reorderNote,
                notes,
                initNotes,
                updateNote,
                allRepoNotesFetch,
                repoNotesFetch,
                folderNotesFetch,
                changeNotesAfterNew,
                title,
                content,
                cursorHead,
                fromPos,
                renderTop,
                updateCursorHead,
                updateFromPos,
                updateRenderTop,
                numArray,
                setNumArray,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};
