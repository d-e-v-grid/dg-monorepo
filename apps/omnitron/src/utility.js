const fs = require('fs');
const fclone = require('fclone');
const cst = require('./constants').default;
const url = require('url');
const util = require('util');
const dayjs = require('dayjs');
const waterfall = require('async/waterfall');

const findPackageJson = require('./tools/find-package-json');

var Utility = (module.exports = {
  findPackageVersion(fullpath) {
    var version;

    try {
      version = findPackageJson(fullpath).next().value.version;
    } catch (e) {
      version = 'N/A';
    }
    return version;
  },
  getDate() {
    return Date.now();
  },
  extendExtraConfig(proc, opts) {
    if (opts.env && opts.env.current_conf) {
      if (
        opts.env.current_conf.env &&
        typeof opts.env.current_conf.env === 'object' &&
        Object.keys(opts.env.current_conf.env).length === 0
      )
        delete opts.env.current_conf.env;

      Utility.extendMix(proc.omnitron_env, opts.env.current_conf);
      delete opts.env.current_conf;
    }
  },
  formatCLU(process) {
    if (!process.omnitron_env) {
      return process;
    }

    var obj = Utility.clone(process.omnitron_env);
    delete obj.env;

    return obj;
  },
  extend(destination, source) {
    if (!source || typeof source != 'object') return destination;

    Object.keys(source).forEach(function (new_key) {
      if (source[new_key] != '[object Object]') destination[new_key] = source[new_key];
    });

    return destination;
  },
  // Same as extend but drop value with 'null'
  extendMix(destination, source) {
    if (!source || typeof source != 'object') return destination;

    Object.keys(source).forEach(function (new_key) {
      if (source[new_key] == 'null') delete destination[new_key];
      else destination[new_key] = source[new_key];
    });

    return destination;
  },

  whichFileExists(file_arr) {
    var f = null;

    file_arr.some(function (file) {
      try {
        fs.statSync(file);
      } catch (e) {
        return false;
      }
      f = file;
      return true;
    });
    return f;
  },
  clone(obj) {
    if (obj === null || obj === undefined) return {};
    return fclone(obj);
  },
  overrideConsole(bus) {
    if (cst.OMNITRON_LOG_DATE_FORMAT && typeof cst.OMNITRON_LOG_DATE_FORMAT == 'string') {
      // Generate timestamp prefix
      function timestamp() {
        return `${dayjs(Date.now()).format(cst.OMNITRON_LOG_DATE_FORMAT)}:`;
      }

      var hacks = ['info', 'log', 'error', 'warn'],
        consoled = {};

      // store console functions.
      hacks.forEach(function (method) {
        consoled[method] = console[method];
      });

      hacks.forEach(function (k) {
        console[k] = function () {
          if (bus) {
            bus.emit('log:OMNITRON', {
              process: {
                pm_id: 'OMNITRON',
                name: 'OMNITRON',
                rev: null,
              },
              at: Utility.getDate(),
              data: util.format.apply(this, arguments) + '\n',
            });
          }
          // do not destroy variable insertion
          arguments[0] && (arguments[0] = timestamp() + ' OMNITRON ' + k + ': ' + arguments[0]);
          consoled[k].apply(console, arguments);
        };
      });
    }
  },
  startLogging(stds, callback) {
    /**
     * Start log outgoing messages
     * @method startLogging
     * @param {} callback
     * @return
     */
    // Make sure directories of `logs` and `pids` exist.
    // try {
    //   ['logs', 'pids'].forEach(function(n){
    //     console.log(n);
    //     (function(_path){
    //       !fs.existsSync(_path) && fs.mkdirSync(_path, '0755');
    //     })(path.resolve(cst.OMNITRON_ROOT_PATH, n));
    //   });
    // } catch(err) {
    //   return callback(new Error('can not create directories (logs/pids):' + err.message));
    // }

    // waterfall.
    var flows = [];
    // types of stdio, should be sorted as `std(entire log)`, `out`, `err`.
    var types = Object.keys(stds).sort(function (x, y) {
      return -x.charCodeAt(0) + y.charCodeAt(0);
    });

    // Create write streams.
    (function createWS(io) {
      if (io.length != 1) {
        return false;
      }
      io = io[0];

      // If `std` is a Stream type, try next `std`.
      // compatible with `omnitron reloadLogs`
      if (typeof stds[io] == 'object' && !isNaN(stds[io].fd)) {
        return createWS(types.splice(0, 1));
      }

      flows.push(function (next) {
        var file = stds[io];

        // if file contains ERR or /dev/null, dont try to create stream since he dont want logs
        if (!file || file.indexOf('NULL') > -1 || file.indexOf('/dev/null') > -1) return next();

        stds[io] = fs
          .createWriteStream(file, { flags: 'a' })
          .once('error', next)
          .on('open', function () {
            stds[io].removeListener('error', next);

            stds[io].on('error', function (err) {
              console.error(err);
            });

            next();
          });
        stds[io]._file = file;
      });
      return createWS(types.splice(0, 1));
    })(types.splice(0, 1));

    waterfall(flows, callback);
  },

  /**
   * Function parse the module name and returns it as canonic:
   * - Makes the name based on installation filename.
   * - Removes the Github author, module version and git branch from original name.
   *
   * @param {string} module_name
   * @returns {string} Canonic module name (without trimed parts).
   * @example Always returns 'omnitron-slack' for inputs 'ma-zal/omnitron-slack', 'ma-zal/omnitron-slack#own-branch',
   *          'omnitron-slack-1.0.0.tgz' or 'omnitron-slack@1.0.0'.
   */
  getCanonicModuleName(module_name) {
    if (typeof module_name !== 'string') return null;
    var canonic_module_name = module_name;

    // Returns the module name from a .tgz package name (or the original name if it is not a valid pkg).
    // Input: The package name (e.g. "foo.tgz", "foo-1.0.0.tgz", "folder/foo.tgz")
    // Output: The module name
    if (canonic_module_name.match(/\.tgz($|\?)/)) {
      if (canonic_module_name.match(/^(.+\/)?([^\/]+)\.tgz($|\?)/)) {
        canonic_module_name = canonic_module_name.match(/^(.+\/)?([^\/]+)\.tgz($|\?)/)[2];
        if (canonic_module_name.match(/^(.+)-[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9_]+\.[0-9]+)?$/)) {
          canonic_module_name = canonic_module_name.match(/^(.+)-[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9_]+\.[0-9]+)?$/)[1];
        }
      }
    }

    //omnitron install git+https://github.com/user/module
    if (canonic_module_name.indexOf('git+') !== -1) {
      canonic_module_name = canonic_module_name.split('/').pop();
    }

    //omnitron install https://github.com/user/module
    if (canonic_module_name.indexOf('http') !== -1) {
      var uri = url.parse(canonic_module_name);
      canonic_module_name = uri.pathname.split('/').pop();
    }

    //omnitron install file:///home/user/module
    else if (canonic_module_name.indexOf('file://') === 0) {
      canonic_module_name = canonic_module_name.replace(/\/$/, '').split('/').pop();
    }

    //omnitron install username/module
    else if (canonic_module_name.indexOf('/') !== -1) {
      if (canonic_module_name.charAt(0) !== '@') {
        canonic_module_name = canonic_module_name.split('/')[1];
      }
    }

    //omnitron install @somescope/module@2.1.0-beta
    if (canonic_module_name.lastIndexOf('@') > 0) {
      canonic_module_name = canonic_module_name.substr(0, canonic_module_name.lastIndexOf('@'));
    }

    //omnitron install module#some-branch
    if (canonic_module_name.indexOf('#') !== -1) {
      canonic_module_name = canonic_module_name.split('#')[0];
    }

    if (canonic_module_name.indexOf('.git') !== -1) {
      canonic_module_name = canonic_module_name.replace('.git', '');
    }

    return canonic_module_name;
  },

  checkPathIsNull(path) {
    return path === 'NULL' || path === '/dev/null' || path === '\\\\.\\NUL';
  },

  generateUUID() {
    var s = [];
    var hexDigits = '0123456789abcdef';
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = '4';
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = '-';
    return s.join('');
  },
});
