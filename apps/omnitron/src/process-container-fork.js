const url = require('url');

// Inject custom modules
const ProcessUtils = require('./process-utils');

ProcessUtils.injectModules();

if (typeof process.env.source_map_support != 'undefined' && process.env.source_map_support !== 'false') {
  require('source-map-support').install();
}

// Rename the process
process.title = process.env.PROCESS_TITLE || 'node ' + process.env.pm_exec_path;

if (process.connected && process.send && process.versions && process.versions.node)
  process.send({
    node_version: process.versions.node,
  });

// Require the real application
if (process.env.pm_exec_path) {
  if (ProcessUtils.isESModule(process.env.pm_exec_path) === true) {
    import(url.pathToFileURL(process.env.pm_exec_path));
  } else require('module')._load(process.env.pm_exec_path, null, true);
} else throw new Error('Could not _load() the script');

// Change some values to make node think that the user's application
// was started directly such as `node app.js`
process.mainModule = process.mainModule || {};
process.mainModule.loaded = false;
require.main = process.mainModule;
