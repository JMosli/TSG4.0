//@ts-nocheck

const EventEmitter = require('events');
const spawn = require('child_process').spawn;
const tryJson = (jsonString) => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (err) {
    return false;
  }
};
const fixJsonFragment = (jsonFragment) => {
  if (tryJson('{' + jsonFragment)) {
    return '{' + jsonFragment;
  } else if (tryJson(jsonFragment + '}')) {
    return jsonFragment + '}';
  } else if (tryJson('{' + jsonFragment + '}')) {
    return '{' + jsonFragment + '}';
  } else {
    return jsonFragment;
  }
};
const parseJsonFromPipe = (buf, parseError, callback) => {
  var jsonList = buf.toString().split('}{');
  if (jsonList.length === 1) {
    if (
      !jsonList[0].trim().startsWith('[') &&
      !jsonList[0].trim().startsWith('{')
    )
      return;

    if (!tryJson(jsonList[0])) return console.error(jsonList[0]);

    callback(JSON.parse(jsonList[0]));
  } else {
    jsonList.forEach((object, n) => {
      try {
        var data = JSON.parse(fixJsonFragment(object));
        callback(data);
      } catch (err) {
        parseError(object);
        parseError(err);
      }
    });
  }
};
export const Worker = (scriptParameters, options) => {
  options = options ? options : {};
  let parseStdout = () => {};
  let parseError = () => {};
  const workerPort = new EventEmitter();
  if (options.debug) {
    parseError = (err, string) => {
      workerPort.emit('error', err);
      workerPort.emit('failedParse', string);
    };
  }
  if (options.json) {
    parseStdout = (buf) => {
      parseJsonFromPipe(buf, parseError, (data) => {
        workerPort.emit('message', data);
      });
    };
    workerPort.postMessage = (json) => {
      if (json instanceof Object) {
        workerProcess.stdin.write(
          Buffer.from(`${JSON.stringify(json)}`, 'utf8'),
        );
      } else {
        workerPort.emit('failedParse', json);
      }
    };
  } else {
    parseStdout = (buf) => {
      workerPort.emit('message', buf);
    };
    workerPort.postMessage = (text) => {
      process.stdout.write(text);
    };
  }
  var workerProcess = spawn(
    'node',
    scriptParameters instanceof Array ? scriptParameters : [scriptParameters],
    Object.assign({ detached: true }, options.spawnOptions || {}),
  );
  workerProcess.stdout.on('data', parseStdout);
  workerProcess.stderr.on('data', function (data) {
    workerPort.emit('error', data.toString());
  });
  workerProcess.on('close', function (data) {
    workerPort.emit('close', data);
  });
  workerProcess.on('exit', function (data) {
    workerPort.emit('exit', data);
  });
  workerPort.kill = workerProcess.kill;
  workerPort.write = workerPort.postMessage;
  workerPort.spawnProcess = workerProcess;
  return workerPort;
};

export const buildParentPort = (options) => {
  options = options ? options : {};
  let parseStdout = () => {};
  let parseError = () => {};
  const parentPort = new EventEmitter();
  if (options.debug) {
    parseError = (err, string) => {
      parentPort.emit('error', err);
      parentPort.emit('failedParse', theJson);
    };
  }
  if (options.json) {
    parseStdout = (buf) => {
      parseJsonFromPipe(buf, parseError, (data) => {
        parentPort.emit('message', data);
      });
    };
    parentPort.postMessage = (text) => {
      if (text instanceof Object) {
        process.stdout.write(Buffer.from(`${JSON.stringify(text)}`, 'utf8'));
      }
    };
  } else {
    parseStdout = (buf) => {
      parentPort.emit('message', buf);
    };
    parentPort.postMessage = (text) => {
      process.stdout.write(text);
    };
  }
  parentPort.postError = (text) => {
    process.stderr.write(Buffer.from(`${text}`, 'utf8'));
  };
  parentPort.write = parentPort.postMessage;
  process.stdin.on('data', parseStdout);
  if (options.uncaughtException) {
    process.on('uncaughtException', function (err) {
      parentPort.postError('Uncaught Exception occured!');
      parentPort.postError(err.stack);
    });
  }
  return parentPort;
};
