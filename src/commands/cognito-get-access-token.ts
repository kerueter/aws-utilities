import { Command, flags } from '@oclif/command';

import { CognitoService } from "../services/cognito";

export default class CognitoGetAccessTokenCommand extends Command {
  static description = 'describe the command here'

  static examples = [
    `$ aws-utils dynamodb-copy`,
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    username: flags.string({char: 'u', description: 'Username'}),
    password: flags.string({char: 'p', description: 'Password'}),
    userPoolId: flags.string({description: 'Cognito user pool ID'}),
    userPoolClient: flags.string({description: 'Cognito user pool client'})
  }

  async run() {
    const { args, flags } = this.parse(CognitoGetAccessTokenCommand);

    if (!flags.username) {
      throw new Error("No username has been specified. Exiting.");
    }

    if (!flags.password) {        
      throw new Error("No password has been specified. Exiting.");
    }

    if (!flags.userPoolId) {        
      throw new Error("No user pool ID has been specified. Exiting.");
    }

    if (!flags.userPoolClient) {    
      console.log(flags.userPoolClient);    
      throw new Error("No user pool client has been specified. Exiting.");
    }

    const cognitoService = new CognitoService(flags.userPoolId, flags.userPoolClient);
    try { 
      const tokens = await cognitoService.getAccessToken(flags.username, flags.password);
      this.log(tokens);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
