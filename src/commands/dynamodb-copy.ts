import { Command, flags } from '@oclif/command';

import { DynamoDBService } from "../services/dynamodb";

export default class DynamoDBCopyCommand extends Command {
  static description = 'describe the command here'

  static examples = [
    `$ aws-utils dynamodb-copy`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    sourceTable: flags.string({char: 's', description: 'DynamoDB source table'}),
    destinationTable: flags.string({char: 'd', description: 'DynamoDB destination table'}),
    region: flags.string({char: 'r', description: 'DynamoDB region'}),
    timeout: flags.integer({char: 't', description: 'Timeout between batches'}),
    filters: flags.string({char: 'f', description: 'DynamoDB filter for items (as JSON array of key/value pairs'}),
  }

  static args = [ {name: 'file'} ];

  async run() {
    const { args, flags } = this.parse(DynamoDBCopyCommand);

    if (!flags.sourceTable) {
      throw new Error("No source table has been specified. Exiting.");
    }

    if (!flags.destinationTable) {        
      throw new Error("No destination table has been specified. Exiting.");
    }

    const dynamodbService = new DynamoDBService(flags.region);
    try {
      await dynamodbService.copy(flags.sourceTable, flags.destinationTable, flags.timeout, flags.filters && flags.filters.length > 0 ? JSON.parse(flags.filters) : undefined);
      this.log("Successfully copied items from source table to destination table.");
    } catch (err) {
      throw err;
    }
  }
}
