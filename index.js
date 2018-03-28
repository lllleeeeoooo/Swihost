const {ipcRenderer, remote} = require('electron');
const package = require("./package.json");

const os = process.platform;

const pageLeft = $('#page_left');
const hostList = $('#host_list');
const content = $('#content');
const keyMaps = $('#key_maps');
const pageAbout = $('#page_about');

let configArray = [];
let configObject = {};
let editor = '';
let systemHost = '';
let editorDoc = '';
let updateMessageDisplay = false;

ipcRenderer.on('read_host_reply', (event, arg) => {
    configArray = arg;
    let html = '<div class="active system_host" data-id="10000"><i class="icon-desktop_windows"></i><span class="host_name">System Host</span><i class="icon-lock_outline"></i></div>';
    systemHost = '';
    for(let i = 0; i < arg.length; i++){
        let item = JSON.parse(arg[i]),
            checkbox = '<input type="checkbox">';
        
        configObject[item.id] = item.content;
        if(item.state){
            systemHost != '' ? systemHost += '\n\n' : '';
            systemHost += '# ' + item.name + '\n' + item.content;
            checkbox = '<input type="checkbox" checked="checked">';
        }
        
        html += '<div data-id="'+ item.id +'" data-name="'+ item.name +'"><i class="icon-turned_in_not"></i><span class="host_name">'+ item.name +'</span><span class="switchButton">'+ checkbox +'</span></div>';
    }
    
    configObject['10000'] = systemHost;

    hostList.html('').append(html); // host 列表
    content.val(systemHost); // 默认显示系统host

    editor = CodeMirror.fromTextArea(document.getElementById("content"), {
        mode: {
            name: "text/x-cython",
            version: 2,
            singleLineStringErrors: false
        },
        // styleActiveLine: true,
        lineNumbers: true,
        lineWrapping: true,
        viewportMargin: Infinity,
        theme: 'material',
        scrollbarStyle: 'simple',
        extraKeys: {"Ctrl-F": "findPersistent"},
        // extraKeys: {
        //     "Ctrl-S": saveHostData
        // }
    })
    editor.on('change', function(){
        if(window.sessionStorage.getItem('switchHostTag') == 1){
            window.sessionStorage.setItem('switchHostTag', 0);
        }else if(editorDoc.historySize().undo > 0){
            if(hostList.find('.active').attr('data-id') == '10000'){
                return false;
            }
            hostList.find('.active').addClass('changed');
        }else{
            hostList.find('.active').removeClass('changed');
        }
    });
    editor.setOption('readOnly', true);
    editorDoc = editor.getDoc(); // 从编辑器中检索当前活动的文档
    pageLeft.find('.nano').nanoScroller();
})
ipcRenderer.send('read_host_message', 'ping');

// host切换
hostList.on('click', '> div', function(){
    saveHostData();

    let _this = $(this);
    if(_this.attr('data-id') == '10000'){
        editor.setOption('readOnly', true);
        $('#tool_edit_host, #tool_del_host').addClass('hide');
    }else{
        editor.setOption('readOnly', false);
        $('#tool_edit_host, #tool_del_host').removeClass('hide');
    }

    hostList.find('> div').removeClass('active');
    _this.addClass('active');

    // switchHostTag用来标记是否是切换host产生的第一条编辑器历史记录
    window.sessionStorage.setItem('switchHostTag', 1);
    editorDoc.setValue(configObject[_this.attr('data-id')]);
    editorDoc.clearHistory();
    editor.scrollTo(0, 1);
    // editor.focus();
    // editorDoc.setCursor({line: editor.lineCount() - 1, ch: editor.getLine()})
})

// 新增host
$('#tool_add_host').click(function(){
    _alert('New host', '<div><input type="text" placeholder="Host name" id="new_host_name"></div>', function(){
        $('#new_host_name').focus();
    }, function(alertElement){
        let name = $('#new_host_name').val(),
            _id = createdId();

        if(!name || !_id){
            return false;
        }

        updateHost({
            'id': _id,
            'name': name,
            'type': 'add'
        })

        let html = '<div data-id="'+ _id +'" data-name="'+ name +'"><i class="icon-turned_in_not"></i><span class="host_name">'+ name +'</span><span class="switchButton"><input type="checkbox"></span></div>';
        hostList.append(html);
        pageLeft.find('.nano').nanoScroller();
        alertElement.addClass('hide');
    })
})

// 删除host
$('#tool_del_host').click(function(){
    let _name = hostList.find('.active').text();
    _alert('Delete host', 'Delete the "'+ _name +'" host file?', function(){
    }, function(alertElement){
        let _id = hostList.find('.active').attr('data-id');
        
        updateHost({
            'id': _id,
            'type': 'delete'
        })
        hostList.find('.active').remove();
        hostList.find('[data-id="10000"]').click();
        pageLeft.find('.nano').nanoScroller();
        alertElement.addClass('hide');
    }, 'delete')
})

