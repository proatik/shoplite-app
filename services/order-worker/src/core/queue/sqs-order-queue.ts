import {
  SendMessageCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand,
  GetQueueAttributesCommand
} from '@aws-sdk/client-sqs';

import { SqsQueueUrl } from '@/core/queue/sqs-queue-url';
import { SQS_WAIT_SECONDS } from '@/core/queue/order-queue.constants';

import type { SQSClient } from '@aws-sdk/client-sqs';
import type { OnApplicationShutdown } from '@nestjs/common';
import type { OrderConfirmedMessage } from '@shoplite/shared';
import type {
  OrderQueue,
  OrderConsumer,
  ReceivedOrder
} from '@/core/queue/order-queue';

class SqsOrderConsumer implements OrderConsumer {
  constructor(
    private readonly queueUrl: SqsQueueUrl,
    private readonly client: SQSClient
  ) {}

  async receive(signal: AbortSignal): Promise<ReceivedOrder | null> {
    const command = new ReceiveMessageCommand({
      QueueUrl: await this.queueUrl.get(),
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: SQS_WAIT_SECONDS
    });

    try {
      const { Messages } = await this.client.send(command, {
        abortSignal: signal
      });
      const message = Messages?.[0];

      if (!message?.ReceiptHandle) {
        return null;
      }

      const receiptHandle = message.ReceiptHandle;

      return {
        body: message.Body ?? '',
        acknowledge: async () => await this.delete(receiptHandle)
      };
    } catch (error) {
      // shutdown aborts the long poll on purpose.
      if (signal.aborted) {
        return null;
      }

      throw error;
    }
  }

  // the client is shared and closed with the queue.
  async close(): Promise<void> {
    await Promise.resolve();
  }

  private async delete(receiptHandle: string): Promise<void> {
    await this.client.send(
      new DeleteMessageCommand({
        QueueUrl: await this.queueUrl.get(),
        ReceiptHandle: receiptHandle
      })
    );
  }
}

export class SqsOrderQueue implements OrderQueue, OnApplicationShutdown {
  readonly system = 'aws_sqs';
  private readonly queueUrl: SqsQueueUrl;
  private readonly confirmedQueueUrl: SqsQueueUrl;

  constructor(
    readonly name: string,
    private readonly client: SQSClient,
    confirmedQueueName: string
  ) {
    this.queueUrl = new SqsQueueUrl(name, client);
    this.confirmedQueueUrl = new SqsQueueUrl(confirmedQueueName, client);
  }

  createConsumer(): OrderConsumer {
    return new SqsOrderConsumer(this.queueUrl, this.client);
  }

  async confirm(message: OrderConfirmedMessage): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: await this.confirmedQueueUrl.get(),
        MessageBody: JSON.stringify(message)
      })
    );
  }

  async ping(): Promise<void> {
    await this.client.send(
      new GetQueueAttributesCommand({
        QueueUrl: await this.queueUrl.get(),
        AttributeNames: ['QueueArn']
      })
    );
  }

  onApplicationShutdown(): void {
    this.client.destroy();
  }
}
