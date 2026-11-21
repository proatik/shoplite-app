import { setTimeout as sleep } from 'node:timers/promises';

import { it, vi, expect, describe, beforeEach } from 'vitest';
import {
  GetQueueUrlCommand,
  SendMessageCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand
} from '@aws-sdk/client-sqs';

import { SqsOrderQueue } from '@/core/queue/sqs-order-queue';
import { ProcessOrderProcessor } from '@/jobs/process-order/process-order.processor';

import type { SQSClient } from '@aws-sdk/client-sqs';
import type { MetricsService } from '@/core/metrics/metrics.service';
import type { ProcessOrderService } from '@/jobs/process-order/process-order.service';

const processor = { process: vi.fn() };
const metrics = { recordOrder: vi.fn() };

// hands out each body once, then empty polls; records the other commands.
function consumerWith(bodies: string[]): {
  consumer: ProcessOrderProcessor;
  sent: object[];
} {
  const sent: object[] = [];
  const send = vi.fn(async (command: object) => {
    if (command instanceof GetQueueUrlCommand) {
      return { QueueUrl: `https://sqs.x/1/${command.input.QueueName}` };
    }

    if (command instanceof ReceiveMessageCommand) {
      const body = bodies.shift();

      if (body === undefined) {
        await sleep(5);

        return {};
      }

      return { Messages: [{ Body: body, ReceiptHandle: `receipt-${body}` }] };
    }

    sent.push(command);

    return {};
  });
  const queue = new SqsOrderQueue(
    'orders',
    { send } as unknown as SQSClient,
    'confirmed'
  );

  return {
    consumer: new ProcessOrderProcessor(
      queue,
      metrics as unknown as MetricsService,
      processor as unknown as ProcessOrderService
    ),
    sent
  };
}

async function runOnce(consumer: ProcessOrderProcessor): Promise<void> {
  consumer.onApplicationBootstrap();
  await vi.waitFor(() => expect(processor.process).toHaveBeenCalled());
  await consumer.beforeApplicationShutdown();
}

function commandsOf<T extends object>(
  sent: object[],
  type: new (...args: never[]) => T
): T[] {
  return sent.filter((command): command is T => command instanceof type);
}

describe('ProcessOrderProcessor with SQS', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('deletes a processed message and confirms a completed order', async () => {
    processor.process.mockResolvedValue('COMPLETED');
    const { consumer, sent } = consumerWith(['{"order_id":42}']);

    await runOnce(consumer);

    expect(commandsOf(sent, DeleteMessageCommand)[0].input).toEqual({
      QueueUrl: 'https://sqs.x/1/orders',
      ReceiptHandle: 'receipt-{"order_id":42}'
    });

    const confirmed = commandsOf(sent, SendMessageCommand);

    expect(confirmed).toHaveLength(1);
    expect(confirmed[0].input.QueueUrl).toBe('https://sqs.x/1/confirmed');
    expect(JSON.parse(confirmed[0].input.MessageBody ?? '')).toEqual({
      order_id: 42,
      status: 'COMPLETED',
      completed_at: expect.any(String)
    });
  });

  it('deletes a FAILED order without confirming it', async () => {
    processor.process.mockResolvedValue('FAILED');
    const { consumer, sent } = consumerWith(['{"order_id":7}']);

    await runOnce(consumer);

    expect(commandsOf(sent, DeleteMessageCommand)).toHaveLength(1);
    expect(commandsOf(sent, SendMessageCommand)).toHaveLength(0);
  });

  it('deletes a malformed message without processing it', async () => {
    const { consumer, sent } = consumerWith(['not json']);

    consumer.onApplicationBootstrap();
    await vi.waitFor(() =>
      expect(commandsOf(sent, DeleteMessageCommand)).toHaveLength(1)
    );
    await consumer.beforeApplicationShutdown();

    expect(processor.process).not.toHaveBeenCalled();
  });

  it('keeps a message whose processing throws, so SQS redelivers it', async () => {
    processor.process.mockRejectedValue(new Error('database down'));
    const { consumer, sent } = consumerWith(['{"order_id":9}']);

    await runOnce(consumer);

    expect(commandsOf(sent, DeleteMessageCommand)).toHaveLength(0);
    expect(commandsOf(sent, SendMessageCommand)).toHaveLength(0);
    expect(metrics.recordOrder).toHaveBeenCalledWith(
      'error',
      expect.any(Number),
      expect.any(String)
    );
  });
});
