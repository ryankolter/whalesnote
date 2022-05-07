import initGuide from "./initGuide";
import { initExistRepo, initEmptyRepo } from "./initRepo";
const { ipcRenderer } = window.require("electron");

const initData = (data_path: string | null) => {
  if (!data_path || (data_path && !isDataPathExist(data_path))) {
    return initGuide();
  } else {
    if (isDxnoteFileExist(data_path + "/dxnote_info.json")) {
      return initExistRepo(data_path);
    }
    {
      return initEmptyRepo(data_path);
    }
  }

  // let notes_in_folder : object = {
  //     "f1":{
  //         "n11": '## 原型链继承\n\n- 父子类型定义\n    ```js\n    【父类型 Person】\n    function Person(){\n        this.sleep = function(){\n            console.log(\"Person Sleep\")\n        }\n    }\n\n    Person.prototype.getName = function(){\n        console.log(\"Person Name\")\n    }\n\n    【子类型 Student】\n    function Student(){\n    }\n    ```\n\n- 继承写法（覆盖原型对象，并生成新原型对象）\n\n    关键是，子类型的原型为父类型的一个实例对象\n\n    ```js\n    Student.prototype = new Person()\n    ```\n',
  //         "n12": "内容2",
  //         "n13": "内容3",
  //         "n14": "内容4"
  //     },
  //     "f2":{
  //         "n21": "内容5",
  //         "n22": "内容6"
  //     }
  // }

  // // no dxnote json
  // // let default_repo_key = cryptoRandomString({length: 12, type: 'alphanumeric'});
  // let dxnote_info = {
  //     "user_uuid": 'anonymity',
  //     "last_open": {
  //         "repo_key": "",
  //         "folder_key": "",
  //         "note_key": ""
  //     },
  //     "repos": ['DEFAULTREPO1']
  // }

  // ipcRenderer.sendSync('writeJson', {
  //     file_path: `${data_path}/dxnote_info.json`,
  //     obj: dxnote_info
  // })
};

const isDataPathExist = (path: string) => {
  let result = ipcRenderer.sendSync("folderExist", {
    folder_path: path,
  });

  if (!result) window.localStorage.setItem("dxnote_data_path", "");

  return result;
};

const isDxnoteFileExist = (path: string) => {
  let result = ipcRenderer.sendSync("fileExist", {
    file_path: path,
  });

  return result;
};

export default initData;
