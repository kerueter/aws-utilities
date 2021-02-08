aws-utilities
=============

Several utilities for AWS using Node.js and the AWS SDK

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
<!--[![Version](https://img.shields.io/npm/v/aws-utilities.svg)](https://npmjs.org/package/aws-utilities) --->
<!--[![Downloads/week](https://img.shields.io/npm/dw/aws-utilities.svg)](https://npmjs.org/package/aws-utilities) --->
<!--[![License](https://img.shields.io/npm/l/aws-utilities.svg)](https://github.com/kerueter/aws-utilities/blob/master/package.json) --->

<!-- toc -->
# Usage
<!-- usage -->
# Commands

## DynamoDB

`aws-utils dynamodb-list-tables [-r <region>]`

`aws-utils dynamodb-import -s <path to source file> -d <name of destination table> [-r <region>] [-t <timeout>]`

`aws-utils dynamodb-export -s <name of source table> -d <path to destination file> [-r <region>]`

`aws-utils dynamodb-copy -s <name of source table> -d <name of destination table> [-r <region>] [-t <timeout>] [-f <filters as JSON array of key/value pairs>]`

## Cognito

`aws-utils cognito-get-access-token -u <username> -p <passwprd> --userPoolId <Cognito user pool id> --userPoolClient <Cognito user pool client>`
