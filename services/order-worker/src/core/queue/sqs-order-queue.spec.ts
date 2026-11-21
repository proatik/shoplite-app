import { it, vi, expect, describe } from 'vitest';
import {
  GetQueueUrlCommand,
  SendMessageCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand
} from '@aws-sdk/client-sqs';

import { SqsOrderQueue } from '@/core/queue/sqs-order-queue';

import type { SQSClient } from '@aws-sdk/client-sqs';

const QUEUE_URL =
  'https://sqs.ap-southeast-1.amazonaws.com/123456789012/orders';
const CONFIRMED_URL =
  'https://sqs.ap-southeast-1.amazonaws.com/123456789012/confirmed';

const URLS: Record<string, string> = {
  orders: QUEUE_URL,
  confirmed: CONFIRMED_URL
};

type Handler = (command: object) => Promise<unknown>;

// answers each URL lookup by queue name; `handler` answers every other call.
function queueWith(handler: Handler): {
  send: ReturnType<typeof vi.fn>;
  queue: SqsOrderQueue;
} {
  const send = vi.fn(async (command: object) => {
    if (command instanceof GetQueueUrlCommand) {
      return { QueueUrl: URLS[command.input.QueueName ?? ''] };
    }

    return await handler(command);
  });

  return {
    send,
    queue: new SqsOrderQueue(
      'orders',
      { send, destroy: vi.fn() } as unknown as SQSClient,
      'confirmed'
    )
  };
}

function callsOf<T extends object>(
  send: ReturnType<typeof vi.fn>,
  type: new (...args: never[]) => T
): T[] {
  return send.mock.calls
    .map(([command]) => command as object)
    .filter((command): command is T => command instanceof type);
}

describe('SqsOrderQueue', () => {
  it('long-polls one message at a time from the orders queue', async () => {
    const { send, queue } = queueWith(async () => ({ Messages: [] }));

    await queue.createConsumer().receive(new AbortController().signal);

    expect(callsOf(send, ReceiveMessageCommand)[0].input).toEqual({
      QueueUrl: QUEUE_URL,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 20
    });
  });

  it('deletes the message once it is acknowledged', async () => {
    const { send, queue } = queueWith(async () => ({
      Messages: [{ Body: '{"order_id":1}', ReceiptHandle: 'receipt-1' }]
    }));

    const received = await queue
      .createConsumer()
      .receive(new AbortController().signal);

    expect(received?.body).toBe('{"order_id":1}');
    expect(callsOf(send, DeleteMessageCommand)).toHaveLength(0);

    await received?.acknowledge();

    expect(callsOf(send, DeleteMessageCommand)[0].input).toEqual({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: 'receipt-1'
    });
  });

  it('returns nothing when the long poll runs out empty', async () => {
    const { queue } = queueWith(async () => ({}));

    expect(
      await queue.createConsumer().receive(new AbortController().signal)
    ).toBeNull();
  });

  it('returns nothing when shutdown aborts the long poll', async () => {
    const controller = new AbortController();
    const { queue } = queueWith(async () => {
      controller.abort();

      throw new Error('aborted');
    });

    expect(await queue.createConsumer().receive(controller.signal)).toBeNull();
  });

  it('rethrows a receive failure while still running', async () => {
    const { queue } = queueWith(async () => {
      throw new Error('throttled');
    });

    await expect(
      queue.createConsumer().receive(new AbortController().signal)
    ).rejects.toThrow('throttled');
  });

  it('sends the confirmation to the confirmed queue', async () => {
    const { send, queue } = queueWith(async () => ({}));
    const message = {
      order_id: 5,
      status: 'COMPLETED' as const,
      completed_at: '2026-11-20T10:00:00.000Z'
    };

    await queue.confirm(message);

    expect(callsOf(send, SendMessageCommand)[0].input).toEqual({
      QueueUrl: CONFIRMED_URL,
      MessageBody: JSON.stringify(message)
    });
  });
});
