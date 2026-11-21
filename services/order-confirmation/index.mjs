import {
  EventBridgeClient,
  PutEventsCommand
} from '@aws-sdk/client-eventbridge';

const client = new EventBridgeClient({});

const publish = async (record) => {
  const detail = JSON.parse(record.body);
  const result = await client.send(
    new PutEventsCommand({
      Entries: [
        {
          Source: 'shoplite.orders',
          DetailType: 'OrderConfirmed',
          Detail: JSON.stringify(detail)
        }
      ]
    })
  );
  if (result.FailedEntryCount > 0) {
    throw new Error(result.Entries[0].ErrorMessage);
  }
  console.log(
    JSON.stringify({
      event: 'OrderConfirmed',
      messageId: record.messageId,
      detail
    })
  );
};

export const handler = async (event) => {
  const outcomes = await Promise.allSettled(event.Records.map(publish));
  const batchItemFailures = [];
  outcomes.forEach((outcome, index) => {
    if (outcome.status === 'rejected') {
      const { messageId } = event.Records[index];
      console.error(
        JSON.stringify({
          event: 'PublishFailed',
          messageId,
          error: String(outcome.reason)
        })
      );
      batchItemFailures.push({ itemIdentifier: messageId });
    }
  });
  return { batchItemFailures };
};
