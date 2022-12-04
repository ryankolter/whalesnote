import { useCallback, useEffect, useRef, useState } from 'react';

import { DataTypes, whalesnoteObjType, historyTypes, notesTypes } from '../commonType';
import initDefault from './initDefault';

const useData = () => {
    const data = useRef<DataTypes>();
    const [curDataPath, setCurDataPath] = useState<string>('');
    const [dataPathChangeFlag, setDataPathChangeFlag] = useState<number>(0);
    const [dataInitingFlag, setDataInitingFlag] = useState<boolean>(true);
    const [dataSwitchingFlag, setDataSwitchingFlag] = useState<boolean>(false);

    const initExistRepo = useCallback(async (data_path: string) => {
        const whalesnote_info = await window.electronAPI.readJsonSync({
            file_path: `${data_path}/whalesnote_info.json`,
        });

        let history_info: historyTypes = await window.electronAPI.readJsonSync({
            file_path: `${data_path}/history_info.json`,
        });

        const whalesnote: whalesnoteObjType = {
            repos_key: [],
            repos_obj: {},
        };
        const notes: notesTypes = {};
        let first_repo_key = '';
        const valid_repos_key: string[] = [];

        for (const repo_key of whalesnote_info.repos_key) {
            const repo_info = await window.electronAPI.readJsonSync({
                file_path: `${data_path}/${repo_key}/repo_info.json`,
            });
            if (repo_info) {
                first_repo_key = first_repo_key ? first_repo_key : repo_key;
                whalesnote.repos_key.push(repo_key);
                whalesnote.repos_obj[repo_key] = repo_info;
                valid_repos_key.push(repo_key);
            }
        }

        if (whalesnote_info.repos_key.length !== valid_repos_key.length) {
            whalesnote_info.repos_key = valid_repos_key;
            await window.electronAPI.writeJson({
                file_path: `${data_path}/whalesnote_info.json`,
                obj: whalesnote_info,
            });
        }

        if (first_repo_key) {
            let init_repo_key = '';
            let folders_key = [];

            if (history_info.cur_repo_key && whalesnote.repos_obj[history_info.cur_repo_key]) {
                init_repo_key = history_info.cur_repo_key;
                folders_key = whalesnote.repos_obj[history_info.cur_repo_key].folders_key;
            } else {
                init_repo_key = first_repo_key;
                folders_key = whalesnote.repos_obj[first_repo_key].folders_key;
                history_info = {
                    cur_repo_key: first_repo_key,
                    repos_record: {
                        [first_repo_key]: {
                            cur_folder_key: '',
                            folders: {},
                        },
                    },
                };
            }

            if (folders_key.length > 0) {
                let fetch_folder_key = folders_key[0];
                for (const folder_key of folders_key) {
                    if (folder_key === history_info.repos_record[init_repo_key].cur_folder_key) {
                        fetch_folder_key = folder_key;
                    }
                }
                notes[init_repo_key] = {};
                const folder_info = await window.electronAPI.readJsonSync({
                    file_path: `${data_path}/${init_repo_key}/${fetch_folder_key}/folder_info.json`,
                });
                whalesnote.repos_obj[init_repo_key].folders_obj[fetch_folder_key] = {
                    ...whalesnote.repos_obj[init_repo_key].folders_obj[fetch_folder_key],
                    ...folder_info,
                };
                if (folder_info && folder_info.notes_obj) {
                    notes[init_repo_key][fetch_folder_key] = {};
                    for (const note_key of Object.keys(folder_info.notes_obj)) {
                        const note_content = await window.electronAPI.readMdSync({
                            file_path: `${data_path}/${init_repo_key}/${fetch_folder_key}/${note_key}.md`,
                        });
                        if (note_content) {
                            notes[init_repo_key][fetch_folder_key][note_key] = note_content;
                        }
                    }
                }
            }
        } else {
            history_info = {
                cur_repo_key: '',
                repos_record: {},
            };
        }

        const data: DataTypes = {
            whalesnote: whalesnote,
            notes: notes,
            id: whalesnote_info.id,
            history: history_info,
        };

        return data;
    }, []);

    const initEmptyRepo = useCallback(async (data_path: string) => {
        const data: DataTypes = initDefault();
        const { id, whalesnote, notes, history } = data;

        await window.electronAPI.writeJson({
            file_path: `${data_path}/whalesnote_info.json`,
            obj: {
                id,
                repos_key: whalesnote.repos_key,
            },
        });

        await window.electronAPI.writeJson({
            file_path: `${data_path}/history_info.json`,
            obj: history,
        });

        for (const repo_key of whalesnote.repos_key) {
            const repo = whalesnote.repos_obj[repo_key];
            if (repo) {
                const folders_obj = {};
                for (const folder_key of Object.keys(repo.folders_obj)) {
                    folders_obj[folder_key] = {};
                    folders_obj[folder_key].folder_name = String(
                        repo.folders_obj[folder_key].folder_name
                    );
                }
                const repo_info = {
                    repo_name: repo.repo_name,
                    folders_key: repo.folders_key,
                    folders_obj: folders_obj,
                };
                await window.electronAPI.writeJson({
                    file_path: `${data_path}/${repo_key}/repo_info.json`,
                    obj: repo_info,
                });
                for (const folder_key of Object.keys(repo.folders_obj)) {
                    const folder = repo.folders_obj[folder_key];
                    if (folder) {
                        const folders_info = {
                            notes_key: folder.notes_key,
                            notes_obj: folder.notes_obj,
                        };
                        await window.electronAPI.writeJson({
                            file_path: `${data_path}/${repo_key}/${folder_key}/folder_info.json`,
                            obj: folders_info,
                        });
                        for (const note_key of Object.keys(folder.notes_obj)) {
                            const note = folder.notes_obj[note_key];
                            if (
                                note &&
                                notes[repo_key][folder_key] &&
                                notes[repo_key][folder_key][note_key]
                            ) {
                                const note_content = notes[repo_key][folder_key][note_key];
                                await window.electronAPI.writeMd({
                                    file_path: `${data_path}/${repo_key}/${folder_key}/${note_key}.md`,
                                    str: note_content,
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
        (async () => {
            let init_data_path = window.localStorage.getItem('whalesnote_current_data_path') || '';
            if (
                !init_data_path ||
                !(await window.electronAPI.checkFolderExist({ folder_path: init_data_path }))
            ) {
                init_data_path = await window.electronAPI.getDefaultDataPath();
            }
            setDataInitingFlag(true);
            setTimeout(() => {
                setCurDataPath(init_data_path);
            }, 100);
        })();
    }, []);

    useEffect(() => {
        (async () => {
            const startTimeStamp = new Date().getTime();
            if (
                curDataPath &&
                (await window.electronAPI.checkFolderExist({ folder_path: curDataPath }))
            ) {
                window.localStorage.setItem('whalesnote_current_data_path', curDataPath);
                const new_data = (await window.electronAPI.checkFileExist({
                    file_path: curDataPath + '/whalesnote_info.json',
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
