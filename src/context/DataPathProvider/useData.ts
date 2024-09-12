import { useCallback, useEffect, useRef, useState } from 'react';

import { DataTypes, WhaleObject, HistoryInfo, notesTypes } from '@/commonType';
import createDefaultWhale from './createDefaultWhale';

const useData = () => {
    const data = useRef<DataTypes>();
    const [curDataPath, setCurDataPath] = useState<string>('');
    const [dataPathChangeFlag, setDataPathChangeFlag] = useState<number>(0);
    const [dataInitingFlag, setDataInitingFlag] = useState<boolean>(true);
    const [dataSwitchingFlag, setDataSwitchingFlag] = useState<boolean>(false);

    useEffect(() => {
        (async () => {
            let initialPath = window.localStorage.getItem('whalesnote_current_data_path') || '';
            if (
                !initialPath ||
                !(await window.electronAPI.checkFolderExist({ folder_path: initialPath }))
            ) {
                initialPath = await window.electronAPI.getDefaultDataPath();
            }
            setDataInitingFlag(true);
            setCurDataPath(initialPath);
        })();
    }, []);

    const validateDatePath = useCallback(async (dataPath: string) => {
        if (!dataPath) return false;

        const dataPathExisted = await window.electronAPI.checkFolderExist({
            folder_path: dataPath,
        });
        if (!dataPathExisted) return false;

        const whaleExisted = await window.electronAPI.checkFileExist({
            file_path: dataPath + '/whalesnote_info.json',
        });
        if (!whaleExisted) await createDefaultWhale(dataPath);

        return true;
    }, []);

    const fetchWhaleData = useCallback(async (dataPath: string) => {
        if (!(await validateDatePath(dataPath))) return null;

        //process whaleObj
        const whaleObj: WhaleObject = {
            repo_keys: [],
            repo_map: {},
        };
        const validRepoKeys: string[] = [];

        const whaleInfo = await window.electronAPI.readJsonSync({
            file_path: `${dataPath}/whalesnote_info.json`,
        });
        for (const repo_key of whaleInfo.repos_key) {
            const repoInfo = await window.electronAPI.readJsonSync({
                file_path: `${dataPath}/${repo_key}/repo_info.json`,
            });
            if (repoInfo) {
                whaleObj.repo_keys.push(repo_key);
                whaleObj.repo_map[repo_key] = {
                    repo_name: repoInfo.repo_name,
                    folder_keys: repoInfo.folders_key,
                    folder_map: repoInfo.folders_obj,
                };
                validRepoKeys.push(repo_key);
            }
        }
        if (validRepoKeys.length < whaleInfo.repos_key.length) {
            whaleInfo.repos_key = validRepoKeys;
            await window.electronAPI.writeJson({
                file_path: `${dataPath}/whalesnote_info.json`,
                obj: whaleInfo,
            });
        }

        let historyInfo: HistoryInfo = await window.electronAPI.readJsonSync({
            file_path: `${dataPath}/history_info.json`,
        });
        let overwriteHistory = false;
        let initRepoKey, initFolderKey, initNoteKeys;

        if (validRepoKeys.length > 0) {
            //init repoKey
            if (historyInfo.cur_repo_key && whaleObj.repo_map[historyInfo.cur_repo_key]) {
                initRepoKey = historyInfo.cur_repo_key;
            } else {
                initRepoKey = validRepoKeys[0];
                overwriteHistory = true;
                historyInfo = {
                    cur_repo_key: initRepoKey,
                    repos_record: {
                        [initRepoKey]: {
                            cur_folder_key: '',
                            folders: {},
                        },
                    },
                };
            }

            const folder_keys = whaleObj.repo_map[initRepoKey].folder_keys;
            if (folder_keys.length > 0) {
                //init folderKey
                const historyFolderKey = historyInfo.repos_record[initRepoKey]?.cur_folder_key;
                const folder_map = whaleObj.repo_map[initRepoKey].folder_map;
                if (historyFolderKey && folder_map[historyFolderKey]) {
                    initFolderKey = historyFolderKey;
                } else {
                    initFolderKey = folder_keys[0];
                    overwriteHistory = true;
                    historyInfo = {
                        cur_repo_key: initRepoKey,
                        repos_record: {
                            [initRepoKey]: {
                                cur_folder_key: initFolderKey,
                                folders: {},
                            },
                        },
                    };
                }

                const folderInfo = await window.electronAPI.readJsonSync({
                    file_path: `${dataPath}/${initRepoKey}/${initFolderKey}/folder_info.json`,
                });
                //init noteKey List
                initNoteKeys = folderInfo.notes_key;
                whaleObj.repo_map[initRepoKey].folder_map[initFolderKey] = {
                    ...whaleObj.repo_map[initRepoKey].folder_map[initFolderKey],
                    note_keys: initNoteKeys,
                    note_map: folderInfo.notes_obj,
                };
            }
        } else {
            overwriteHistory = true;
            historyInfo = {
                cur_repo_key: '',
                repos_record: {},
            };
        }

        if (overwriteHistory) {
            await window.electronAPI.writeJson({
                file_path: `${dataPath}/history_info.json`,
                obj: historyInfo,
            });
        }

        let notes: notesTypes = {};
        if (initRepoKey && initFolderKey) {
            notes = {
                [initRepoKey]: {
                    [initFolderKey]: {},
                },
            };

            for (const initNoteKey of initNoteKeys) {
                const note_content = await window.electronAPI.readMdSync({
                    file_path: `${dataPath}/${initRepoKey}/${initFolderKey}/${initNoteKey}.md`,
                });
                if (note_content) {
                    notes[initRepoKey][initFolderKey][initNoteKey] = note_content;
                }
            }
        }

        const data: DataTypes = {
            whalesnote: whaleObj,
            notes,
            id: whaleInfo.id,
            history: historyInfo,
        };

        return data;
    }, []);

    useEffect(() => {
        (async () => {
            const startTimeStamp = new Date().getTime();
            const whaleData = await fetchWhaleData(curDataPath);
            if (!whaleData) return;

            window.localStorage.setItem('whalesnote_current_data_path', curDataPath);
            data.current = whaleData;
            setDataPathChangeFlag((dataPathChangeFlag) => dataPathChangeFlag + 1);

            const endTimeStamp = new Date().getTime();
            const diff = endTimeStamp - startTimeStamp;
            if (diff < 10) {
                setTimeout(() => {
                    setDataSwitchingFlag(false);
                    setDataInitingFlag(false);
                }, 500);
            } else {
                setDataSwitchingFlag(false);
                setDataInitingFlag(false);
            }
        })();
    }, [curDataPath]);

    return [
        data,
        curDataPath,
        setCurDataPath,
        dataPathChangeFlag,
        dataInitingFlag,
        dataSwitchingFlag,
        setDataSwitchingFlag,
    ] as const;
};

export default useData;
