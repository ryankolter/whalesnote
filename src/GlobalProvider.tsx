import {
    createContext,
    Dispatch,
    SetStateAction,
    useCallback,
    useState,
    useMemo,
    useEffect,
} from 'react';
import { whalenoteTypes, historyTypes, reposObjTypes, notesTypes } from './commonType';

import useData from './lib/useData';
import useDataList from './lib/useDataList';
import { useWhalenote } from './lib/useWhalenote';
import { useHistory } from './lib/useHistory';
import { useRepos } from './lib/useRepos';
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
    setCurDataPath: Dispatch<SetStateAction<string>>;
    dataPathChangeFlag: number;
    initingData: boolean;
    setInitingData: Dispatch<SetStateAction<boolean>>;
    switchingData: boolean;
    setSwitchingData: Dispatch<SetStateAction<boolean>>;
    dataPathList: string[];
    removeDataPathFromList: (data_path: string) => void;
    whalenote: whalenoteTypes;
    history: historyTypes;
    initWhalenote: (new_whalenote: whalenoteTypes) => void;
    updateWhalenote: (data_path: string) => void;
    repoSwitch: (repo_key: string | undefined) => void;
    folderSwitch: (repo_key: string | undefined, folderKey: string | undefined) => void;
    noteSwitch: (
        repo_key: string | undefined,
        folder_key: string | undefined,
        note_key: string | undefined
    ) => void;
    currentRepoKey: string;
    currentFolderKey: string;
    currentNoteKey: string;
    repos: reposObjTypes;
    newRepo: (
        curDataPath: string,
        repo_key: string,
        repo_name: string,
        default_folder_key: string,
        default_note_key: string
    ) => void;
    renameRepo: (curDataPath: string, repo_key: string, new_repo_name: string) => void;
    deleteRepo: (curDataPath: string, repo_key: string) => any;
    newFolder: (
        curDataPath: string,
        repo_key: string,
        new_folder_key: string,
        new_folder_name: string,
        new_note_key: string
    ) => void;
    renameFolder: (
        curDataPath: string,
        repo_key: string,
        folder_key: string,
        new_folder_name: string
    ) => void;
    deleteFolder: (curDataPath: string, repo_key: string, folder_key: string) => any;
    initRepos: (newRepos: reposObjTypes) => void;
    renameNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        new_title: string
    ) => void;
    reorderRepo: (data_path: string, repo_key: string, new_repos_key: string[]) => void;
    reorderFolder: (data_path: string, repo_key: string, new_folders_key: string[]) => void;
    reorderNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        new_notes_key: string[]
    ) => void;
    notes: notesTypes;
    initNotes: (_notes: notesTypes) => void;
    updateNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        currentContent: string
    ) => void;
    allRepoNotesFetch: (data_path: string | null, repos_obj: reposObjTypes) => any;
    repoNotesFetch: (
        data_path: string | null,
        history: historyTypes,
        repos_obj: reposObjTypes,
        repo_key: string | undefined
    ) => void;
    folderNotesFetch: (
        data_path: string | null,
        repo_key: string | undefined,
        folder_key: string | undefined
    ) => void;
    changeNotesAfterNew: (
        action_name: string,
        obj: {
            data_path: string;
            repo_key: string;
            folder_key?: string;
            note_key?: string;
        }
    ) => void;
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
    setNumArray: Dispatch<SetStateAction<number[]>>;
    focus: string;
    setFocus: Dispatch<SetStateAction<string>>;
    blur: string;
    setBlur: Dispatch<SetStateAction<string>>;
    keySelect: boolean;
    setKeySelect: Dispatch<SetStateAction<boolean>>;
    editorFontSize: number;
    setEditorFontSize: Dispatch<SetStateAction<number>>;
    renderFontSize: number;
    setRenderFontSize: Dispatch<SetStateAction<number>>;
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
    whalenote: { id: '' },
    initWhalenote: () => {},
    updateWhalenote: () => {},
    reorderRepo: () => {},
    history: { cur_repo_key: '', repos_record: {} },
    repoSwitch: () => {},
    folderSwitch: () => {},
    noteSwitch: () => {},
    currentRepoKey: '',
    currentFolderKey: '',
    currentNoteKey: '',
    repos: { repos_key: [], repos_obj: {} },
    newRepo: () => {},
    renameRepo: () => {},
    deleteRepo: () => {
        return '';
    },
    newFolder: () => {},
    renameFolder: () => {},
    deleteFolder: () => {
        return '';
    },
    initRepos: () => {},
    renameNote: () => {},
    reorderFolder: () => {},
    reorderNote: () => {},
    notes: {},
    initNotes: () => {},
    updateNote: () => {},
    allRepoNotesFetch: () => {},
    repoNotesFetch: () => {},
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
    editorFontSize: 15,
    setEditorFontSize: () => {},
    renderFontSize: 15,
    setRenderFontSize: () => {},
};
export const GlobalContext = createContext(initContext);

