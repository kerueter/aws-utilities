const AWS = require("aws-sdk");
const { exit } = require("process");

async function run() {
  const fs = require('fs');

  if (process.argv.length < 4) {
    exit(-1);
  }

  const sourceTable = process.argv[2];
  const destinationTable = process.argv[3];

  const documentClient = new AWS.DynamoDB.DocumentClient({ region: 'eu-central-1' });

  const scanParams = { TableName: sourceTable };

  let scanResult;
  try {
    scanResult = await documentClient.scan(scanParams).promise();
  } catch (err) {
    console.error(err);
    exit(1);
  }
  
  const items = scanResult && scanResult.Items && scanResult.Items.length > 0 ? [...scanResult.Items] : [];

  while (items.length > 0) {
    const bwParams = { RequestItems: {} };
    bwParams["RequestItems"][`${destinationTable}`] = new Array();

    const ops = items.splice(0, 25);

    ops.forEach(op => {
      bwParams["RequestItems"][`${destinationTable}`].push({
        PutRequest: {
          Item: op
        }
      })
    });
  
    try {
      const bwData = await documentClient.batchWrite(bwParams).promise();
      console.log(bwData);

      if (bwData && 
        bwData.UnprocessedItems && 
        bwData["UnprocessedItems"][`${destinationTable}`] && 
        bwData["UnprocessedItems"][`${destinationTable}`].length > 0
      ) {
        items.push(...bwData["UnprocessedItems"][`${destinationTable}`]);
      }
      setTimeout(() => console.log("Timeout"), 25);
    } catch (bwErr) {
      console.error(bwErr);
    }
  }
}
run();