'use strict';

var path = require('path'),
  fs = require('fs'),
  userDataDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/.haroopad',
  errorLog = userDataDir + '/error.md';

if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir);
}

process.on('uncaughtException', function(err) {

  var message = 
      ' Information | Description \n'
    + '-------------|-----------------------------\n'
    + ' Type        | UncaughtException \n'
    + ' Date        | '+ new Date +'\n'
    + ' Stack       | '+ err.stack +'\n\n'
    
  fs.appendFile(errorLog, '---uncaughtException---\n' + new Date +'\n'+ err.stack + '\n\n');
});

window.addEventListener('error', function(err) {
  var message = 
      ' Information | Description \n'
    + '-------------|-----------------------------\n'
    + ' Type        | Error\n'
    + ' Date        | '+ new Date +'\n'
    + ' File        | '+ err.filename.replace(process.cwd(), '') +'\n'
    + ' Line Number | '+ err.lineno +'\n'
    + ' Message     | '+ err.message +'\n\n'
    
  fs.appendFile(errorLog, message);
}, false);


function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.getElementsByTagName("head")[0].appendChild(link);
}

//fixed text.js error on node-webkit
require.nodeRequire = require;

/**
 * require.js 환경 설정
 */
requirejs.config({
  baseUrl: 'js/app',
  waitSeconds: 30,
  locale: 'ko-kr',
  paths: {
    tpl: '../../tpl',
    vendors: '../vendors',
    text: '../vendors/text',
    store: '../vendors/store',
    keyboard: '../vendors/keymage'
  },
  config: {
    text: {
      env: 'xhr'
    }
  }
});

requirejs.onError = function (e) {
  alert('Oops! Haroopad is crash :-(');
};

requirejs([
    'menu/MenuBar',
    'window/Window',
    'editor/Editor',
    'editor/Parser',
    'viewer/Viewer',
    'ui/file/File',
    'utils/Error'
  ], function(MenuBar, Window, Editor, Parser, Viewer, File) {
    var html, res, file, x, y;
    var _tid_;

    var gui = require('nw.gui'),
        win = gui.Window.get();

    file = url('#file');
    x = url('#x');
    y = url('#y');
    location.hash = '';

    win.on('file.opened', function(opt) {
      Editor.setValue(opt.markdown);
      html = Parser(opt.markdown);

      Viewer.init(opt);
      Viewer.update(opt.markdown, html, Editor);
      Editor.on("change", delayChange); 
    });

    //run with file open;
    if (file) {
      File.open(decodeURIComponent(file));
    } else {
      Editor.on("change", delayChange);
    }

    if (x && y) {
      win.moveTo(x, y);
    }

    //open file with commend line
    if (gui.App.argv.length > 0) {
      File.open(gui.App.argv[0])
      // win.emit('open.file', gui.App.argv[0]);
    }

    win.on('file.saved', function(opt) {
      Viewer.init(opt);
    });

    /**
     * 코드미러 내용 변경 이벤트 핸들러
     * @return {[type]} [description]
     */
    function changeHandler() {
      res = Parser(Editor.getValue());
      win.emit('change.markdown', Editor.getValue(), res, Editor);
    }

    function delayChange() {
      if(_tid_) {
        clearTimeout(_tid_);
      }

      _tid_ = setTimeout(changeHandler, 300);
    }

    win.show();
    win.focus();
});