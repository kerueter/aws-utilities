import {
	CognitoUserPool,
  CognitoUser,
  AuthenticationDetails
} from 'amazon-cognito-identity-js';

import { Service } from './service';

export class CognitoService extends Service {
  private userPoolId: string;
  private userPoolClient: string;
  
  constructor(userPoolId: string, userPoolClient: string) {
    super();

    this.userPoolId = userPoolId;
    this.userPoolClient = userPoolClient;
  }

  /**
   * 
   * @param username 
   * @param password 
   */
  async getAccessToken(username: string, password: string): Promise<any> {
    const authenticationData = {
      Username: username,
      Password: password,
    };
    const authenticationDetails = new AuthenticationDetails(authenticationData);
    const poolData = {
      UserPoolId: this.userPoolId,
      ClientId: this.userPoolClient
    };

    const userPool = new CognitoUserPool(poolData);
    const userData = {
      Username: username,
      Pool: userPool,
    };

    const cognitoUser = new CognitoUser(userData);
    return new Promise<string>((resolve, reject) => {
      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          const accessToken = result.getAccessToken().getJwtToken();
          resolve(accessToken);
        },
        onFailure: (err) => {
          reject(err.message || JSON.stringify(err));
        }
      });
    });
  }
}