import * as fs from 'fs';
import { DynamoDB } from "aws-sdk"; 
import { DocumentClient, BatchWriteItemInput, WriteRequest, ScanInput, ScanOutput } from "aws-sdk/clients/dynamodb";

import { Service } from "./service";

export class DynamoDBService extends Service {
  private dynamodb: DynamoDB;
  private documentClient: DocumentClient;
  
  constructor(region?: string) {
    const options: { region: string, endpoint?: string } = {
      region: region ? region : 'eu-central-1'
    };
  
    if (options.region === 'localhost') {
      options.endpoint = 'http://localhost:8000';
    }

    super();

    this.dynamodb = new DynamoDB(options);
    this.documentClient = new DocumentClient(options);
  }

  /**
   * 
   */
  async listTables(): Promise<any> {
    const tableNames = new Array<any>();
    const listTablesParams: DynamoDB.ListTablesInput = { Limit: 100 };

    let tableNamesResult: DynamoDB.ListTablesOutput;
    do {
      try {
        tableNamesResult = await this.dynamodb.listTables(listTablesParams).promise();
      } catch (err) {
        throw err;
      }

      if (tableNamesResult.TableNames && tableNamesResult.TableNames.length > 0) {
        tableNames.push(...tableNamesResult.TableNames);
      }
      listTablesParams.ExclusiveStartTableName = tableNamesResult.LastEvaluatedTableName;

    } while (listTablesParams.ExclusiveStartTableName);

    return tableNames;
  }

  /**
   *
   */
  async getItem(table: string, partitionKey: { key: string, value: string }, sortKey?: { key: string, value: string }): Promise<any> {
    const params: DocumentClient.GetItemInput = {
      TableName: table,
      Key: {}
    };

    params.Key[partitionKey.key] = partitionKey.value;
    if (sortKey) {
      params.Key[sortKey.key] = sortKey.value;
    }

    let result: DocumentClient.GetItemOutput;
    try {
      result = await this.documentClient.get(params).promise();
    } catch (err) {
      throw err;
    }

    if (!result.Item) {
      throw new Error("Unable to get item from database.");
    }

    return result.Item;
  }

  /**
   * 
   * @param sourceTable 
   * @param destinationTable 
   * @param timeout 
   */
  async copy(sourceTable: string, destinationTable: string, timeout?: number, filters?: Array<any>): Promise<void> {
    try {
      let items = await this.scanAll(sourceTable);

      if (filters && filters.length > 0) {
        this.log(`Filter items with following filters: ${JSON.stringify(filters)}`);

        items = items.filter(item => {
          for (const filter of filters) {
            if (item[filter.key] && item[filter.key] === filter.value) {
              return true;
            }
          }
          return false;
        });

        this.log(`Items after filtering: ${items.length}`);
      }

      await this.batchWriteAll(items, destinationTable, timeout);
    } catch (err) {
      throw err;
    }
  }

  /**
   * 
   * @param sourceFile 
   * @param destinationTable 
   * @param timeout 
   */
  async import(sourceFile: string, destinationTable: string, timeout?: number): Promise<void> {
    let data;
    try {
      const fileStr = fs.readFileSync(sourceFile).toString();
      data = JSON.parse(fileStr);

      const items = data && Array.isArray(data) && data.length > 0 ? [...data] : [];
      await this.batchWriteAll(items, destinationTable, timeout);
    } catch (err) {
      throw err;
    }
  }

  /**
   * 
   * @param sourceTable 
   * @param destinationFile 
   */
  async export(sourceTable: string, destinationFile: string): Promise<void> {
    try {
      const items = await this.scanAll(sourceTable);
      fs.writeFileSync(destinationFile, JSON.stringify(items));
    } catch (err) {
      throw err;
    }
  }

  /**
   * 
   * @param table 
   */
  private async scanAll(table: string): Promise<Array<any>> {
    const SCAN_TIMEOUT = 1000;
    const items = new Array<any>();

    const scanParams: ScanInput = { TableName: table };
    let scanResult: ScanOutput;
    do {
      try {
        scanResult = await this.documentClient.scan(scanParams).promise();
      } catch (err) {
        throw err;
      }
  
      if (scanResult.Items && scanResult.Items.length > 0) {
        items.push(...scanResult.Items);
      }
      scanParams.ExclusiveStartKey = scanResult.LastEvaluatedKey;

      if (scanParams.ExclusiveStartKey) {
        await this.timeout(SCAN_TIMEOUT);
      }
    } while (scanParams.ExclusiveStartKey);

    this.log(`Scanned ${items.length} items from table ${table}`);

    return items;
  }

  /**
   * 
   * @param items 
   * @param table 
   * @param timeout 
   */
  private async batchWriteAll(items: Array<any>, table: string, timeout: number = 1000): Promise<void> {
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
        this.log(`Upload batch ${++batchNo}.`);
        const bwData = await this.documentClient.batchWrite(bwParams).promise();

        if (bwData && 
          bwData.UnprocessedItems && 
          bwData["UnprocessedItems"][`${table}`] && 
          bwData["UnprocessedItems"][`${table}`].length > 0
        ) {
          items.push(...bwData["UnprocessedItems"][`${table}`]);
          retries++;
        }
        
        await this.timeout(timeout);
      } catch (bwErr) {
        throw bwErr;
      }
    }

    this.log(`Uploaded ${batchNo} batches.`);

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