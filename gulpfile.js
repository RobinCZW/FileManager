var gulp = require('gulp');
var changed = require('gulp-changed');
var uglify = require('gulp-uglify');
var cleancss = require('gulp-clean-css');
var babel = require('gulp-babel');
var pug = require('gulp-pug');
var plumber = require('gulp-plumber');
var gulp_webpack = require('gulp-webpack');
var exec = require('child_process').exec;

var webpackConf = require('./config/webpack.prod');

gulp.task('js', function () {
  var SRC = 'src/js/**/*.js';
  var DEST = 'public/js';
  return gulp.src(SRC)
    .pipe(plumber())
    .pipe(changed(DEST))
    .pipe(babel())
    .pipe(uglify())
    .pipe(gulp.dest(DEST));
});

gulp.task('css', function () {
  var SRC = 'src/css/**/*.css';
  var DEST = 'public/css';
  return gulp.src(SRC)
    .pipe(plumber())
    .pipe(changed(DEST))
    .pipe(cleancss())
    .pipe(gulp.dest(DEST));
});

gulp.task('pug', function () {
  var SRC = ['src/pug/**/*.pug', '!src/pug/includes', '!src/pug/error.pug'];
  var DEST = 'public/';
  return gulp.src(SRC)
    .pipe(plumber())
    .pipe(changed(DEST, {extension: '.html'}))
    .pipe(pug())
    .pipe(gulp.dest(DEST));
});

gulp.task('pugall', function () {
  var SRC = ['src/pug/**/*.pug', '!src/pug/includes', '!src/pug/error.pug'];
  var DEST = 'public/';
  return gulp.src(SRC)
    .pipe(plumber())
    .pipe(pug())
    .pipe(gulp.dest(DEST));
});

gulp.task('compile', ['js', 'css', 'pug'], function () {

});

gulp.task('watch', ['js', 'css', 'pug'], function () {
  gulp.watch('src/pug/**/*.pug', ['pug']);
  gulp.watch('src/pug/includes/*.pug', ['pugall']);
  gulp.watch('src/css/**/*.css', ['css']);
  gulp.watch('src/js/**/*.js', ['js']);
});

gulp.task('default', function (){
  var DEST = 'public/';
  return gulp_webpack(webpackConf)
    .pipe(gulp.dest(DEST));
});