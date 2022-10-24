const { ipcRenderer } = window.require('electron');
import { createContext, useCallback, useState, useMemo, useEffect } from 'react';

import useData from './lib/useData';
import useDataList from './lib/useDataList';
import { useWhalenote } from './lib/useWhalenote';
import { useHistory } from './lib/useHistory';
import { useRepos } from './lib/useRepos';
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
    updateNoteHandler,
} from './lib/notes';

const initContext: {
    curDataPath: string;
    setCurDataPath: (path: string) => void;
    dataPathChangeFlag: number;
    initingData: boolean;
    setInitingData: (switchingData: boolean) => void;
    switchingData: boolean;
    setSwitchingData: (switchingData: boolean) => void;
    dataPathList: string[];
    removeDataPathFromList: (data_path: string) => void;
    whalenote: any;
    history: any;
    initWhalenote: (new_whalenote: any) => void;
    updateWhalenote: (data_path: string) => void;
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
        currentContent: string
    ) => void;
    allRepoNotesFetch: any;
    repoNotesFetch: any;
    folderNotesFetch: (
        data_path: string | null,
        repo_key: string | undefined,
        folder_key: string | undefined
    ) => void;
    changeNotesAfterNew: (action_name: string, obj: object) => void;
    currentTitle: string;
    currentContent: string;
    currentNoteStr: string;
    cursorHead: number;
    updateCursorHead: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        cursor_head: number
    ) => void;
    fromPos: number;
    updateFromPos: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        from_pos: number
    ) => void;
    renderTop: number;
    updateRenderTop: (
        repo_key: string,
        folder_key: string,
        note_key: string,
        render_scroll_value: number
    ) => void;
    numArray: number[];
    setNumArray: any;
    focus: string;
    setFocus: (focus: string) => void;
    blur: string;
    setBlur: (blur: string) => void;
    keySelect: boolean;
    setKeySelect: (keySelect: boolean) => void;
} = {
    curDataPath: '',
    setCurDataPath: () => {},
    dataPathChangeFlag: 0,
    initingData: false,
    setInitingData: () => {},
    switchingData: false,
    setSwitchingData: () => {},
    dataPathList: [],
    removeDataPathFromList: () => {},
    whalenote: null,
    history: null,
    initWhalenote: () => {},
    updateWhalenote: () => {},
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
    folderNotesFetch: () => {},
    changeNotesAfterNew: () => {},
    currentTitle: '',
    currentContent: '',
    currentNoteStr: '',
    cursorHead: 0,
    updateCursorHead: () => {},
    fromPos: 0,
    updateFromPos: () => {},
    renderTop: 0,
    updateRenderTop: () => {},
    numArray: [],
    setNumArray: () => {},
    focus: '',
    setFocus: () => {},
    blur: '',
    setBlur: () => {},
    keySelect: false,
    setKeySelect: () => {},
};
export const GlobalContext = createContext(initContext);

export const GlobalProvider = ({ children }: { children: any }) => {
    const [
        data,
        curDataPath,
        setCurDataPath,
        dataPathChangeFlag,
        initingData,
        setInitingData,
        switchingData,
        setSwitchingData,
    ] = useData();
    const [dataPathList, addDataPathToList, removeDataPathFromList] = useDataList();
    const [whalenote, { updateWhalenote, reorderRepo, initWhalenote }] = useWhalenote();
    const [
        history,
        {
            switchRepo,
            switchFolder,
            switchNote,
            currentRepoKey,
            currentFolderKey,
            currentNoteKey,
            updateHistory,
            initHistory,
        },
    ] = useHistory();
    const [repos_obj, { updateRepos, initRepo, renameNote, reorderFolder, reorderNote }] =
        useRepos();

    useEffect(() => {
        if (data.current) {
            addDataPathToList(curDataPath);
            initWhalenote(data.current.whalenote);
            initHistory(data.current.history);
            initRepo(data.current.repos);
            initNotes(data.current.notes);
        }
    }, [dataPathChangeFlag]);

    const [currentNoteStr, setCurrentNoteStr] = useState<string>('');
    const [cursorHeads, { updateCursorHead }] = useEditPos();
    const [fromPoses, { updateFromPos }] = useEditLine();
    const [renderTops, { updateRecordValue: updateRenderTop }] = useRecordValue();

    const [numArray, setNumArray] = useState<number[]>([]);
    const [focus, setFocus] = useState('');
    const [blur, setBlur] = useState('');
    const [keySelect, setKeySelect] = useState(false);

    const repoSwitch = useCallback(
        (repo_key: string | undefined) => {
            repoNotesFetch(curDataPath, history, repos_obj, repo_key);
            switchRepo(curDataPath, repo_key);
        },
        [curDataPath, history, repos_obj]
    );

    const folderSwitch = useCallback(
        (repo_key: string | undefined, folder_key: string | undefined) => {
            folderNotesFetch(curDataPath, repo_key, folder_key);
            switchFolder(curDataPath, folder_key);
        },
        [curDataPath]
    );

    const noteSwitch = useCallback(
        (note_key: string | undefined) => {
            switchNote(curDataPath, note_key);
        },
        [curDataPath]
    );
    console.log('render');

    const updateNote = useCallback(
        (
            data_path: string,
            repo_key: string,
            folder_key: string,
            note_key: string,
            note_content: string
        ) => {
            setCurrentNoteStr(note_content);
            updateNoteHandler(data_path, repo_key, folder_key, note_key, note_content);
        },
        [updateNoteHandler]
    );

    const currentTitle = useMemo(
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

    const currentContent = useMemo(
        () =>
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            notes[currentRepoKey] &&
            notes[currentRepoKey][currentFolderKey] &&
            notes[currentRepoKey][currentFolderKey][currentNoteKey]
                ? notes[currentRepoKey][currentFolderKey][currentNoteKey]
                : '',
        [currentRepoKey, currentFolderKey, currentNoteKey]
    );

    useEffect(() => {
        setCurrentNoteStr(currentContent);
    }, [currentContent]);

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
                curDataPath,
                setCurDataPath,
                dataPathChangeFlag,
                initingData,
                setInitingData,
                switchingData,
                setSwitchingData,
                dataPathList,
                removeDataPathFromList,
                whalenote,
                history,
                initWhalenote,
                updateWhalenote,
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
                currentTitle,
                currentContent,
                currentNoteStr,
                cursorHead,
                updateCursorHead,
                fromPos,
                updateFromPos,
                renderTop,
                updateRenderTop,
                numArray,
                setNumArray,
                focus,
                setFocus,
                blur,
                setBlur,
                keySelect,
                setKeySelect,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};
