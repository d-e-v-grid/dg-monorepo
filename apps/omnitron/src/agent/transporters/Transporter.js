'use strict';

const EventEmitter2 = require('eventemitter2').EventEmitter2;
const dns = require('dns');

const cst = require('../constants.js');

module.exports = class Transporter extends EventEmitter2 {
  constructor() {
    super({
      delimiter: ':',
      wildcard: true,
    });
  }

  /**
   * Disconnect and connect to a url
   * @param {String} url where the client will connect [optionnal]
   * @param {Function} cb invoked with <err>
   */
  reconnect(url, cb) {
    this.disconnect();
    this.connect(url, cb);
  }

  /**
   * Broadcast the close event from websocket connection
   * @private
   * @param {Integer} code
   * @param {String} reason
   */
  _onClose(code, reason) {
    this.disconnect();
    this._reconnect();
    this.emit('close', code, reason);
  }

  /**
   * Broadcast the error event from websocket connection
   * and eventually close the connection if it isnt already
   * @private
   * @param {Error} err
   */
  _onError(err) {
    // close connection if needed
    this.disconnect();
    this._reconnect();
    this.emit('error', err);
  }

  /**
   * Worker that will empty the packet queue if the connection works.
   * @private
   */
  _emptyQueue() {
    // create the queue if it doesn't exist
    if (!this.queue) {
      this.queue = [];
      return;
    }
    if (this.queue.length === 0) return;
    if (!this.isConnected()) return;

    // re-send all of the data
    while (this.queue.length > 0) {
      if (!this.isConnected()) return;
      let packet = this.queue[0];
      this.send(packet.channel, packet.data);
      this.queue.shift();
    }
  }

  /**
   * Is internet reachable via DNS
   * @private
   * @param {Function} cb invoked with <boolean>
   */
  _checkInternet(cb) {
    dns.lookup('google.com', (err) => {
      if (err && (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN')) {
        this._online = false;
      } else {
        this._online = true;
      }
      return cb(this._online);
    });
  }

  /**
   * Strategy to reconnect to remote endpoint as soon as possible
   *  -> test internet connection with dns request (if fail retry in 2 sec)
   *  -> try to connect to endpoint (if fail retry in 5 sec)
   */
  _reconnect() {
    if (this._reconnecting === true) return;
    this._reconnecting = true;

    this._checkInternet((online) => {
      if (!online && !cst.OMNITRON_DEBUG) {
        this._reconnecting = false;
        return setTimeout(this._reconnect.bind(this), process.env.NODE_ENV === 'test' ? 1 : 2000);
      }
      this.connect((err) => {
        if (err || !this.isConnected()) {
          this._reconnecting = false;
          return setTimeout(this._reconnect.bind(this), process.env.NODE_ENV === 'test' ? 1 : 5000);
        }

        this._reconnecting = false;
        this._emptyQueue();
      });
    });
  }
};
