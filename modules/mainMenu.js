const electron = require('electron');
const {Menu, ipcMain, shell} = electron;

const update = require('./update');

let mainWindow = null;
const template = [{
    label: 'File',
    submenu: [{
        label: 'New Host',
        accelerator: 'CommandOrControl+N',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'newHost');
        }
    },{
        label: 'Save Host',
        accelerator: 'CommandOrControl+S',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'saveHost');
        }
    },{
        type: 'separator'
    },{
        label: 'Quit',
        accelerator: 'CommandOrControl+Q',
        role: 'quit'
    }]
}, {
    label: 'Edit',
    submenu: [{
        label: 'Undo',
        accelerator: 'CommandOrControl+Z',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'undo');
        }
    },{
        label: 'Redo',
        accelerator: 'CommandOrControl+Y',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'redo');
        }
    },{
        type: 'separator'
    },{
        label: 'Reload',
        accelerator: 'CommandOrControl+X',
        role: 'reload'
    },{
        label: 'Copy',
        accelerator: 'CommandOrControl+C',
        role: 'copy'
    },{
        label: 'Paste',
        accelerator: 'CommandOrControl+V',
        role: 'paste'
    },{
        label: 'Select All',
        accelerator: 'CommandOrControl+A',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'selectAll');
        }
    },{
        type: 'separator'
    },{
        label: 'Search',
        accelerator: 'CommandOrControl+F',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'search');
        }
    },{
        label: 'Replace',
        accelerator: 'CommandOrControl+Shift+F',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'replace');
        }
    },{
        label: 'Replace All',
        accelerator: 'CommandOrControl+Shift+R',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'replaceAll');
        }
    },{
        type: 'separator'
    },{
        label: 'Comment',
        accelerator: 'CommandOrControl+/',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'comment');
        }
    }]
},{
    label: 'Help',
    submenu: [{
        label: 'Hot keys',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'hotKeys');
        }
    },{
        label: 'About',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'about');
        }
    },{
        label: 'Feedback',
        click: () => {
            shell.openExternal('https://github.com/lllleeeeoooo/Swihost/issues');
        }
    },{
        label: 'Check update',
        click: () => {
            mainWindow.webContents.send('main_menu_reply', 'update');
            update.check();
        }
    }]
}]

function mainMenuInit(window){
    mainWindow = window;
    const mianMenu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(mianMenu);
}

module.exports = mainMenuInit;