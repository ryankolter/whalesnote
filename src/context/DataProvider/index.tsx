// DataContext.tsx
import React, { createContext, useEffect, useCallback, useState, useMemo } from 'react';
import { fetchContentInFolder, addContentMap, fetchContentAfterNew } from '@/lib';
import { useAtom } from 'jotai';
import { activeWhaleIdAtom } from '@/atoms';
import {
    createDefaultWhale,
    dataPathExisted,
    dataPathHasWhale,
    importWhale,
    updateWhale,
} from './_helpers';
import { useHistory, useWhalesnote } from './_hooks';
import { WhaleObject } from '@/interface';
import i18next from 'i18next';

interface DataContextType {
    dataFetchFinished: boolean;
    whales: Record<string, WhaleObject>;
    curDataPath: string;
    whalesnote: WhaleObject;
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
    }[];
}

const DataContext = createContext<DataContextType>({
    dataFetchFinished: false,
    whales: {},
    curDataPath: '',
    whalesnote: { path: '', repo_keys: [], repo_map: {} },
    newRepo: async () => {},
    newFolder: async () => {},
    newNote: async () => {},
    renameRepo: async () => {},
    renameFolder: async () => {},
    renameNote: async () => {},
    reorderRepo: async () => {},
    reorderFolder: async () => {},
    reorderNote: async () => {},
    deleteRepo: () => {
        return '';
    },
    deleteFolder: () => {
        return '';
    },
    deleteNote: () => {
        return '';
    },
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
    const [dataFetchFinished, setDataFetchFinished] = useState(false);
    const [dataIsLoading, setDataIsLoading] = useState(true);
    const [id, setId] = useAtom(activeWhaleIdAtom);

    const { histories, addHistory, updateHistory } = useHistory();
    const {
        whales,
        addWhale,
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

    useEffect(() => {
        (async () => {
            setDataIsLoading(true);
            let dataPathList: string[] = [];
            try {
                dataPathList = JSON.parse(
                    window.localStorage.getItem('whalesnote_data_path_list') || '[]',
                );
            } catch (e) {
                window.localStorage.setItem('whalesnote_data_path_list', '[]');
            }

            const priorityWhaleList = [];
            for (const path of dataPathList) {
                if (!(await dataPathExisted(path))) continue;

                const whaleInfo = await window.electronAPI.readJsonSync(
                    `${path}/whalesnote_info.json`,
                );
                if (!whaleInfo) continue;

                await updateWhale(path, whaleInfo);

                const iterWhaleObj = {
                    path,
                    id: whaleInfo.id,
                    info: whaleInfo,
                };
                id === whaleInfo.id
                    ? priorityWhaleList.unshift(iterWhaleObj)
                    : priorityWhaleList.push(iterWhaleObj);
            }

            if (priorityWhaleList.length < dataPathList.length) {
                window.localStorage.setItem(
                    'whalesnote_data_path_list',
                    JSON.stringify(priorityWhaleList),
                );
            }

            if (priorityWhaleList.length === 0) {
                const defaultDataPath = await window.electronAPI.getDefaultDataPath();
                if (!dataPathHasWhale(defaultDataPath)) await createDefaultWhale(defaultDataPath);
                const whaleInfo = await window.electronAPI.readJsonSync(
                    `${defaultDataPath}/whalesnote_info.json`,
                );
                priorityWhaleList.push({
                    path: defaultDataPath,
                    id: whaleInfo.id,
                    info: whaleInfo,
                });

                window.localStorage.setItem(
                    'whalesnote_data_path_list',
                    JSON.stringify(priorityWhaleList),
                );
            }

            if (!priorityWhaleList.find((obj) => obj.id === id))
                setId(priorityWhaleList?.[0].id || '');

            for (const { path, id, info } of priorityWhaleList) {
                const { whaleObj, historyInfo, contentMap } = await importWhale(path, info);
                addHistory(id, historyInfo);
                addWhale(id, whaleObj);
                addContentMap(id, contentMap);
            }

            setDataFetchFinished(true);
            setDataIsLoading(false);
        })();
    }, []);

    const workspaceItemList = useMemo(
        () =>
            Object.entries(whales).map(([id, whale]) => ({
                id,
                name: whale.path.substring(whale.path.lastIndexOf('/') + 1),
            })),
        [whales],
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
                .title
            ? whales[id].repo_map[curRepoKey].folder_map[curFolderKey].note_map[curNoteKey].title
            : i18next.t('note.untitled');
    }, [whales, id, curRepoKey, curFolderKey, curNoteKey]);

    return (
        <DataContext.Provider
            value={{
                dataFetchFinished,
                whales,
                curDataPath,
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
