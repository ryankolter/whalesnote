import {
    app,
    Menu,
    BrowserWindow,
    ipcMain,
    dialog,
    nativeTheme,
    shell,
    MenuItemConstructorOptions,
} from 'electron';
import * as path from 'path';
import * as fse from 'fs-extra';
import * as nodejieba from 'nodejieba';

let mainWindow: BrowserWindow | null = null;

if (!app.requestSingleInstanceLock()) {
    app.quit();
    process.exit(0);
}

app.disableHardwareAcceleration();

const createWindow = async (): Promise<void> => {
    mainWindow = new BrowserWindow({
        show: false,
        vibrancy: 'under-window',
        visualEffectState: 'active',
        autoHideMenuBar: true,
        width: 1080,
        height: 720,
        minWidth: 800,
        minHeight: 520,
        maximizable: true,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 18, y: 18 },
        webPreferences: {
            preload: path.join(__dirname, './preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    mainWindow.setBackgroundColor('#2A2C34');

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    if (app.isPackaged) {
        mainWindow.loadFile(path.join(__dirname, './index.html'));
    } else {
        mainWindow.loadURL('http://localhost:3005');
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('ready-to-show', () => {
        if (!mainWindow?.isVisible()) {
            mainWindow?.show();
        }
    });
};

const createMenu = async (): Promise<void> => {
    const isMac = process.platform === 'darwin';

    const template: Electron.MenuItemConstructorOptions[] = [
        isMac
            ? {
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
              }
            : {},
        {
            label: 'File',
            submenu: [isMac ? { role: 'close' } : { role: 'quit' }],
        },
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                ...((isMac
                    ? [{ role: 'pasteAndMatchStyle' }]
                    : [{}]) as MenuItemConstructorOptions[]),
                { role: 'delete' },
                { role: 'selectAll' },
            ],
        },
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
            ] as MenuItemConstructorOptions[],
        },
        {
            role: 'help',
            submenu: [
                {
                    label: 'Learn More',
                    click: async () => {
                        await shell.openExternal('https://electronjs.org');
                    },
                },
            ],
        },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
};

let server: any = null;
let socket: any = null;

const processIPC = (): void => {
    //get, return value
    ipcMain.on('get:platform', (event) => {
        event.returnValue = process.platform;
    });

    ipcMain.on('get:language', (event) => {
        event.returnValue = app.getLocale();
    });

    ipcMain.handle('get:defaultDataPath', async () => {
        const default_data_Path = path.join(app.getPath('userData'), 'workspace1');
        fse.ensureDirSync(default_data_Path);
        return default_data_Path;
    });

    //query, return true/false
    ipcMain.on('query:shouldUseDarkMode', (event) => {
        event.returnValue = nativeTheme.shouldUseDarkColors;
    });

    ipcMain.handle('query:checkPathExist', async (_, path: string) => {
        return fse.existsSync(path);
    });

    //write
    ipcMain.handle('write:str', async (_, path: string, str: string) => {
        console.log('write:str: ' + path);
        fse.ensureFileSync(path);
        fse.writeFileSync(path, str);
        return true;
    });

    ipcMain.handle('write:json', async (_, path: string, obj: object) => {
        console.log('write:json: ' + path);
        fse.ensureFileSync(path);
        fse.writeFileSync(path, JSON.stringify(obj, null, 2));
        return true;
    });

    //read
    ipcMain.handle('read:json:sync', async (_, path: string) => {
        console.log('read:json:sync: ' + path);
        if (!fse.pathExistsSync(path)) {
            return false;
        } else {
            try {
                const json_str = fse.readFileSync(path);
                return JSON.parse(json_str.toString());
            } catch {
                return false;
            }
        }
    });

    ipcMain.handle('read:json:async', async (_, path: string) => {
        console.log('read:json:async: ' + path);
        return new Promise((resolve, reject) => {
            if (!fse.pathExistsSync(path)) {
                reject(false);
            }
            fse.readFile(path, (err, buf) => {
                if (err) {
                    reject(false);
                } else {
                    try {
                        const obj = JSON.parse(buf.toString());
                        resolve(obj);
                    } catch {
                        reject(false);
                    }
                }
            });
        });
    });

    ipcMain.handle('read:md:sync', async (_, path: string) => {
        console.log('read:md:sync: ' + path);
        if (!fse.pathExistsSync(path)) {
            return false;
        } else {
            const md_str = fse.readFileSync(path);
            return md_str.toString();
        }
    });

    ipcMain.handle('read:css:sync', async (_, css_file_name: string) => {
        let file_path = path.join(__dirname, '../../src/resources/css/', css_file_name);
        console.log(file_path);

        if (app.isPackaged) {
            const cssFilePath = path.join(__dirname, '../../extraResources/css/');
            file_path = path.join(cssFilePath, css_file_name);
        }
        if (!fse.pathExistsSync(file_path)) {
            return false;
        } else {
            return fse.readFileSync(file_path, 'utf-8');
        }
    });

    //operate
    ipcMain.handle('operate:remove', async (_, path: string) => {
        console.log('remove: ' + path);
        fse.removeSync(path);
        return true;
    });

    ipcMain.handle('operate:copy', async (_, src_path: string, dest_path: string) => {
        console.log('copy: ' + src_path + ' to ' + dest_path);
        fse.ensureDirSync(path.dirname(dest_path));
        fse.copyFileSync(src_path, dest_path);
        return true;
    });

    ipcMain.handle('operate:move', async (_, src_path: string, dest_path: string) => {
        fse.ensureDirSync(path.dirname(dest_path));
        fse.moveSync(src_path, dest_path);
        return true;
    });

    //dialog
    ipcMain.handle('dialog:openDirectoryDialog', async () => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            properties: ['openDirectory'],
        });

        if (!canceled && filePaths.length > 0) {
            return filePaths[0];
        } else {
            return '';
        }
    });

    ipcMain.handle('dialog:openSaveDialog', async (_, file_name: string, file_types: string[]) => {
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
            return '';
        }
    });

    ipcMain.handle('dialog:openSelectImagesDialog', async (_, file_types: string[]) => {
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
            return [];
        }
    });

    ipcMain.handle('dialog:openSelectMarkdownsDialog', async (_, file_types: string[]) => {
        const { canceled, filePaths } = await dialog.showOpenDialog({
            title: 'Select markdown files',
            buttonLabel: 'Load',
            defaultPath: '*/',
            filters: [
                {
                    name: 'Markdown',
                    extensions: file_types,
                },
            ],
            properties: ['openFile', 'multiSelections'],
        });

        if (!canceled) {
            return filePaths;
        } else {
            return [];
        }
    });

    ipcMain.handle('dialog:openParentFolder', async (_, path: string) => {
        shell.showItemInFolder(path);
        return;
    });

    //nodejieba
    ipcMain.handle('plugin:loadNodejiebaDict', async () => {
        const dictFilePath = app.isPackaged
            ? path.join(__dirname, '../../extraResources/dict')
            : path.join(__dirname, '../../src/resources/dict');
        nodejieba.load({
            dict: path.join(dictFilePath, '/jieba.dict.utf8'),
            hmmDict: path.join(dictFilePath, '/hmm_model.utf8'),
            userDict: path.join(dictFilePath, '/user.dict.utf8'),
            idfDict: path.join(dictFilePath, '/idf.utf8'),
            stopWordDict: path.join(dictFilePath, '/stop_words.utf8'),
        });
    });

    ipcMain.on('plugin:nodejieba', (event, word: string) => {
        const en_word = word.replace(/[^a-zA-Z]/g, ' ').replace(/\s+/g, ' ');
        const zh_word = word.replace(/[a-zA-Z]/g, ' ').replace(/\s+/g, ' ');
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
