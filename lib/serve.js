var CSON, DataServer, PrettyError, PrettyMonitor, PromiseMonitor, didServe, fs, path, serve, wn;

fs = require('fs');

wn = require('when');

CSON = require('cson');

path = require('path');

DataServer = require('./DataServer');

PrettyError = require('pretty-error');

PrettyMonitor = require('pretty-monitor');

PromiseMonitor = require('when/monitor/PromiseMonitor');

didServe = false;

module.exports = serve = function(repoPath, port, serializedDirName, passphrase, logsPath) {
  var pe, promiseMonitor;
  if (didServe) {
    throw Error("Already serving");
  }
  didServe = true;
  pe = new PrettyError;
  pe.renderer.style({
    'pretty-error': {
      marginLeft: 3,
      marginTop: 1
    }
  });
  if (logsPath != null) {
    pe.filterParsedError(function(e) {
      console.log("\007");;
      var errorLog;
      errorLog = CSON.stringifySync(JSON.parse(JSON.stringify(e)));
      errorLog += '\n\n------------------\n\n';
      fs.writeFileSync(path.join(repoPath, logsPath), errorLog, {
        flag: 'a'
      });
      setTimeout((function() {
        return process.exit(1);
      }), 0);
    });
  }
  promiseMonitor = new PromiseMonitor(new PrettyMonitor(pe));
  promiseMonitor.monitor(wn.Promise);
  pe.skipNodeFiles();
  pe.skipPackage('socket.io');
  process.on('uncaughtException', function(e) {
    console.log("\007");;
    pe.render(e, true);
    console.log("-----------------------\n");
    return process.exit(1);
  });
  return process.nextTick(function() {
    var s;
    console.log("\n-----------------------\n");
    return s = new DataServer(repoPath, serializedDirName, port, passphrase);
  });
};
