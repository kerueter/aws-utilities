import { Command, flags } from '@oclif/command';

import { DynamoDBService } from "../services/dynamodb";

export default class DynamoDBExportCommand extends Command {
  static description = 'Lists all tables of set region'

  static examples = [
    `$ aws-utils dynamodb-list-tables`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    region: flags.string({char: 'r', description: 'DynamoDB region'})
  }

  static args = [ {name: 'file'} ];

  async run() {
    const { args, flags } = this.parse(DynamoDBExportCommand);

    const dynamodbService = new DynamoDBService(flags.region);
    try {
      const tables = await dynamodbService.listTables();
      console.table(tables);
    } catch (err) {
      throw err;
    }
  }
}
