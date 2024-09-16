import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const useDataList = () => {
    const [dataPathList, setDataPathList] = useState<string[]>([]);

    const validateDataPathList = useCallback(async (data_path_list: string[]) => {
        const new_data_path_list = [];
        for (const data_path of data_path_list) {
            if (
                (await window.electronAPI.checkPathExist(data_path)) &&
                (await window.electronAPI.checkPathExist(data_path + '/whalesnote_info.json'))
            ) {
                new_data_path_list.push(data_path);
            }
        }
        return new_data_path_list;
    }, []);

    const addDataPathToList = useCallback(
        (data_path: string) => {
            let repeted = false;
            for (const dataPath of dataPathList) {
                if (dataPath === data_path) repeted = true;
            }
            if (!repeted) {
                setDataPathList((dataPathList) => [...dataPathList, data_path]);
            }
        },
        [dataPathList, setDataPathList],
    );

    const removeDataPathFromList = useCallback(
        (data_path: string) => {
            const newDataPathList = [];
            for (const dataPath of dataPathList) {
                if (dataPath !== data_path) newDataPathList.push(dataPath);
            }
            setDataPathList(newDataPathList);
        },
        [dataPathList, setDataPathList],
    );

    useEffect(() => {
        (async () => {
            let data_path_list: string[] = [];
            try {
                data_path_list = JSON.parse(
                    window.localStorage.getItem('whalesnote_data_path_list') || '[]',
                );
            } catch (e) {
                window.localStorage.setItem('whalesnote_data_path_list', '[]');
            }
            const new_data_path_list = await validateDataPathList(data_path_list);
            setDataPathList(new_data_path_list);
        })();
    }, []);

    useEffect(() => {
        window.localStorage.setItem('whalesnote_data_path_list', JSON.stringify(dataPathList));
    }, [dataPathList]);

    return [dataPathList, addDataPathToList, removeDataPathFromList] as const;
};

export default useDataList;
