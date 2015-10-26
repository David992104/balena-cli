(function() {
  var Promise, _, capitano, chalk, child_process, os, rindle;

  Promise = require('bluebird');

  capitano = Promise.promisifyAll(require('capitano'));

  _ = require('lodash');

  _.str = require('underscore.string');

  child_process = require('child_process');

  rindle = require('rindle');

  os = require('os');

  chalk = require('chalk');

  exports.getGroupDefaults = function(group) {
    return _.chain(group).get('options').map(function(question) {
      return [question.name, question["default"]];
    }).object().value();
  };

  exports.stateToString = function(state) {
    var percentage, result;
    percentage = _.str.lpad(state.percentage, 3, '0') + '%';
    result = (chalk.blue(percentage)) + " " + (chalk.cyan(state.operation.command));
    switch (state.operation.command) {
      case 'copy':
        return result + " " + state.operation.from.path + " -> " + state.operation.to.path;
      case 'replace':
        return result + " " + state.operation.file.path + ", " + state.operation.copy + " -> " + state.operation.replace;
      case 'run-script':
        return result + " " + state.operation.script;
      default:
        throw new Error("Unsupported operation: " + state.operation.type);
    }
  };

  exports.sudo = function(command) {
    var spawn;
    if (os.platform() === 'win32') {
      return capitano.runAsync(command.join(' '));
    }
    console.log('Type your computer password to continue');
    command = _.union(_.take(process.argv, 2), command);
    spawn = child_process.spawn('sudo', command, {
      stdio: 'inherit'
    });
    return rindle.wait(spawn);
  };

}).call(this);