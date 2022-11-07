const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    checkFolderExist: (params) => ipcRenderer.invoke('operate:checkFolderExist', params),
    checkFileExist: (params) => ipcRenderer.invoke('operate:checkFileExist', params),
    getDefaultDataPath: (params) => ipcRenderer.invoke('operate:getDefaultDataPath', params),
    getPlatform: (params) => ipcRenderer.invoke('operate:getPlatform', params),
    writeCson: (params) => ipcRenderer.invoke('operate:writeCson', params),
    writeJson: (params) => ipcRenderer.invoke('operate:writeJson', params),
    writeStr: (params) => ipcRenderer.invoke('operate:writeStr', params),
    writeStrToFile: (params) => ipcRenderer.invoke('operate:writeStrToFile', params),
    writePngBlob: (params) => ipcRenderer.invoke('operate:writePngBlob', params),
    readCsonSync: (params) => ipcRenderer.invoke('operate:readCsonSync', params),
    readJsonSync: (params) => ipcRenderer.invoke('operate:readJsonSync', params),
    readCssSync: (params) => ipcRenderer.invoke('operate:readCssSync', params),
    readJsonAsync: (params) => ipcRenderer.invoke('operate:readJsonAsync', params),
    remove: (params) => ipcRenderer.invoke('operate:remove', params),
    copy: (params) => ipcRenderer.invoke('operate:copy', params),
    move: (params) => ipcRenderer.invoke('operate:move', params),
    openDirectoryDialog: (params) => ipcRenderer.invoke('dialog:openDirectoryDialog', params),
    openSaveDialog: (params) => ipcRenderer.invoke('dialog:openSaveDialog', params),
    openSelectImagesDialog: (params) => ipcRenderer.invoke('dialog:openSelectImagesDialog', params),
    openParentFolder: (params) => ipcRenderer.invoke('dialog:openParentFolder', params),
    openFolder: (params) => ipcRenderer.invoke('dialog:openFolder', params),
    loadNodejiebaDict: (params) => ipcRenderer.invoke('plugin:loadNodejiebaDict', params),
    nodejieba: (params) => ipcRenderer.sendSync('plugin:nodejieba', params),
});