// 保存host
$('#save_button').click(function(){
    let _id = hostList.find('.active').attr('data-id'),
        _content = editorDoc.getValue();
    
    updateHost({
        'id': _id,
        'content': _content,
        'type': 'update'
    })
})

// 更新host数据 configObject
ipcRenderer.once('edit_host_reply', (event, arg) => {
    configObject = arg;
})

// 编辑host名称
$('#tool_edit_host').click(function(){
    _alert('Edit host', '<div><input type="text" placeholder="Host name" id="edit_host_name"></div>', function(){
        $('#edit_host_name').val(hostList.find('.active').text()).focus();
    }, function(alertElement){
        let name = $('#edit_host_name').val(),
            activeItem = hostList.find('.active');

        alertElement.addClass('hide');
        if(!name || name == activeItem.find('.host_name').text()){
            return false;
        }
        let _id = activeItem.attr('data-id');

        updateHost({
            'name': name,
            'id': _id,
            'type': 'update'
        })
        activeItem.find('.host_name').text(name);
    })
})

hostList.on('click', '.switchButton', function(event){
    event.stopPropagation();
    let _id = $(this).parent('div').attr('data-id');
    updateHost({
        'id': _id,
        'type': 'switch'
    })

    ipcRenderer.send('toggle_host_message', _id);
})

ipcRenderer.on('update_host_reply', (event, arg) => {
    notice('Host saved successfully');
})

// 渲染进程与系统托盘菜单交互
ipcRenderer.on('toggle_host_reply', (event, arg) => {
    let checkBox = hostList.find('div[data-id="'+ arg +'"] .switchButton input');
    if(checkBox.is(':checked')){
        checkBox.removeAttr('checked');
    }else{
        checkBox.prop('checked', 'checked');
    }

    updateHost({
        'id': arg,
        'type': 'switch'
    })
})

// 渲染进程与主菜单交互
ipcRenderer.on('main_menu_reply', (event, arg) => {
    if(arg == 'newHost'){
        $('#tool_add_host').click();
    }else if(arg == 'saveHost'){
        saveHostData();
    }else if(arg == 'undo'){
        editorDoc.undo();
    }else if(arg == 'redo'){
        editorDoc.redo();
    }else if(arg == 'selectAll'){
        editor.focus();
        editorDoc.setSelection({line: 0, ch: 0 }, {line: editorDoc.lineCount() - 1, ch: editorDoc.getLine()});
    }else if(arg == 'comment'){
        commentCode();
    }else if(arg == 'search'){
        CodeMirror.commands.findPersistent(editor);
    }else if(arg == 'replace'){
        CodeMirror.commands.replace(editor);
    }else if(arg == 'replaceAll'){
        CodeMirror.commands.replaceAll(editor);
    }else if(arg == 'hotKeys'){
        pageAbout.addClass('hide');
        keyMaps.removeClass('hide');
    }else if(arg == 'about'){
        keyMaps.addClass('hide');
        pageAbout.removeClass('hide');
    }else if(arg == 'update'){
        updateMessageDisplay = true;
    }
})

$('#about_versions').text('v' + package.version);
let _info = '<span>Node: ' + process.versions.node + '</span>';
_info += '<span>Electron: ' + process.versions.electron + '</span>';
_info += '<span>Chromium: ' + process.versions.chrome + '</span>';
// _info += '<span>V8: ' + process.versions.v8 + '</span>';
$('#about_other_info').html(_info);

// 重新定义快捷键，当浏览器和APP有相同快捷键相同方法时，有些快捷键可能会造成触发对象不是app而是浏览器
$('body').on('keydown', function(){
    if(event.ctrlKey && event.keyCode == 65){
        // 全选
        event.preventDefault();
        editor.focus();
        editorDoc.setSelection({line: 0, ch: 0 }, {line: editorDoc.lineCount() - 1, ch: editorDoc.getLine()});
    }else if(event.ctrlKey && event.keyCode == 90){
        event.preventDefault();
        editorDoc.undo();
    }else if(event.ctrlKey && event.keyCode == 89){
        event.preventDefault();
        editorDoc.redo();
    }
})

if(os === 'darwin'){
    let item = keyMaps.find('.key_item > span:first-child');
    for(let i = 0; i < item.length; i++){
        let _index = item.eq(i);
        _index.text(_index.text().replace('Ctrl', 'Cmd'));
    }
}
keyMaps.on('click', '.key_maps_mask, .key_maps_close', function(){
    keyMaps.addClass('hide');
})
pageAbout.on('click', '.page_about_mask, .page_about_close', function(){
    pageAbout.addClass('hide');
})

