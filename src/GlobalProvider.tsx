import {
    createContext,
    Dispatch,
    SetStateAction,
    useCallback,
    useState,
    useMemo,
    useEffect,
} from 'react';
import { whalenoteObjType, historyTypes, notesTypes } from './commonType';
import useData from './lib/useData';
import useDataList from './lib/useDataList';
import useHistory from './lib/useHistory';
import useWhalenote from './lib/useWhalenote';

import { fetchNotesInRepo, fetchNotesInfolder, changeNotesAfterNew, initNotes } from './lib/notes';

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
    whalenote: whalenoteObjType;
    initWhalenote: (newRepos: whalenoteObjType) => void;
    newRepo: (curDataPath: string, repo_key: string, repo_name: string) => void;
    renameRepo: (curDataPath: string, repo_key: string, new_repo_name: string) => void;
    reorderRepo: (data_path: string, repo_key: string, new_repos_key: string[]) => void;
    deleteRepo: (curDataPath: string, repo_key: string) => any;
    newFolder: (
        curDataPath: string,
        repo_key: string,
        new_folder_key: string,
        new_folder_name: string
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
    fetchNotesInRepo: (
        data_path: string | null,
        history: historyTypes,
        repos_obj: whalenoteObjType,
        repo_key: string | undefined
    ) => void;
    fetchNotesInfolder: (
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
    whalenoteId: string;
    platformName: string;
    currentTitle: string;
    numArray: number[];
    setNumArray: Dispatch<SetStateAction<number[]>>;
    theme: string;
    setTheme: Dispatch<SetStateAction<string>>;
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
    showSearchPanel: boolean;
    setShowSearchPanel: Dispatch<SetStateAction<boolean>>;
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
    history: { cur_repo_key: '', repos_record: {} },
    repoSwitch: () => {},
    folderSwitch: () => {},
    noteSwitch: () => {},
    currentRepoKey: '',
    currentFolderKey: '',
    currentNoteKey: '',
    fetchNotesInRepo: () => {},
    fetchNotesInfolder: () => {},
    changeNotesAfterNew: () => {},
    whalenoteId: '',
    platformName: '',
    currentTitle: '',
    numArray: [],
    setNumArray: () => {},
    theme: '',
    setTheme: () => {},
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
    showSearchPanel: false,
    setShowSearchPanel: () => {},
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
    const [history, { initHistory, switchRepo, switchFolder, switchNote }] = useHistory();
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

    const [whalenoteId, setWhaltenoteId] = useState<string>('');
    const [platformName, setPlatformName] = useState<string>('');
    const [theme, setTheme] = useState('grey');
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
    const [showSearchPanel, setShowSearchPanel] = useState(false);

    useEffect(() => {
        if (data.current) {
            addDataPathToList(curDataPath);
            setWhaltenoteId(data.current.id);
            initHistory(data.current.history);
            initWhalenote(data.current.whalenote);
            initNotes(data.current.notes);
        }
    }, [dataPathChangeFlag]);

    useEffect(() => {
        (async () => {
            setPlatformName(await window.electronAPI.getPlatform());
        })();
    }, []);

    const currentRepoKey = useMemo(() => {
        const cur_repo_key = history.cur_repo_key;
        console.log('cur_repo_key: ' + cur_repo_key);
        return history.cur_repo_key;
    }, [history]);

    const currentFolderKey = useMemo(() => {
        const cur_folder_key = history.repos_record[history.cur_repo_key]?.cur_folder_key;
        console.log('cur_folder_key: ' + cur_folder_key);
        return cur_folder_key;
    }, [history]);

    const currentNoteKey = useMemo(() => {
        const cur_folder_key = history.repos_record[history.cur_repo_key]?.cur_folder_key;
        const cur_note_key = history.repos_record[history.cur_repo_key]?.folders[cur_folder_key];
        console.log('cur_note_key: ' + cur_note_key);
        return cur_note_key;
    }, [history]);

    const repoSwitch = useCallback(
        async (repo_key: string | undefined) => {
            await fetchNotesInRepo(curDataPath, history, whalenote, repo_key);
            await switchRepo(curDataPath, repo_key);
        },
        [curDataPath, history, whalenote]
    );

    const folderSwitch = useCallback(
        async (repo_key: string | undefined, folder_key: string | undefined) => {
            await fetchNotesInfolder(curDataPath, repo_key, folder_key);
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
            await fetchNotesInfolder(curDataPath, repo_key, folder_key);
            await switchNote(curDataPath, repo_key, folder_key, note_key);
        },
        [curDataPath]
    );

    const currentTitle = useMemo(
        () =>
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            whalenote.repos_key.length > 0 &&
            whalenote.repos_obj[currentRepoKey]?.folders_obj &&
            whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj &&
            whalenote.repos_obj[currentRepoKey].folders_obj[currentFolderKey].notes_obj[
                currentNoteKey
            ]?.title
                ? whalenote.repos_obj[currentRepoKey]?.folders_obj[currentFolderKey]?.notes_obj[
                      currentNoteKey
                  ].title
                : '新建文档',
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, whalenote]
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
                history,
                repoSwitch,
                folderSwitch,
                noteSwitch,
                currentRepoKey,
                currentFolderKey,
                currentNoteKey,
                fetchNotesInRepo,
                fetchNotesInfolder,
                changeNotesAfterNew,
                whalenoteId,
                platformName,
                currentTitle,
                numArray,
                setNumArray,
                theme,
                setTheme,
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
                showSearchPanel,
                setShowSearchPanel,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};
