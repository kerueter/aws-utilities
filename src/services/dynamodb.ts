import * as fs from 'fs';
import { DynamoDB } from "aws-sdk"; 
import { DocumentClient, BatchWriteItemInput, WriteRequest, ScanInput, ScanOutput } from "aws-sdk/clients/dynamodb";

export class DynamoDBService extends DynamoDB.DocumentClient {
  
  constructor() {
    const options = { region: 'eu-central-1' };
    super(options);
  }

  /**
   * 
   * @param sourceTable 
   * @param destinationTable 
   */
  async copy(sourceTable: string, destinationTable: string): Promise<void> {
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
  async import(sourceFile: string, destinationTable: string): Promise<void> {
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
  async export(sourceTable: string, destinationFile: string): Promise<void> {
    try {
      const items = await this.scanAll(sourceTable);
      console.log(JSON.stringify(items));
    } catch (err) {
      throw err;
    }
  }

  /**
   * 
   */
  private async scanAll(table: string): Promise<Array<any>> {
    const SCAN_TIMEOUT = 1000;
    const items = new Array<any>();

    const scanParams: ScanInput = { TableName: table };
    let scanResult: ScanOutput;
    do {
      try {
        scanResult = await this.scan(scanParams).promise();
      } catch (err) {
        throw err;
      }
  
      if (scanResult.Items && scanResult.Items.length > 0) {
        items.push(...scanResult.Items);
      }
      scanParams.ExclusiveStartKey = scanResult.LastEvaluatedKey;

      await this.timeout(SCAN_TIMEOUT);
    } while (scanParams.ExclusiveStartKey);

    return items;
  }

  /**
   * 
   */
  private async batchWriteAll(items: Array<any>, table: string): Promise<void> {
    const BATCH_WRITE_TIMEOUT = 1000;
    const MAX_RETRIES = 5;

    let retries = 0;
    let batchNo = 0;
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
        console.log(`Upload batch ${++batchNo}.`);
        const bwData = await this.batchWrite(bwParams).promise();

        if (bwData && 
          bwData.UnprocessedItems && 
          bwData["UnprocessedItems"][`${table}`] && 
          bwData["UnprocessedItems"][`${table}`].length > 0
        ) {
          items.push(...bwData["UnprocessedItems"][`${table}`]);
          retries++;
        }
        
        await this.timeout(BATCH_WRITE_TIMEOUT);
      } catch (bwErr) {
        throw bwErr;
      }
    }

    console.log(`Uploaded ${batchNo} batches.`);

    if (retries >= MAX_RETRIES) {
      throw new Error(`Exceeded maximum retries while batch writing to ${table}.`);
    }
  }

  /**
   * 
   * @param ms 
   */
  private async timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}