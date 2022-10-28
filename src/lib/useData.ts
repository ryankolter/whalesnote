import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DataTypes, reposObjTypes } from '../commonType';
import initDefault from './initDefault';

const useData = () => {
    const data = useRef<DataTypes>();
    const [curDataPath, setCurDataPath] = useState<string>('');
    const [dataPathChangeFlag, setDataPathChangeFlag] = useState<number>(0);
    const [initingData, setInitingData] = useState<boolean>(true);
    const [switchingData, setSwitchingData] = useState<boolean>(false);

    const initExistRepo = useCallback(async (data_path: string) => {
        let whalenote = await window.electronAPI.readJson({
            file_path: `${data_path}/whalenote_info.json`,
        });

        let history = await window.electronAPI.readJson({
            file_path: `${data_path}/history_info.json`,
        });

        const repos: reposObjTypes = {
            repos_key: [],
            repos_obj: {},
        };
        const notes = {};
        let first_repo_key = '';
        const valid_repos_key: string[] = [];

        for (const repo_key of whalenote.repos_key) {
            const repo_info = await window.electronAPI.readJson({
                file_path: `${data_path}/${repo_key}/repo_info.json`,
            });
            if (repo_info) {
                first_repo_key = first_repo_key ? first_repo_key : repo_key;
                repos.repos_key.push(repo_key);
                repos.repos_obj[repo_key] = {
                    repo_name: repo_info.repo_name,
                    folders_key: repo_info.folders_key,
                    folders_obj: {},
                };
                const valid_folders_key: string[] = [];
                for (const folder_key of repo_info.folders_key) {
                    const folder_info = await window.electronAPI.readJson({
                        file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
                    });
                    if (folder_info) {
                        repos.repos_obj[repo_key].folders_obj[folder_key] = folder_info;
                        valid_folders_key.push(folder_key);
                    }
                }
                if (repo_info.folders_key.length !== valid_folders_key.length) {
                    repos.repos_obj[repo_key].folders_key = valid_folders_key;
                    repo_info.folders_key = valid_folders_key;
                    await window.electronAPI.writeJson({
                        file_path: `${data_path}/${repo_key}/repo_info.json`,
                        obj: repo_info,
                    });
                }

                valid_repos_key.push(repo_key);
            }
        }

        if (whalenote.repos_key.length !== valid_repos_key.length) {
            whalenote.repos_key = valid_repos_key;
            await window.electronAPI.writeJson({
                file_path: `${data_path}/whalenote_info.json`,
                obj: whalenote,
            });
        }

        if (first_repo_key) {
            let init_repo_key = '';
            let folders_key = [];

            if (repos.repos_obj[history.cur_repo_key]) {
                init_repo_key = history.cur_repo_key;
                folders_key = repos.repos_obj[init_repo_key].folders_key;
            } else {
                init_repo_key = first_repo_key;
                folders_key = repos.repos_obj[first_repo_key].folders_key;

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
            for (const folder_key of folders_key) {
                const folder_info = await window.electronAPI.readJson({
                    file_path: `${data_path}/${init_repo_key}/${folder_key}/folder_info.json`,
                });
                if (folder_info && folder_info.notes_obj) {
                    notes[init_repo_key][folder_key] = {};
                    for (const note_key of Object.keys(folder_info.notes_obj)) {
                        const note_info = await window.electronAPI.readCson({
                            file_path: `${data_path}/${init_repo_key}/${folder_key}/${note_key}.cson`,
                        });
                        if (note_info) {
                            notes[init_repo_key][folder_key][note_key] = note_info.content;
                        }
                    }
                }
            }
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

    const initEmptyRepo = useCallback(async (data_path: string) => {
        const data = initDefault();
        const repos = data.repos;
        const notes = data.notes;
        const whalenote = data.whalenote;
        const history = data.history;

        await window.electronAPI.writeJson({
            file_path: `${data_path}/whalenote_info.json`,
            obj: {
                ...whalenote,
                repos_key: repos.repos_key,
            },
        });

        await window.electronAPI.writeJson({
            file_path: `${data_path}/history_info.json`,
            obj: history,
        });

        for (const repo_key of repos.repos_key) {
            const repo = repos.repos_obj[repo_key];
            if (repo) {
                const repo_info = {
                    repo_name: repo.repo_name,
                    folders_key: repo.folders_key,
                };
                await window.electronAPI.writeJson({
                    file_path: `${data_path}/${repo_key}/repo_info.json`,
                    obj: repo_info,
                });
                for (const folder_key of Object.keys(repo.folders_obj)) {
                    const folder = repo.folders_obj[folder_key];
                    if (folder) {
                        await window.electronAPI.writeJson({
                            file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
                            obj: folder,
                        });
                        for (const note_key of Object.keys(folder.notes_obj)) {
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
                                await window.electronAPI.writeCson({
                                    file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.cson`,
                                    obj: note_info,
                                });
                            }
                        }
                    }
                }
            }
        }

        return data;
    }, []);

    useEffect(() => {
        (async function func() {
            let init_data_path = window.localStorage.getItem('whalenote_current_data_path') || '';
            if (
                !init_data_path ||
                !(await window.electronAPI.folderExist({ folder_path: init_data_path }))
            ) {
                init_data_path = await window.electronAPI.getDefaultDataPath();
            }
            setInitingData(true);
            setTimeout(() => {
                setCurDataPath(init_data_path);
            }, 100);
        })();
    }, []);

    useEffect(() => {
        (async function func() {
            const startTimeStamp = new Date().getTime();
            if (
                curDataPath &&
                (await window.electronAPI.folderExist({ folder_path: curDataPath }))
            ) {
                window.localStorage.setItem('whalenote_current_data_path', curDataPath);
                const new_data = (await window.electronAPI.fileExist({
                    file_path: curDataPath + '/whalenote_info.json',
                }))
                    ? await initExistRepo(curDataPath)
                    : await initEmptyRepo(curDataPath);
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
        })();
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
