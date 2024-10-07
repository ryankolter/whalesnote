import cryptoRandomString from 'crypto-random-string';
import i18next from '@/i18n';
import { basename } from 'path-browserify';

export const createDefaultWhale = async (dataPath: string) => {
    //create whalesnote_info
    const id = cryptoRandomString({ length: 24, type: 'alphanumeric' });
    const repo_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    await window.electronAPI.writeJson(`${dataPath}/whalesnote_info.json`, {
        id,
        name: basename(dataPath),
        repo_keys: [repo_id],
    });

    //create repo_info, folder_info and note.md
    const folder_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    const note_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    const folder_info = {
        note_keys: [note_id],
        note_map: {
            [note_id]: {
                title: i18next.t('note.untitled'),
            },
        },
    };
    const repo_info = {
        repo_name: i18next.t('repository.default_name'),
        folder_keys: [folder_id],
        folder_map: {
            [folder_id]: {
                folder_name: i18next.t('category.default_name'),
            },
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
