const {ipcMain, dialog, nativeImage} = require('electron');
const {autoUpdater} = require('electron-updater');
const package = require("../package.json");

// 检测更新，在你想要检查更新的时候执行，renderer事件触发后的操作自行编写
let mainWindow = null;

autoUpdater.autoDownload = false; // 禁用自动下载更新

function updateHandle(window){
    mainWindow = window;
    let message = {
        error:'error', // 检查更新出错
        checking:'checking', // 正在检查更新……
        updateAva:'updateAva', // 检测到新版本
        updateNotAva:'updateNotAva' // 现在使用的就是最新版本，不用更新
    };
    const os = require('os');
    // autoUpdater.setFeedURL('http://www.xxx.com/');
    autoUpdater.on('error', function(error){
        sendUpdateMessage(message.error)
    });
    autoUpdater.on('checking-for-update', function() {
        sendUpdateMessage(message.checking)
    });
    autoUpdater.on('update-available', function(info) {
        sendUpdateMessage(message.updateAva)
        let img = nativeImage.createFromPath('./imges/logo@4x.png');
        dialog.showMessageBox(mainWindow, {
            type: 'question',
            title: 'Swihost version update',
            message: 'A new version is available, and click download to update Swihost.',
            detail: 'Current version: v' + package.version + ', latest version: v' + info.version,
            icon: img,
            noLink: true,
            buttons: ['Don\'t update', 'Download update']
        }, function(buttonIndex, checkboxSelectState){
            if(buttonIndex === 1){
                autoUpdater.downloadUpdate(); // 下载更新
            }
        })
    });
    autoUpdater.on('update-not-available', function(info) {
        sendUpdateMessage(message.updateNotAva)
    });
    
    // 更新下载进度事件
    autoUpdater.on('download-progress', function(progressObj) {
        mainWindow.setProgressBar(progressObj.percent / 100);
        mainWindow.webContents.send('app_update_downloadProgress', progressObj);
    })

    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName, releaseDate, updateUrl, quitAndUpdate){
        mainWindow.setProgressBar(-1);
        ipcMain.on('isUpdateNow', (e, arg) => {
            //some code here to handle event
            autoUpdater.quitAndInstall();
        })
        mainWindow.webContents.send('app_update_isUpdateNow', 'isUpdateNow?');
    });
    
    //执行自动更新检查
    autoUpdater.checkForUpdates();
}

// 通过main进程发送事件给renderer进程，提示更新信息
// mainWindow = new BrowserWindow()
function sendUpdateMessage(text){
    mainWindow.webContents.send('app_update_message', text)
}

module.exports = {
    updateHandle: updateHandle,
    check: function(){
        autoUpdater.checkForUpdates();
    }
};