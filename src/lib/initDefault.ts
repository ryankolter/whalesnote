import { Data } from "../commonType";
import cryptoRandomString from "crypto-random-string";

const initDefault = () => {
    return updateDefaultData();
};

const updateDefaultData = () => {
    let repo_id = cryptoRandomString({ length: 12, type: "alphanumeric" });
    let folder_id = cryptoRandomString({ length: 12, type: "alphanumeric" });
    let note_id = cryptoRandomString({ length: 12, type: "alphanumeric" });
    let default_data: Data = {
        repos: {
            [repo_id]: {
                repo_name: "1号资料库",
                folders_key: [folder_id],
                folders_obj: {
                    [folder_id]: {
                        folder_name: "默认分类",
                        notes_key: [note_id],
                        notes_obj: {
                            [note_id]: {
                                title: "新建文档",
                            },
                        },
                    },
                },
            },
        },
        notes: {
            [repo_id]: {
                [folder_id]: {
                    [note_id]: "",
                },
            },
        },
        dxnote: {
            id: cryptoRandomString({ length: 10, type: "alphanumeric" }),
            repos_key: [repo_id],
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
