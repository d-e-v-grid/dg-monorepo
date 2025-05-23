# @devgrid/netron

A powerful TypeScript library for building distributed systems with event bus, streams, and remote object invocation capabilities. Built with WebSocket for real-time bidirectional communication between Node.js and browser environments.

## Features

- 🔄 Bidirectional WebSocket communication
- 📦 Remote object invocation (RPC)
- 🚀 Event bus with parallel and serial execution
- 💫 Streaming support
- 🛡️ TypeScript decorators for service definitions
- 🔍 Automatic service discovery
- ⚡ MessagePack serialization
- 🔒 Type-safe service interfaces
- 🔄 Automatic reconnection handling
- 📡 Service versioning support

## Installation
```bash
npm install @devgrid/netron
# or
yarn add @devgrid/netron
```

## Basic Usage

### Creating a Server

```typescript
import { Netron, Service, Public } from '@devgrid/netron';

@Service('calculator@1.0.0')
class Calculator {
  @Public()
  add(a: number, b: number): number {
    return a + b;
  }

  @Public()
  multiply(a: number, b: number): number {
    return a * b;
  }

  @Public({ readonly: true })
  version: string = '1.0.0';
}

const server = await Netron.create({
  listenHost: 'localhost',
  listenPort: 8080,
  taskTimeout: 5000,
  connectTimeout: 5000,
  requestTimeout: 5000,
  streamTimeout: 5000,
  allowServiceEvents: true,
  maxReconnectAttempts: 5
});

// Expose the calculator service
await server.peer.exposeService(new Calculator());
```

### Connecting from Client

```typescript
import { Netron } from '@devgrid/netron';

const client = await Netron.create();
const remotePeer = await client.connect('ws://localhost:8080');

// Query the calculator interface
const calculator = await remotePeer.queryInterface<ICalculator>('calculator@1.0.0');
// or latest version
const latestCalculator = await peer.queryInterface<ICalculator>('calculator');

// Use remote methods
const sum = await calculator.add(5, 3);      // 8
const product = await calculator.multiply(4, 2); // 8
const version = await calculator.version;     // '1.0.0'
```

## Advanced Features

### Event Bus

```typescript
// Server side
@Service('notifications')
class NotificationService {
  @Public()
  async broadcast(message: string) {
    await this.netron.emitParallel('notification', { message });
  }
}

// Client side
remotePeer.subscribe('notification', (data) => {
  console.log('New notification:', data.message);
});

// Different emission patterns
await netron.emitParallel('event');  // Execute handlers in parallel
await netron.emitSerial('event');    // Execute handlers sequentially
await netron.emitReduce('event');    // Reduce pattern (left to right)
await netron.emitReduceRight('event'); // Reduce pattern (right to left)
```

### Streaming Support

```typescript
@Service('fileService')
class FileService {
  @Public()
  async streamFile(filename: string) {
    const stream = createReadStream(filename);
    return new ReadableStream(stream);
  }

  @Public()
  async uploadFile(filename: string) {
    const stream = createWriteStream(filename);
    return new WritableStream(stream);
  }
}

// Client usage
const fileService = await remotePeer.queryInterface('fileService');
const readStream = await fileService.streamFile('large.file');

for await (const chunk of readStream) {
  console.log('Received chunk:', chunk);
}
```

### Task Management

```typescript
// Define a task
netron.addTask(async function pingTask(peer) {
  return { status: 'ok', timestamp: Date.now() };
});

// Execute task on remote peer
const result = await remotePeer.runTask('pingTask');
```

### Service Decorators

```typescript
@Service('users')
class UserService {
  @Public()
  async getUser(id: number): Promise<User> {
    return this.database.findUser(id);
  }

  @Public({ readonly: true })
  currentUser: User;

  // Private methods/properties are not exposed
  private async validateUser(user: User) {
    // ...
  }
}
```

## Configuration Options

```typescript
interface NetronOptions {
  id?: string;                    // Unique identifier for the Netron instance
  listenHost?: string;            // Host to listen on (server only)
  listenPort?: number;            // Port to listen on (server only)
  taskTimeout?: number;           // Timeout for task execution (default: 5000ms)
  taskOverwriteStrategy?: 'replace' | 'skip' | 'throw'; // How to handle duplicate tasks
  connectTimeout?: number;        // Connection timeout (default: 5000ms)
  requestTimeout?: number;        // Request timeout (default: 5000ms)
  streamTimeout?: number;         // Stream timeout (default: 5000ms)
  allowServiceEvents?: boolean;   // Enable service events
  maxReconnectAttempts?: number;  // Maximum reconnection attempts (default: unlimited)
}
```

## API Reference

### Netron Class

```typescript
class Netron {
  static create(options?: NetronOptions): Promise<Netron>;
  connect(address: string): Promise<RemotePeer>;
  disconnect(peerId: string): void;
  addTask(fn: Task): string;
  getServiceNames(): string[];
  emitParallel(event: string, ...args: any[]): Promise<void>;
  emitSerial(event: string, ...args: any[]): Promise<void>;
  emitReduce(event: string, ...args: any[]): Promise<any>;
  emitReduceRight(event: string, ...args: any[]): Promise<any>;
}
```

### Service Decorator Options

```typescript
interface ServiceMetadata {
  name: string;
  version: string;
  properties: Record<string, PropertyInfo>;
  methods: Record<string, MethodInfo>;
}

interface PropertyInfo {
  type: string;
  readonly: boolean;
}

interface MethodInfo {
  type: string;
  arguments: ArgumentInfo[];
}

interface ArgumentInfo {
  index: number;
  type: string;
}
```

### RemotePeer Methods

```typescript
class RemotePeer {
  queryInterface<T>(qualifiedName: string): Promise<T>;
  queryInterfaceByDefId<T>(defId: string, def?: Definition): T;
  subscribe(eventName: string, handler: EventSubscriber): Promise<void>;
  unsubscribe(eventName: string, handler: EventSubscriber): Promise<void>;
  runTask(name: string, ...args: any[]): Promise<any>;
  disconnect(): void;
  getServiceNames(): string[];
}
```

## Performance Considerations

- Uses MessagePack for efficient serialization
- Supports parallel execution of event handlers
- Automatic cleanup of unused services
- Memory-efficient stream handling
- Connection pooling for multiple peers
- Automatic reconnection with exponential backoff
- Efficient binary protocol for WebSocket communication

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- WebSocket support required
- ES2018+ features used
- Some features may require polyfills in older browsers

## License

MIT

## Credits

Built with:
- [ws](https://github.com/websockets/ws) for WebSocket support
- [@devgrid/messagepack](https://github.com/devgrid/messagepack) for serialization
- [@devgrid/async-emitter](https://github.com/devgrid/async-emitter) for event handling
- [@devgrid/smartbuffer](https://github.com/devgrid/smartbuffer) for efficient binary operations
- [@devgrid/common](https://github.com/devgrid/common) for utility functions