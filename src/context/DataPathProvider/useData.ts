import { useCallback, useEffect, useRef, useState } from 'react';

import { DataTypes, WhaleObject, HistoryInfo, notesTypes } from '@/commonType';
import createDefaultWhale from './createDefaultWhale';
import { fetchWhaleData } from './importWhale';

const useData = () => {
    const data = useRef<DataTypes>();
    const [curDataPath, setCurDataPath] = useState<string>('');
    const [dataIsLoading, setDataIsLoading] = useState(true);
    const [dataInitingFlag, setDataInitingFlag] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            let initialPath = window.localStorage.getItem('whalesnote_current_data_path') || '';
            if (!initialPath || !(await window.electronAPI.checkPathExist(initialPath))) {
                initialPath = await window.electronAPI.getDefaultDataPath();
            }
            // setDataInitingFlag(true);
            setCurDataPath(initialPath);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            setDataIsLoading(true);

            const whaleData = await fetchWhaleData(curDataPath);
            if (!whaleData) return;

            data.current = whaleData;
            window.localStorage.setItem('whalesnote_current_data_path', curDataPath);
        })();
    }, [curDataPath]);

    console.log(curDataPath);

    return [data, curDataPath, dataInitingFlag, dataIsLoading] as const;
};

export default useData;
