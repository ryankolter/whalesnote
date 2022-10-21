import cryptoRandomString from 'crypto-random-string';
import { Data } from '../commonType';

const initDefault = () => {
    const repo_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    const folder_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    const note_id = cryptoRandomString({ length: 12, type: 'alphanumeric' });
    const default_data: Data = {
        repos: {
            [repo_id]: {
                repo_name: '1号资料库',
                folders_key: [folder_id],
                folders_obj: {
                    [folder_id]: {
                        folder_name: '默认分类',
                        notes_key: [note_id],
                        notes_obj: {
                            [note_id]: {
                                title: '新建文档',
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
        whalenote: {
            id: cryptoRandomString({ length: 36, type: 'alphanumeric' }),
            repos_key: [repo_id],
        },
        history: {
            cur_repo_key: repo_id,
            repos: {
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
