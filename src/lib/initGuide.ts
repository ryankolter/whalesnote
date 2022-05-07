import { Data } from "../commonType";
import cryptoRandomString from "crypto-random-string";

const initGuide = () => {
  return updateGuideData();
};

const updateGuideData = () => {
  let guide_data: Data = {
    repos: {
      DEFAULTREPO1: {
        repo_name: "默认仓库",
        folders_key: ["SIMPLEGUIDE1", "MIDDLEGUIDE1"],
        folders_obj: {
          SIMPLEGUIDE1: {
            folder_name: "1. 入门教程",
            notes_key: [
              "SIMPLENOTE01",
              "SIMPLENOTE02",
              "SIMPLENOTE03",
              "SIMPLENOTE04",
            ],
            notes_obj: {
              SIMPLENOTE01: {
                title: "添加数据目录",
              },
              SIMPLENOTE02: {
                title: "新建仓库",
              },
              SIMPLENOTE03: {
                title: "新建文件夹",
              },
              SIMPLENOTE04: {
                title: "写笔记",
              },
            },
          },
          MIDDLEGUIDE1: {
            folder_name: "2. 进阶",
            notes_key: ["MIDDLENOTE01", "MIDDLENOTE02"],
            notes_obj: {
              MIDDLENOTE01: {
                title: "快捷键",
              },
              MIDDLENOTE02: {
                title: "单向同步到手机",
              },
            },
          },
          PRIMERGUIDE1: {
            folder_name: "3. 高级",
            notes_key: ["PRIMERNOTE01", "PRIMERNOTE02"],
            notes_obj: {
              PRIMERNOTE01: {
                title: "快捷键",
              },
              PRIMERNOTE02: {
                title: "单向同步到手机",
              },
            },
          },
        },
      },
    },
    notes: {
      DEFAULTREPO1: {
        SIMPLEGUIDE1: {
          SIMPLENOTE01: "内容1",
          SIMPLENOTE02: "内容2",
          SIMPLENOTE03: "内容3",
          SIMPLENOTE04: "内容4",
        },
        MIDDLEGUIDE1: {
          MIDDLENOTE01: "内容5",
          MIDDLENOTE02: "内容6",
        },
      },
    },
    dxnote: {
      id: cryptoRandomString({ length: 10, type: "alphanumeric" }),
      repos_key: ["DEFAULTREPO1"],
      cur_repo_key: "DEFAULTREPO1",
      repos: {
        DEFAULTREPO1: {
          cur_folder_key: "SIMPLEGUIDE1",
          folders: {
            SIMPLEGUIDE1: "SIMPLENOTE01",
            MIDDLEGUIDE2: "MIDDLENOTE01",
          },
        },
      },
    },
  };
  return guide_data;
};

export default initGuide;
