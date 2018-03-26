const electron = require('electron');
const {ipcMain} = electron;

const fs = require('fs');
const path = require('path');
const sysHostPath = process.platform === 'win32' ? `${process.env.windir ||
    'C:\\WINDOWS'}\\system32\\drivers\\etc\\hosts` : '/etc/hosts';
const dataPath = electron.app.getPath('userData');
const fileUrl = path.join(dataPath, 'config.json');

let host = {
    // 读取系统host
    readSystemHostFile: () => {
        let data = fs.readFileSync(sysHostPath, 'utf8');
        return data;
    },
    // 写入系统host文件
    writeSystemHostFile: (data) => {
        fs.writeFileSync(sysHostPath, data);
    },
    // 获取个人用户host配置文件
    getUserHostConfig: (data) => {
        let userHostConfigArray = [];
        if(fs.existsSync(fileUrl)){
            userHostConfigArray = JSON.parse(fs.readFileSync(fileUrl, 'utf8'));
        }else{
            // 创建host配置文件的默认host
            let config = {
                name: 'Default Host',
                content: data || host.readSystemHostFile(),
                id: '10001',
                state: true
            };
            userHostConfigArray.push(JSON.stringify(config));
            fs.writeFileSync(fileUrl, JSON.stringify(userHostConfigArray));
        }

        ipcMain.on('read_host_message', (event, arg) => {
            event.sender.send('read_host_reply', userHostConfigArray);
        })

        return userHostConfigArray;
    }
}

// 修改host内容消息
ipcMain.on('update_host_message', (event, arg) => {
    arg.systemHost && host.writeSystemHostFile(arg.systemHost);
    fs.writeFileSync(fileUrl, JSON.stringify(arg.configArray));
    event.sender.send('update_host_reply', 'Host saved successfully');
})

module.exports = host;