'use strict';
var path = require('path');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');

gulp.task('static', function () {
  return gulp.src(['**/*.js', '!**/templates/**'])
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('nsp', function (cb) {
  nsp({package: path.resolve('package.json')}, cb);
});

gulp.task('pre-test', function () {
  return gulp.src(['**/*.js', '!**/templates/**'])
    .pipe(excludeGitignore())
    .pipe(istanbul({
      includeUntested: true
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', gulp.series('pre-test'), function (cb) {
  var mochaErr;

  gulp.src('test/**/*.js')
    .pipe(mocha({reporter: 'spec', timeout: 4000}))
    .on('error', function (err) {
      mochaErr = err;
    })
    .pipe(istanbul.writeReports())
    .on('end', function () {
      cb(mochaErr);
    });
});

gulp.task('watch', function () {
  gulp.watch(['**/*.js', 'test/**'], ['test']);
});

gulp.task('prepublish', gulp.series('nsp'));
gulp.task('default', gulp.series('static', 'test'));
