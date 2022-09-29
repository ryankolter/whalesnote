const { ipcRenderer } = window.require('electron');
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const useDataList = () => {
    const [dataPathList, setDataPathList] = useState<string[]>([]);

    const validateDataPathList = useCallback((data_path_list: string[]) => {
        const new_data_path_list = [];
        for (const data_path of data_path_list) {
            if (
                ipcRenderer.sendSync('folderExist', { folder_path: data_path }) &&
                ipcRenderer.sendSync('fileExist', { file_path: data_path + '/dxnote_info.json' })
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
        [dataPathList, setDataPathList]
    );

    const removeDataPathFromList = useCallback(
        (data_path: string) => {
            const newDataPathList = [];
            for (const dataPath of dataPathList) {
                if (dataPath !== data_path) newDataPathList.push(dataPath);
            }
            setDataPathList(newDataPathList);
        },
        [dataPathList, setDataPathList]
    );

    useEffect(() => {
        let data_path_list: string[] = [];
        try {
            data_path_list = JSON.parse(
                window.localStorage.getItem('whalenote_data_path_list') || '[]'
            );
        } catch (e) {
            window.localStorage.setItem('whalenote_data_path_list', '[]');
        }
        const new_data_path_list = validateDataPathList(data_path_list);
        setDataPathList(new_data_path_list);
    }, []);

    useEffect(() => {
        console.log(dataPathList);
        window.localStorage.setItem('whalenote_data_path_list', JSON.stringify(dataPathList));
    }, [dataPathList]);

    return [dataPathList, addDataPathToList, removeDataPathFromList] as const;
};

export default useDataList;
