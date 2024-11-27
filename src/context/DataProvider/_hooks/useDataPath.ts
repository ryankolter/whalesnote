import { activeWhaleIdAtom, dataPathListAtom } from '@/atoms';
import { useAtom, useSetAtom } from 'jotai';
import { useCallback } from 'react';

export const useDataPath = () => {
    const [dataPathList, setDataPathList] = useAtom(dataPathListAtom);
    const setId = useSetAtom(activeWhaleIdAtom);

    const addDataPath = useCallback((path: string) => {
        setDataPathList((prev) => [...prev, path]);
    }, []);

    const removeDataPath = useCallback((path: string) => {
        setDataPathList((prev) => prev.filter((p) => p !== path));
    }, []);

    return {
        dataPathList,
        setDataPathList,
        addDataPath,
        removeDataPath,
    };
};
