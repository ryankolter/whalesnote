import React, { createContext, useEffect, useCallback, useState, useMemo, useRef } from 'react';
import { fetchContentInFolder, addContentMap, fetchContentAfterNew, removeContentMap } from '@/lib';
import { useAtom } from 'jotai';
import { activeWhaleIdAtom, dataPathListAtom } from '@/atoms';
import {
    createDefaultWhale,
    dataPathExisted,
    dataPathHasWhale,
    importBirthWhale,
    updateWhaleKeyName,
} from './_helpers';
import { useDataPath, useHistory, useWhalesnote } from './_hooks';
import { Whale } from '@/interface';
import i18next from 'i18next';

interface DataContextType {
    dataIsLoading: boolean;
    whales: Record<string, Whale>;
    curDataPath: string;
    addWorkspace: (path: string) => void;
    removeWorkspace: (id: string) => void;
    whalesnote: Whale;
    newRepo: (id: string, repoKey: string, repoName: string) => Promise<void>;
    newFolder: (
        id: string,
        repoKey: string,
        new_folder_key: string,
        new_folder_name: string,
    ) => Promise<void>;
    newNote: (
        id: string,
        repoKey: string,
        folderKey: string,
        new_note_key: string,
        note_title: string,
    ) => Promise<void>;
    renameRepo: (id: string, repoKey: string, newRepoName: string) => Promise<void>;
    renameFolder: (
        id: string,
        repoKey: string,
        folderKey: string,
        newFolderName: string,
    ) => Promise<void>;
    renameNote: (
        id: string,
        repoKey: string,
        folderKey: string,
        noteKey: string,
        newNotetitle: string,
    ) => Promise<void>;
    reorderRepo: (id: string, repoKey: string, newRepoKeys: string[]) => Promise<void>;
    reorderFolder: (id: string, repoKey: string, newFolderKeys: string[]) => Promise<void>;
    reorderNote: (
        id: string,
        repoKey: string,
        folderKey: string,
        newNoteKeys: string[],
    ) => Promise<void>;
    deleteRepo: (id: string, repoKey: string) => any;
    deleteFolder: (id: string, repoKey: string, folderKey: string) => any;
    deleteNote: (id: string, repoKey: string, folderKey: string, noteKey: string) => any;
    curRepoKey: string;
    curFolderKey: string;
    curNoteKey: string;
    currentTitle: string;
    switchRepo: (repoKey: string) => Promise<void>;
    switchFolder: (repoKey: string, folderKey?: string) => Promise<void>;
    switchNote: (repoKey: string, folderKey?: string, noteKey?: string) => Promise<void>;
    prepareContent: (repoKey: string, folderKey?: string, noteKey?: string) => Promise<void>;
    workspaceItemList: {
        id: string;
        name: string;
        path: string;
    }[];
}

