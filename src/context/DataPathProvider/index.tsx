// DataContext.tsx
import React, { createContext, Dispatch, SetStateAction, useEffect, useCallback } from 'react';
import useData from './useData';
import useDataList from '@/lib/useDataList';
import { initNotes } from '@/lib/notes';
import createDefaultWhale from './createDefaultWhale';
import { useAtom } from 'jotai';
import { dataPathListAtom } from '@/atoms';
import { dataPathExisted, dataPathHasWhale, importWhale } from './importWhale';
import useWhalesnote from '@/lib/useWhalesnote';
import useHistory from '@/lib/useHistory';

interface DataPathContextType {
    curDataPath: string;
    dataPathList: string[];
    removeDataPathFromList: (data_path: string) => void;
}

const DataPathContext = createContext<DataPathContextType>({
    curDataPath: '',
    dataPathList: [],
    removeDataPathFromList: () => {},
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [dataPathList, setDataPathList] = useAtom(dataPathListAtom);

    const [history, { initHistory, repoSwitch, folderSwitch, noteSwitch }] = useHistory();
    const [
        whalesnote,
        {
            addWhale,
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

    useEffect(() => {
        (async () => {
            let dataPathList: string[] = [];
            try {
                dataPathList = JSON.parse(
                    window.localStorage.getItem('whalesnote_data_path_list') || '[]',
                );
            } catch (e) {
                window.localStorage.setItem('whalesnote_data_path_list', '[]');
            }

            const validPathList = dataPathList.filter(async (path) => {
                return (await dataPathExisted(path)) && (await dataPathHasWhale(path));
            });

            if (validPathList.length === 0) {
                const defaultDataPath = await window.electronAPI.getDefaultDataPath();
                if (!dataPathHasWhale(defaultDataPath)) await createDefaultWhale(defaultDataPath);
                validPathList.push(defaultDataPath);
            }

            for (let path of validPathList) {
                const whale = await importWhale(path);

                // initHistory(data.current.history);
                addWhale(whale.id, whale.obj);
                // initNotes(data.current.notes);
            }
        })();
    }, []);

    return (
        <DataPathContext.Provider
            value={{
                curDataPath,
                dataPathList,
                removeDataPathFromList,
            }}
        >
            {children}
        </DataPathContext.Provider>
    );
};

export const useDataPathContext = () => React.useContext(DataPathContext);
