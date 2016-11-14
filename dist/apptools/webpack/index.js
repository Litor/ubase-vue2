'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _autoprefixer = require('autoprefixer');

var _autoprefixer2 = _interopRequireDefault(_autoprefixer);

var _config = require('./config');

var _config2 = _interopRequireDefault(_config);

var _webpack = require('./webpack.loaders');

var _webpack2 = _interopRequireDefault(_webpack);

var _webpack3 = require('./webpack.plugins');

var _webpack4 = _interopRequireDefault(_webpack3);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _colors = require('colors');

var _colors2 = _interopRequireDefault(_colors);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _chokidar = require('chokidar');

var _chokidar2 = _interopRequireDefault(_chokidar);

var _debounce = require('debounce');

var _debounce2 = _interopRequireDefault(_debounce);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_colors2.default.setTheme({
  silly: 'rainbow',
  input: 'grey',
  verbose: 'cyan',
  prompt: 'red',
  info: 'green',
  data: 'blue',
  help: 'cyan',
  warn: 'yellow',
  debug: 'magenta',
  error: 'red'
});

var projectType = null;

exports.default = function (path, webpack, userConfig) {
  var entrys = {};

  projectType = checkProjectType(path);
  generatorEntryFiles(path, webpack, userConfig, entrys);

  var watcher = _chokidar2.default.watch([path.resolve(_config2.default.src) + '/pages/', path.resolve(_config2.default.src) + '/components/'], {
    persistent: true
  });

  watcher.on('addDir', function () {
    reGeneratorEntryFiles(path, webpack, userConfig, entrys);
  }).on('unlinkDir', function () {
    reGeneratorEntryFiles(path, webpack, userConfig, entrys);
  }).on('unlink', function () {
    reGeneratorEntryFiles(path, webpack, userConfig, entrys);
  }).on('add', function () {
    reGeneratorEntryFiles(path, webpack, userConfig, entrys);
  });

  var webpackConfig = {
    context: path.resolve(_config2.default.src),
    entry: entrys,
    resolve: {
      root: [path.resolve(_config2.default.src), path.resolve('./node_modules/')],
      alias: Object.assign({}, userConfig.alias),
      extensions: ['', '.js', '.vue']
    },

    output: {
      publicPath: projectType === 'singleApp' ? './' : '../',
      filename: _config2.default.isDevelope ? '[name].js' : '[name]-[chunkhash].js',
      chunkFilename: '[name]-[id].js'
    },

    watch: _config2.default.isDevelope,

    module: {
      loaders: (0, _webpack2.default)(path)
    },

    // http://habrahabr.ru/post/245991/
    plugins: (0, _webpack4.default)(path, webpack),

    postcss: function postcss() {
      return [(0, _autoprefixer2.default)({
        browsers: ['last 3 versions'],
        cascade: false
      })];
    },

    cssLoader: {
      sourceMap: _config2.default.isDevelope,
      localIdentName: _config2.default.isDevelope ? '[local]' : '[hash:5]'
    },

    jadeLoader: {
      locals: _config2.default,
      pretty: _config2.default.isDevelope
    },

    devtool: _config2.default.isDebug ? '#inline-source-map' : false
  };

  return webpackConfig;
};

function checkProjectType(path) {
  var projectType = null;
  if (_fs2.default.existsSync(path.resolve(_config2.default.src) + '/pages/index.html') && _fs2.default.existsSync(path.resolve(_config2.default.src) + '/pages/routes.js')) {
    projectType = 'singleApp';
  }

  return projectType;
}

