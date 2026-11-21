export abstract class OrderQueue {
  abstract readonly system: 'redis' | 'aws_sqs';
  abstract readonly name: string;
  abstract push(body: string): Promise<void>;
  abstract depth(): Promise<number>;
  abstract ping(): Promise<void>;
}
