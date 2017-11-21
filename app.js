global.requirePR = (path) => require('./'+path); //require relative path of project root

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var log4js = require('log4js');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var SequelizeStore = require('connect-session-sequelize')(session.Store);
var config = require('./config/config');
var models = require('./models');

var users = require('./libs/users');
var HandleSessionId = require('./libs/sessionInHeader')

var routes = require('./routes/index');


log4js.configure({
  appenders: [
    {type:'console'},
    {
      type: 'file',
      filename: 'logs/access.log',
      maxLogSize: 10485760, //10MB
      backups: 100,
      category: 'www'
    },
    {
      type: 'file',
      filename: 'logs/database.log',
      maxLogSize: 10485760, //10MB
      backups: 100,
      category: 'db'
    },
    {
      type: 'file',
      filename: 'logs/normal.log',
      maxLogSize: 10485760, //10MB
      backups: 100,
      category: 'normal'
    }
  ],
  replaceConsole: true
});
var logger = log4js.getLogger('www');

var app = express();


app.set('trust proxy', 'loopback');
// view engine setup
app.set('views', path.join(__dirname, 'src/pug'));
app.set('view engine', 'pug');

app.use(function(req, res, next) {
  if ((req.query.sessionId) || (req.method === 'OPTIONS')) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  }
  next()
})

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(log4js.connectLogger(logger, {level:log4js.levels.INFO}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(HandleSessionId({
  name: 'session',
  secret: config.SessionSecret
}));
app.use(session({
  secret: config.SessionSecret,
  name: 'session',
  saveUninitialized: true,
  resave: false,
  store: new SequelizeStore({
    db: models.sequelize,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 7 * 24 * 60 * 60 * 1000
  }),
  cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
}));

if (config.debug && config.wpMiddleware) {
  var webpack = require('webpack')
  var webpackConfig = require('./config/webpack.dev')
  var compiler = webpack(webpackConfig)
  var devMiddleware = require('webpack-dev-middleware')(compiler, {
    publicPath: webpackConfig.output.publicPath,
    stats: {
      colors: true,
      chunks: false
    }
  })
  var hotMiddleware = require('webpack-hot-middleware')(compiler)
  compiler.plugin('compilation', function (compilation) {
    compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
      hotMiddleware.publish({ action: 'reload' })
      cb()
    })
  })
  app.use(devMiddleware)
  app.use(hotMiddleware)
}

app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use(users);

routes(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (config.debug) {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
