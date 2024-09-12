import cryptoRandomString from 'crypto-random-string';
import i18next from '@/i18n';

const createDefaultWhale = async (dataPath: string) => {
    //create whalesnote_info
    const id = cryptoRandomString({ length: 24, type: 'alphanumeric' });
    const repo_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    await window.electronAPI.writeJson({
        file_path: `${dataPath}/whalesnote_info.json`,
        obj: {
            id,
            repos_key: [repo_id],
        },
    });

    //create repo_info, folder_info and note.md
    const folder_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    const note_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    const folder_info = {
        folder_name: i18next.t('category.default_name'),
        notes_key: [note_id],
        notes_obj: {
            [note_id]: {
                title: i18next.t('note.untitled'),
            },
        },
    };
    const repo_info = {
        repo_name: i18next.t('repository.default_name'),
        folders_key: [folder_id],
        folders_obj: {
            [folder_id]: folder_info,
        },
    };
    await window.electronAPI.writeJson({
        file_path: `${dataPath}/${repo_id}/repo_info.json`,
        obj: repo_info,
    });
    await window.electronAPI.writeJson({
        file_path: `${dataPath}/${repo_id}/${folder_id}/folder_info.json`,
        obj: folder_info,
    });
    await window.electronAPI.writeMd({
        file_path: `${dataPath}/${repo_id}/${folder_id}/${note_id}.md`,
        str: '',
    });

    //create history
    const history = {
        cur_repo_key: repo_id,
        repos_record: {
            [repo_id]: {
                cur_folder_key: folder_id,
                folders: {
                    [folder_id]: note_id,
                },
            },
        },
    };
    await window.electronAPI.writeJson({
        file_path: `${dataPath}/history_info.json`,
        obj: history,
    });
    await window.electronAPI.writeGitIgnore({
        file_path: `${dataPath}/.gitignore`,
        str: 'history_info.json',
    });
};

export default createDefaultWhale;
