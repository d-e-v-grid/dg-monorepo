// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
// omnitron-htop
// Library who interacts with OMNITRON to display processes resources in htop way
// by Strzelewicz Alexandre

import * as os from 'os';
import * as p from 'path';
import chalk from 'ansis';

import UX from '../ux';
import multimeter from './multimeter';

// Cst for light programs
const RATIO_T1 = Math.floor(os.totalmem() / 500);
// Cst for medium programs
const RATIO_T2 = Math.floor(os.totalmem() / 50);
// Cst for heavy programs
const RATIO_T3 = Math.floor(os.totalmem() / 5);
// Cst for heavy programs
const RATIO_T4 = Math.floor(os.totalmem());

interface MonitType {
  multi?: any;
  bars?: { [key: string]: any };
  num_bars?: number;
  init?: () => MonitType;
  stop?: () => void;
  reset?: (msg?: string) => MonitType;
  refresh?: (processes?: any[]) => MonitType;
  addProcess?: (proc: any, i: number) => MonitType;
  addProcesses?: (processes: any[]) => void;
  drawRatio?: (bar_memory: any, memory: number) => void;
  updateBars?: (proc: any) => MonitType;
}

const Monit: MonitType = {};

//helper to get bars.length (num bars printed)
Object.size = function (obj: { [key: string]: any }) {
  let size = 0,
    key: string;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) size++;
  }
  return size;
};

/**
 * Reset the monitor through charm, basically \033c
 * @param  String msg optional message to show
 * @return Monit
 */
Monit.reset = function (msg?: string) {
  this.multi.charm.reset();

  this.multi.write(
    '\x1B[32m⌬ OMNITRON \x1B[39mmonitoring\x1B[96m (To go further check out https://app.omnitron.io) \x1B[39m\n\n'
  );

  if (msg) {
    this.multi.write(msg);
  }

  this.bars = {};

  return this;
};

/**
 * Synchronous Monitor init method
 * @method init
 * @return Monit
 */
Monit.init = function () {
  this.multi = multimeter(process);

  this.multi.on('^C', this.stop);

  this.reset();

  return this;
};

/**
 * Stops monitor
 * @method stop
 */
Monit.stop = function () {
  this.multi.charm.destroy();
  process.exit(0);
};

/**
 * Refresh monitor
 * @method refresh
 * @param {} processes
 * @return this
 */
Monit.refresh = function (processes?: any[]) {
  if (!processes) {
    processes = [];
  }

  const num = processes.length;
  this.num_bars = Object.size(this.bars);

  if (num !== this.num_bars) {
    return this.addProcesses(processes);
  } else {
    if (num === 0) {
      return this;
    }

    let proc: any;

    for (let i = 0; i < num; i++) {
      proc = processes[i];

      //this is to avoid a print issue when the process is restarted for example
      //we might also check for the pid but restarted|restarting will be rendered bad
      if (this.bars[proc.pm_id] && proc.omnitron_env.status !== this.bars[proc.pm_id].status) {
        this.addProcesses(processes);
        break;
      }

      this.updateBars(proc);
    }
  }

  return this;
};

Monit.addProcess = function (proc: any, i: number) {
  if (proc.pm_id in this.bars) {
    return this;
  }

  if (proc.monit.error) throw new Error(JSON.stringify(proc.monit.error));

  const process_name = proc.omnitron_env.name || p.basename(proc.omnitron_env.pm_exec_path);
  const status = proc.omnitron_env.status == 'online' ? chalk.green.bold('●') : chalk.red.bold('●');

  this.multi.write(' ' + status + ' ' + chalk.green.bold(process_name));
  this.multi.write('\n');
  this.multi.write('[' + proc.omnitron_env.pm_id + '] [' + proc.omnitron_env.exec_mode + ']\n');

  const bar_cpu = this.multi(40, i * 2 + 3 + i, {
    width: 30,
    solid: {
      text: '|',
      foreground: 'white',
      background: 'blue',
    },
    empty: {
      text: ' ',
    },
  });

  const bar_memory = this.multi(40, i * 2 + 4 + i, {
    width: 30,
    solid: {
      text: '|',
      foreground: 'white',
      background: 'red',
    },
    empty: {
      text: ' ',
    },
  });

  this.bars[proc.pm_id] = {
    memory: bar_memory,
    cpu: bar_cpu,
    status: proc.omnitron_env.status,
  };

  this.updateBars(proc);

  this.multi.write('\n');

  return this;
};

Monit.addProcesses = function (processes: any[]) {
  if (!processes) {
    processes = [];
  }

  this.reset();

  const num = processes.length;

  if (num > 0) {
    for (let i = 0; i < num; i++) {
      this.addProcess(processes[i], i);
    }
  } else {
    this.reset('No processes to monit');
  }
};

// Draw memory bars
/**
 * Description
 * @method drawRatio
 * @param {} bar_memory
 * @param {} memory
 * @return
 */
Monit.drawRatio = function (bar_memory: any, memory: number) {
  let scale = 0;

  if (memory < RATIO_T1) scale = RATIO_T1;
  else if (memory < RATIO_T2) scale = RATIO_T2;
  else if (memory < RATIO_T3) scale = RATIO_T3;
  else scale = RATIO_T4;

  bar_memory.ratio(memory, scale, UX.helpers.bytesToSize(memory, 3));
};

/**
 * Updates bars informations
 * @param  {} proc       proc object
 * @return  this
 */
Monit.updateBars = function (proc: any) {
  if (this.bars[proc.pm_id]) {
    if (proc.omnitron_env.status !== 'online' || proc.omnitron_env.status !== this.bars[proc.pm_id].status) {
      this.bars[proc.pm_id].cpu.percent(0, chalk.red(proc.omnitron_env.status));
      this.drawRatio(this.bars[proc.pm_id].memory, 0, chalk.red(proc.omnitron_env.status));
    } else if (!proc.monit) {
      this.bars[proc.pm_id].cpu.percent(0, chalk.red('No data'));
      this.drawRatio(this.bars[proc.pm_id].memory, 0, chalk.red('No data'));
    } else {
      this.bars[proc.pm_id].cpu.percent(proc.monit.cpu);
      this.drawRatio(this.bars[proc.pm_id].memory, proc.monit.memory);
    }
  }

  return this;
};

export default Monit;
