import { it, vi, expect, describe } from 'vitest';
import {
  GetQueueUrlCommand,
  SendMessageCommand,
  GetQueueAttributesCommand
} from '@aws-sdk/client-sqs';

import { SqsOrderQueue } from '@/core/queue/sqs-order-queue';

import type { SQSClient } from '@aws-sdk/client-sqs';

const QUEUE_URL =
  'https://sqs.ap-southeast-1.amazonaws.com/123456789012/orders';

// answers the URL lookup, then whatever the test expects for its own call.
function clientWith(answer: unknown): {
  send: ReturnType<typeof vi.fn>;
  queue: SqsOrderQueue;
} {
  const send = vi.fn(async (command: object) => {
    if (command instanceof GetQueueUrlCommand) {
      return { QueueUrl: QUEUE_URL };
    }

    if (answer instanceof Error) {
      throw answer;
    }

    return answer;
  });

  return {
    send,
    queue: new SqsOrderQueue('orders', { send } as unknown as SQSClient)
  };
}

describe('SqsOrderQueue', () => {
  it('sends the message body to the orders queue', async () => {
    const { send, queue } = clientWith({});

    await queue.push('{"order_id":42}');

    const command = send.mock.calls[1][0] as SendMessageCommand;

    expect(command).toBeInstanceOf(SendMessageCommand);
    expect(command.input).toEqual({
      QueueUrl: QUEUE_URL,
      MessageBody: '{"order_id":42}'
    });
  });

  it('looks the queue URL up by name once', async () => {
    const { send, queue } = clientWith({});

    await queue.push('a');
    await queue.push('b');

    const lookups = send.mock.calls.filter(
      ([command]) => command instanceof GetQueueUrlCommand
    );

    expect(lookups).toHaveLength(1);
    expect((lookups[0][0] as GetQueueUrlCommand).input).toEqual({
      QueueName: 'orders'
    });
  });

  it('reads the depth from ApproximateNumberOfMessages', async () => {
    const { send, queue } = clientWith({
      Attributes: { ApproximateNumberOfMessages: '12' }
    });

    expect(await queue.depth()).toBe(12);

    const command = send.mock.calls[1][0] as GetQueueAttributesCommand;

    expect(command.input.AttributeNames).toEqual([
      'ApproximateNumberOfMessages'
    ]);
  });

  it('fails when the depth attribute is missing', async () => {
    const { queue } = clientWith({});

    await expect(queue.depth()).rejects.toThrow('queue depth missing');
  });

  it('reports ready once the queue attributes can be read', async () => {
    const { send, queue } = clientWith({});

    await expect(queue.ping()).resolves.toBeUndefined();
    expect(send.mock.calls[1][0]).toBeInstanceOf(GetQueueAttributesCommand);
  });

  it('reports not ready when SQS rejects the call', async () => {
    const { queue } = clientWith(new Error('access denied'));

    await expect(queue.ping()).rejects.toThrow('access denied');
  });

  it('looks the URL up again after a failed lookup', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValue({ QueueUrl: QUEUE_URL, Attributes: {} });
    const queue = new SqsOrderQueue('orders', { send } as unknown as SQSClient);

    await expect(queue.ping()).rejects.toThrow('network down');
    await expect(queue.ping()).resolves.toBeUndefined();
  });
});
