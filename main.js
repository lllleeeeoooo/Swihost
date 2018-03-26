const electron = require('electron');

// 控制应用生命周期的模块。
const {app, ipcMain} = electron;
// 创建原生浏览器窗口的模块。
const {BrowserWindow} = electron;

// 保持一个对于 window 对象的全局引用，如果你不这样做，
// 当 JavaScript 对象被垃圾回收， window 会被自动地关闭
let mainWindow;

const mainMenu = require('./modules/mainMenu');
const createTray = require('./modules/createTray');
const host = require('./modules/host');
const preferences = require('./modules/preferences');
const update = require('./modules/update');

let quitSate = false;

function createWindow() {
    // 获取用户上次关闭前的窗口大小位置信息
    let winBounds = preferences.get();
    // 创建浏览器窗口。
    mainWindow = new BrowserWindow({
        width: winBounds.width || 800,
        minWidth: 800,
        height: winBounds.height || 600,
        minHeight: 500,
        x: winBounds.x || 'center',
        y: winBounds.y || 'center',
        backgroundColor: '#383e4a',
        show: false
    });

    // 加载应用的 index.html。
    mainWindow.loadURL(`file://${__dirname}/index.html`);

    // 启用开发工具。
    mainWindow.webContents.openDevTools();

    // 当 window 被关闭，这个事件会被触发。
    mainWindow.on('closed', () => {
        // 取消引用 window 对象，如果你的应用支持多窗口的话，
        // 通常会把多个 window 对象存放在一个数组里面，
        // 与此同时，你应该删除相应的元素。
        mainWindow = null;
    });

    mainWindow.on('close', (e) => {
        if(quitSate){
            // 保存用户当前窗口大小位置信息
            let winBounds = mainWindow.getBounds();
            preferences.set(winBounds);

            mainWindow = null;
        }else{
            e.preventDefault()
            mainWindow.hide()
        }
    })

    mainWindow.once('ready-to-show', () => {
        mainWindow.show()
    })
}

// 单实例
const shouldQuit = app.makeSingleInstance(
    (commandLine, workingDirectory) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()){
                mainWindow.restore();
            };
        mainWindow.focus();
    };
});
if (shouldQuit) {
    app.quit();
    return;//没有这句话，会报错！
 };

// Electron 会在初始化后并准备
// 创建浏览器窗口时，调用这个函数。
// 部分 API 在 ready 事件触发后才能使用。
app.on('ready', () => {
    createWindow();
    
    let userHostConfig = host.getUserHostConfig();
    
    // 创建系统托盘按钮
    createTray(app, mainWindow, userHostConfig);

    // 创建菜单栏
    mainMenu(mainWindow);

    update(mainWindow);
});

// 当全部窗口关闭时退出。
app.on('window-all-closed', () => {
    // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
    // 否则绝大部分应用及其菜单栏会保持激活。
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // 在 macOS 上，当点击 dock 图标并且该应用没有打开的窗口时，
    // 绝大部分应用会重新创建一个窗口。
    if (mainWindow === null) {
        createWindow();
    }
});

app.on('before-quit', () => {
    quitSate = true;
})

// 新增host更新tray
ipcMain.on('update_host_message', (event, arg) => {
    let userHostConfig = host.getUserHostConfig();

    createTray(app, mainWindow, userHostConfig);
})