function commentCode(){
    // 注释当前行
    let pos = editorDoc.getCursor(),
        lineContent = editorDoc.getLine(pos.line);
    editorDoc.setSelection({line: pos.line, ch: 0 }, {line: pos.line, ch: null});
    if(lineContent[0] == '#'){
        // 取消注释掉的代码
        lineContent = lineContent.replace(/#\s|#/, '');
        editorDoc.replaceRange(lineContent, {line: pos.line, ch: 0}, {line: pos.line, ch: null})
    }else{
        // 注释代码
        editorDoc.replaceRange('# ' + lineContent, {line: pos.line, ch: 0}, {line: pos.line, ch: null})
    }
}

// host增删改
function updateHost(data){
    if(data.type == 'add'){
        let host = {
            name: data.name,
            content: '',
            id: data.id,
            state: false
        }
        configArray.push(JSON.stringify(host));
        configObject[data.id] = '';
        ipcRenderer.send('update_host_message', {
            'configArray': configArray
        });
    }else{
        systemHost = '';
        for(let i = 0; i < configArray.length; i++){
            let item = JSON.parse(configArray[i]);

            // 更新
            if(item.id == data.id && data.type == 'update'){
                data.content && (item.content = data.content);
                data.name && (item.name = data.name);
                configArray[i] = JSON.stringify(item);
            }

            // 删除
            if(item.id == data.id && data.type == 'delete'){
                configArray.splice(i, 1);
            }

            // 开关切换
            if(item.id == data.id && data.type == 'switch'){
                item.state = !item.state;
                configArray[i] = JSON.stringify(item);
            }

            if(item.state){
                systemHost != '' ? systemHost += '\n\n' : '';
                systemHost += '# ' + item.name + '\n' + item.content;
            }
            configObject[item.id] = item.content;
        }

        // 更新编辑器中的系统host并定位到最后一行
        if(hostList.find('.active').attr('data-id') == '10000'){
            editorDoc.setValue(systemHost);
            editor.scrollIntoView({line: editor.lineCount() - 1, ch: 0});
        }

        configObject['10000'] = systemHost;
        ipcRenderer.send('update_host_message', {
            'systemHost': systemHost,
            'configArray': configArray
        });
    }
}

// 保存host数据
function saveHostData(){
    let _activeItem = hostList.find('.active');
    if(!_activeItem.hasClass('changed')){
        return false;
    }
    console.log('save data')
    let _id = _activeItem.attr('data-id'),
        _content = editorDoc.getValue();
    
    updateHost({
        'id': _id,
        'content': _content,
        'type': 'update'
    })
    _activeItem.removeClass('changed');
}

// 弹窗
function _alert(title, content, initCallback, callback, type){
    let alertElement = $('#page_alert');
    alertElement.find('.alert_title').text(title);
    alertElement.find('.alert_content').html(content);
    alertElement.removeClass('hide');
    initCallback && initCallback();
    if(type == 'delete'){
        alertElement.find('.alert_submit').addClass('alert_delete').text('Delete');
    }else{
        alertElement.find('.alert_submit').removeClass('alert_delete').text('Submit');
    }
    alertElement.off().on('click', '.alert_submit', function(){
        callback && callback(alertElement);
    }).on('click', '.alert_cancel', function(){
        alertElement.addClass('hide');
    }).on('keydown', 'input', function(){
        if(event.keyCode == 13){
            event.preventDefault();
            alertElement.find('.alert_submit').click();
        }
    })
}

function notice(content, time){
    let clock = null;
    time = time || 2000;

    clearTimeout(clock);
    clock = setTimeout(() => {
        $('#page_notice').removeClass('open');
        $('#page_notice_content').html('');
    }, time);

    $('#page_notice_content').html(content);
    $('#page_notice').addClass('open');
}

function createdId(){
    return 'H' + new Date().getTime() + 2 + parseInt(Math.random() * Math.pow(10, 8));
}

function calculateSize(size){
    size = size / 1024;
    if(size > 1024){
        size = (size / 1024).toFixed(2) + ' MB';
    }else if(size > 1048576){
        size = (size / 1048576).toFixed(2) + ' GB';
    }else{
        size = size.toFixed(2) + ' KB';
    }
    return size;
}

// 程序更新
const updateProgress = $('#update_progress');
ipcRenderer.on('app_update_downloadProgress', (event, arg) => {
    let html = '<div class="progress_info"><span>'+ calculateSize(arg.transferred) +' / '+ calculateSize(arg.total) +'</span><span>'+ calculateSize(arg.bytesPerSecond) +'/S</span></div><div class="progress_block"><div></div></div>';

    updateProgress.addClass('open').find('.progress_content').html(html);
    updateProgress.find('.progress_block > div').css('width', arg.transferred / arg.total * 100 + '%');
})
ipcRenderer.on('app_update_message', (event, arg) => {
    let text = '';
    
    if(arg == 'updateNotAva'){
        text = 'This is the latest version, which doesn\'t need to be updated.'
    }else if(arg == 'error'){
        text = 'Check the update error, please check whether the network is connected.'
    }else{
        return false;
    }
    if(updateMessageDisplay){ 
        notice(text, 5000);
    }
})
ipcRenderer.on('app_update_isUpdateNow', (event, arg) => {
    updateProgress.addClass('open').find('.progress_content').html('<span>The latest update package has been downloaded.</span><span class="progress_install" id="progress_install">Install</span>');
    $('#progress_install').click(function(){
        updateProgress.removeClass('open');
        $(this).addClass('hide');
        ipcRenderer.send('isUpdateNow', true);
    })
})