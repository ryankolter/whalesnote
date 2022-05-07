import initGuide from "./initGuide";
import { initExistRepo, initEmptyRepo } from "./initRepo";
const { ipcRenderer } = window.require("electron");

const initData = (data_path: string | null) => {
  if (!data_path || (data_path && !isDataPathExist(data_path))) {
    // TODO: show finger tips
    return null;
  } else {
    if (isDxnoteFileExist(data_path + "/dxnote_info.json")) {
      return initExistRepo(data_path);
    } else {
      return initEmptyRepo(data_path);
    }
  }
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
