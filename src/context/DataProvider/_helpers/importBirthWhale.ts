import { DataTypes, HistoryInfo, ContentMap, Whale } from '@/interface';

export const dataPathExisted = async (path: string) => {
    if (!path) return false;
    return await window.electronAPI.checkPathExist(path);
};

export const dataPathHasWhale = async (path: string) => {
    return await window.electronAPI.checkPathExist(path + '/whalesnote_info.json');
};

export const importBirthWhale = async (birthWhale: {
    id: string;
    name: string;
    path: string;
    repo_keys: string[];
}) => {
    const { path, repo_keys } = birthWhale;

    const whale: Whale = {
        ...birthWhale,
        repo_keys: [],
        repo_map: {},
    };

    const validRepoKeys = [];
    for (const repoKey of repo_keys) {
        const repoInfo = await window.electronAPI.readJsonSync(`${path}/${repoKey}/repo_info.json`);
        if (!repoInfo) continue;

        whale.repo_keys.push(repoKey);
        whale.repo_map[repoKey] = repoInfo;
        validRepoKeys.push(repoKey);
    }

    if (validRepoKeys.length < repo_keys.length) {
        birthWhale.repo_keys = validRepoKeys;
        const { path, ...whaleInfo } = birthWhale;
        await window.electronAPI.writeJson(`${path}/whalesnote_info.json`, whaleInfo);
    }

    let historyInfo: HistoryInfo = await window.electronAPI.readJsonSync(
        `${path}/history_info.json`,
    );
    let overwriteHistory = false;
    let initRepoKey, initFolderKey, initNoteKeys;

    if (validRepoKeys.length > 0) {
        //init repoKey
        if (historyInfo.cur_repo_key && whale.repo_map[historyInfo.cur_repo_key]) {
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

        const folder_keys = whale.repo_map[initRepoKey].folder_keys;
        if (folder_keys.length > 0) {
            //init folderKey
            const historyFolderKey = historyInfo.repos_record[initRepoKey]?.cur_folder_key; //TODO: check historyFolderKey is really exist in the file system
            const folder_map = whale.repo_map[initRepoKey].folder_map;
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
            whale.repo_map[initRepoKey].folder_map[initFolderKey] = {
                ...whale.repo_map[initRepoKey].folder_map[initFolderKey],
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

    if (overwriteHistory)
        await window.electronAPI.writeJson(`${path}/history_info.json`, historyInfo);

    let contentMap: ContentMap = {};
    if (initRepoKey && initFolderKey) {
        contentMap = {
            [initRepoKey]: {
                [initFolderKey]: {},
            },
        };

        for (const initNoteKey of initNoteKeys) {
            const noteContent = await window.electronAPI.readMdSync(
                `${path}/${initRepoKey}/${initFolderKey}/${initNoteKey}.md`,
            );
            if (!noteContent) continue;

            contentMap[initRepoKey][initFolderKey][initNoteKey] = noteContent;
        }
    }

    const data: DataTypes = {
        whale,
        contentMap,
        historyInfo,
    };

    return data;
};
