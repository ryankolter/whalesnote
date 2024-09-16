import { contextBridge, ipcRenderer } from 'electron';

interface CheckFolderExistParams {
    folder_path: string;
}

interface CheckFileExistParams {
    file_path: string;
}

interface FilePathParams {
    file_path: string;
}

interface WriteFileParams {
    file_path: string;
    str: string;
}

interface WriteJsonParams {
    file_path: string;
    obj: object;
}

interface CopyMoveParams {
    src_file_path: string;
    dest_dir_path: string;
    dest_file_name: string;
}

interface MoveFileParams {
    src_file_path: string;
    dest_file_path: string;
}

interface DialogSaveParams {
    file_name: string;
    file_types: string[];
}

interface SelectImagesParams {
    file_types: string[];
}

interface OpenFolderParams {
    folder_path: string;
}

interface NodejiebaParams {
    word: string;
}

contextBridge.exposeInMainWorld('electronAPI', {
    getPlatform: () => ipcRenderer.sendSync('get:platform'),

    getLanguage: () => ipcRenderer.sendSync('get:language'),

    getDefaultDataPath: () => ipcRenderer.invoke('get:defaultDataPath'),

    shouldUseDarkMode: () => ipcRenderer.sendSync('query:shouldUseDarkMode'),

    checkPathExist: (path: string) => ipcRenderer.invoke('query:checkPathExist', path),

    writeStr: (path: string, str: string) => ipcRenderer.invoke('write:str', path, str),

    writeJson: (path: string, obj: object) => ipcRenderer.invoke('write:json', path, obj),

    readJsonSync: (path: string) => ipcRenderer.invoke('read:json:sync', path),

    readJsonAsync: (path: string) => ipcRenderer.invoke('read:json:async', path),

    readMdSync: (path: string) => ipcRenderer.invoke('read:md:sync', path),

    readCssSync: (css_file_name: string) => ipcRenderer.invoke('read:css:sync', css_file_name),

    remove: (path: string) => ipcRenderer.invoke('operate:remove', path),

    copy: (src_path: string, dest_path: string) =>
        ipcRenderer.invoke('operate:copy', src_path, dest_path),

    move: (src_path: string, dest_path: string) =>
        ipcRenderer.invoke('operate:move', src_path, dest_path),

    openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectoryDialog'),

    openSaveDialog: (file_name: string, file_types: string[]) =>
        ipcRenderer.invoke('dialog:openSaveDialog', file_name, file_types),

    openSelectImagesDialog: (file_types: string[]) =>
        ipcRenderer.invoke('dialog:openSelectImagesDialog', file_types),

    openSelectMarkdownsDialog: (file_types: string[]) =>
        ipcRenderer.invoke('dialog:openSelectMarkdownsDialog', file_types),

    openParentFolder: (path: string) => ipcRenderer.invoke('dialog:openParentFolder', path),

    loadNodejiebaDict: () => ipcRenderer.invoke('plugin:loadNodejiebaDict'),

    nodejieba: (word: string) => ipcRenderer.sendSync('plugin:nodejieba', word),
});
