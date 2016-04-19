'use strict';
var generators = require('yeoman-generator');
var extend = require('lodash').merge;

module.exports = generators.Base.extend({
  constructor: function () {
    generators.Base.apply(this, arguments);

    this.option('generateInto', {
      type: String,
      required: false,
      defaults: '',
      desc: 'Relocate the location of the generated files.'
    });

    this.option('es2015', {
      required: false,
      defaults: true,
      desc: 'Allow ES2015 syntax'
    });
  },

  writing: function () {
    var pkg = this.fs.readJSON(this.destinationPath(this.options.generateInto, 'package.json'), {});

    var eslintConfig = {
      env: {
        mocha: true
      }
    };
    var devDep = {
      'eslint': '^2.8.0',
      'eslint-config-defaults': 'walmartlabs/eslint-config-defaults#feature/update-to-eslint-2'
    };

    if (this.options.es2015) {
      devDep['babel-eslint'] = '^6.0.2';
      devDep['eslint-plugin-babel'] = '^3.2.0';
    }

    this.fs.copy(
      this.templatePath('eslintrc'),
      this.destinationPath(this.options.generateInto, '.eslintrc')
    );

    extend(pkg, {
      devDependencies: devDep,
      eslintConfig: eslintConfig
    });

    this.fs.writeJSON(this.destinationPath(this.options.generateInto, 'package.json'), pkg);
  }
});
