#!/usr/bin/env node
"use strict";
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/prebuild-file-path.js
var require_prebuild_file_path = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/prebuild-file-path.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ptyPath = void 0;
    var fs = require("fs");
    var os = require("os");
    var path = require("path");
    function prebuildName() {
      var tags = [];
      tags.push(process.versions.hasOwnProperty("electron") ? "electron" : "node");
      tags.push("abi" + process.versions.modules);
      if (os.platform() === "linux" && fs.existsSync("/etc/alpine-release")) {
        tags.push("musl");
      }
      return tags.join(".") + ".node";
    }
    var pathToBuild = path.resolve(__dirname, "../prebuilds/" + os.platform() + "-" + os.arch() + "/" + prebuildName());
    exports2.ptyPath = fs.existsSync(pathToBuild) ? pathToBuild : null;
  }
});

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/eventEmitter2.js
var require_eventEmitter2 = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/eventEmitter2.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.EventEmitter2 = void 0;
    var EventEmitter2 = (
      /** @class */
      (function() {
        function EventEmitter22() {
          this._listeners = [];
        }
        Object.defineProperty(EventEmitter22.prototype, "event", {
          get: function() {
            var _this = this;
            if (!this._event) {
              this._event = function(listener) {
                _this._listeners.push(listener);
                var disposable = {
                  dispose: function() {
                    for (var i = 0; i < _this._listeners.length; i++) {
                      if (_this._listeners[i] === listener) {
                        _this._listeners.splice(i, 1);
                        return;
                      }
                    }
                  }
                };
                return disposable;
              };
            }
            return this._event;
          },
          enumerable: false,
          configurable: true
        });
        EventEmitter22.prototype.fire = function(data) {
          var queue = [];
          for (var i = 0; i < this._listeners.length; i++) {
            queue.push(this._listeners[i]);
          }
          for (var i = 0; i < queue.length; i++) {
            queue[i].call(void 0, data);
          }
        };
        return EventEmitter22;
      })()
    );
    exports2.EventEmitter2 = EventEmitter2;
  }
});

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/terminal.js
var require_terminal = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/terminal.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.Terminal = exports2.DEFAULT_ROWS = exports2.DEFAULT_COLS = void 0;
    var events_1 = require("events");
    var eventEmitter2_1 = require_eventEmitter2();
    exports2.DEFAULT_COLS = 80;
    exports2.DEFAULT_ROWS = 24;
    var FLOW_CONTROL_PAUSE = "";
    var FLOW_CONTROL_RESUME = "";
    var Terminal = (
      /** @class */
      (function() {
        function Terminal2(opt) {
          this._pid = 0;
          this._fd = 0;
          this._cols = 0;
          this._rows = 0;
          this._readable = false;
          this._writable = false;
          this._onData = new eventEmitter2_1.EventEmitter2();
          this._onExit = new eventEmitter2_1.EventEmitter2();
          this._internalee = new events_1.EventEmitter();
          this.handleFlowControl = !!(opt === null || opt === void 0 ? void 0 : opt.handleFlowControl);
          this._flowControlPause = (opt === null || opt === void 0 ? void 0 : opt.flowControlPause) || FLOW_CONTROL_PAUSE;
          this._flowControlResume = (opt === null || opt === void 0 ? void 0 : opt.flowControlResume) || FLOW_CONTROL_RESUME;
          if (!opt) {
            return;
          }
          this._checkType("name", opt.name ? opt.name : void 0, "string");
          this._checkType("cols", opt.cols ? opt.cols : void 0, "number");
          this._checkType("rows", opt.rows ? opt.rows : void 0, "number");
          this._checkType("cwd", opt.cwd ? opt.cwd : void 0, "string");
          this._checkType("env", opt.env ? opt.env : void 0, "object");
          this._checkType("uid", opt.uid ? opt.uid : void 0, "number");
          this._checkType("gid", opt.gid ? opt.gid : void 0, "number");
          this._checkType("encoding", opt.encoding ? opt.encoding : void 0, "string");
        }
        Object.defineProperty(Terminal2.prototype, "onData", {
          get: function() {
            return this._onData.event;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Terminal2.prototype, "onExit", {
          get: function() {
            return this._onExit.event;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Terminal2.prototype, "pid", {
          get: function() {
            return this._pid;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Terminal2.prototype, "cols", {
          get: function() {
            return this._cols;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(Terminal2.prototype, "rows", {
          get: function() {
            return this._rows;
          },
          enumerable: false,
          configurable: true
        });
        Terminal2.prototype.write = function(data) {
          if (this.handleFlowControl) {
            if (data === this._flowControlPause) {
              this.pause();
              return;
            }
            if (data === this._flowControlResume) {
              this.resume();
              return;
            }
          }
          this._write(data);
        };
        Terminal2.prototype._forwardEvents = function() {
          var _this = this;
          this.on("data", function(e) {
            return _this._onData.fire(e);
          });
          this.on("exit", function(exitCode, signal) {
            return _this._onExit.fire({ exitCode, signal });
          });
        };
        Terminal2.prototype._checkType = function(name, value, type, allowArray) {
          if (allowArray === void 0) {
            allowArray = false;
          }
          if (value === void 0) {
            return;
          }
          if (allowArray) {
            if (Array.isArray(value)) {
              value.forEach(function(v, i) {
                if (typeof v !== type) {
                  throw new Error(name + "[" + i + "] must be a " + type + " (not a " + typeof v[i] + ")");
                }
              });
              return;
            }
          }
          if (typeof value !== type) {
            throw new Error(name + " must be a " + type + " (not a " + typeof value + ")");
          }
        };
        Terminal2.prototype.end = function(data) {
          this._socket.end(data);
        };
        Terminal2.prototype.pipe = function(dest, options) {
          return this._socket.pipe(dest, options);
        };
        Terminal2.prototype.pause = function() {
          return this._socket.pause();
        };
        Terminal2.prototype.resume = function() {
          return this._socket.resume();
        };
        Terminal2.prototype.setEncoding = function(encoding) {
          if (this._socket._decoder) {
            delete this._socket._decoder;
          }
          if (encoding) {
            this._socket.setEncoding(encoding);
          }
        };
        Terminal2.prototype.addListener = function(eventName, listener) {
          this.on(eventName, listener);
        };
        Terminal2.prototype.on = function(eventName, listener) {
          if (eventName === "close") {
            this._internalee.on("close", listener);
            return;
          }
          this._socket.on(eventName, listener);
        };
        Terminal2.prototype.emit = function(eventName) {
          var args = [];
          for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
          }
          if (eventName === "close") {
            return this._internalee.emit.apply(this._internalee, arguments);
          }
          return this._socket.emit.apply(this._socket, arguments);
        };
        Terminal2.prototype.listeners = function(eventName) {
          return this._socket.listeners(eventName);
        };
        Terminal2.prototype.removeListener = function(eventName, listener) {
          this._socket.removeListener(eventName, listener);
        };
        Terminal2.prototype.removeAllListeners = function(eventName) {
          this._socket.removeAllListeners(eventName);
        };
        Terminal2.prototype.once = function(eventName, listener) {
          this._socket.once(eventName, listener);
        };
        Terminal2.prototype._close = function() {
          this._socket.readable = false;
          this.write = function() {
          };
          this.end = function() {
          };
          this._writable = false;
          this._readable = false;
        };
        Terminal2.prototype._parseEnv = function(env2) {
          var keys = Object.keys(env2 || {});
          var pairs = [];
          for (var i = 0; i < keys.length; i++) {
            if (keys[i] === void 0) {
              continue;
            }
            pairs.push(keys[i] + "=" + env2[keys[i]]);
          }
          return pairs;
        };
        return Terminal2;
      })()
    );
    exports2.Terminal = Terminal;
  }
});

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/shared/conout.js
var require_conout = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/shared/conout.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.getWorkerPipeName = void 0;
    function getWorkerPipeName(conoutPipeName) {
      return conoutPipeName + "-worker";
    }
    exports2.getWorkerPipeName = getWorkerPipeName;
  }
});

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/windowsConoutConnection.js
var require_windowsConoutConnection = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/windowsConoutConnection.js"(exports2) {
    "use strict";
    var __awaiter = exports2 && exports2.__awaiter || function(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function(resolve) {
          resolve(value);
        });
      }
      return new (P || (P = Promise))(function(resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }
        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }
        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    };
    var __generator = exports2 && exports2.__generator || function(thisArg, body) {
      var _ = { label: 0, sent: function() {
        if (t[0] & 1) throw t[1];
        return t[1];
      }, trys: [], ops: [] }, f, y, t, g;
      return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
        return this;
      }), g;
      function verb(n) {
        return function(v) {
          return step([n, v]);
        };
      }
      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
        if (op[0] & 5) throw op[1];
        return { value: op[0] ? op[1] : void 0, done: true };
      }
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.ConoutConnection = void 0;
    var worker_threads_1 = require("worker_threads");
    var conout_1 = require_conout();
    var path_1 = require("path");
    var eventEmitter2_1 = require_eventEmitter2();
    var FLUSH_DATA_INTERVAL = 1e3;
    var ConoutConnection = (
      /** @class */
      (function() {
        function ConoutConnection2(_conoutPipeName, _useConptyDll) {
          var _this = this;
          this._conoutPipeName = _conoutPipeName;
          this._useConptyDll = _useConptyDll;
          this._isDisposed = false;
          this._onReady = new eventEmitter2_1.EventEmitter2();
          var workerData = {
            conoutPipeName: _conoutPipeName
          };
          var scriptPath = __dirname.replace("node_modules.asar", "node_modules.asar.unpacked");
          this._worker = new worker_threads_1.Worker(path_1.join(scriptPath, "worker/conoutSocketWorker.js"), { workerData });
          this._worker.on("message", function(message) {
            switch (message) {
              case 1:
                _this._onReady.fire();
                return;
              default:
                console.warn("Unexpected ConoutWorkerMessage", message);
            }
          });
        }
        Object.defineProperty(ConoutConnection2.prototype, "onReady", {
          get: function() {
            return this._onReady.event;
          },
          enumerable: false,
          configurable: true
        });
        ConoutConnection2.prototype.dispose = function() {
          if (!this._useConptyDll && this._isDisposed) {
            return;
          }
          this._isDisposed = true;
          this._drainDataAndClose();
        };
        ConoutConnection2.prototype.connectSocket = function(socket) {
          socket.connect(conout_1.getWorkerPipeName(this._conoutPipeName));
        };
        ConoutConnection2.prototype._drainDataAndClose = function() {
          var _this = this;
          if (this._drainTimeout) {
            clearTimeout(this._drainTimeout);
          }
          this._drainTimeout = setTimeout(function() {
            return _this._destroySocket();
          }, FLUSH_DATA_INTERVAL);
        };
        ConoutConnection2.prototype._destroySocket = function() {
          return __awaiter(this, void 0, void 0, function() {
            return __generator(this, function(_a) {
              switch (_a.label) {
                case 0:
                  return [4, this._worker.terminate()];
                case 1:
                  _a.sent();
                  return [
                    2
                    /*return*/
                  ];
              }
            });
          });
        };
        return ConoutConnection2;
      })()
    );
    exports2.ConoutConnection = ConoutConnection;
  }
});

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/windowsPtyAgent.js
var require_windowsPtyAgent = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/windowsPtyAgent.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.argsToCommandLine = exports2.WindowsPtyAgent = void 0;
    var fs = require("fs");
    var os = require("os");
    var path = require("path");
    var child_process_1 = require("child_process");
    var net_1 = require("net");
    var windowsConoutConnection_1 = require_windowsConoutConnection();
    var conptyNative;
    var winptyNative;
    var FLUSH_DATA_INTERVAL = 1e3;
    var WindowsPtyAgent = (
      /** @class */
      (function() {
        function WindowsPtyAgent2(file, args, env2, cwd, cols, rows, debug, _useConpty, _useConptyDll, conptyInheritCursor) {
          var _this = this;
          if (_useConptyDll === void 0) {
            _useConptyDll = false;
          }
          if (conptyInheritCursor === void 0) {
            conptyInheritCursor = false;
          }
          this._useConpty = _useConpty;
          this._useConptyDll = _useConptyDll;
          this._pid = 0;
          this._innerPid = 0;
          if (this._useConpty === void 0 || this._useConpty === true) {
            this._useConpty = this._getWindowsBuildNumber() >= 18309;
          }
          if (this._useConpty) {
            if (!conptyNative) {
              try {
                conptyNative = require("../build/Release/conpty.node");
              } catch (outerError) {
                try {
                  conptyNative = require("../build/Debug/conpty.node");
                } catch (innerError) {
                  console.error("innerError", innerError);
                  throw outerError;
                }
              }
            }
          } else {
            if (!winptyNative) {
              try {
                winptyNative = require("../build/Release/pty.node");
              } catch (outerError) {
                try {
                  winptyNative = require("../build/Debug/pty.node");
                } catch (innerError) {
                  console.error("innerError", innerError);
                  throw outerError;
                }
              }
            }
          }
          this._ptyNative = this._useConpty ? conptyNative : winptyNative;
          cwd = path.resolve(cwd);
          var commandLine = argsToCommandLine(file, args);
          var term;
          if (this._useConpty) {
            term = this._ptyNative.startProcess(file, cols, rows, debug, this._generatePipeName(), conptyInheritCursor, this._useConptyDll);
          } else {
            term = this._ptyNative.startProcess(file, commandLine, env2, cwd, cols, rows, debug);
            this._pid = term.pid;
            this._innerPid = term.innerPid;
          }
          this._fd = term.fd;
          this._pty = term.pty;
          this._outSocket = new net_1.Socket();
          this._outSocket.setEncoding("utf8");
          this._conoutSocketWorker = new windowsConoutConnection_1.ConoutConnection(term.conout, this._useConptyDll);
          this._conoutSocketWorker.onReady(function() {
            _this._conoutSocketWorker.connectSocket(_this._outSocket);
          });
          this._outSocket.on("connect", function() {
            _this._outSocket.emit("ready_datapipe");
          });
          var inSocketFD = fs.openSync(term.conin, "w");
          this._inSocket = new net_1.Socket({
            fd: inSocketFD,
            readable: false,
            writable: true
          });
          this._inSocket.setEncoding("utf8");
          if (this._useConpty) {
            var connect = this._ptyNative.connect(this._pty, commandLine, cwd, env2, this._useConptyDll, function(c) {
              return _this._$onProcessExit(c);
            });
            this._innerPid = connect.pid;
          }
        }
        Object.defineProperty(WindowsPtyAgent2.prototype, "inSocket", {
          get: function() {
            return this._inSocket;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(WindowsPtyAgent2.prototype, "outSocket", {
          get: function() {
            return this._outSocket;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(WindowsPtyAgent2.prototype, "fd", {
          get: function() {
            return this._fd;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(WindowsPtyAgent2.prototype, "innerPid", {
          get: function() {
            return this._innerPid;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(WindowsPtyAgent2.prototype, "pty", {
          get: function() {
            return this._pty;
          },
          enumerable: false,
          configurable: true
        });
        WindowsPtyAgent2.prototype.resize = function(cols, rows) {
          if (this._useConpty) {
            if (this._exitCode !== void 0) {
              throw new Error("Cannot resize a pty that has already exited");
            }
            this._ptyNative.resize(this._pty, cols, rows, this._useConptyDll);
            return;
          }
          this._ptyNative.resize(this._pid, cols, rows);
        };
        WindowsPtyAgent2.prototype.clear = function() {
          if (this._useConpty) {
            this._ptyNative.clear(this._pty, this._useConptyDll);
          }
        };
        WindowsPtyAgent2.prototype.kill = function() {
          var _this = this;
          if (this._useConpty) {
            if (!this._useConptyDll) {
              this._inSocket.readable = false;
              this._outSocket.readable = false;
              this._getConsoleProcessList().then(function(consoleProcessList) {
                consoleProcessList.forEach(function(pid) {
                  try {
                    process.kill(pid);
                  } catch (e) {
                  }
                });
              });
              this._ptyNative.kill(this._pty, this._useConptyDll);
              this._conoutSocketWorker.dispose();
            } else {
              this._inSocket.destroy();
              this._ptyNative.kill(this._pty, this._useConptyDll);
              this._outSocket.on("data", function() {
                _this._conoutSocketWorker.dispose();
              });
            }
          } else {
            var processList = this._ptyNative.getProcessList(this._pid);
            this._ptyNative.kill(this._pid, this._innerPid);
            processList.forEach(function(pid) {
              try {
                process.kill(pid);
              } catch (e) {
              }
            });
          }
        };
        WindowsPtyAgent2.prototype._getConsoleProcessList = function() {
          var _this = this;
          return new Promise(function(resolve) {
            var agent = child_process_1.fork(path.join(__dirname, "conpty_console_list_agent"), [_this._innerPid.toString()]);
            agent.on("message", function(message) {
              clearTimeout(timeout);
              resolve(message.consoleProcessList);
            });
            var timeout = setTimeout(function() {
              agent.kill();
              resolve([_this._innerPid]);
            }, 5e3);
          });
        };
        Object.defineProperty(WindowsPtyAgent2.prototype, "exitCode", {
          get: function() {
            if (this._useConpty) {
              return this._exitCode;
            }
            var winptyExitCode = this._ptyNative.getExitCode(this._innerPid);
            return winptyExitCode === -1 ? void 0 : winptyExitCode;
          },
          enumerable: false,
          configurable: true
        });
        WindowsPtyAgent2.prototype._getWindowsBuildNumber = function() {
          var osVersion = /(\d+)\.(\d+)\.(\d+)/g.exec(os.release());
          var buildNumber = 0;
          if (osVersion && osVersion.length === 4) {
            buildNumber = parseInt(osVersion[3]);
          }
          return buildNumber;
        };
        WindowsPtyAgent2.prototype._generatePipeName = function() {
          return "conpty-" + Math.random() * 1e7;
        };
        WindowsPtyAgent2.prototype._$onProcessExit = function(exitCode) {
          var _this = this;
          this._exitCode = exitCode;
          if (!this._useConptyDll) {
            this._flushDataAndCleanUp();
            this._outSocket.on("data", function() {
              return _this._flushDataAndCleanUp();
            });
          }
        };
        WindowsPtyAgent2.prototype._flushDataAndCleanUp = function() {
          var _this = this;
          if (this._useConptyDll) {
            return;
          }
          if (this._closeTimeout) {
            clearTimeout(this._closeTimeout);
          }
          this._closeTimeout = setTimeout(function() {
            return _this._cleanUpProcess();
          }, FLUSH_DATA_INTERVAL);
        };
        WindowsPtyAgent2.prototype._cleanUpProcess = function() {
          if (this._useConptyDll) {
            return;
          }
          this._inSocket.readable = false;
          this._outSocket.readable = false;
          this._outSocket.destroy();
        };
        return WindowsPtyAgent2;
      })()
    );
    exports2.WindowsPtyAgent = WindowsPtyAgent;
    function argsToCommandLine(file, args) {
      if (isCommandLine(args)) {
        if (args.length === 0) {
          return file;
        }
        return argsToCommandLine(file, []) + " " + args;
      }
      var argv2 = [file];
      Array.prototype.push.apply(argv2, args);
      var result = "";
      for (var argIndex = 0; argIndex < argv2.length; argIndex++) {
        if (argIndex > 0) {
          result += " ";
        }
        var arg = argv2[argIndex];
        var hasLopsidedEnclosingQuote = xOr(arg[0] !== '"', arg[arg.length - 1] !== '"');
        var hasNoEnclosingQuotes = arg[0] !== '"' && arg[arg.length - 1] !== '"';
        var quote = arg === "" || (arg.indexOf(" ") !== -1 || arg.indexOf("	") !== -1) && (arg.length > 1 && (hasLopsidedEnclosingQuote || hasNoEnclosingQuotes));
        if (quote) {
          result += '"';
        }
        var bsCount = 0;
        for (var i = 0; i < arg.length; i++) {
          var p = arg[i];
          if (p === "\\") {
            bsCount++;
          } else if (p === '"') {
            result += repeatText("\\", bsCount * 2 + 1);
            result += '"';
            bsCount = 0;
          } else {
            result += repeatText("\\", bsCount);
            bsCount = 0;
            result += p;
          }
        }
        if (quote) {
          result += repeatText("\\", bsCount * 2);
          result += '"';
        } else {
          result += repeatText("\\", bsCount);
        }
      }
      return result;
    }
    exports2.argsToCommandLine = argsToCommandLine;
    function isCommandLine(args) {
      return typeof args === "string";
    }
    function repeatText(text, count) {
      var result = "";
      for (var i = 0; i < count; i++) {
        result += text;
      }
      return result;
    }
    function xOr(arg1, arg2) {
      return arg1 && !arg2 || !arg1 && arg2;
    }
  }
});

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/utils.js
var require_utils = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.assign = void 0;
    function assign(target) {
      var sources = [];
      for (var _i = 1; _i < arguments.length; _i++) {
        sources[_i - 1] = arguments[_i];
      }
      sources.forEach(function(source) {
        return Object.keys(source).forEach(function(key) {
          return target[key] = source[key];
        });
      });
      return target;
    }
    exports2.assign = assign;
  }
});

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/windowsTerminal.js
var require_windowsTerminal = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/windowsTerminal.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.WindowsTerminal = void 0;
    var terminal_1 = require_terminal();
    var windowsPtyAgent_1 = require_windowsPtyAgent();
    var utils_1 = require_utils();
    var DEFAULT_FILE = "cmd.exe";
    var DEFAULT_NAME = "Windows Shell";
    var WindowsTerminal = (
      /** @class */
      (function(_super) {
        __extends(WindowsTerminal2, _super);
        function WindowsTerminal2(file, args, opt) {
          var _this = _super.call(this, opt) || this;
          _this._checkType("args", args, "string", true);
          args = args || [];
          file = file || DEFAULT_FILE;
          opt = opt || {};
          opt.env = opt.env || process.env;
          if (opt.encoding) {
            console.warn("Setting encoding on Windows is not supported");
          }
          var env2 = utils_1.assign({}, opt.env);
          _this._cols = opt.cols || terminal_1.DEFAULT_COLS;
          _this._rows = opt.rows || terminal_1.DEFAULT_ROWS;
          var cwd = opt.cwd || process.cwd();
          var name = opt.name || env2.TERM || DEFAULT_NAME;
          var parsedEnv = _this._parseEnv(env2);
          _this._isReady = false;
          _this._deferreds = [];
          _this._agent = new windowsPtyAgent_1.WindowsPtyAgent(file, args, parsedEnv, cwd, _this._cols, _this._rows, false, opt.useConpty, opt.useConptyDll, opt.conptyInheritCursor);
          _this._socket = _this._agent.outSocket;
          _this._pid = _this._agent.innerPid;
          _this._fd = _this._agent.fd;
          _this._pty = _this._agent.pty;
          _this._socket.on("ready_datapipe", function() {
            ["connect", "data", "end", "timeout", "drain"].forEach(function(event) {
              _this._socket.on(event, function() {
                if (!_this._isReady && event === "data") {
                  _this._isReady = true;
                  _this._deferreds.forEach(function(fn) {
                    fn.run();
                  });
                  _this._deferreds = [];
                }
              });
            });
            _this._socket.on("error", function(err) {
              _this._close();
              if (err.code) {
                if (~err.code.indexOf("errno 5") || ~err.code.indexOf("EIO"))
                  return;
              }
              if (_this.listeners("error").length < 2) {
                throw err;
              }
            });
            _this._socket.on("close", function() {
              _this.emit("exit", _this._agent.exitCode);
              _this._close();
            });
          });
          _this._file = file;
          _this._name = name;
          _this._readable = true;
          _this._writable = true;
          _this._forwardEvents();
          return _this;
        }
        WindowsTerminal2.prototype._write = function(data) {
          this._defer(this._doWrite, data);
        };
        WindowsTerminal2.prototype._doWrite = function(data) {
          this._agent.inSocket.write(data);
        };
        WindowsTerminal2.open = function(options) {
          throw new Error("open() not supported on windows, use Fork() instead.");
        };
        WindowsTerminal2.prototype.resize = function(cols, rows) {
          var _this = this;
          if (cols <= 0 || rows <= 0 || isNaN(cols) || isNaN(rows) || cols === Infinity || rows === Infinity) {
            throw new Error("resizing must be done using positive cols and rows");
          }
          this._deferNoArgs(function() {
            _this._agent.resize(cols, rows);
            _this._cols = cols;
            _this._rows = rows;
          });
        };
        WindowsTerminal2.prototype.clear = function() {
          var _this = this;
          this._deferNoArgs(function() {
            _this._agent.clear();
          });
        };
        WindowsTerminal2.prototype.destroy = function() {
          var _this = this;
          this._deferNoArgs(function() {
            _this.kill();
          });
        };
        WindowsTerminal2.prototype.kill = function(signal) {
          var _this = this;
          this._deferNoArgs(function() {
            if (signal) {
              throw new Error("Signals not supported on windows.");
            }
            _this._close();
            _this._agent.kill();
          });
        };
        WindowsTerminal2.prototype._deferNoArgs = function(deferredFn) {
          var _this = this;
          if (this._isReady) {
            deferredFn.call(this);
            return;
          }
          this._deferreds.push({
            run: function() {
              return deferredFn.call(_this);
            }
          });
        };
        WindowsTerminal2.prototype._defer = function(deferredFn, arg) {
          var _this = this;
          if (this._isReady) {
            deferredFn.call(this, arg);
            return;
          }
          this._deferreds.push({
            run: function() {
              return deferredFn.call(_this, arg);
            }
          });
        };
        Object.defineProperty(WindowsTerminal2.prototype, "process", {
          get: function() {
            return this._name;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(WindowsTerminal2.prototype, "master", {
          get: function() {
            throw new Error("master is not supported on Windows");
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(WindowsTerminal2.prototype, "slave", {
          get: function() {
            throw new Error("slave is not supported on Windows");
          },
          enumerable: false,
          configurable: true
        });
        return WindowsTerminal2;
      })(terminal_1.Terminal)
    );
    exports2.WindowsTerminal = WindowsTerminal;
  }
});

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/prebuild-loader.js
var require_prebuild_loader = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/prebuild-loader.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    var prebuild_file_path_1 = require_prebuild_file_path();
    var pty2;
    try {
      pty2 = require(prebuild_file_path_1.ptyPath || "../build/Release/pty.node");
    } catch (outerError) {
      try {
        pty2 = prebuild_file_path_1.ptyPath ? require("../build/Release/pty.node") : require("../build/Debug/pty.node");
      } catch (innerError) {
        console.error("innerError", innerError);
        throw outerError;
      }
    }
    exports2.default = pty2;
  }
});

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/unixTerminal.js
var require_unixTerminal = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/unixTerminal.js"(exports2) {
    "use strict";
    var __extends = exports2 && exports2.__extends || /* @__PURE__ */ (function() {
      var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
          d2.__proto__ = b2;
        } || function(d2, b2) {
          for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
        };
        return extendStatics(d, b);
      };
      return function(d, b) {
        extendStatics(d, b);
        function __() {
          this.constructor = d;
        }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
      };
    })();
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.UnixTerminal = void 0;
    var path = require("path");
    var tty = require("tty");
    var terminal_1 = require_terminal();
    var utils_1 = require_utils();
    var prebuild_loader_1 = require_prebuild_loader();
    var helperPath;
    helperPath = "../build/Release/spawn-helper";
    helperPath = path.resolve(__dirname, helperPath);
    helperPath = helperPath.replace("app.asar", "app.asar.unpacked");
    helperPath = helperPath.replace("node_modules.asar", "node_modules.asar.unpacked");
    var DEFAULT_FILE = "sh";
    var DEFAULT_NAME = "xterm";
    var DESTROY_SOCKET_TIMEOUT_MS = 200;
    var UnixTerminal = (
      /** @class */
      (function(_super) {
        __extends(UnixTerminal2, _super);
        function UnixTerminal2(file, args, opt) {
          var _a, _b;
          var _this = _super.call(this, opt) || this;
          _this._boundClose = false;
          _this._emittedClose = false;
          if (typeof args === "string") {
            throw new Error("args as a string is not supported on unix.");
          }
          args = args || [];
          file = file || DEFAULT_FILE;
          opt = opt || {};
          opt.env = opt.env || process.env;
          _this._cols = opt.cols || terminal_1.DEFAULT_COLS;
          _this._rows = opt.rows || terminal_1.DEFAULT_ROWS;
          var uid = (_a = opt.uid) !== null && _a !== void 0 ? _a : -1;
          var gid = (_b = opt.gid) !== null && _b !== void 0 ? _b : -1;
          var env2 = utils_1.assign({}, opt.env);
          if (opt.env === process.env) {
            _this._sanitizeEnv(env2);
          }
          var cwd = opt.cwd || process.cwd();
          env2.PWD = cwd;
          var name = opt.name || env2.TERM || DEFAULT_NAME;
          env2.TERM = name;
          var parsedEnv = _this._parseEnv(env2);
          var encoding = opt.encoding === void 0 ? "utf8" : opt.encoding;
          var onexit = function(code, signal) {
            if (!_this._emittedClose) {
              if (_this._boundClose) {
                return;
              }
              _this._boundClose = true;
              var timeout_1 = setTimeout(function() {
                timeout_1 = null;
                _this._socket.destroy();
              }, DESTROY_SOCKET_TIMEOUT_MS);
              _this.once("close", function() {
                if (timeout_1 !== null) {
                  clearTimeout(timeout_1);
                }
                _this.emit("exit", code, signal);
              });
              return;
            }
            _this.emit("exit", code, signal);
          };
          var term = prebuild_loader_1.default.fork(file, args, parsedEnv, cwd, _this._cols, _this._rows, uid, gid, encoding === "utf8", helperPath, onexit);
          _this._socket = new tty.ReadStream(term.fd);
          if (encoding !== null) {
            _this._socket.setEncoding(encoding);
          }
          _this._socket.on("error", function(err) {
            if (err.code) {
              if (~err.code.indexOf("EAGAIN")) {
                return;
              }
            }
            _this._close();
            if (!_this._emittedClose) {
              _this._emittedClose = true;
              _this.emit("close");
            }
            if (err.code) {
              if (~err.code.indexOf("errno 5") || ~err.code.indexOf("EIO")) {
                return;
              }
            }
            if (_this.listeners("error").length < 2) {
              throw err;
            }
          });
          _this._pid = term.pid;
          _this._fd = term.fd;
          _this._pty = term.pty;
          _this._file = file;
          _this._name = name;
          _this._readable = true;
          _this._writable = true;
          _this._socket.on("close", function() {
            if (_this._emittedClose) {
              return;
            }
            _this._emittedClose = true;
            _this._close();
            _this.emit("close");
          });
          _this._forwardEvents();
          return _this;
        }
        Object.defineProperty(UnixTerminal2.prototype, "master", {
          get: function() {
            return this._master;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(UnixTerminal2.prototype, "slave", {
          get: function() {
            return this._slave;
          },
          enumerable: false,
          configurable: true
        });
        UnixTerminal2.prototype._write = function(data) {
          this._socket.write(data);
        };
        Object.defineProperty(UnixTerminal2.prototype, "fd", {
          /* Accessors */
          get: function() {
            return this._fd;
          },
          enumerable: false,
          configurable: true
        });
        Object.defineProperty(UnixTerminal2.prototype, "ptsName", {
          get: function() {
            return this._pty;
          },
          enumerable: false,
          configurable: true
        });
        UnixTerminal2.open = function(opt) {
          var self = Object.create(UnixTerminal2.prototype);
          opt = opt || {};
          if (arguments.length > 1) {
            opt = {
              cols: arguments[1],
              rows: arguments[2]
            };
          }
          var cols = opt.cols || terminal_1.DEFAULT_COLS;
          var rows = opt.rows || terminal_1.DEFAULT_ROWS;
          var encoding = opt.encoding === void 0 ? "utf8" : opt.encoding;
          var term = prebuild_loader_1.default.open(cols, rows);
          self._master = new tty.ReadStream(term.master);
          if (encoding !== null) {
            self._master.setEncoding(encoding);
          }
          self._master.resume();
          self._slave = new tty.ReadStream(term.slave);
          if (encoding !== null) {
            self._slave.setEncoding(encoding);
          }
          self._slave.resume();
          self._socket = self._master;
          self._pid = -1;
          self._fd = term.master;
          self._pty = term.pty;
          self._file = process.argv[0] || "node";
          self._name = process.env.TERM || "";
          self._readable = true;
          self._writable = true;
          self._socket.on("error", function(err) {
            self._close();
            if (self.listeners("error").length < 2) {
              throw err;
            }
          });
          self._socket.on("close", function() {
            self._close();
          });
          return self;
        };
        UnixTerminal2.prototype.destroy = function() {
          var _this = this;
          this._close();
          this._socket.once("close", function() {
            _this.kill("SIGHUP");
          });
          this._socket.destroy();
        };
        UnixTerminal2.prototype.kill = function(signal) {
          try {
            process.kill(this.pid, signal || "SIGHUP");
          } catch (e) {
          }
        };
        Object.defineProperty(UnixTerminal2.prototype, "process", {
          /**
           * Gets the name of the process.
           */
          get: function() {
            if (process.platform === "darwin") {
              var title = prebuild_loader_1.default.process(this._fd);
              return title !== "kernel_task" ? title : this._file;
            }
            return prebuild_loader_1.default.process(this._fd, this._pty) || this._file;
          },
          enumerable: false,
          configurable: true
        });
        UnixTerminal2.prototype.resize = function(cols, rows) {
          if (cols <= 0 || rows <= 0 || isNaN(cols) || isNaN(rows) || cols === Infinity || rows === Infinity) {
            throw new Error("resizing must be done using positive cols and rows");
          }
          prebuild_loader_1.default.resize(this._fd, cols, rows);
          this._cols = cols;
          this._rows = rows;
        };
        UnixTerminal2.prototype.clear = function() {
        };
        UnixTerminal2.prototype._sanitizeEnv = function(env2) {
          delete env2["TMUX"];
          delete env2["TMUX_PANE"];
          delete env2["STY"];
          delete env2["WINDOW"];
          delete env2["WINDOWID"];
          delete env2["TERMCAP"];
          delete env2["COLUMNS"];
          delete env2["LINES"];
        };
        return UnixTerminal2;
      })(terminal_1.Terminal)
    );
    exports2.UnixTerminal = UnixTerminal;
  }
});

// node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/index.js
var require_lib = __commonJS({
  "node_modules/@homebridge/node-pty-prebuilt-multiarch/lib/index.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.native = exports2.open = exports2.createTerminal = exports2.fork = exports2.spawn = void 0;
    var prebuild_file_path_1 = require_prebuild_file_path();
    var terminalCtor;
    if (process.platform === "win32") {
      terminalCtor = require_windowsTerminal().WindowsTerminal;
    } else {
      terminalCtor = require_unixTerminal().UnixTerminal;
    }
    function spawn2(file, args, opt) {
      return new terminalCtor(file, args, opt);
    }
    exports2.spawn = spawn2;
    function fork(file, args, opt) {
      return new terminalCtor(file, args, opt);
    }
    exports2.fork = fork;
    function createTerminal(file, args, opt) {
      return new terminalCtor(file, args, opt);
    }
    exports2.createTerminal = createTerminal;
    function open(options) {
      return terminalCtor.open(options);
    }
    exports2.open = open;
    exports2.native = process.platform !== "win32" ? require(prebuild_file_path_1.ptyPath || "../build/Release/pty.node") : null;
  }
});

// src/bin/cli.ts
var import_child_process = require("child_process");
var import_path = require("path");
var import_fs = require("fs");
var import_readline = require("readline");
var import_process = require("process");
var pty = require_lib();
var __dirname2 = (0, import_path.dirname)(__filename);
var QODER_PROJECTS = (0, import_path.join)(import_process.env.HOME || "~", ".qoder", "projects");
var QWRAP_SESS_DIR = (0, import_path.join)(import_process.env.HOME || "~", ".qwrap", "sessions");
var MEM_HEADER = `> \u2699\uFE0F qwrap: \u6BCF\u6B21\u56DE\u590D\u672B\u5C3E\u7528 Bash \u66F4\u65B0\u6B64\u6587\u4EF6\u3002Compaction \u540E\u5148 cat \u6062\u590D\u8BB0\u5FC6\u3002

## \u{1F4DD} Worklog\uFF08\u6309\u65F6\u95F4\u987A\u5E8F\uFF09

| \u65F6\u95F4  | \u4E8B\u4EF6 |
|-------|------|
| \u542F\u52A8 | \u521D\u59CB\u5316\u4F1A\u8BDD |

## \u4EFB\u52A1\u76EE\u6807
-

## \u7528\u6237\u7EA6\u675F / \u504F\u597D
-

## \u9047\u5230\u7684\u5751 / \u6CE8\u610F\u4E8B\u9879
-

## \u5173\u952E\u51B3\u5B9A
-

`;
var MEM_TMPL = `## \u4EFB\u52A1\u76EE\u6807
- 

## \u7528\u6237\u7EA6\u675F / \u504F\u597D
- 

## \u5173\u952E\u4E0A\u4E0B\u6587
- 

## \u5F00\u53D1\u5DE5\u5177 / \u73AF\u5883
- 

## \u9047\u5230\u7684\u5751 / \u6CE8\u610F\u4E8B\u9879
- 

## \u4EFB\u52A1\u53D8\u66F4\u5386\u53F2
- 

`;
function resolveQoderCli() {
  const e = import_process.env.QODERCLI_PATH;
  if (e && (0, import_fs.existsSync)(e)) return e;
  const s = (0, import_path.join)(__dirname2, "qodercli");
  if ((0, import_fs.existsSync)(s)) return s;
  return import_process.env.QODER_BINARY || "qodercli";
}
function processArgs(raw) {
  const ua = raw.slice(2);
  if (ua.some((a) => a === "--no-yolo" || a === "--require-permissions"))
    return ua.filter((a) => a !== "--no-yolo" && a !== "--require-permissions");
  if (!ua.some((a) => a === "--yolo" || a === "--dangerously-skip-permissions"))
    return ["--yolo", ...ua];
  return ua;
}
function findLatestSession(cwd) {
  const slug = cwd.replace(/^\/+/, "").replace(/\//g, "-") || "root";
  const dir = (0, import_path.join)(QODER_PROJECTS, slug);
  if (!(0, import_fs.existsSync)(dir)) return null;
  let best = null;
  let mt = 0;
  try {
    for (const f of (0, import_fs.readdirSync)(dir).filter((x) => x.endsWith("-session.json"))) {
      const fp = (0, import_path.join)(dir, f);
      const st = (0, import_fs.statSync)(fp);
      if (st.mtimeMs <= mt) continue;
      try {
        const j = JSON.parse((0, import_fs.readFileSync)(fp, "utf8"));
        if (j.working_dir === cwd && j.id) {
          best = j.id;
          mt = st.mtimeMs;
        }
      } catch {
      }
    }
  } catch {
  }
  return best ? { id: best } : null;
}
function sessMemPath(sid) {
  if (!(0, import_fs.existsSync)(QWRAP_SESS_DIR)) (0, import_fs.mkdirSync)(QWRAP_SESS_DIR, { recursive: true });
  return (0, import_path.join)(QWRAP_SESS_DIR, `${sid}.md`);
}
function ensureMemFile(sid) {
  const mp = sessMemPath(sid);
  if (!(0, import_fs.existsSync)(mp)) (0, import_fs.writeFileSync)(mp, MEM_HEADER + MEM_TMPL, "utf8");
  else {
    const c = (0, import_fs.readFileSync)(mp, "utf8");
    if (!c.includes("qwrap:")) (0, import_fs.writeFileSync)(mp, MEM_HEADER + c, "utf8");
  }
  return mp;
}
function spawnAcpProxy(qc, args) {
  const ch = (0, import_child_process.spawn)(qc, args, { stdio: ["pipe", "pipe", "inherit"], cwd: process.cwd(), env: process.env });
  const send = (m) => ch.stdin?.write(JSON.stringify(m) + "\n");
  import_process.stdin.setEncoding("utf8");
  import_process.stdin.on("data", (c) => ch.stdin?.write(c));
  const rl = (0, import_readline.createInterface)({ input: ch.stdout, crlfDelay: Infinity });
  rl.on("line", (line) => {
    const t = line.trim();
    if (!t) return;
    let m;
    try {
      m = JSON.parse(t);
    } catch {
      import_process.stdout.write(line + "\n");
      return;
    }
    if ("id" in m && m.id !== void 0 && "method" in m && typeof m.method === "string") {
      const id = m.id;
      if (m.method === "session/request_permission") {
        send({ jsonrpc: "2.0", id, result: { outcome: { outcome: "selected", optionId: "allow_always" } } });
        return;
      }
      send({ jsonrpc: "2.0", id, result: {} });
      return;
    }
    if (m.result && typeof m.result === "object" && "sessionId" in m.result) {
      const sid = m.result.sessionId;
      if (typeof sid === "string") ensureMemFile(sid);
    }
    import_process.stdout.write(line + "\n");
  });
  ch.on("exit", (c, s) => (0, import_process.exit)(c ?? (s ? 128 : 1)));
  ch.on("error", (e) => {
    console.error(`Failed: ${e.message}`);
    (0, import_process.exit)(1);
  });
}
function spawnPlain(qc, args) {
  const ch = (0, import_child_process.spawn)(qc, args, { stdio: ["inherit", "inherit", "inherit"], cwd: process.cwd(), env: process.env });
  ch.on("exit", (c, s) => (0, import_process.exit)(c ?? (s ? 128 : 1)));
  ch.on("error", (e) => {
    console.error(`Failed: ${e.message}`);
    (0, import_process.exit)(1);
  });
}
function spawnTuiPty(qc, args) {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;
  const workDir = process.cwd();
  const sess = findLatestSession(workDir);
  const memPath = sess ? ensureMemFile(sess.id) : null;
  const ptyProc = pty.spawn(qc, args, {
    name: "xterm-256color",
    cols,
    rows,
    cwd: workDir,
    env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? "1" }
  });
  let buf = "";
  let lastOk = 0;
  let injected = false;
  let cwdShown = false;
  ptyProc.onData((data) => {
    const filtered = data.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "\u{1F310}");
    import_process.stdout.write(filtered);
    buf += filtered;
    const clean = buf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").replace(/\x0d/g, "");
    const tail = clean.slice(-4096);
    if (/Permission required/i.test(tail)) {
      const now = Date.now();
      if (now - lastOk >= 500) {
        lastOk = now;
        ptyProc.write("2\r");
      }
      buf = "";
      return;
    }
    if (/Type your message/i.test(tail) && !injected && memPath) {
      injected = true;
      const content = (0, import_fs.readFileSync)(memPath, "utf8");
      if (content.trim().length > 20) {
        setTimeout(() => {
          ptyProc.write(`\u89C4\u5219\uFF1A\u6301\u7EED\u7EF4\u62A4 ${memPath}\u3002\u6BCF\u6B21\u56DE\u590D\u672B\u5C3E\u7528 Bash \u66F4\u65B0 Worklog \u548C\u5404\u7AE0\u8282\u3002Compaction \u540E\u5148 cat ${memPath} \u6062\u590D\u8BB0\u5FC6\u3002Worklog \u6309\u65F6\u95F4\u8FFD\u52A0\u8BB0\u5F55\u7528\u6237\u9700\u6C42\u53D8\u5316\u3001\u4EFB\u52A1\u5207\u6362\u3001\u5173\u952E\u51B3\u7B56\u3002

\u8BB0\u5FC6\u6587\u4EF6\u5185\u5BB9\uFF1A

${content}

\u8BF7\u6D88\u5316\u5E76\u7EE7\u7EED\u3002
`);
        }, 1500);
      }
    }
    if (!cwdShown && /Type your message/i.test(tail)) {
      cwdShown = true;
      import_process.stdout.write(`
 \x1B[48;5;235m\x1B[38;5;147m \u{1F4C1} ${workDir} \x1B[0m
`);
    }
    if (buf.length > 65536) buf = buf.slice(-8192);
  });
  if (import_process.stdin.isTTY) import_process.stdin.setRawMode(true);
  import_process.stdin.resume();
  import_process.stdin.on("data", (d) => ptyProc.write(d));
  ptyProc.onExit(({ exitCode, signal }) => {
    if (import_process.stdin.isTTY) import_process.stdin.setRawMode(false);
    (0, import_process.exit)(exitCode ?? (signal ? 128 : 1));
  });
}
function main() {
  const qc = resolveQoderCli();
  const args = processArgs(import_process.argv);
  const info = ["-v", "--version", "-h", "--help"];
  const isInfo = args.some((a) => info.includes(a));
  const isAcp = args.some((a) => a === "--acp");
  if (isInfo || !process.stdin.isTTY) spawnPlain(qc, args);
  else if (isAcp) spawnAcpProxy(qc, args);
  else spawnTuiPty(qc, args);
}
main();
