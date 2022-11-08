import {
    createContext,
    Dispatch,
    SetStateAction,
    useCallback,
    useState,
    useMemo,
    useEffect,
} from 'react';
import cryptoRandomString from 'crypto-random-string';
import { whalenoteObjType, historyTypes, notesTypes } from './commonType';
import useData from './lib/useData';
import useDataList from './lib/useDataList';
import useHistory from './lib/useHistory';
import useWhalenote from './lib/useWhalenote';

import { fetchNotesInfolder, changeNotesAfterNew, initNotes } from './lib/notes';

const initContext: {
    curDataPath: string;
    setCurDataPath: Dispatch<SetStateAction<string>>;
    dataPathChangeFlag: number;
    dataInitingFlag: boolean;
    dataSwitchingFlag: boolean;
    setDataSwitchingFlag: Dispatch<SetStateAction<boolean>>;
    dataPathList: string[];
    removeDataPathFromList: (data_path: string) => void;
    whalenote: whalenoteObjType;
    initWhalenote: (newRepos: whalenoteObjType) => void;
    newRepo: (curDataPath: string, repo_key: string, repo_name: string) => void;
    newFolder: (
        curDataPath: string,
        repo_key: string,
        new_folder_key: string,
        new_folder_name: string
    ) => void;
    newNote: (
        curDataPath: string,
        repo_key: string,
        folder_key: string,
        new_note_key: string,
        note_title: string
    ) => void;
    renameRepo: (curDataPath: string, repo_key: string, new_repo_name: string) => void;
    renameFolder: (
        curDataPath: string,
        repo_key: string,
        folder_key: string,
        new_folder_name: string
    ) => void;
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
    deleteRepo: (curDataPath: string, repo_key: string) => any;
    deleteFolder: (curDataPath: string, repo_key: string, folder_key: string) => any;
    deleteNote: (
        curDataPath: string,
        repo_key: string,
        folder_key: string,
        note_key: string
    ) => any;
    history: historyTypes;
    currentRepoKey: string;
    currentFolderKey: string;
    currentNoteKey: string;
    currentTitle: string;
    repoSwitch: (repo_key: string) => void;
    folderSwitch: (repo_key: string, folderKey: string | undefined) => void;
    noteSwitch: (
        repo_key: string,
        folder_key: string | undefined,
        note_key: string | undefined
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
    platformName: string;
    whalenoteId: string;
    focus: string;
    manualFocus: (delay: number) => void;
    blur: string;
    manualBlur: (delay: number) => void;
    showSearchPanel: boolean;
    setShowSearchPanel: Dispatch<SetStateAction<boolean>>;
    showRepoPanel: boolean;
    setShowRepoPanel: Dispatch<SetStateAction<boolean>>;
    showKeySelect: boolean;
    setShowKeySelect: Dispatch<SetStateAction<boolean>>;
    keySelectNumArray: number[];
    setKeySelectNumArray: Dispatch<SetStateAction<number[]>>;
    theme: string;
    setTheme: Dispatch<SetStateAction<string>>;
    editorFontSize: number;
    setEditorFontSize: Dispatch<SetStateAction<number>>;
    renderFontSize: number;
    setRenderFontSize: Dispatch<SetStateAction<number>>;
} = {
    curDataPath: '',
    setCurDataPath: () => {},
    dataPathChangeFlag: 0,
    dataInitingFlag: false,
    dataSwitchingFlag: false,
    setDataSwitchingFlag: () => {},
    dataPathList: [],
    removeDataPathFromList: () => {},
    whalenote: { repos_key: [], repos_obj: {} },
    initWhalenote: () => {},
    newRepo: () => {},
    newFolder: () => {},
    newNote: () => {},
    renameRepo: () => {},
    renameFolder: () => {},
    renameNote: () => {},
    reorderRepo: () => {},
    reorderFolder: () => {},
    reorderNote: () => {},
    deleteRepo: () => {
        return '';
    },
    deleteFolder: () => {
        return '';
    },
    deleteNote: () => {
        return '';
    },
    history: { cur_repo_key: '', repos_record: {} },
    currentRepoKey: '',
    currentFolderKey: '',
    currentNoteKey: '',
    currentTitle: '',
    repoSwitch: () => {},
    folderSwitch: () => {},
    noteSwitch: () => {},
    changeNotesAfterNew: () => {},
    platformName: '',
    whalenoteId: '',
    focus: '',
    manualFocus: () => {},
    blur: '',
    manualBlur: () => {},
    setRenderFontSize: () => {},
    showSearchPanel: false,
    setShowSearchPanel: () => {},
    showRepoPanel: false,
    setShowRepoPanel: () => {},
    showKeySelect: false,
    setShowKeySelect: () => {},
    keySelectNumArray: [],
    setKeySelectNumArray: () => {},
    theme: '',
    setTheme: () => {},
    editorFontSize: 15,
    setEditorFontSize: () => {},
    renderFontSize: 15,
};
export const GlobalContext = createContext(initContext);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
    console.log('GlobalProvider render');
    const [
        data,
        curDataPath,
        setCurDataPath,
        dataPathChangeFlag,
        dataInitingFlag,
        dataSwitchingFlag,
        setDataSwitchingFlag,
    ] = useData();
    const [dataPathList, addDataPathToList, removeDataPathFromList] = useDataList();
    const [history, { initHistory, switchRepo, switchFolder, switchNote }] = useHistory();
    const [
        whalenote,
        {
            initWhalenote,
            newRepo,
            newFolder,
            newNote,
            renameRepo,
            renameFolder,
            renameNote,
            reorderRepo,
            reorderFolder,
            reorderNote,
            deleteRepo,
            deleteFolder,
            deleteNote,
        },
    ] = useWhalenote();

    const [platformName, setPlatformName] = useState<string>('');
    const [whalenoteId, setWhaltenoteId] = useState<string>('');

    const [focus, setFocus] = useState<string>('');
    const [blur, setBlur] = useState<string>('');

    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [showRepoPanel, setShowRepoPanel] = useState(false);
    const [showKeySelect, setShowKeySelect] = useState<boolean>(false);
    const [keySelectNumArray, setKeySelectNumArray] = useState<number[]>([]);

    const [theme, setTheme] = useState('grey');
    const [editorFontSize, setEditorFontSize] = useState<number>(
        Number(window.localStorage.getItem('editor_font_size')) || 15
    );
    const [renderFontSize, setRenderFontSize] = useState<number>(
        Number(window.localStorage.getItem('render_font_size')) || 15
    );

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
        return cur_repo_key;
    }, [history]);

    const currentFolderKey = useMemo(() => {
        const cur_folder_key = history.repos_record[history.cur_repo_key]?.cur_folder_key;
        return cur_folder_key;
    }, [history]);

    const currentNoteKey = useMemo(() => {
        const cur_folder_key = history.repos_record[history.cur_repo_key]?.cur_folder_key;
        const cur_note_key = history.repos_record[history.cur_repo_key]?.folders[cur_folder_key];
        return cur_note_key;
    }, [history]);

    const repoSwitch = useCallback(
        async (repo_key: string) => {
            const folders_key = whalenote.repos_obj[repo_key].folders_key;
            const fetch_folder_key =
                history.repos_record[repo_key]?.cur_folder_key ||
                (folders_key.length > 0 ? folders_key[0] : undefined);
            await fetchNotesInfolder(curDataPath, repo_key, fetch_folder_key);
            await switchRepo(curDataPath, repo_key);
        },
        [curDataPath, history, whalenote]
    );

    const folderSwitch = useCallback(
        async (repo_key: string, folder_key: string | undefined) => {
            await fetchNotesInfolder(curDataPath, repo_key, folder_key);
            await switchFolder(curDataPath, repo_key, folder_key);
        },
        [curDataPath]
    );

    const noteSwitch = useCallback(
        async (repo_key: string, folder_key: string | undefined, note_key: string | undefined) => {
            await fetchNotesInfolder(curDataPath, repo_key, folder_key);
            await switchNote(curDataPath, repo_key, folder_key, note_key);
        },
        [curDataPath]
    );

    const manualFocus = useCallback(
        (delay: number) => {
            setTimeout(() => {
                setFocus(
                    cryptoRandomString({
                        length: 24,
                        type: 'alphanumeric',
                    })
                );
            }, delay);
        },
        [setFocus]
    );

    const manualBlur = useCallback(
        (delay: number) => {
            setTimeout(() => {
                setBlur(
                    cryptoRandomString({
                        length: 24,
                        type: 'alphanumeric',
                    })
                );
            }, delay);
        },
        [setBlur]
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
                : '空笔记',
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, whalenote]
    );

    return (
        <GlobalContext.Provider
            value={{
                curDataPath,
                setCurDataPath,
                dataPathChangeFlag,
                dataInitingFlag,
                dataSwitchingFlag,
                setDataSwitchingFlag,
                dataPathList,
                removeDataPathFromList,
                whalenote,
                initWhalenote,
                newRepo,
                newFolder,
                newNote,
                renameRepo,
                renameFolder,
                renameNote,
                reorderRepo,
                reorderFolder,
                reorderNote,
                deleteRepo,
                deleteFolder,
                deleteNote,
                history,
                currentRepoKey,
                currentFolderKey,
                currentNoteKey,
                currentTitle,
                repoSwitch,
                folderSwitch,
                noteSwitch,
                changeNotesAfterNew,
                whalenoteId,
                platformName,
                focus,
                manualFocus,
                blur,
                manualBlur,
                showSearchPanel,
                setShowSearchPanel,
                showRepoPanel,
                setShowRepoPanel,
                showKeySelect,
                setShowKeySelect,
                keySelectNumArray,
                setKeySelectNumArray,
                editorFontSize,
                setEditorFontSize,
                renderFontSize,
                setRenderFontSize,
                theme,
                setTheme,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};
