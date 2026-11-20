import {
  SendMessageCommand,
  GetQueueAttributesCommand
} from '@aws-sdk/client-sqs';

import { SqsQueueUrl } from '@/core/queue/sqs-queue-url';

import type { SQSClient } from '@aws-sdk/client-sqs';
import type { OrderQueue } from '@/core/queue/order-queue';
import type { OnApplicationShutdown } from '@nestjs/common';

export class SqsOrderQueue implements OrderQueue, OnApplicationShutdown {
  readonly system = 'aws_sqs';
  private readonly queueUrl: SqsQueueUrl;

  constructor(
    readonly name: string,
    private readonly client: SQSClient
  ) {
    this.queueUrl = new SqsQueueUrl(name, client);
  }

  async push(body: string): Promise<void> {
    await this.client.send(
      new SendMessageCommand({
        QueueUrl: await this.queueUrl.get(),
        MessageBody: body
      })
    );
  }

  async depth(): Promise<number> {
    const { Attributes } = await this.client.send(
      new GetQueueAttributesCommand({
        QueueUrl: await this.queueUrl.get(),
        AttributeNames: ['ApproximateNumberOfMessages']
      })
    );
    const depth = Number(Attributes?.ApproximateNumberOfMessages);

    if (!Number.isInteger(depth)) {
      throw new Error('queue depth missing from the SQS queue attributes');
    }

    return depth;
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
