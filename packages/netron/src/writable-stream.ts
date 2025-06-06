import { Writable, Readable, WritableOptions } from 'stream';

import { Uid } from './uid';
import { RemotePeer } from './remote-peer';
import { Packet, createPacket, TYPE_STREAM_ERROR } from './packet';

/**
 * Global UID generator instance for creating unique stream identifiers.
 * This ensures that each stream gets a unique ID across the application.
 */
const uid = new Uid();

/**
 * Configuration options for creating a NetronWritableStream instance.
 * Extends Node.js WritableOptions with Netron-specific properties.
 * 
 * @interface NetronWritableStreamOptions
 * @extends {WritableOptions}
 * @property {RemotePeer} peer - The remote peer this stream is associated with
 * @property {number} [streamId] - Optional custom stream identifier
 * @property {boolean} [isLive] - Whether the stream is operating in live/real-time mode
 */
export interface NetronWritableStreamOptions extends WritableOptions {
  peer: RemotePeer;
  streamId?: number;
  isLive?: boolean;
}

/**
 * A specialized writable stream implementation for the Netron distributed system.
 * This class extends Node.js Writable stream to provide distributed stream capabilities
 * with proper error handling, cleanup, and remote peer communication.
 * 
 * @class NetronWritableStream
 * @extends {Writable}
 * @property {number} id - Unique identifier for this stream instance
 * @property {RemotePeer} peer - The remote peer this stream is associated with
 * @property {boolean} isLive - Indicates if the stream is operating in live mode
 */
export class NetronWritableStream extends Writable {
  /** Unique identifier for this stream instance */
  public readonly id: number;

  /** The remote peer this stream is associated with */
  public readonly peer: RemotePeer;

  /** Current chunk index for maintaining write order */
  private index: number = 0;

  /** Whether the stream is operating in live/real-time mode */
  public isLive: boolean;

  /** Flag indicating if the stream has been closed */
  private isClosed: boolean = false;

  /**
   * Creates a new NetronWritableStream instance.
   * 
   * @constructor
   * @param {NetronWritableStreamOptions} options - Configuration options for the stream
   * @param {RemotePeer} options.peer - The remote peer this stream is associated with
   * @param {number} [options.streamId] - Optional custom stream identifier
   * @param {boolean} [options.isLive=false] - Whether the stream is operating in live mode
   * @param {WritableOptions} [options] - Additional Node.js stream options
   */
  constructor({ peer, streamId, isLive = false, ...opts }: NetronWritableStreamOptions) {
    super({ ...opts, objectMode: true });

    this.peer = peer;
    this.isLive = isLive;
    this.id = streamId ?? uid.next();

    this.peer.logger.info('Creating writable stream', { streamId: this.id, isLive });
    this.peer.writableStreams.set(this.id, this);

    this.once('close', this.cleanup);
    this.once('error', this.handleError);
  }

