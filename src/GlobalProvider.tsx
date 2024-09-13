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
import { WhaleObject, HistoryInfo } from './commonType';
import useData from '@/context/DataPathProvider/useData';
import useDataList from './lib/useDataList';
import useHistory from './lib/useHistory';
import useWhalesnote from './lib/useWhalesnote';

import i18next from './i18n';

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
    whalesnote: WhaleObject;
    initwhalesnote: (newWhalesnote: WhaleObject) => void;
    newRepo: (curDataPath: string, repo_key: string, repo_name: string) => void;
    newFolder: (
        curDataPath: string,
        repo_key: string,
        new_folder_key: string,
        new_folder_name: string,
    ) => void;
    newNote: (
        curDataPath: string,
        repo_key: string,
        folder_key: string,
        new_note_key: string,
        note_title: string,
    ) => void;
    renameRepo: (curDataPath: string, repo_key: string, new_repo_name: string) => void;
    renameFolder: (
        curDataPath: string,
        repo_key: string,
        folder_key: string,
        new_folder_name: string,
    ) => void;
    renameNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
        new_title: string,
    ) => void;
    reorderRepo: (data_path: string, repo_key: string, new_repo_keys: string[]) => void;
    reorderFolder: (data_path: string, repo_key: string, new_folder_keys: string[]) => void;
    reorderNote: (
        data_path: string,
        repo_key: string,
        folder_key: string,
        new_note_keys: string[],
    ) => void;
    deleteRepo: (curDataPath: string, repo_key: string) => any;
    deleteFolder: (curDataPath: string, repo_key: string, folder_key: string) => any;
    deleteNote: (
        curDataPath: string,
        repo_key: string,
        folder_key: string,
        note_key: string,
    ) => any;
    history: HistoryInfo;
    currentRepoKey: string;
    currentFolderKey: string;
    currentNoteKey: string;
    currentTitle: string;
    switchRepo: (repo_key: string) => void;
    switchFolder: (repo_key: string, folderKey: string | undefined) => void;
    switchNote: (
        repo_key: string,
        folder_key: string | undefined,
        note_key: string | undefined,
    ) => void;
    changeNotesAfterNew: (
        action_name: string,
        obj: {
            data_path: string;
            repo_key: string;
            folder_key?: string;
            note_key?: string;
        },
    ) => void;
    platformName: string;
    whalesnoteId: string;
    focus: string;
    manualFocus: (delay: number) => void;
    blur: string;
    manualBlur: (delay: number) => void;
    showSearchPanel: boolean;
    setShowSearchPanel: Dispatch<SetStateAction<boolean>>;
    showSearchResultHighlight: boolean;
    setShowSearchResultHighlight: Dispatch<SetStateAction<boolean>>;
    showRepoPanel: boolean;
    setShowRepoPanel: Dispatch<SetStateAction<boolean>>;
    showKeySelect: boolean;
    setShowKeySelect: Dispatch<SetStateAction<boolean>>;
    keySelectNumArray: number[];
    setKeySelectNumArray: Dispatch<SetStateAction<number[]>>;
} = {
    curDataPath: '',
    setCurDataPath: () => {},
    dataPathChangeFlag: 0,
    dataInitingFlag: false,
    dataSwitchingFlag: false,
    setDataSwitchingFlag: () => {},
    dataPathList: [],
    removeDataPathFromList: () => {},
    whalesnote: { repo_keys: [], repo_map: {} },
    initwhalesnote: () => {},
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
    switchRepo: () => {},
    switchFolder: () => {},
    switchNote: () => {},
    changeNotesAfterNew: () => {},
    platformName: '',
    whalesnoteId: '',
    focus: '',
    manualFocus: () => {},
    blur: '',
    manualBlur: () => {},
    showSearchPanel: false,
    setShowSearchPanel: () => {},
    showSearchResultHighlight: false,
    setShowSearchResultHighlight: () => {},
    showRepoPanel: false,
    setShowRepoPanel: () => {},
    showKeySelect: false,
    setShowKeySelect: () => {},
    keySelectNumArray: [],
    setKeySelectNumArray: () => {},
};
export const GlobalContext = createContext(initContext);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
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
    const [history, { initHistory, repoSwitch, folderSwitch, noteSwitch }] = useHistory();
    const [
        whalesnote,
        {
            initwhalesnote,
            fetchNotesInfoInFolder,
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
    ] = useWhalesnote();

    const [platformName, setPlatformName] = useState<string>('');
    const [whalesnoteId, setWhaltenoteId] = useState<string>('');

    const [focus, setFocus] = useState<string>('');
    const [blur, setBlur] = useState<string>('');

    const [showSearchPanel, setShowSearchPanel] = useState(false);
    const [showSearchResultHighlight, setShowSearchResultHighlight] = useState(false);
    const [showRepoPanel, setShowRepoPanel] = useState(false);
    const [showKeySelect, setShowKeySelect] = useState<boolean>(false);
    const [keySelectNumArray, setKeySelectNumArray] = useState<number[]>([]);

    useEffect(() => {
        if (data.current) {
            addDataPathToList(curDataPath);
            setWhaltenoteId(data.current.id);
            initHistory(data.current.history);
            initwhalesnote(data.current.whalesnote);
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

    const switchRepo = useCallback(
        async (repo_key: string) => {
            const folder_keys = whalesnote.repo_map[repo_key].folder_keys;
            const fetch_folder_key =
                history.repos_record[repo_key]?.cur_folder_key ||
                (folder_keys.length > 0 ? folder_keys[0] : undefined);
            await fetchNotesInfoInFolder(curDataPath, repo_key, fetch_folder_key);
            await fetchNotesInfolder(curDataPath, repo_key, fetch_folder_key);
            await repoSwitch(curDataPath, repo_key);
        },
        [curDataPath, history, whalesnote],
    );

    const switchFolder = useCallback(
        async (repo_key: string, folder_key: string | undefined) => {
            await fetchNotesInfoInFolder(curDataPath, repo_key, folder_key);
            await fetchNotesInfolder(curDataPath, repo_key, folder_key);
            await folderSwitch(curDataPath, repo_key, folder_key);
        },
        [curDataPath],
    );

    const switchNote = useCallback(
        async (repo_key: string, folder_key: string | undefined, note_key: string | undefined) => {
            await fetchNotesInfoInFolder(curDataPath, repo_key, folder_key);
            await fetchNotesInfolder(curDataPath, repo_key, folder_key);
            await noteSwitch(curDataPath, repo_key, folder_key, note_key);
        },
        [curDataPath],
    );

    const manualFocus = useCallback(
        (delay: number) => {
            setTimeout(() => {
                setFocus(
                    cryptoRandomString({
                        length: 24,
                        type: 'alphanumeric',
                    }),
                );
            }, delay);
        },
        [setFocus],
    );

    const manualBlur = useCallback(
        (delay: number) => {
            if (delay >= 0) {
                setTimeout(() => {
                    setBlur(
                        cryptoRandomString({
                            length: 24,
                            type: 'alphanumeric',
                        }),
                    );
                }, delay);
            }
        },
        [setBlur],
    );

    console.log(whalesnote);

    const currentTitle = useMemo(
        () =>
            currentRepoKey &&
            currentFolderKey &&
            currentNoteKey &&
            whalesnote.repo_keys?.length > 0 &&
            whalesnote.repo_map[currentRepoKey]?.folder_map &&
            whalesnote.repo_map[currentRepoKey]?.folder_map[currentFolderKey]?.note_map &&
            whalesnote.repo_map[currentRepoKey].folder_map[currentFolderKey].note_map[
                currentNoteKey
            ]?.title
                ? whalesnote.repo_map[currentRepoKey]?.folder_map[currentFolderKey]?.note_map[
                      currentNoteKey
                  ].title
                : i18next.t('note.untitled'),
        [curDataPath, currentRepoKey, currentFolderKey, currentNoteKey, whalesnote],
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
                whalesnote,
                initwhalesnote,
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
                switchRepo,
                switchFolder,
                switchNote,
                changeNotesAfterNew,
                whalesnoteId,
                platformName,
                focus,
                manualFocus,
                blur,
                manualBlur,
                showSearchPanel,
                setShowSearchPanel,
                showSearchResultHighlight,
                setShowSearchResultHighlight,
                showRepoPanel,
                setShowRepoPanel,
                showKeySelect,
                setShowKeySelect,
                keySelectNumArray,
                setKeySelectNumArray,
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};
