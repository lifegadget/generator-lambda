'use strict';
/*eslint-disable no-console */

var path = require('path');
var gulp = require('gulp');
var eslint = require('gulp-eslint');
var excludeGitignore = require('gulp-exclude-gitignore');
var mocha = require('gulp-mocha');
var istanbul = require('gulp-istanbul');
var nsp = require('gulp-nsp');
<% if (includeCoveralls) { -%>
var coveralls = require('gulp-coveralls');
<% } -%>
<% if (cli) { -%>
var lec = require('gulp-line-ending-corrector');
<% } -%>
<% if (babel) { -%>
var babel = require('gulp-babel');
var del = require('del');
var shell = require('gulp-shell');
var isparta = require('isparta');
var sourceFiles = 'lib/*.js';
var testFiles = 'test/**/*.js';

// Initialize the babel transpiler so ES2015 files gets compiled
// when they're loaded
require('babel-core/register');
<% } -%>

gulp.task('static', function () {
  return gulp.src('**/*.js')
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('linter', function() {
  console.log(chalk.bgBlue.white(' ' + chalk.bold('Transporter') + ' ESlint '));

  return gulp.src([sourceFiles, testFiles], {since: gulp.lastRun('linter')})
    .pipe(excludeGitignore())
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('nsp', function (cb) {
  nsp({package: path.resolve('package.json')}, cb);
});

gulp.task('pre-test', function () {
  return gulp.src('<%- projectRoot %>')
    .pipe(excludeGitignore())
    .pipe(istanbul({
      includeUntested: true<% if (babel) { %>,
      instrumenter: isparta.Instrumenter<% } %>
    }))
    .pipe(istanbul.hookRequire());
});

gulp.task('test', gulp.series('pre-test'), function (cb) {
  var mochaErr;

  gulp.src('test/**/*.js')
    .pipe(mocha({reporter: 'spec'}))
    .on('error', function (err) {
      mochaErr = err;
    })
    .pipe(istanbul.writeReports())
    .on('end', function () {
      cb(mochaErr);
    });
});

gulp.task('mocha-test', function(done) {
  let mochaErr;
  console.log();
  console.log(chalk.bgBlue.white(' Running Mocha '));
  console.log(chalk.grey(testFiles));
  gulp.src(testFiles, {since: gulp.lastRun('mocha-test')})
    .pipe(mocha({reporter: 'spec'}))
    .on('error', err => {
      console.log(chalk.red(err));
      mochaErr = err;
    })
    .on('end', function() {
      console.log();
      console.log(chalk.gray(` --- Test Run Complete --- `));
      console.log();
      console.log(mochaErr);
      done();
    });
});

<% if (babel) { -%>
gulp.task('clean', function () {
  return del('dist');
});

gulp.task('babel', gulp.series('clean'), function () {
  return gulp.src('<%- projectRoot %>')
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});
<% } -%>

gulp.task('commit', gulp.series(shell.task([
  'echo Adding files to git repo',
  'git add .babelrc .editorconfig .env .gitignore .gitattributes README.md deploy.env event.json package.json *.js lib/*',
  'git status',
  'git commit'
])));

gulp.task('watch', function() {
  gulp.watch(sourceFiles, gulp.series('code-change'));
  gulp.watch(`gulpfile.js`, gulp.series('gulp-change'));
  gulp.watch(`test/**/*.js`, gulp.series('test-change'));
});
gulp.task('code-change', gulp.series('clean', gulp.parallel('linter', 'babel'), 'mocha-test'));
gulp.task('test-change', gulp.series('linter', 'mocha-test'));
gulp.task('gulp-change', gulp.series('mocha-test'));
gulp.task('deploy', gulp.series(gulp.parallel('babel'), shell.task([
  'echo Lamba Deploy',
  'echo ------------',
  'node-lambda deploy -f dev.env'
])));
gulp.task('deploy-prod', gulp.series(gulp.parallel('babel'), shell.task([
  'echo Lamba Deploy',
  'echo ------------',
  'node-lambda deploy -e production -f prod.env'
])));
gulp.task('run', gulp.series('babel', shell.task([
  'echo Run Locally',
  'echo -----------',
  'node-lambda run'
])));

<% if (includeCoveralls) { -%>

gulp.task('coveralls', gulp.series('test'), function () {
  if (!process.env.CI) {
    return;
  }

  return gulp.src(path.join(__dirname, 'coverage/lcov.info'))
    .pipe(coveralls());
});
<% } -%>
<% if (cli) { -%>
gulp.task('line-ending-corrector', function () {
  return gulp.src('<%- projectRoot.replace("**/*.js", "cli.js") %>')
    .pipe(excludeGitignore())
    .pipe(lec())
    .pipe(gulp.dest('.'));
});
<% } -%>

gulp.task('prepublish', gulp.series(...<%- prepublishTasks %>));
gulp.task('default', gulp.series(...<%- tasks %>));
