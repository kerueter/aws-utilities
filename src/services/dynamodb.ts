import * as fs from 'fs';
import { DynamoDB } from "aws-sdk"; 
import { DocumentClient, BatchWriteItemInput, WriteRequest } from "aws-sdk/clients/dynamodb";

export class DynamoDBService extends DynamoDB.DocumentClient {
  
  constructor() {
    super();
  }

  /**
   * 
   * @param sourceTable 
   * @param destinationTable 
   */
  async copy(sourceTable: string, destinationTable: string): Promise<any> {
    const scanParams = { TableName: sourceTable };

    let scanResult;
    try {
      scanResult = await this.scan(scanParams).promise();

      const items = scanResult && scanResult.Items && scanResult.Items.length > 0 ? [...scanResult.Items] : [];
      await this.batchWriteAll(items, destinationTable);
    } catch (err) {
      throw err;
    }
  }

  /**
   * 
   */
  async import(sourceFile: string, destinationTable: string): Promise<any> {
    let data;
    try {
      const fileStr = fs.readFileSync(sourceFile).toString();
      data = JSON.parse(fileStr);

      const items = data && Array.isArray(data) && data.length > 0 ? [...data] : [];
      await this.batchWriteAll(items, destinationTable);
    } catch (err) {
      throw err;
    }
  }

  /**
   * 
   */
  private async batchWriteAll(items: Array<any>, table: string): Promise<void> {
    const BATCH_WRITE_TIMEOUT = 1000;
    const MAX_RETRIES = 5;

    let retries = 0;
    while (items.length > 0 && retries < MAX_RETRIES) {
      const bwParams: BatchWriteItemInput = { RequestItems: {} };
      bwParams["RequestItems"][`${table}`] = new Array<WriteRequest>();

      const ops = items.splice(0, 25);

      ops.forEach(op => {
        bwParams["RequestItems"][`${table}`].push({
          PutRequest: {
            Item: op
          }
        })
      });
    
      try {
        const bwData = await this.batchWrite(bwParams).promise();

        if (bwData && 
          bwData.UnprocessedItems && 
          bwData["UnprocessedItems"][`${table}`] && 
          bwData["UnprocessedItems"][`${table}`].length > 0
        ) {
          items.push(...bwData["UnprocessedItems"][`${table}`]);
          retries++;
        }
        setTimeout(() => console.log("Timeout..."), BATCH_WRITE_TIMEOUT);
      } catch (bwErr) {
        throw bwErr;
      }
    }
  }
}