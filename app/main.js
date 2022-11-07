const { app, Menu, BrowserWindow, ipcMain, dialog, shell } = require('electron');

const path = require('path');
const CSON = require('cson');
const fse = require('fs-extra');
const nodejieba = require('nodejieba');

if (app.isPackaged) {
    let dictFilePath = path.join(__dirname, '../extraResources/dict');
    nodejieba.load({
        dict: path.join(dictFilePath, '/jieba.dict.utf8'),
        hmmDict: path.join(dictFilePath, '/hmm_model.utf8'),
        userDict: path.join(dictFilePath, '/user.dict.utf8'),
        idfDict: path.join(dictFilePath, '/idf.utf8'),
        stopWordDict: path.join(dictFilePath, '/stop_words.utf8'),
    });
}

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

app.disableHardwareAcceleration();

let mainWindow = null;

const createWindow = async () => {
    mainWindow = new BrowserWindow({
        show: false,
        vibrancy: 'under-window',
        visualEffectState: 'active',
        width: 1080,
        height: 720,
        minWidth: 800,
        minHeight: 520,
        maximizable: true,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 18, y: 18 },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
        },
    });

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, '/build/index.html'));
    } else {
        mainWindow.loadURL('http://localhost:3005');
        // mainWindow.loadFile(path.join(__dirname, '/build/index.html'));
        mainWindow.webContents.openDevTools();
        //await installExtensions();
    }

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow?.isVisible()) {
            mainWindow?.show();
        }
    });
};

const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS', 'DEVTRON'];

    return Promise.all(
        extensions.map((name) => installer.default(installer[name], forceDownload))
    ).catch(console.log);
};

const createMenu = async () => {
    const isMac = process.platform === 'darwin';

    const template = [
        // { role: 'appMenu' }
        ...(isMac
            ? [
                  {
                      label: app.name,
                      submenu: [
                          { role: 'about' },
                          { type: 'separator' },
                          { role: 'hide' },
                          { role: 'hideOthers' },
                          { role: 'unhide' },
                          { type: 'separator' },
                          { role: 'quit' },
                      ],
                  },
              ]
            : []),
        // { role: 'fileMenu' }
        {
            label: 'File',
            submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
        },
        // { role: 'editMenu' }
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...(isMac
                    ? [{ role: 'pasteAndMatchStyle' }, { role: 'delete' }, { role: 'selectAll' }]
                    : [{ role: 'delete' }, { role: 'selectAll' }]),
            ],
        },
        // { role: 'viewMenu' }
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' },
            ],
        },
        // { role: 'windowMenu' }
        {
            label: 'Window',
            submenu: [
                { role: 'minimize' },
                { role: 'zoom' },
                ...(isMac
                    ? [
                          { type: 'separator' },
                          { role: 'front' },
                          { type: 'separator' },
                          { role: 'window' },
                      ]
                    : [{ role: 'close' }]),
            ],
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openExternal('https://electronjs.org');
                    },
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

let server = null;
let socket = null;

