import { Command, flags } from '@oclif/command';

import { DynamoDBService } from "../services/dynamodb";

export default class DynamoDBExportCommand extends Command {
  static description = 'describe the command here'

  static examples = [
    `$ aws-utils dynamodb-import`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    sourceTable: flags.string({char: 's', description: 'DynamoDB source table'}),
    destinationFile: flags.string({char: 'd', description: 'DynamoDB destination table'})
  }

  static args = [ {name: 'file'} ];

  async run() {
    const { args, flags } = this.parse(DynamoDBExportCommand);

    if (!flags.sourceTable) {
      throw new Error("No source table has been specified. Exiting.");
    }

    if (!flags.destinationFile) {        
      throw new Error("No destination table has been specified. Exiting.");
    }

    const dynamodbService = new DynamoDBService();
    try { 
      await dynamodbService.export(flags.sourceTable, flags.destinationFile);
      this.log("Successfully exported items from source table to destination file.");
    } catch (err) {
      throw err;
    }
  }
}