const DataContext = createContext<DataContextType>({
    dataIsLoading: false,
    whales: {},
    curDataPath: '',
    addWorkspace: () => {},
    removeWorkspace: () => {},
    whalesnote: { id: '', name: '', path: '', repo_keys: [], repo_map: {} },
    newRepo: async () => {},
    newFolder: async () => {},
    newNote: async () => {},
    renameRepo: async () => {},
    renameFolder: async () => {},
    renameNote: async () => {},
    reorderRepo: async () => {},
    reorderFolder: async () => {},
    reorderNote: async () => {},
    deleteRepo: () => '',
    deleteFolder: () => '',
    deleteNote: () => '',
    curRepoKey: '',
    curFolderKey: '',
    curNoteKey: '',
    currentTitle: '',
    switchRepo: async () => {},
    switchFolder: async () => {},
    switchNote: async () => {},
    prepareContent: async () => {},
    workspaceItemList: [],
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const defaultPathInitializedRef = useRef(false);
    const dataIsLoadingRef = useRef(false);
    const [dataIsLoading, setDataIsLoading] = useState(true);
    const [id, setId] = useAtom(activeWhaleIdAtom);

    const { dataPathList, addDataPath, removeDataPath } = useDataPath();
    const { histories, addHistory, removeHistory, updateHistory } = useHistory();
    const {
        whales,
        addWhale,
        removeWhale,
        fetchFolderMap,
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
    } = useWhalesnote();

    const loadWhales = useCallback(
        async (pathList: string[]) => {
            if (pathList.length === 0) return;
            if (dataIsLoadingRef.current) return;

            dataIsLoadingRef.current = true;
            setDataIsLoading(true);
            const birthWhaleList = [];
            for (const path of pathList) {
                if (!(await dataPathExisted(path))) continue;
                if (!(await dataPathHasWhale(path))) await createDefaultWhale(path);

                let whaleInfo = await window.electronAPI.readJsonSync(
                    `${path}/whalesnote_info.json`,
                );
                if (!whaleInfo || !whaleInfo.id || whales[whaleInfo.id]) continue;

                whaleInfo = await updateWhaleKeyName(path, whaleInfo);
                const birthWhale = {
                    ...whaleInfo,
                    path,
                };

                id === whaleInfo.id
                    ? birthWhaleList.unshift(birthWhale)
                    : birthWhaleList.push(birthWhale);
            }

            if (Object.keys(whales).length === 0) {
                if (!birthWhaleList.find((whale) => whale.id === id))
                    setId(birthWhaleList[0].id || '');
            }

            let oldIdIsValid = false;
            let firstCancidateId;

            for (const birthWhale of birthWhaleList) {
                if (Object.keys(whales).includes(birthWhale.id)) continue;
                const { whale, historyInfo, contentMap } = await importBirthWhale(birthWhale);
                addWhale(whale.id, whale);
                addHistory(whale.id, historyInfo);
                addContentMap(whale.id, contentMap);

                if (whale.id === id) oldIdIsValid = true;
                if (!firstCancidateId) firstCancidateId = whale.id;
            }
            if (!oldIdIsValid && firstCancidateId) setId(firstCancidateId);

            dataIsLoadingRef.current = false;
            setDataIsLoading(false);
        },
        [whales, addWhale, addHistory, addContentMap],
    );

    useEffect(() => {
        const initializeOnFirstLoad = async () => {
            if (dataPathList.length === 0 && Object.keys(whales).length === 0) {
                const defaultDataPath = await window.electronAPI.getDefaultDataPath();
                if (!(await dataPathHasWhale(defaultDataPath)))
                    await createDefaultWhale(defaultDataPath);
                addDataPath(defaultDataPath);
                loadWhales([defaultDataPath]);
            } else {
                loadWhales(dataPathList);
            }
        };

        if (defaultPathInitializedRef.current) return;
        defaultPathInitializedRef.current = true;
        initializeOnFirstLoad();
    }, []);

    const addWorkspace = useCallback(
        (path: string) => {
            addDataPath(path);
            loadWhales([path]);
        },
        [addDataPath, loadWhales],
    );

    const removeWorkspace = useCallback(
        (id: string) => {
            const whaleEntriesRemaining = Object.entries(whales)
                .filter(([whaleId]) => whaleId !== id)
                .sort(
                    (itemA, itemB) =>
                        dataPathList.indexOf(itemA[1].path) - dataPathList.indexOf(itemB[1].path),
                );
            if (whaleEntriesRemaining.length > 0) setId(whaleEntriesRemaining[0][0]);

            const whaleEntriesRemove = Object.entries(whales).filter(([whaleId]) => whaleId === id);
            whaleEntriesRemove.forEach(([id, whale]) => {
                removeDataPath(whale.path);
                removeWhale(id);
                removeHistory(id);
                removeContentMap(id);
            });
        },
        [whales, dataPathList, removeDataPath, removeWhale, removeHistory, removeContentMap],
    );

    const workspaceItemList = useMemo(
        () =>
            Object.entries(whales)
                .map(([id, whale]) => ({
                    id,
                    name: whale.name,
                    path: whale.path,
                }))
                .sort(
                    (itemA, itemB) =>
                        dataPathList.indexOf(itemA.path) - dataPathList.indexOf(itemB.path),
                ),
        [whales, dataPathList],
    );

    const whalesnote = useMemo(() => {
        return whales[id] || { path: '', repo_keys: [], repo_map: {} };
    }, [whales, id]);

    const switchRepo = useCallback(
        async (repoKey?: string) => {
            if (!repoKey) return;
            if (!whales[id] || !histories[id]) return;

            const folderKeys = whales[id].repo_map[repoKey].folder_keys;
            const targetFolderKey =
                histories[id].repos_record[repoKey]?.cur_folder_key || folderKeys?.[0];

            await fetchFolderMap(id, repoKey, targetFolderKey);
            await fetchContentInFolder(id, whales[id].path, repoKey, targetFolderKey);
            await updateHistory(id, whales[id].path, repoKey);
        },
        [id, whales, histories, fetchFolderMap, updateHistory],
    );

    const switchFolder = useCallback(
        async (repoKey?: string, folderKey?: string) => {
            if (!repoKey || !folderKey) return;
            if (!whales[id]) return;

            await fetchFolderMap(id, repoKey, folderKey);
            await fetchContentInFolder(id, whales[id].path, repoKey, folderKey);
            await updateHistory(id, whales[id].path, repoKey, folderKey);
        },
        [id, whales, fetchFolderMap, updateHistory],
    );

    const switchNote = useCallback(
        async (
            repoKey: string | undefined,
            folderKey: string | undefined,
            noteKey: string | undefined,
        ) => {
            if (!repoKey || !folderKey || !noteKey) return;
            await fetchFolderMap(id, repoKey, folderKey);
            await fetchContentInFolder(id, whales[id].path, repoKey, folderKey);
            await updateHistory(id, whales[id].path, repoKey, folderKey, noteKey);
        },
        [id, whales, fetchFolderMap, updateHistory],
    );

    const prepareContent = useCallback(
        async (
            repoKey: string | undefined,
            folderKey: string | undefined,
            noteKey: string | undefined,
        ) => {
            if (!repoKey || !folderKey || !noteKey) return;
            if (!whales[id]) return;
            await fetchContentAfterNew(id, whales[id].path, repoKey, folderKey, noteKey);
        },
        [id, whales],
    );

    const curDataPath = useMemo(() => {
        return whales[id]?.path || '';
    }, [whales, id]);

    const history = useMemo(() => {
        return histories[id];
    }, [histories, id]);

    const curRepoKey = useMemo(() => {
        return history?.cur_repo_key || '';
    }, [history]);

    const curFolderKey = useMemo(() => {
        const curRepoKey = history?.cur_repo_key;
        return history?.repos_record?.[curRepoKey]?.cur_folder_key || '';
    }, [history]);

    const curNoteKey = useMemo(() => {
        const curRepoKey = history?.cur_repo_key;
        const curFolderKey = history?.repos_record[curRepoKey]?.cur_folder_key;
        return history?.repos_record?.[curRepoKey]?.folders?.[curFolderKey];
    }, [history]);

    const currentTitle = useMemo(() => {
        if (!whales[id]) return i18next.t('note.untitled');
        const keyExisted = curRepoKey && curFolderKey && curNoteKey;

        return keyExisted &&
            whales[id].repo_keys?.length > 0 &&
            whales[id].repo_map?.[curRepoKey]?.folder_map?.[curFolderKey]?.note_map?.[curNoteKey]
                ?.title
            ? whales[id].repo_map[curRepoKey].folder_map[curFolderKey].note_map[curNoteKey].title
            : i18next.t('note.untitled');
    }, [whales, id, curRepoKey, curFolderKey, curNoteKey]);

    return (
        <DataContext.Provider
            value={{
                dataIsLoading,
                whales,
                curDataPath,
                addWorkspace,
                removeWorkspace,
                whalesnote,
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
                curRepoKey,
                curFolderKey,
                curNoteKey,
                currentTitle,
                switchRepo,
                switchFolder,
                switchNote,
                prepareContent,
                workspaceItemList,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};

export const useDataContext = () => React.useContext(DataContext);
