import { Command, flags } from '@oclif/command';

import { DynamoDBService } from "../services/dynamodb";

export default class DynamoDBImportCommand extends Command {
  static description = 'describe the command here'

  static examples = [
    `$ aws-utils dynamodb-import`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    sourceFile: flags.string({char: 's', description: 'DynamoDB source table'}),
    destinationTable: flags.string({char: 'd', description: 'DynamoDB destination table'}),
    region: flags.string({char: 'r', description: 'DynamoDB region'})
  }

  static args = [ {name: 'file'} ];

  async run() {
    const { args, flags } = this.parse(DynamoDBImportCommand);

    if (!flags.sourceFile) {
      throw new Error("No source file has been specified. Exiting.");
    }

    if (!flags.destinationTable) {        
      throw new Error("No destination table has been specified. Exiting.");
    }

    const dynamodbService = new DynamoDBService(flags.region);
    try { 
      await dynamodbService.import(flags.sourceFile, flags.destinationTable);
      this.log("Successfully imported items from source file to destination table.");
    } catch (err) {
      throw err;
    }
  }
}
