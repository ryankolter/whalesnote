import { Data } from "../commonType";
import cryptoRandomString from "crypto-random-string";

const initDefault = () => {
  return updateDefaultData();
};

const updateDefaultData = () => {
  let default_data: Data = {
    repos: {
      DEFAULTREPO1: {
        repo_name: "默认仓库",
        folders_key: ["DEFAULTFOLD1"],
        folders_obj: {
          DEFAULTFOLD1: {
            folder_name: "默认文件夹",
            notes_key: ["DEFAULTNOTE1"],
            notes_obj: {
              DEFAULTNOTE1: {
                title: "空笔记",
              },
            },
          },
        },
      },
    },
    notes: {
      DEFAULTREPO1: {
        DEFAULTFOLD1: {
          DEFAULTNOTE1: "",
        },
      },
    },
    dxnote: {
      id: cryptoRandomString({ length: 10, type: "alphanumeric" }),
      repos_key: ["DEFAULTREPO1"],
      cur_repo_key: "DEFAULTREPO1",
      repos: {
        DEFAULTREPO1: {
          cur_folder_key: "DEFAULTFOLD1",
          folders: {
            DEFAULTFOLD1: "DEFAULTNOTE1",
          },
        },
      },
    },
  };
  return default_data;
};

export default initDefault;
