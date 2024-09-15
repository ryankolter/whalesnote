// DataContext.tsx
import React, { createContext, Dispatch, SetStateAction, useEffect, useCallback } from 'react';
import useData from './useData';
import useDataList from '@/lib/useDataList';
import { initNotes } from '@/lib/notes';

interface DataPathContextType {
    curDataPath: string;
    setCurDataPath: Dispatch<SetStateAction<string>>;
    dataPathChangeFlag: number;
    dataInitingFlag: boolean;
    dataPathList: string[];
    removeDataPathFromList: (data_path: string) => void;
}

const DataPathContext = createContext<DataPathContextType>({
    curDataPath: '',
    setCurDataPath: () => {},
    dataPathChangeFlag: 0,
    dataInitingFlag: false,
    dataPathList: [],
    removeDataPathFromList: () => {},
});

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
    const [data, curDataPath, setCurDataPath, dataPathChangeFlag, dataInitingFlag] = useData();

    const [dataPathList, addDataPathToList, removeDataPathFromList] = useDataList();

    useEffect(() => {
        if (data.current) {
            addDataPathToList(curDataPath);
            // Initialize necessary data
            initNotes(data.current.notes);
        }
    }, [dataPathChangeFlag]);

    return (
        <DataPathContext.Provider
            value={{
                curDataPath,
                setCurDataPath,
                dataPathChangeFlag,
                dataInitingFlag,
                dataPathList,
                removeDataPathFromList,
            }}
        >
            {children}
        </DataPathContext.Provider>
    );
};

export const useDataPathContext = () => React.useContext(DataPathContext);
