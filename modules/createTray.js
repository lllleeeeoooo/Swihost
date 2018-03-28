const path = require('path');
const electron = require('electron');
const {Tray, Menu, ipcMain, shell} = electron;

let appTray = '';
let contextMenu = '';

// 系统托盘菜单与渲染进程交互
ipcMain.on('toggle_host_message', (event, arg) => {
    if(arg){
        let item = contextMenu.getMenuItemById(arg);
        item.checked = !item.checked;
    }
})

// 创建系统托盘菜单
function createTray(app, mainWindow, hostList){
    let menu = [];
    menu.push({
        label: 'Open Swihost',
        click: () => {
            mainWindow.show();
        }
    },{
        label: '-',
        type: 'separator'
    });
    for(let i = 0; i < hostList.length; i++){
        let item = JSON.parse(hostList[i]);
        menu.push({
            id: item.id,
            label: item.name,
            type: 'checkbox',
            checked: item.state,
            click: () => {
                mainWindow.webContents.send('toggle_host_reply', item.id);
            }
        });
    }
    menu.push({
        label: '-',
        type: 'separator'
    },{
        label: 'Feedback',
        click: () => {
            shell.openExternal('https://github.com/lllleeeeoooo/Swihost/issues');
        }
    },{
        label: 'Quit Swihost',
        click: () => {
            app.quit();
        }
    })
    
    //图标的上下文菜单
    contextMenu = Menu.buildFromTemplate(menu);

    let icon = '../imges/logo.png';
    if (process.platform === 'darwin'){
        icon = '../imges/logoTemplate.png';
    }
    appTray = appTray ? appTray : new Tray(path.resolve(__dirname, icon));
    //设置此托盘图标的悬停提示内容
    appTray.setToolTip('Swihost');
    
    //设置此图标的上下文菜单
    appTray.setContextMenu(contextMenu);

    appTray.on('click', () => {
        if (process.platform === 'win32') {
            mainWindow.show();
        }
    })
}

module.exports = createTray;