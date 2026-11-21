import type { OrderConfirmedMessage } from '@shoplite/shared';

export interface ReceivedOrder {
  body: string;
  acknowledge(): Promise<void>;
}

export interface OrderConsumer {
  receive(signal: AbortSignal): Promise<ReceivedOrder | null>;
  close(): Promise<void>;
}

export abstract class OrderQueue {
  abstract readonly system: 'redis' | 'aws_sqs';
  abstract readonly name: string;
  abstract createConsumer(): OrderConsumer;
  abstract confirm(message: OrderConfirmedMessage): Promise<void>;
  abstract ping(): Promise<void>;
}
