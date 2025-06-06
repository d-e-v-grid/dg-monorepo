const fs = require('fs');
const os = require('os');
const path = require('path');
const chalk = require('ansis');
const axon = require('pm2-axon');
const rpc = require('pm2-axon-rpc');
const childProcess = require('child_process');

const constants = require('./constants');

const printError = function (msg) {
  if (process.env.OMNITRON_SILENT || process.env.OMNITRON_PROGRAMMATIC) return false;
  if (msg instanceof Error) return console.error(msg.message);
  return console.error.apply(console, arguments);
};
const printOut = function (msg) {
  if (process.env.OMNITRON_SILENT || process.env.OMNITRON_PROGRAMMATIC) return false;
  return console.log.apply(console, arguments);
};

module.exports = class InteractorDaemonizer {
  /**
   * Ping the Interactor to see if its online
   * @param {Object} opts global constants
   * @param {String} opts.INTERACTOR_RPC_PORT path used to connect to the interactor
   * @param {Function} cb invoked with <err, result>
   */
  static ping(opts, cb) {
    if (typeof cb !== 'function') {
      throw new Error('Missing parameters');
    } else if (typeof opts !== 'object' || !opts || !opts.INTERACTOR_RPC_PORT) {
      return cb(new Error('Missing parameters'));
    }
    const req = axon.socket('req');
    const client = new rpc.Client(req);

    client.sock.once('reconnect attempt', (_) => {
      client.sock.close();
      return cb(null, false);
    });

    client.sock.once('connect', (_) => {
      client.sock.once('close', (_) => cb(null, true));
      client.sock.close();
    });

    client.sock.once('error', (e) => {
      if (e.code === 'EACCES') {
        fs.stat(opts.INTERACTOR_RPC_PORT, (e, stats) => {
          if (stats.uid === 0) {
            console.error('Permission denied, activate current user');
            return process.exit(1);
          }
        });
      } else {
        console.error('unexpected error');
        console.error(e);
      }
    });

    req.connect(opts.INTERACTOR_RPC_PORT);
  }

  /**
   * Try to kill the interactor daemon via RPC
   * @param {Object} conf global constants
   * @param {String} conf.INTERACTOR_RPC_PORT path used to connect to the interactor
   * @param {Function} cb invoked with <err>
   */
  static killInteractorDaemon(conf, cb) {
    process.env.OMNITRON_INTERACTOR_PROCESSING = true;

    this.ping(conf, (err, online) => {
      if (!online || err) {
        return cb ? (err ? cb(err) : cb(new Error('Interactor not launched'))) : printError('Interactor not launched');
      }

      this.launchRPC(conf, (err, data) => {
        if (err) {
          setTimeout((_) => {
            this.disconnectRPC(cb);
          }, 100);
          return false;
        }
        this.rpc.kill((err) => {
          if (err) printError(err);
          setTimeout((_) => {
            this.disconnectRPC(cb);
          }, 100);
        });
        return false;
      });
      return false;
    });
  }

  /**
   * Start a RPC client that connect to the InteractorDaemon
   * @param {Object} conf global constants
   * @param {Function} cb invoked with <err>
   */
  static launchRPC(conf, cb) {
    const req = axon.socket('req');
    this.rpc = {};
    this.client = new rpc.Client(req);

    // attach known methods to RPC client
    const generateMethods = (cb) => {
      this.client.methods((err, methods) => {
        if (err) return cb(err);
        Object.keys(methods).forEach((key) => {
          let method = methods[key]((name) => {
            let self = this;
            this.rpc[name] = function () {
              let args = Array.prototype.slice.call(arguments);
              args.unshift(name);
              self.client.call.apply(self.client, args);
            };
          })(method.name);
        });
        return cb();
      });
    };

    this.client.sock.once('reconnect attempt', (err) => {
      this.client.sock.removeAllListeners();
      return cb(err, { success: false, msg: 'reconnect attempt' });
    });

    this.client.sock.once('error', (err) => cb(err, { success: false, msg: 'reconnect attempt' }));

    this.client.sock.once('connect', () => {
      this.client.sock.removeAllListeners();
      generateMethods((_) => cb(null, { success: true }));
    });

    this.client_sock = req.connect(conf.INTERACTOR_RPC_PORT);
  }

  /**
   * Start or Restart the Interaction Daemon depending if its online or not
   * @private
   * @param {Object} conf global constants
   * @param {Object} infos data used to start the interactor [can be recovered from FS]
   * @param {String} infos.secret_key the secret key used to cipher data
   * @param {String} infos.public_key the public key used identify the user
   * @param {String} infos.machine_name [optional] override name of the machine
   * @param {Function} cb invoked with <err, msg, process>
   */
  static daemonize(cst, conf, cb) {
    const InteractorJS = path.resolve(path.dirname(module.filename), 'InteractorDaemon.js');
    const OMNITRONPath = require.main.filename;

    // Redirect OMNITRON internal err and out
    // to STDERR STDOUT when running with Travis
    const testEnv = process.env.TRAVIS || (process.env.NODE_ENV && process.env.NODE_ENV.match(/test/));
    const out = testEnv ? 1 : fs.openSync(constants.INTERACTOR_LOG_FILE_PATH, 'a');
    const err = testEnv ? 2 : fs.openSync(constants.INTERACTOR_LOG_FILE_PATH, 'a');

    let binary = process.execPath;

    if (cst.IS_BUN === true) binary = process.execPath;
    else if (binary.indexOf('node') === -1) binary = 'node';
    if (process.env.NODEJS_EXECUTABLE) binary = process.env.NODEJS_EXECUTABLE;

    const child = childProcess.spawn(binary, [InteractorJS], {
      silent: false,
      detached: true,
      windowsHide: true,
      cwd: process.cwd(),
      env: Object.assign(
        {
          OMNITRON_HOME: cst.OMNITRON_HOME,
          OMNITRON_MACHINE_NAME: conf.machine_name,
          OMNITRON_SECRET_KEY: conf.secret_key,
          OMNITRON_PUBLIC_KEY: conf.public_key,
          OMNITRON_REVERSE_INTERACT: conf.reverse_interact,
          OMNITRON_BINARY_PATH: OMNITRONPath,
          KEYMETRICS_NODE: conf.info_node,
          OMNITRON_VERSION: conf.omnitron_version,
          DEBUG:
            process.env.DEBUG ||
            'interactor:*,-interactor:axon,-interactor:websocket,-interactor:omnitron:client,-interactor:push',
        },
        process.env
      ),
      stdio: [null, out, err, 'ipc'], // Redirect stdout, stderr, and enable IPC
      //stdio: ['ipc', out, err]
    });

    try {
      let prevPid = fs.readFileSync(constants.INTERACTOR_PID_PATH);
      prevPid = parseInt(prevPid);
      process.kill(prevPid);
    } catch (e) { }

    let pid = '';

    if (child.pid) pid = child.pid.toString();

    fs.writeFileSync(cst.INTERACTOR_PID_PATH, pid);

    child.on('close', (status) => {
      if (status === constants.ERROR_EXIT) {
        return cb(new Error('Agent has shutdown for unknown reason'));
      }

      return cb();
    });

    child.once('error', (err) => cb(err));

    if (cst.IS_BUN === true) {
      return cb(null, {}, child);
    }

    child.unref();

    const timeout = setTimeout((_) => {
      printOut(
        `${chalk.yellow('[OMNITRON.IO][WARNING]')} Not managed to connect to OMNITRON Plus, retrying in background.`
      );
      child.removeAllListeners();
      if (child.disconnect) child.disconnect();
      return cb(null, {}, child);
    }, 7000);

    child.once('message', (msg) => {
      clearTimeout(timeout);

      if (msg.log) {
        return cb(null, msg, child);
      }

      child.removeAllListeners('error');
      if (cst.IS_BUN === true) child.removeAllListeners('close');
      child.disconnect();

      // Handle and show to user the different error message that can happen
      if (msg.km_data && msg.km_data.error === true) {
        if (!process.env.OMNITRON_SILENT) {
          console.log(chalk.red('[OMNITRON.IO][ERROR]'), msg.km_data.msg);
          console.log(
            chalk.cyan('[OMNITRON.IO]') + ' Contact support contact@keymetrics.io and send us the error message'
          );
        }
        return cb(msg);
      } else if (msg.km_data && msg.km_data.disabled === true) {
        if (!process.env.OMNITRON_SILENT) {
          console.log(
            chalk.cyan('[OMNITRON.IO]') +
            ' Server DISABLED BY ADMINISTRATION contact support contact@keymetrics.io with reference to your public and secret keys)'
          );
        }
        return cb(msg);
      } else if (msg.km_data && msg.km_data.error === true) {
        if (!process.env.OMNITRON_SILENT) {
          console.log(
            '%s %s (Public: %s) (Secret: %s) (Machine name: %s)',
            chalk.red('[OMNITRON.IO][ERROR]'),
            msg.km_data.msg,
            msg.public_key,
            msg.secret_key,
            msg.machine_name
          );
        }
        return cb(msg);
      } else if (msg.km_data && msg.km_data.active === false && msg.km_data.pending === true) {
        if (!process.env.OMNITRON_SILENT) {
          console.log('%s You must upgrade your bucket in order to monitor more servers.', chalk.red('[OMNITRON.IO]'));
        }
        return cb(msg);
      }

      return cb(null, msg, child);
    });
  }

  /**
   * Start or Restart the Interaction Daemon depending if its online or not
   * @private
   * @param {Object} conf global constants
   * @param {Object} infos data used to start the interactor [can be recovered from FS]
   * @param {String} infos.secret_key the secret key used to cipher data
   * @param {String} infos.public_key the public key used identify the user
   * @param {String} infos.machine_name [optional] override name of the machine
   * @param {Function} cb invoked with <err, msg, process>
   */
  static launchOrAttach(conf, infos, cb) {
    this.ping(conf, (err, online) => {
      if (!err && online) {
        this.launchRPC(conf, (_) => {
          this.rpc.kill((ignoredErr) => {
            this.daemonize(conf, infos, cb);
          });
        });
      } else {
        this.daemonize(conf, infos, cb);
      }
    });
  }

  /**
   * Restart the Interactor Daemon
   * @param {Object} conf global constants
   * @param {Function} cb invoked with <err, msg>
   */
  static update(conf, cb) {
    this.ping(conf, (err, online) => {
      if (err || !online) {
        return cb ? cb(new Error('Interactor not launched')) : printError('Interactor not launched');
      }
      this.launchRPC(conf, (_) => {
        this.rpc.kill((err) => {
          if (err) {
            return cb ? cb(err) : printError(err);
          }
          printOut('Interactor successfully killed');
          setTimeout((_) => {
            this.launchAndInteract(conf, {}, (_) => cb(null, { msg: 'Daemon launched' }));
          }, 500);
        });
      });
    });
  }

  /**
   * Retrieve Interactor configuration from env, params and filesystem.
   * @param {Object} cst global constants
   * @param {Object} infos data used to start the interactor [optional]
   * @param {String} infos.secret_key the secret key used to cipher data [optional]
   * @param {String} infos.public_key the public key used identify the user [optional]
   * @param {String} infos.machine_name override name of the machine [optional]
   * @param {Function} cb invoked with <err, configuration>
   */
  static getOrSetConf(cst, infos, cb) {
    infos = infos || {};
    let configuration = {
      version_management: {
        active: true,
      },
    };
    let confFS = {};

    // Try loading configuration file on FS
    try {
      let fileContent = fs.readFileSync(cst.INTERACTION_CONF).toString();
      // Handle old configuration with json5
      fileContent = fileContent.replace(/\s(\w+):/g, '"$1":');
      // parse
      confFS = JSON.parse(fileContent);

      if (confFS.version_management) {
        configuration.version_management.active = confFS.version_management.active;
      }
    } catch (e) {
      //
    }

    // load the configration (first have priority)
    //    -> from env variable
    //    -> from params (eg. CLI)
    //    -> from configuration on FS
    configuration.public_key =
      process.env.OMNITRON_PUBLIC_KEY || process.env.KEYMETRICS_PUBLIC || infos.public_key || confFS.public_key;
    configuration.secret_key =
      process.env.OMNITRON_SECRET_KEY || process.env.KEYMETRICS_SECRET || infos.secret_key || confFS.secret_key;
    configuration.machine_name =
      process.env.OMNITRON_MACHINE_NAME ||
      process.env.INSTANCE_NAME ||
      infos.machine_name ||
      confFS.machine_name ||
      `${os.hostname()}-${require('crypto').randomBytes(2).toString('hex')}`;
    configuration.omnitron_version = process.env.OMNITRON_VERSION || infos.omnitron_version || confFS.omnitron_version;
    configuration.reverse_interact = confFS.reverse_interact || true;
    // is setup empty ? use the one provided in env OR root OTHERWISE get the one on FS conf OR fallback on root
    configuration.info_node =
      process.env.KEYMETRICS_NODE || infos.info_node || confFS.info_node || cst.KEYMETRICS_ROOT_URL;

    if (!configuration.secret_key) {
      return cb(new Error('secret key is not defined'));
    }
    if (!configuration.public_key) {
      return cb(new Error('public key is not defined'));
    }

    // write configuration on FS
    try {
      fs.writeFileSync(cst.INTERACTION_CONF, JSON.stringify(configuration, null, 4));
    } catch (e) {
      console.error('Error when writting configuration file %s', cst.INTERACTION_CONF);
      return cb(e);
    }
    if (configuration.info_node.indexOf('http') === -1) {
      // handle old file
      configuration.info_node = `https://${configuration.info_node}`;
    }
    return cb(null, configuration);
  }

  /**
   * Disconnect the RPC client from Interactor Daemon
   * @param {Function} cb invoked with <err, msg>
   */
  static disconnectRPC(cb) {
    if (!this.client_sock || !this.client_sock.close) {
      return cb(null, {
        success: false,
        msg: 'RPC connection to Interactor Daemon is not launched',
      });
    }

    if (this.client_sock.closing === true) {
      return cb(null, {
        success: false,
        msg: 'RPC closed',
      });
    }

    try {
      let timer;

      this.client_sock.once('close', (_) => {
        clearTimeout(timer);
        return cb ? cb(null, { success: true }) : false;
      });

      timer = setTimeout((_) => {
        if (this.client_sock.destroy) {
          this.client_sock.destroy();
        }
        return cb ? cb(null, { success: true }) : false;
      }, 200);

      this.client_sock.close();
    } catch (err) {
      return cb ? cb(err) : false;
    }
  }

  /**
   * Start the Interactor Daemon
   * @param {Object} cst global constants
   * @param {Object} infos data used to start the interactor [can be recovered from FS]
   * @param {String} infos.secret_key the secret key used to cipher data
   * @param {String} infos.public_key the public key used identify the user
   * @param {String} infos.machine_name [optional] override name of the machine
   * @param {Function} cb invoked with <err, msg, process>
   */
  static launchAndInteract(cst, opts, cb) {
    // For Watchdog
    if (process.env.OMNITRON_AGENT_ONLINE) {
      return cb();
    }

    process.env.OMNITRON_INTERACTOR_PROCESSING = true;

    this.getOrSetConf(Object.assign(cst, constants), opts, (err, conf) => {
      if (err || !conf) return cb(err || new Error('Cant retrieve configuration'));

      if (!process.env.OMNITRON_SILENT) {
        console.log(
          chalk.cyan('[OMNITRON I/O]') + ' Using: Public key: %s | Private key: %s | Machine name: %s',
          conf.public_key,
          conf.secret_key,
          conf.machine_name
        );
      }
      return this.launchOrAttach(cst, conf, cb);
    });
  }

  /**
   * Retrieve configuration used by the Interaction Daemon
   * @param {Object} cst global constants
   * @param {Function} cb invoked with <err, data>
   */
  static getInteractInfo(cst, cb) {
    if (process.env.OMNITRON_NO_INTERACTION) return cb(new Error('OMNITRON_NO_INTERACTION set'));

    this.ping(cst, (err, online) => {
      if (err || !online) return cb(new Error('Interactor is offline'));

      this.launchRPC(cst, (_) => {
        this.rpc.getInfos((err, infos) => {
          if (err) return cb(err);

          // Avoid general CLI to interfere with Keymetrics CLI commands
          if (process.env.OMNITRON_INTERACTOR_PROCESSING) return cb(null, infos);

          this.disconnectRPC(() => cb(null, infos));
        });
      });
    });
  }
};
