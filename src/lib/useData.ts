const { ipcRenderer } = window.require('electron');
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import initDefault from './initDefault';

const useData = () => {
    const data = useRef<any>();
    const [curDataPath, setCurDataPath] = useState<string>('');
    const [dataPathChangeFlag, setDataPathChangeFlag] = useState<number>(0);
    const [initingData, setInitingData] = useState<boolean>(true);
    const [switchingData, setSwitchingData] = useState<boolean>(false);

    const initExistRepo = useCallback((data_path: string) => {
        let whalenote = ipcRenderer.sendSync('readJson', {
            file_path: `${data_path}/whalenote_info.json`,
        });

        let history = ipcRenderer.sendSync('readJson', {
            file_path: `${data_path}/history_info.json`,
        });

        const repos = {};
        const notes = {};
        let first_repo_key = '';
        const valid_repos_key: string[] = [];

        whalenote.repos_key.forEach((repo_key: string) => {
            const repo_info = ipcRenderer.sendSync('readJson', {
                file_path: `${data_path}/${repo_key}/repo_info.json`,
            });
            if (repo_info) {
                first_repo_key = first_repo_key ? first_repo_key : repo_key;
                repos[repo_key] = {
                    repo_name: repo_info.repo_name,
                    folders_key: repo_info.folders_key,
                    folders_obj: {},
                };
                const valid_folders_key: string[] = [];
                repo_info.folders_key.forEach((folder_key: string) => {
                    const folder_info = ipcRenderer.sendSync('readJson', {
                        file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
                    });
                    if (folder_info) {
                        repos[repo_key].folders_obj[folder_key] = folder_info;
                        valid_folders_key.push(folder_key);
                    }
                });
                if (repo_info.folders_key.length !== valid_folders_key.length) {
                    repos[repo_key].folders_key = valid_folders_key;
                    repo_info.folders_key = valid_folders_key;
                    ipcRenderer.sendSync('writeJson', {
                        file_path: `${data_path}/${repo_key}/repo_info.json`,
                        obj: repo_info,
                    });
                }

                valid_repos_key.push(repo_key);
            }
        });

        if (whalenote.repos_key.length !== valid_repos_key.length) {
            whalenote.repos_key = valid_repos_key;
            ipcRenderer.sendSync('writeJson', {
                file_path: `${data_path}/whalenote_info.json`,
                obj: whalenote,
            });
        }

        if (first_repo_key) {
            let init_repo_key = '';
            let folders_key = [];

            if (repos[history.cur_repo_key]) {
                init_repo_key = history.cur_repo_key;
                folders_key = repos[init_repo_key].folders_key;
            } else {
                init_repo_key = first_repo_key;
                folders_key = repos[first_repo_key].folders_key;

                history = {
                    cur_repo_key: 'DEFAULTREPO1',
                    repos: {
                        DEFAULTREPO1: {
                            cur_folder_key: '',
                            folders: {},
                        },
                    },
                };
            }

            notes[init_repo_key] = {};
            folders_key.forEach((folder_key: string) => {
                const folder_info = ipcRenderer.sendSync('readJson', {
                    file_path: `${data_path}/${init_repo_key}/${folder_key}/folder_info.json`,
                });
                if (folder_info && folder_info.notes_obj) {
                    notes[init_repo_key][folder_key] = {};
                    Object.keys(folder_info.notes_obj).forEach((note_key) => {
                        const note_info = ipcRenderer.sendSync('readCson', {
                            file_path: `${data_path}/${init_repo_key}/${folder_key}/${note_key}.cson`,
                        });
                        if (note_info) {
                            notes[init_repo_key][folder_key][note_key] = note_info.content;
                        }
                    });
                }
            });
        } else {
            whalenote = {};
            history = {};
        }

        return {
            repos: repos,
            notes: notes,
            whalenote: whalenote,
            history: history,
        };
    }, []);

    const initEmptyRepo = useCallback((data_path: string) => {
        const data = initDefault();
        const repos = data.repos;
        const notes = data.notes;
        const whalenote = data.whalenote;
        const history = data.history;

        ipcRenderer.sendSync('writeJson', {
            file_path: `${data_path}/whalenote_info.json`,
            obj: whalenote,
        });

        ipcRenderer.sendSync('writeJson', {
            file_path: `${data_path}/history_info.json`,
            obj: history,
        });

        whalenote.repos_key.forEach((repo_key: string) => {
            const repo = repos[repo_key];
            if (repo) {
                const repo_info = {
                    repo_name: repo.repo_name,
                    folders_key: repo.folders_key,
                };
                ipcRenderer.sendSync('writeJson', {
                    file_path: `${data_path}/${repo_key}/repo_info.json`,
                    obj: repo_info,
                });
                Object.keys(repo.folders_obj).forEach((folder_key) => {
                    const folder = repo.folders_obj[folder_key];
                    if (folder) {
                        ipcRenderer.sendSync('writeJson', {
                            file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
                            obj: folder,
                        });
                        Object.keys(folder.notes_obj).forEach((note_key) => {
                            const note = folder.notes_obj[note_key];
                            if (
                                note &&
                                notes[repo_key][folder_key] &&
                                notes[repo_key][folder_key][note_key]
                            ) {
                                const note_info = {
                                    createAt: new Date(),
                                    updatedAt: new Date(),
                                    type: 'markdown',
                                    content: notes[repo_key][folder_key][note_key],
                                };
                                ipcRenderer.sendSync('writeCson', {
                                    file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
                                    obj: note_info,
                                });
                            }
                        });
                    }
                });
            }
        });

        return data;
    }, []);

    useEffect(() => {
        let init_data_path = window.localStorage.getItem('whalenote_current_data_path') || '';
        if (
            !init_data_path ||
            !ipcRenderer.sendSync('folderExist', { folder_path: init_data_path })
        ) {
            init_data_path = ipcRenderer.sendSync('defaultDataPath');
        }
        setInitingData(true);
        setTimeout(() => {
            setCurDataPath(init_data_path);
        }, 100);
    }, []);

    useEffect(() => {
        const startTimeStamp = new Date().getTime();
        if (curDataPath && ipcRenderer.sendSync('folderExist', { folder_path: curDataPath })) {
            window.localStorage.setItem('whalenote_current_data_path', curDataPath);
            const new_data = ipcRenderer.sendSync('fileExist', {
                file_path: curDataPath + '/whalenote_info.json',
            })
                ? initExistRepo(curDataPath)
                : initEmptyRepo(curDataPath);
            if (new_data) {
                data.current = new_data;
                setDataPathChangeFlag((dataPathChangeFlag) => dataPathChangeFlag + 1);
            }
        }
        const endTimeStamp = new Date().getTime();
        const diff = endTimeStamp - startTimeStamp;
        if (diff < 10) {
            setTimeout(() => {
                setSwitchingData(false);
                setInitingData(false);
            }, 500);
        } else {
            setSwitchingData(false);
            setInitingData(false);
        }
    }, [curDataPath]);

    return [
        data,
        curDataPath,
        setCurDataPath,
        dataPathChangeFlag,
        initingData,
        setInitingData,
        switchingData,
        setSwitchingData,
    ] as const;
};

export default useData;
