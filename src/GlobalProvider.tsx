import {
    createContext,
    Dispatch,
    SetStateAction,
    useCallback,
    useState,
    useMemo,
    useEffect,
    useRef,
} from 'react';
import { historyTypes, whalenoteObjType, notesTypes } from './commonType';

import useData from './lib/useData';
import useDataList from './lib/useDataList';
import { useHistory } from './lib/useHistory';
import { useWhalenote } from './lib/useWhalenote';
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
    history: historyTypes;
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
    whalenote: whalenoteObjType;
    initWhalenote: (newRepos: whalenoteObjType) => void;
    newRepo: (
        curDataPath: string,
        repo_key: string,
        repo_name: string,
        default_folder_key: string,
        default_note_key: string
    ) => void;
    renameRepo: (curDataPath: string, repo_key: string, new_repo_name: string) => void;
    reorderRepo: (data_path: string, repo_key: string, new_repos_key: string[]) => void;
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
    reorderFolder: (data_path: string, repo_key: string, new_folders_key: string[]) => void;
    deleteFolder: (curDataPath: string, repo_key: string, folder_key: string) => any;
    newNote: (
        curDataPath: string,
        repo_key: string,
        folder_key: string,
        new_note_key: string,
        note_title: string
    ) => void;
    renameNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        new_title: string
    ) => void;
    reorderNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        new_notes_key: string[]
    ) => void;
    deleteNote: (
        curDataPath: string,
        repo_key: string,
        folder_key: string,
        note_key: string
    ) => any;
    notes: notesTypes;
    initNotes: (_notes: notesTypes) => void;
    updateNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        currentContent: string
    ) => void;
    allRepoNotesFetch: (data_path: string | null, repos_obj: whalenoteObjType) => any;
    repoNotesFetch: (
        data_path: string | null,
        history: historyTypes,
        repos_obj: whalenoteObjType,
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
    platformName: string;
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
    history: { cur_repo_key: '', repos_record: {} },
    repoSwitch: () => {},
    folderSwitch: () => {},
    noteSwitch: () => {},
    currentRepoKey: '',
    currentFolderKey: '',
    currentNoteKey: '',
    whalenote: { repos_key: [], repos_obj: {} },
    initWhalenote: () => {},
    newRepo: () => {},
    renameRepo: () => {},
    reorderRepo: () => {},
    deleteRepo: () => {
        return '';
    },
    newFolder: () => {},
    renameFolder: () => {},
    reorderFolder: () => {},
    deleteFolder: () => {
        return '';
    },
    newNote: () => {},
    renameNote: () => {},
    reorderNote: () => {},
    deleteNote: () => {
        return '';
    },
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
    platformName: '',
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
        whalenote,
        {
            initWhalenote,
            newRepo,
            renameRepo,
            reorderRepo,
            deleteRepo,
            newFolder,
            renameFolder,
            reorderFolder,
            deleteFolder,
            newNote,
            renameNote,
            reorderNote,
            deleteNote,
        },
    ] = useWhalenote();

    useEffect(() => {
        console.log('dataPathChangeFlag');
        console.log(data.current);
        if (data.current) {
            addDataPathToList(curDataPath);
            initHistory(data.current.history);
            initWhalenote(data.current.whalenote);
            initNotes(data.current.notes);
        }
    }, [dataPathChangeFlag]);

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

    const [platformName, setPlatformName] = useState<string>('');
    useEffect(() => {
        (async () => {
            setPlatformName(await window.electronAPI.getPlatform());
        })();
    }, []);

    const repoSwitch = useCallback(
        async (repo_key: string | undefined) => {
            await repoNotesFetch(curDataPath, history, whalenote, repo_key);
            await switchRepo(curDataPath, repo_key);
        },
        [curDataPath, history, whalenote]
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
            whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj[
                currentNoteKey
            ]?.title
                ? whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj[
                      currentNoteKey
                  ].title
                : '新建文档',
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, whalenote]
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
                history,
                repoSwitch,
                folderSwitch,
                noteSwitch,
                currentRepoKey,
                currentFolderKey,
                currentNoteKey,
                whalenote,
                initWhalenote,
                newRepo,
                renameRepo,
                reorderRepo,
                deleteRepo,
                newFolder,
                renameFolder,
                reorderFolder,
                deleteFolder,
                newNote,
                renameNote,
                reorderNote,
                deleteNote,
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
                platformName,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};