function generatorEntryFiles(path, webpack, userConfig, entrys) {
  // appPathList 工程下所有app的主页面入口文件
  var appPathList = _glob2.default.sync(path.resolve(_config2.default.src) + '/pages/*');

  // app入口文件模板
  var appEntryTemplate = _fs2.default.readFileSync(__dirname + '/../appindex/index.js', 'utf8');

  if (projectType === 'singleApp') {
    appPathList = ['.'];
  }

  appPathList.forEach(function (appPath) {

    var appName = appPath.replace(/.*\/pages\/([^\/]*)$/, '$1');

    // 获取app下所有vuex文件路径列表
    var appVuexFilesPath = _glob2.default.sync(path.resolve(_config2.default.src) + '/pages/' + appName + '/**/*.vuex.js').concat(_glob2.default.sync(path.resolve(_config2.default.src) + '/*.vuex.js'));

    // 获取app下的vue组件及components下的组件
    var appVueFilesPath = _glob2.default.sync(path.resolve(_config2.default.src) + '/pages/' + appName + '/**/*.vue').concat(_glob2.default.sync(path.resolve(_config2.default.src) + '/components/**/*.vue'));

    // 获取app下的所有国际化文件路径列表
    var appI18nFilesPath = _glob2.default.sync(path.resolve(_config2.default.src) + '/pages/' + appName + '/**/*.i18n.js').concat(_glob2.default.sync(path.resolve(_config2.default.src) + '/*.i18n.js'));

    var routeFilePath = path.resolve(_config2.default.src) + '/pages/' + appName + '/routes.js';
    var indexHtmlFilePath = path.resolve(_config2.default.src) + '/pages/' + appName + '/index.html';
    var configFilePath = path.resolve(_config2.default.src) + '/pages/' + appName + '/config.json';

    // 解析vuex文件路径 生成对应的vuex初始化语句
    var vuexTpl = generateVuexTpl(appVuexFilesPath);

    // 生成全局注册vue组件的语句
    var vueCompnentTpl = generateVueCompnentRegisterTpl(appVueFilesPath);

    // 生成初始化国际化的语句
    var appI18nFilesTpl = generateappI18nRegisterTpl(appI18nFilesPath);

    var fileContent = templateReplace(appEntryTemplate, {
      importTpl: { content: vuexTpl.importTpl, relativePath: true, required: true, statement: true },
      setValueTpl: { content: vuexTpl.setValueTpl, relativePath: true, required: true, statement: true },
      vueCompnentimportTpl: { content: vueCompnentTpl.importTpl, relativePath: true, required: true, statement: true },
      vueCompnentsetValueTpl: {
        content: vueCompnentTpl.setValueTpl,
        relativePath: true,
        required: true,
        statement: true
      },
      i18nimportTpl: { content: appI18nFilesTpl.importTpl, relativePath: true, required: true, statement: true },
      i18nsetValueTpl: { content: appI18nFilesTpl.setValueTpl, relativePath: true, required: true, statement: true },
      routes: { content: routeFilePath, relativePath: true, required: true },
      indexHtml: { content: indexHtmlFilePath, relativePath: true, required: true },
      config: { content: configFilePath, relativePath: true, required: true },
      rootRoute: { content: '/' + appName, relativePath: false, required: true }
    });

    var entryFilePath = __dirname + '/../tempfile/' + appName + '.js';

    // 判断入口文件是否已经存在， 如果存在切内容已过期 则重新写入（此时是为了防止对已经存在且内容未过期的入口文件重复写入触发webpack重新编译）
    if (!_fs2.default.existsSync(entryFilePath) || _fs2.default.readFileSync(entryFilePath) + '' != fileContent) {
      _fs2.default.writeFileSync(entryFilePath, fileContent);
    }

    entrys[appName + '/main'] = entryFilePath;

    if (projectType === 'singleApp') {
      entrys = entryFilePath;
    }
  });

  /**
   * * 生成vuex初始化语句 STORE在appindex/index.js中已定义
   * @param  {[Array]} fileList [vuex文件列表]
   * @return {[Object]}         [importTpl：require语句；setValueTpl: 赋值语句]
   */
  function generateVuexTpl(fileList) {
    var uniqueIndex = 0;
    var importTpl = [];
    var setValueTpl = [];
    fileList.forEach(function (vuexFile) {
      var filename = vuexFile.replace(/.*\/([^\/]*)\.vuex\.js/, '$1');
      var uid = uniqueIndex++;
      checkFileNameValid(filename, '.vuex.js');
      importTpl.push('var ' + filename + 'Store' + uid + ' = require("' + relativePath(vuexFile) + '");');
      setValueTpl.push('STORE.modules.' + filename + ' = ' + filename + 'Store' + uid + ';');
    });

    return {
      importTpl: importTpl.join('\n'),
      setValueTpl: setValueTpl.join('\n')
    };
  }

  /**
   * * 生成国际化初始化语句 UBASE_INITI18N是ubase-vue中定义的一个全局方法
   * @param  {[Array]} fileList [i18n文件列表]
   * @return {[Object]}         [importTpl：require语句；setValueTpl: 赋值语句]
   */
  function generateappI18nRegisterTpl(fileList) {
    var uniqueIndex = 0;
    var importTpl = [];
    var setValueTpl = ['var _alli18n = {};'];
    fileList.forEach(function (i18nFile) {
      var filename = i18nFile.replace(/.*\/([^\/]*)\.i18n\.js/, '$1');
      var uid = uniqueIndex++;
      checkFileNameValid(filename, '.i18n.js');
      importTpl.push('var ' + filename + 'I18n' + uid + ' = require("' + relativePath(i18nFile) + '");');
      setValueTpl.push('_alli18n["' + filename + '"]=' + filename + 'I18n' + uid + ';');
    });

    setValueTpl.push('window._UBASE_PRIVATE.initI18n(_alli18n)');

    return {
      importTpl: importTpl.join('\n'),
      setValueTpl: setValueTpl.join('\n')
    };
  }

  function checkFileNameValid(filename, format) {
    if (filename.indexOf('-') > 0 || filename.indexOf('.') > 0) {
      console.error(_colors2.default.red('文件名请使用驼峰式命名, 如myNameIsWisedu！命名错误文件：' + filename + format));
      process.exit();
    }
  }

  /**
   * *全局注册vue组件，避免在业务开发的时候手动一个个import
   */
  function generateVueCompnentRegisterTpl(fileList) {
    var uniqueIndex = 0;
    var importTpl = [];
    var setValueTpl = [];
    fileList.forEach(function (vuexFile) {
      var filename = vuexFile.replace(/.*\/([^\/]*)\.vue/, '$1');
      checkFileNameValid(filename, '.vue');
      var uid = uniqueIndex++;
      importTpl.push('var ' + filename + 'Component' + uid + ' = require("' + relativePath(vuexFile) + '");');
      importTpl.push(filename + 'Component' + uid + "._ubase_component_name = '" + filename + "'");
      setValueTpl.push('Vue.component(' + filename + 'Component' + uid + '.name || "' + filename + '", ' + filename + 'Component' + uid + ');');
    });

    return {
      importTpl: importTpl.join('\n'),
      setValueTpl: setValueTpl.join('\n')
    };
  }

  function relativePath(filePath) {
    return path.relative(__dirname + '/../tempfile', filePath);
  }

  /**
   * 模板替换方法
   * @param  {[type]} template [模板]
   * @param  {[type]} config   [配置对象]
   * @return {[type]}          [description]
   */
  function templateReplace(template, config) {
    Object.keys(config).forEach(function (item) {
      var re = new RegExp('\\{\\{' + item + '\\}\\}', 'g');
      var statementre = new RegExp('\\\'\\{\\{' + item + '\\}\\}\\\'', 'g');

      if (config[item].statement) {
        template = template.replace(statementre, config[item].content);
        return;
      }
      if (!config[item].relativePath) {
        template = template.replace(re, config[item].content);
        return;
      }

      if (_fs2.default.existsSync(config[item].content)) {
        template = template.replace(re, relativePath(config[item].content)).replace(/\\/g, '/');
      } else {
        if (config[item].required) {
          console.error(_colors2.default.red(config[item].content + '文件不存在!'));
          process.exit();
        } else {
          template = template.replace(re, config[item].default);
        }
      }
    });

    return template;
  }

  return entrys;
}

var reGeneratorEntryFiles = (0, _debounce2.default)(generatorEntryFiles, 200);