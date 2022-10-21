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

let win = null;

const createWindow = async () => {
    win = new BrowserWindow({
        show: false,
        vibrancy: 'under-window',
        visualEffectState: 'active',
        width: 1080,
        height: 720,
        minWidth: 800,
        minHeight: 520,
        maximizable: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    win.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    if (app.isPackaged) {
        win.loadFile(path.join(__dirname, '/build/index.html'));
    } else {
        win.loadURL('http://localhost:3005');
        // win.loadFile(path.join(__dirname, '/build/index.html'));
        win.webContents.openDevTools();
        await installExtensions();
    }

    win.on('ready-to-show', () => {
        if (!win?.isVisible()) {
            win?.show();
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
    ipcMain.on('askOpenHttp', (event, { port }) => {
        server = require('http').createServer();
        const io = require('socket.io')(server);
        io.on('connection', (s) => {
            socket = s;
            socket.on('MobileToPc', (data) => {
                console.log('电脑收到消息:' + data);
            });
            socket.emit('connectSuccess', '电脑已经连上!');
        });

        server.on('listening', () => {
            win?.webContents.send('openHttpStatus', {
                httpStatus: true,
                message: `open http on ${port} success!!`,
            });
            console.log('这里服务器被开启，要上报坐标');
        });

        server.once('close', () => {
            win?.webContents.send('closeHttpSuccess');
            console.log('这里服务器被停止');
        });

        server.on('error', (err) => {
            console.log(err);
            if (err.code === 'EADDRINUSE') {
                win?.webContents.send('openHttpStatus', {
                    httpStatus: false,
                    message: `open http on ${port} failed!!`,
                });
            }
        });

        server.listen(port);
    });

    ipcMain.on('askcloseHttp', (event) => {
        let result = server.close();
        console.log(result);

        if (result._connections > 0) {
            win?.webContents.send('closeHttpStatus', {
                httpStatus: false,
                message: `close http failed!!`,
            });
        } else {
            win?.webContents.send('closeHttpStatus', {
                httpStatus: true,
                message: `close http success!!`,
            });
        }
    });

    ipcMain.on('pcSendMessage', (event, { data }) => {
        socket?.emit('PcToMobile', data);
    });

    ipcMain.on('folderExist', (event, { folder_path }) => {
        event.returnValue = fse.existsSync(folder_path);
    });

    ipcMain.on('fileExist', (event, { file_path }) => {
        event.returnValue = fse.existsSync(file_path);
    });

    ipcMain.on('defaultDataPath', (event) => {
        let default_data_Path = path.join(app.getPath('userData'), 'noteData');
        fse.ensureDirSync(default_data_Path);
        event.returnValue = default_data_Path;
    });

    ipcMain.on('writeCson', (event, { file_path, obj }) => {
        console.log('writeCson: ' + file_path);
        fse.ensureFileSync(file_path);
        fse.writeFileSync(file_path, CSON.createCSONString(obj));
        event.returnValue = true;
    });

    ipcMain.on('writeJson', (event, { file_path, obj }) => {
        console.log('writeJson: ' + file_path);
        fse.ensureFileSync(file_path);
        fse.writeFileSync(file_path, CSON.createJSONString(obj));
        event.returnValue = true;
    });

    ipcMain.on('writeStr', (event, { file_path, str }) => {
        fse.ensureFileSync(file_path);
        fse.writeFileSync(file_path, str);
        event.returnValue = true;
    });

    ipcMain.on('writeStrToFile', (event, { folder_path, file_name, str }) => {
        const file_path = path.join(folder_path, file_name);
        fse.ensureFileSync(file_path);
        fse.writeFileSync(file_path, str);
        event.returnValue = true;
    });

    ipcMain.on('writePngBlob', (event, { file_path, url }) => {
        fse.ensureFileSync(file_path);
        fse.writeFileSync(file_path, url.replace(/^data:image\/png;base64,/, ''), 'base64');
        event.returnValue = true;
    });

    ipcMain.on('readCson', (event, { file_path }) => {
        console.log('readCson: ' + file_path);
        if (!fse.pathExistsSync(file_path)) {
            event.returnValue = false;
        } else {
            let cson_str = fse.readFileSync(file_path);
            event.returnValue = CSON.parseCSONString(cson_str);
        }
    });

    ipcMain.on('readJson', (event, { file_path }) => {
        console.log('readJson: ' + file_path);
        if (!fse.pathExistsSync(file_path)) {
            event.returnValue = false;
        } else {
            let json_str = fse.readFileSync(file_path);
            event.returnValue = CSON.parseJSONString(json_str);
        }
    });

    ipcMain.on('readCss', (event, { file_name }) => {
        let file_path = path.join(__dirname, '/src/resources/css/' + file_name);
        if (app.isPackaged) {
            let cssFilePath = path.join(__dirname, '../extraResources/css/');
            file_path = path.join(cssFilePath, file_name);
        }
        if (!fse.pathExistsSync(file_path)) {
            event.returnValue = false;
        } else {
            let css_str = fse.readFileSync(file_path, 'utf-8');
            event.returnValue = css_str;
        }
    });

    ipcMain.on('copy', (event, { src_file_path, dest_dir_path, dest_file_name }) => {
        const dest_file_path = path.join(dest_dir_path, dest_file_name);
        console.log('copy: ' + src_file_path + ' to ' + dest_file_path);
        fse.ensureDirSync(dest_dir_path);
        fse.copyFileSync(src_file_path, dest_file_path);
        event.returnValue = true;
    });

    ipcMain.on('move', (event, { src_file_path, dest_file_path }) => {
        console.log('move: ' + src_file_path + ' to ' + dest_file_path);
        fse.moveSync(src_file_path, dest_file_path);
        event.returnValue = true;
    });

    ipcMain.on('remove', (event, { file_path }) => {
        console.log('remove: ' + file_path);
        fse.removeSync(file_path);
        event.returnValue = true;
    });

    ipcMain.on('open-directory-dialog', (event, { response_event_name }) => {
        dialog
            .showOpenDialog({
                properties: ['openDirectory'],
            })
            .then((files) => {
                if (files && !files.canceled && files.filePaths.length > 0) {
                    event.sender.send(response_event_name, files.filePaths[0]);
                }
            });
    });

    ipcMain.on('open-save-dialog', (event, { file_name, file_types, response_event_name }) => {
        dialog
            .showSaveDialog({
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
            })
            .then((files) => {
                if (files && !files.canceled) {
                    event.sender.send(response_event_name, files.filePath);
                }
            });
    });

    ipcMain.on('open-select-images-dialog', (event, { file_types, response_event_name }) => {
        console.log(file_types);
        dialog
            .showOpenDialog({
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
            })
            .then((files) => {
                if (files && !files.canceled) {
                    event.sender.send(response_event_name, files.filePaths);
                }
            });
    });

    ipcMain.on('open-parent-folder', (event, { folder_path }) => {
        shell.showItemInFolder(folder_path);
    });

    ipcMain.on('open-folder', (event, { folder_path }) => {
        fse.ensureDirSync(folder_path);
        shell.openPath(folder_path);
    });

    ipcMain.on('nodejieba', (event, { word }) => {
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
    if (win) {
        if (win.isMinimized()) win.restore();
        win.focus();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
