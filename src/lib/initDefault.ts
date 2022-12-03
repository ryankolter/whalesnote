import cryptoRandomString from 'crypto-random-string';
import i18next from '../i18n';
import { DataTypes } from '../commonType';

const initDefault = () => {
    const repo_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    const folder_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    const note_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    const default_data: DataTypes = {
        whalenote: {
            repos_key: [repo_id],
            repos_obj: {
                [repo_id]: {
                    repo_name: i18next.t('repository.default_name'),
                    folders_key: [folder_id],
                    folders_obj: {
                        [folder_id]: {
                            folder_name: i18next.t('category.default_name'),
                            notes_key: [note_id],
                            notes_obj: {
                                [note_id]: {
                                    title: i18next.t('note.untitled'),
                                },
                            },
                        },
                    },
                },
            },
        },
        notes: {
            [repo_id]: {
                [folder_id]: {
                    [note_id]: '',
                },
            },
        },
        id: cryptoRandomString({ length: 24, type: 'alphanumeric' }),
        history: {
            cur_repo_key: repo_id,
            repos_record: {
                [repo_id]: {
                    cur_folder_key: folder_id,
                    folders: {
                        [folder_id]: note_id,
                    },
                },
            },
        },
    };
    return default_data;
};

export default initDefault;
