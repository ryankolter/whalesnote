export const updateWhaleKeyName = async (path: string, whaleInfo: any) => {
    if (whaleInfo['repos_key'] === undefined) return whaleInfo;

    const newWhaleInfo = {
        id: whaleInfo.id,
        repo_keys: whaleInfo.repos_key,
    };

    for (const repo_key of newWhaleInfo.repo_keys) {
        const repoInfoPath = `${path}/${repo_key}/repo_info.json`;
        const repoInfo = await window.electronAPI.readJsonSync(repoInfoPath);
        if (!repoInfo) continue;

        const newRepoInfo = {
            repo_name: repoInfo.repo_name,
            folder_keys: repoInfo.folders_key || repoInfo.folder_keys,
            folder_map: repoInfo.folders_obj || repoInfo.folder_map,
        };

        for (const folder_key of newRepoInfo.folder_keys) {
            const folderInfoPath = `${path}/${repo_key}/${folder_key}/folder_info.json`;
            const folderInfo = await window.electronAPI.readJsonSync(folderInfoPath);
            if (!folderInfo) continue;

            const newFolderInfo = {
                folder_name: folderInfo.folder_name,
                note_keys: folderInfo.notes_key || folderInfo.note_keys,
                note_map: folderInfo.notes_obj || folderInfo.note_map,
            };

            await window.electronAPI.writeJson(folderInfoPath, newFolderInfo);
        }

        await window.electronAPI.writeJson(repoInfoPath, newRepoInfo);
    }
    await window.electronAPI.writeJson(`${path}/whalesnote_info.json`, newWhaleInfo);

    return newWhaleInfo;
};
