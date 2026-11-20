import { GetQueueUrlCommand } from '@aws-sdk/client-sqs';

import type { SQSClient } from '@aws-sdk/client-sqs';

// the URL holds the AWS account id, so it is looked up by name, once.
export class SqsQueueUrl {
  private resolved: Promise<string> | undefined;

  constructor(
    private readonly queueName: string,
    private readonly client: SQSClient
  ) {}

  async get(): Promise<string> {
    this.resolved ??= this.lookup();

    try {
      return await this.resolved;
    } catch (error) {
      this.resolved = undefined;

      throw error;
    }
  }

  private async lookup(): Promise<string> {
    const { QueueUrl } = await this.client.send(
      new GetQueueUrlCommand({ QueueName: this.queueName })
    );

    if (!QueueUrl) {
      throw new Error(`SQS returned no URL for queue ${this.queueName}`);
    }

    return QueueUrl;
  }
}
