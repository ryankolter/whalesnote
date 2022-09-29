const { ipcRenderer } = window.require('electron');
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import initDefault from './initDefault';

const useData = () => {
    const data = useRef<any>();
    const [curDataPath, setCurDataPath] = useState<string>('');
    const [dataPathList, setDataPathList] = useState<string[]>([]);

    const addDataPathToList = useCallback((data_path: string) => {
        let repeted = false;
        for (const dataPath of dataPathList) {
            if (dataPath === data_path) repeted = true;
        }
        if (!repeted) {
            setDataPathList((dataPathList) => [...dataPathList, data_path]);
        }
        window.localStorage.setItem('whalenote_current_data_path', data_path);
    }, []);

    const initExistRepo = (data_path: string) => {
        let dxnote = ipcRenderer.sendSync('readJson', {
            file_path: `${data_path}/dxnote_info.json`,
        });

        const repos = {};
        const notes = {};
        let first_repo_key = '';
        const valid_repos_key: string[] = [];

        dxnote.repos_key.forEach((repo_key: string) => {
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

        if (dxnote.repos_key.length !== valid_repos_key.length) {
            dxnote.repos_key = valid_repos_key;
            ipcRenderer.sendSync('writeJson', {
                file_path: `${data_path}/dxnote_info.json`,
                obj: dxnote,
            });
        }

        if (first_repo_key) {
            let init_repo_key = '';
            let folders_key = [];

            if (repos[dxnote.cur_repo_key]) {
                init_repo_key = dxnote.cur_repo_key;
                folders_key = repos[init_repo_key].folders_key;
            } else {
                init_repo_key = first_repo_key;
                folders_key = repos[first_repo_key].folders_key;

                dxnote = {
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
            dxnote = {};
        }

        return {
            repos: repos,
            notes: notes,
            dxnote: dxnote,
        };
    };

    const initEmptyRepo = (data_path: string) => {
        const data = initDefault();
        const repos = data.repos;
        const notes = data.notes;
        const dxnote = data.dxnote;

        ipcRenderer.sendSync('writeJson', {
            file_path: `${data_path}/dxnote_info.json`,
            obj: dxnote,
        });

        dxnote.repos_key.forEach((repo_key: string) => {
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
    };

    useEffect(() => {
        let init_data_path = window.localStorage.getItem('whalenote_current_data_path') || '';
        if (
            !init_data_path ||
            !ipcRenderer.sendSync('folderExist', { folder_path: init_data_path })
        ) {
            init_data_path = ipcRenderer.sendSync('defaultDataPath');
        }
        setCurDataPath(init_data_path);
    }, []);

    useEffect(() => {
        console.log(curDataPath);
        if (curDataPath && ipcRenderer.sendSync('folderExist', { folder_path: curDataPath })) {
            window.localStorage.setItem('whalenote_current_data_path', curDataPath);
            const new_data = ipcRenderer.sendSync('fileExist', {
                file_path: curDataPath + '/dxnote_info.json',
            })
                ? initExistRepo(curDataPath)
                : initEmptyRepo(curDataPath);
            if (new_data) {
                data.current = new_data;
            }
        }
    }, [curDataPath]);

    return [data, curDataPath, setCurDataPath] as const;
};

export default useData;
