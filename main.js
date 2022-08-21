const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");

const path = require("path");
const CSON = require("cson");
const fse = require("fs-extra");

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.disableHardwareAcceleration();

let win = null;

const createWindow = async () => {
  win = new BrowserWindow({
    show: false,
    vibrancy: "under-window",
    visualEffectState: "active",
    width: 1080,
    height: 720,
    minWidth: 500,
    minHeight: 320,
    maximizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  //win?.loadFile(path.join(__dirname, "/build/index.html"));
  win?.loadURL("http://localhost:3000");

  win?.webContents.openDevTools();

  win?.webContents.on(
    "select-bluetooth-device",
    (event, deviceList, callback) => {
      event.preventDefault();
      if (deviceList && deviceList.length > 0) {
        callback(deviceList[0].deviceId);
      }
    }
  );

  win.on("ready-to-show", () => {
    if (!win?.isVisible()) {
      win?.show();
    }
  });
};

let server = null;
let socket = null;

const processIPC = () => {
  ipcMain.on("askOpenHttp", (event, { port }) => {
    server = require("http").createServer();
    const io = require("socket.io")(server);
    io.on("connection", (s) => {
      socket = s;
      socket.on("MobileToPc", (data) => {
        console.log("电脑收到消息:" + data);
      });
      socket.emit("connectSuccess", "电脑已经连上!");
    });

    server.on("listening", () => {
      win?.webContents.send("openHttpStatus", {
        httpStatus: true,
        message: `open http on ${port} success!!`,
      });
      console.log("这里服务器被开启，要上报坐标");
    });

    server.once("close", () => {
      win?.webContents.send("closeHttpSuccess");
      console.log("这里服务器被停止");
    });

    server.on("error", (err) => {
      console.log(err);
      if (err.code === "EADDRINUSE") {
        win?.webContents.send("openHttpStatus", {
          httpStatus: false,
          message: `open http on ${port} failed!!`,
        });
      }
    });

    server.listen(port);
  });

  ipcMain.on("askcloseHttp", (event) => {
    let result = server.close();
    console.log(result);

    if (result._connections > 0) {
      win?.webContents.send("closeHttpStatus", {
        httpStatus: false,
        message: `close http failed!!`,
      });
    } else {
      win?.webContents.send("closeHttpStatus", {
        httpStatus: true,
        message: `close http success!!`,
      });
    }
  });

  ipcMain.on("pcSendMessage", (event, { data }) => {
    socket?.emit("PcToMobile", data);
  });

  ipcMain.on("folderExist", (event, { folder_path }) => {
    event.returnValue = fse.existsSync(folder_path);
  });

  ipcMain.on("fileExist", (event, { file_path }) => {
    event.returnValue = fse.existsSync(file_path);
  });

  ipcMain.on("writeCson", (event, { file_path, obj }) => {
    console.log("writeCson: " + file_path);
    fse.ensureFileSync(file_path);
    fse.writeFileSync(file_path, CSON.createCSONString(obj));
    event.returnValue = true;
  });

  ipcMain.on("writeJson", (event, { file_path, obj }) => {
    console.log("writeJson: " + file_path);
    fse.ensureFileSync(file_path);
    fse.writeFileSync(file_path, CSON.createJSONString(obj));
    event.returnValue = true;
  });

  ipcMain.on("readCson", (event, { file_path }) => {
    console.log("readCson: " + file_path);
    if (!fse.pathExistsSync(file_path)) {
      event.returnValue = false;
    } else {
      let cson_str = fse.readFileSync(file_path);
      event.returnValue = CSON.parseCSONString(cson_str);
    }
  });

  ipcMain.on("readJson", (event, { file_path }) => {
    console.log("readJson: " + file_path);
    if (!fse.pathExistsSync(file_path)) {
      event.returnValue = false;
    } else {
      let json_str = fse.readFileSync(file_path);
      event.returnValue = CSON.parseJSONString(json_str);
    }
  });

  ipcMain.on("move", (event, { src_file_path, dest_file_path }) => {
    console.log("move: " + src_file_path + " to " + dest_file_path);
    fse.moveSync(src_file_path, dest_file_path);
    event.returnValue = true;
  });

  ipcMain.on("remove", (event, { file_path }) => {
    console.log("remove: " + file_path);
    fse.removeSync(file_path);
    event.returnValue = true;
  });

  ipcMain.on("open-directory-dialog", (event, p) => {
    dialog
      .showOpenDialog({
        properties: ["openDirectory"],
      })
      .then((files) => {
        console.log(files);
        if (files && !files.canceled && files.filePaths.length > 0) {
          event.sender.send("selectedFolder", files.filePaths[0]);
        }
      });
  });

  ipcMain.on("open-folder", (event, { folder_path }) => {
    shell.showItemInFolder(folder_path);
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  processIPC();
});

app.on("second-instance", () => {
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