const processIPC = () => {
    // ipcMain.on('askOpenHttp', (event, { port }) => {
    //     server = require('http').createServer();
    //     const io = require('socket.io')(server);
    //     io.on('connection', (s) => {
    //         socket = s;
    //         socket.on('MobileToPc', (data) => {
    //             console.log('电脑收到消息:' + data);
    //         });
    //         socket.emit('connectSuccess', '电脑已经连上!');
    //     });

    //     server.on('listening', () => {
    //         mainWindow?.webContents.send('openHttpStatus', {
    //             httpStatus: true,
    //             message: `open http on ${port} success!!`,
    //         });
    //         console.log('这里服务器被开启，要上报坐标');
    //     });

    //     server.once('close', () => {
    //         mainWindow?.webContents.send('closeHttpSuccess');
    //         console.log('这里服务器被停止');
    //     });

    //     server.on('error', (err) => {
    //         console.log(err);
    //         if (err.code === 'EADDRINUSE') {
    //             mainWindow?.webContents.send('openHttpStatus', {
    //                 httpStatus: false,
    //                 message: `open http on ${port} failed!!`,
    //             });
    //         }
    //     });

    //     server.listen(port);
    // });

    // ipcMain.on('askcloseHttp', (event) => {
    //     let result = server.close();
    //     console.log(result);

    //     if (result._connections > 0) {
    //         mainWindow?.webContents.send('closeHttpStatus', {
    //             httpStatus: false,
    //             message: `close http failed!!`,
    //         });
    //     } else {
    //         mainWindow?.webContents.send('closeHttpStatus', {
    //             httpStatus: true,
    //             message: `close http success!!`,
    //         });
    //     }
    // });

    // ipcMain.on('pcSendMessage', (event, { data }) => {
    //     socket?.emit('PcToMobile', data);
    // });

    ipcMain.handle('operate:getPlatform', (event) => {
        return process.platform;
    });

    ipcMain.handle('operate:checkFolderExist', async (event, { folder_path }) => {
        return fse.existsSync(folder_path);
    });

    ipcMain.handle('operate:checkFileExist', async (event, { file_path }) => {
        return fse.existsSync(file_path);
    });

    ipcMain.handle('operate:getDefaultDataPath', async (event) => {
        let default_data_Path = path.join(app.getPath('userData'), 'noteData');
        fse.ensureDirSync(default_data_Path);
        return default_data_Path;
    });

    ipcMain.handle('operate:writeCson', async (event, { file_path, obj }) => {
        console.log('writeCson: ' + file_path);
        fse.ensureFileSync(file_path);
        fse.writeFileSync(file_path, CSON.createCSONString(obj));
        return true;
    });

    ipcMain.handle('operate:writeJson', async (event, { file_path, obj }) => {
        console.log('writeJson: ' + file_path);
        fse.ensureFileSync(file_path);
        fse.writeFileSync(file_path, CSON.createJSONString(obj));
        return true;
    });

    ipcMain.handle('operate:writeStr', async (event, { file_path, str }) => {
        fse.ensureFileSync(file_path);
        fse.writeFileSync(file_path, str);
        return true;
    });

    ipcMain.handle('operate:writeStrToFile', async (event, { folder_path, file_name, str }) => {
        const file_path = path.join(folder_path, file_name);
        fse.ensureFileSync(file_path);
        fse.writeFileSync(file_path, str);
        return true;
    });

    ipcMain.handle('operate:writePngBlob', async (event, { file_path, url }) => {
        fse.ensureFileSync(file_path);
        fse.writeFileSync(file_path, url.replace(/^data:image\/png;base64,/, ''), 'base64');
        return true;
    });

    ipcMain.handle('operate:readCsonSync', async (event, { file_path }) => {
        console.log('readCsonSync: ' + file_path);
        if (!fse.pathExistsSync(file_path)) {
            return false;
        } else {
            let cson_str = fse.readFileSync(file_path);
            return CSON.parseCSONString(cson_str);
        }
    });

    ipcMain.handle('operate:readJsonSync', async (event, { file_path }) => {
        console.log('readJsonSync: ' + file_path);
        if (!fse.pathExistsSync(file_path)) {
            return false;
        } else {
            let json_str = fse.readFileSync(file_path);
            return CSON.parseJSONString(json_str);
        }
    });

    ipcMain.handle('operate:readCssSync', async (event, { file_name }) => {
        let file_path = path.join(__dirname, '/src/resources/css/' + file_name);
        if (app.isPackaged) {
            let cssFilePath = path.join(__dirname, '../extraResources/css/');
            file_path = path.join(cssFilePath, file_name);
        }
        if (!fse.pathExistsSync(file_path)) {
            return false;
        } else {
            let css_str = fse.readFileSync(file_path, 'utf-8');
            return css_str;
        }
    });

    ipcMain.handle('operate:readJsonAsync', async (event, { file_path }) => {
        console.log('readJsonAsync: ' + file_path);
        return new Promise((resolve, reject) => {
            if (!fse.pathExistsSync(file_path)) {
                reject(false);
            }
            fse.readFile(file_path, (err, json_str) => {
                if (err) {
                    reject(false);
                } else {
                    resolve(CSON.parseJSONString(json_str));
                }
            });
        });
    });

    ipcMain.handle(
        'operate:copy',
        async (event, { src_file_path, dest_dir_path, dest_file_name }) => {
            const dest_file_path = path.join(dest_dir_path, dest_file_name);
            console.log('copy: ' + src_file_path + ' to ' + dest_file_path);
            fse.ensureDirSync(dest_dir_path);
            fse.copyFileSync(src_file_path, dest_file_path);
            return true;
        }
    );

    ipcMain.handle('operate:move', async (event, { src_file_path, dest_file_path }) => {
        console.log('move: ' + src_file_path + ' to ' + dest_file_path);
        fse.moveSync(src_file_path, dest_file_path);
        return true;
    });

    ipcMain.handle('operate:remove', async (event, { file_path }) => {
        console.log('remove: ' + file_path);
        fse.removeSync(file_path);
        return true;
    });

    ipcMain.handle('dialog:openDirectoryDialog', async (event) => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });

        if (!canceled && filePaths.length > 0) {
            return filePaths[0];
        } else {
            return;
        }
    });

    ipcMain.handle('dialog:openSaveDialog', async (event, { file_name, file_types }) => {
        const { canceled, filePath } = await dialog.showSaveDialog({
            title: 'Select the File Path to save',
            buttonLabel: 'Save',
            defaultPath: '*/' + file_name.replace('/', ' '),
            filters: [
                {
                    name: file_name,
                    extensions: file_types,
                },
            ],
            properties: [],
        });

        if (!canceled) {
            return filePath;
        } else {
            return;
        }
    });

    ipcMain.handle('dialog:openSelectImagesDialog', async (event, { file_types }) => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'Select images',
            buttonLabel: 'Load',
            defaultPath: '*/',
            filters: [
                {
                    name: 'Images',
                    extensions: file_types,
                },
            ],
            properties: ['openFile', 'multiSelections'],
        });

        if (!canceled) {
            return filePaths;
        } else {
            return;
        }
    });

    ipcMain.handle('dialog:openParentFolder', async (event, { folder_path }) => {
        shell.showItemInFolder(folder_path);
        return;
    });

    ipcMain.handle('dialog:openFolder', async (event, { folder_path }) => {
        fse.ensureDirSync(folder_path);
        shell.openPath(folder_path);
        return;
    });

    ipcMain.on('plugin:nodejieba', async (event, { word }) => {
        let en_word = word.replace(/[^a-zA-Z]/g, ' ').replace(/\s+/g, ' ');
        let zh_word = word.replace(/[a-zA-Z]/g, ' ').replace(/\s+/g, ' ');
        let result = [...en_word.split(' '), ...nodejieba.cut(zh_word)];
        result = result.filter((w) => w !== ' ' && w !== '');
        event.returnValue = result;
    });
};

app.whenReady().then(() => {
    createWindow();
    createMenu();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
    processIPC();
});

app.on('second-instance', () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
