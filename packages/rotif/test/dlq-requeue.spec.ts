import { delay as delayMs } from '@devgrid/common';

import { NotificationManager } from '../src';
import { createTestConfig } from './helpers/test-utils';

describe('DLQ - Requeue from DLQ', () => {
  let manager: NotificationManager;

  beforeAll(async () => {
    manager = new NotificationManager(createTestConfig(1, {
      checkDelayInterval: 100,
      blockInterval: 100,
    }));
    await manager.redis.flushdb();
  });

  afterAll(async () => {
    await manager.stopAll();
  });

  it('should requeue messages from DLQ back to the original stream', async () => {
    const received: any[] = [];
    const channel = 'dlq.test';

    let failOnce = true;

    // Subscribe to channel and fail once to put msg in DLQ
    await manager.subscribe(channel, async (msg) => {
      if (failOnce) {
        failOnce = false;
        throw new Error('forced failure');
      }
      received.push(msg.payload);
    }, { maxRetries: 0 });

    await delayMs(100);

    // Publish message that will fail and go to DLQ
    await manager.publish(channel, { data: 'important' });

    await delayMs(1000);

    expect(received.length).toBe(0); // msg initially not processed (in DLQ)

    // Now, requeue message from DLQ
    await manager.requeueFromDLQ();

    await delayMs(1000);

    expect(received.length).toBe(1);
    expect(received[0]).toEqual({ data: 'important' });
  }, 10000);
});
