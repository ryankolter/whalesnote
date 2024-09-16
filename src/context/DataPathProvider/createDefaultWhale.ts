import cryptoRandomString from 'crypto-random-string';
import i18next from '@/i18n';

const createDefaultWhale = async (dataPath: string) => {
    //create whalesnote_info
    const id = cryptoRandomString({ length: 24, type: 'alphanumeric' });
    const repo_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    await window.electronAPI.writeJson(`${dataPath}/whalesnote_info.json`, {
        id,
        repos_key: [repo_id],
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
    await window.electronAPI.writeJson(`${dataPath}/${repo_id}/repo_info.json`, repo_info);
    await window.electronAPI.writeJson(
        `${dataPath}/${repo_id}/${folder_id}/folder_info.json`,
        folder_info,
    );
    await window.electronAPI.writeStr(`${dataPath}/${repo_id}/${folder_id}/${note_id}.md`, '');

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
    await window.electronAPI.writeJson(`${dataPath}/history_info.json`, history);
    await window.electronAPI.writeStr(`${dataPath}/.gitignore`, 'history_info.json');
};

export default createDefaultWhale;