export const GlobalProvider = ({ children }: { children: any }) => {
    console.log('GlobalProvider render');
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
    const [whalenote, { initWhalenote, updateWhalenote }] = useWhalenote();
    const [
        history,
        {
            initHistory,
            switchRepo,
            switchFolder,
            switchNote,
            currentRepoKey,
            currentFolderKey,
            currentNoteKey,
        },
    ] = useHistory();
    const [
        repos,
        {
            newRepo,
            renameRepo,
            deleteRepo,
            newFolder,
            renameFolder,
            deleteFolder,
            initRepos,
            renameNote,
            reorderRepo,
            reorderFolder,
            reorderNote,
        },
    ] = useRepos();

    useEffect(() => {
        console.log('dataPathChangeFlag');
        console.log(data.current);
        if (data.current) {
            addDataPathToList(curDataPath);
            initWhalenote(data.current.whalenote);
            initHistory(data.current.history);
            initRepos(data.current.repos);
            initNotes(data.current.notes);
        }
    }, [dataPathChangeFlag]);

    const [cursorHeads, { updateRecordValue: updateCursorHead }] = useRecordValue<number>();
    const [fromPoses, { updateRecordValue: updateFromPos }] = useRecordValue<number>();
    const [renderTops, { updateRecordValue: updateRenderTop }] = useRecordValue<number>();

    const [currentNoteStr, setCurrentNoteStr] = useState<string>('');
    const [focus, setFocus] = useState<string>('');
    const [blur, setBlur] = useState<string>('');
    const [keySelect, setKeySelect] = useState<boolean>(false);
    const [numArray, setNumArray] = useState<number[]>([]);
    const [editorFontSize, setEditorFontSize] = useState<number>(
        Number(window.localStorage.getItem('editor_font_size')) || 15
    );
    const [renderFontSize, setRenderFontSize] = useState<number>(
        Number(window.localStorage.getItem('render_font_size')) || 15
    );

    const repoSwitch = useCallback(
        async (repo_key: string | undefined) => {
            await repoNotesFetch(curDataPath, history, repos, repo_key);
            await switchRepo(curDataPath, repo_key);
        },
        [curDataPath, history, repos]
    );

    const folderSwitch = useCallback(
        async (repo_key: string | undefined, folder_key: string | undefined) => {
            await folderNotesFetch(curDataPath, repo_key, folder_key);
            await switchFolder(curDataPath, repo_key, folder_key);
        },
        [curDataPath]
    );

    const noteSwitch = useCallback(
        async (
            repo_key: string | undefined,
            folder_key: string | undefined,
            note_key: string | undefined
        ) => {
            await switchNote(curDataPath, repo_key, folder_key, note_key);
        },
        [curDataPath]
    );

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
            repos.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj[
                currentNoteKey
            ]?.title
                ? repos.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj[
                      currentNoteKey
                  ].title
                : '新建文档',
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, repos]
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
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey]
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
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, cursorHeads]
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
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, fromPoses]
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
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, renderTops]
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
                repos,
                newRepo,
                renameRepo,
                deleteRepo,
                newFolder,
                renameFolder,
                deleteFolder,
                initRepos,
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
                editorFontSize,
                setEditorFontSize,
                renderFontSize,
                setRenderFontSize,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};
