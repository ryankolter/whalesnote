import { DataTypes, HistoryInfo, ContentMap, WhaleObject } from '@/commonType';

export const dataPathExisted = async (path: string) => {
    if (!path) return false;
    return await window.electronAPI.checkPathExist(path);
};

export const dataPathHasWhale = async (path: string) => {
    return await window.electronAPI.checkPathExist(path + '/whalesnote_info.json');
};

export const importWhale = async (
    path: string,
    whaleInfo: {
        id: string;
        repo_keys: string[];
    },
) => {
    const whaleObj: WhaleObject = {
        path,
        repo_keys: [],
        repo_map: {},
    };
    const validRepoKeys: string[] = [];

    for (const repo_key of whaleInfo.repo_keys) {
        const repoInfo = await window.electronAPI.readJsonSync(
            `${path}/${repo_key}/repo_info.json`,
        );
        if (repoInfo) {
            whaleObj.repo_keys.push(repo_key);
            whaleObj.repo_map[repo_key] = {
                repo_name: repoInfo.repo_name,
                folder_keys: repoInfo.folder_keys,
                folder_map: repoInfo.folder_map,
            };
            validRepoKeys.push(repo_key);
        }
    }
    if (validRepoKeys.length < whaleInfo.repo_keys.length) {
        whaleInfo.repo_keys = validRepoKeys;
        await window.electronAPI.writeJson(`${path}/whalesnote_info.json`, whaleInfo);
    }

    let historyInfo: HistoryInfo = await window.electronAPI.readJsonSync(
        `${path}/history_info.json`,
    );
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
            const historyFolderKey = historyInfo.repos_record[initRepoKey]?.cur_folder_key; //TODO: check historyFolderKey is really exist in the file system
            const folder_map = whaleObj.repo_map[initRepoKey].folder_map;
            if (historyFolderKey && folder_map[historyFolderKey]) {
                initFolderKey = historyFolderKey;
            } else {
                initFolderKey = folder_keys[0]; //TODO: get the first valid key which exist in the file system
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

            const folderInfo = await window.electronAPI.readJsonSync(
                `${path}/${initRepoKey}/${initFolderKey}/folder_info.json`,
            );

            //init noteKey List
            initNoteKeys = folderInfo.note_keys;
            whaleObj.repo_map[initRepoKey].folder_map[initFolderKey] = {
                ...whaleObj.repo_map[initRepoKey].folder_map[initFolderKey],
                note_keys: initNoteKeys,
                note_map: folderInfo.note_map,
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
        await window.electronAPI.writeJson(`${path}/history_info.json`, historyInfo);
    }

    let contentMap: ContentMap = {};
    if (initRepoKey && initFolderKey) {
        contentMap = {
            [initRepoKey]: {
                [initFolderKey]: {},
            },
        };

        for (const initNoteKey of initNoteKeys) {
            const note_content = await window.electronAPI.readMdSync(
                `${path}/${initRepoKey}/${initFolderKey}/${initNoteKey}.md`,
            );
            if (note_content) {
                contentMap[initRepoKey][initFolderKey][initNoteKey] = note_content;
            }
        }
    }

    const data: DataTypes = {
        whaleObj,
        contentMap,
        historyInfo,
    };

    return data;
};
