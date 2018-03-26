const electron = require('electron');

const fs = require('fs');
const path = require('path');
const dataPath = electron.app.getPath('userData');
const fileUrl = path.join(dataPath, 'preferences.json');

var preferences = {
    // 获取用户偏好设置
    get: () => {
        let data = {};
        if(fs.existsSync(fileUrl)){
            data = fs.readFileSync(fileUrl, 'utf8');
        }
        try {
            data = JSON.parse(data);
        } catch (error) {}
        
        return data;
    },
    // 设置用户偏好设置
    set: (data) => {
        try {
            data = JSON.stringify(data);
        } catch (error) {}

        fs.writeFileSync(fileUrl, data);
    }
}
module.exports = preferences;