  /**
   * Pipes data from an AsyncIterable or Readable stream into this stream.
   * Handles backpressure and ensures proper cleanup on errors.
   * 
   * @param {AsyncIterable<any> | Readable} source - The source stream to pipe from
   * @returns {Promise<void>} A promise that resolves when piping is complete
   * @throws {Error} If an error occurs during the piping process
   */
  public async pipeFrom(source: AsyncIterable<any> | Readable): Promise<void> {
    this.peer.logger.debug('Starting pipe operation', { streamId: this.id });
    try {
      for await (const chunk of source) {
        if (!this.write(chunk)) {
          this.peer.logger.debug('Stream backpressure detected', { streamId: this.id });
          await new Promise((resolve) => this.once('drain', resolve));
        }
      }
      this.end();
      this.peer.logger.debug('Pipe operation completed', { streamId: this.id });
    } catch (error) {
      this.peer.logger.error('Pipe operation failed', { streamId: this.id, error });
      this.destroy(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Internal write implementation for handling stream chunks.
   * Sends data to the remote peer and manages stream state.
   * 
   * @override
   * @param {any} chunk - The data chunk to write
   * @param {BufferEncoding} _ - Unused encoding parameter
   * @param {(error?: Error | null) => void} callback - Callback to signal write completion
   */
  override _write(chunk: any, _: BufferEncoding, callback: (error?: Error | null) => void): void {
    if (this.isClosed) {
      this.peer.logger.warn('Attempt to write to closed stream', { streamId: this.id });
      callback(new Error('Stream is already closed'));
      return;
    }

    this.peer.logger.debug('Writing chunk', { streamId: this.id, index: this.index });
    this.peer.sendStreamChunk(this.id, chunk, this.index++, false, this.isLive)
      .then(() => callback())
      .catch((err: Error) => {
        this.peer.logger.error('Error sending stream chunk', { streamId: this.id, error: err });
        this.peer.sendPacket(createPacket(Packet.nextId(), 1, TYPE_STREAM_ERROR, {
          streamId: this.id,
          message: err.message,
        })).finally(() => {
          callback(err);
          this.destroy(err);
        });
      });
  }

  /**
   * Internal final implementation for handling stream completion.
   * Sends final chunk to remote peer and performs cleanup.
   * 
   * @override
   * @param {(error?: Error | null) => void} callback - Callback to signal finalization completion
   */
  override _final(callback: (error?: Error | null) => void): void {
    if (this.isClosed) {
      this.peer.logger.warn('Attempt to finalize closed stream', { streamId: this.id });
      callback(new Error('Stream is already closed'));
      return;
    }

    this.peer.logger.debug('Sending final chunk', { streamId: this.id, index: this.index });
    this.peer.sendStreamChunk(this.id, null, this.index, true, this.isLive)
      .then(() => callback())
      .catch((err: Error) => {
        this.peer.logger.error('Error sending final chunk', { streamId: this.id, error: err });
        callback(err);
        this.destroy(err);
      })
      .finally(() => this.closeStream());
  }

  /**
   * Gracefully closes the stream and performs cleanup.
   * This method ensures proper resource cleanup and state management.
   */
  public closeStream(): void {
    if (this.isClosed) {
      this.peer.logger.warn('Attempt to close already closed stream', { streamId: this.id });
      return;
    }

    this.peer.logger.info('Closing stream', { streamId: this.id });
    this.isClosed = true;
    this.end();
    this.cleanup();
  }

  /**
   * Overrides the destroy method to ensure proper cleanup and error handling.
   * Sends a final chunk to the remote peer before destruction.
   * 
   * @override
   * @param {Error} [error] - Optional error that caused the destruction
   * @returns {this} The stream instance for chaining
   */
  public override destroy(error?: Error): this {
    if (this.isClosed) {
      this.peer.logger.warn('Attempt to destroy already closed stream', { streamId: this.id });
      return this;
    }

    this.peer.logger.info('Destroying stream', { streamId: this.id, error });
    this.isClosed = true;

    this.peer.sendStreamChunk(this.id, null, this.index, true, this.isLive)
      .catch((sendError) => {
        this.peer.logger.error('Failed to send final stream chunk', { streamId: this.id, error: sendError });
      })
      .finally(() => {
        super.destroy(error);
        this.cleanup();
      });

    return this;
  }

  /**
   * Internal cleanup method that removes stream references from the peer.
   * This ensures proper garbage collection and prevents memory leaks.
   */
  private cleanup = () => {
    this.peer.logger.debug('Cleaning up stream resources', { streamId: this.id });
    this.peer.writableStreams.delete(this.id);
  };

  /**
   * Error handler for stream errors.
   * Logs the error and performs cleanup operations.
   * 
   * @param {Error} err - The error that occurred
   */
  private handleError = (err: Error) => {
    this.peer.logger.error('Stream error occurred', { streamId: this.id, error: err });
    this.cleanup();
  };

  /**
   * Factory method for creating a NetronWritableStream instance.
   * Optionally pipes data from a source stream if provided.
   * 
   * @static
   * @param {RemotePeer} peer - The remote peer this stream is associated with
   * @param {AsyncIterable<any> | Readable} [source] - Optional source stream to pipe from
   * @param {boolean} [isLive=false] - Whether the stream is operating in live mode
   * @param {number} [streamId] - Optional custom stream identifier
   * @returns {NetronWritableStream} A new stream instance
   */
  public static create(peer: RemotePeer, source?: AsyncIterable<any> | Readable, isLive: boolean = false, streamId?: number): NetronWritableStream {
    const stream = new NetronWritableStream({ peer, streamId, isLive });

    if (source) {
      stream.pipeFrom(source);
    }

    return stream;
  }
}
