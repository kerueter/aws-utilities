import { Command, flags } from '@oclif/command';

import { DynamoDBService } from "../services/dynamodb";

export default class DynamoDBGetItemCommand extends Command {
  static description = 'Get a single item from a table'

  static examples = [
    `$ aws-utils dynamodb-get-item`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    region: flags.string({char: 'r', description: 'DynamoDB region'}),
    table: flags.string({char: 't', description: 'DynamoDB table to get item from'}),
    partitionKey: flags.string({char: 'p', description: 'DynamoDB key of the item to get'}),
    sortKey: flags.string({char: 's', description: 'DynamoDB key of the item to get'})
  }

  static args = [ {name: 'file'} ];

  async run() {
    const { args, flags } = this.parse(DynamoDBGetItemCommand);

    if (!flags.table) {
      throw new Error("No table has been specified. Exiting.");
    }

    if (!flags.partitionKey) {
      throw new Error("No partition key has been specified. Exiting.");
    }

    let partitionKey: { key: string, value: string };
    let sortKey: { key: string, value: string } | undefined;

    try {
      partitionKey = JSON.parse(flags.partitionKey);

      if (!partitionKey.key || !partitionKey.value) {
        throw new Error("Partition key is not a key value pair.");
      }

      if (flags.sortKey) {
        sortKey = JSON.parse(flags.sortKey);

        if (!sortKey || !sortKey.key || !sortKey.value) {
          throw new Error("Sort key is not a key value pair.");
        }
      }
    } catch (err) {
      throw err;
    }

    const dynamodbService = new DynamoDBService(flags.region);
    try {
      const item = await dynamodbService.getItem(flags.table, partitionKey, sortKey);
      console.log(JSON.stringify(item, undefined, 2));
    } catch (err) {
      throw err;
    }
  }
}
