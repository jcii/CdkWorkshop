import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as dynamodb from '@aws-cdk/aws-dynamodb';

export interface HitCounterProps {
  /** the function for which we want to count url hits **/
  downstream: lambda.Function;
}

export class HitCounter extends cdk.Construct {

  /** allows accessing the counter function */
  public readonly handler: lambda.Function;

  constructor(scope: cdk.Construct, id: string, props: HitCounterProps) {
    super(scope, id);

    // defines table for the counter
    const table = new dynamodb.Table(this, 'Hits', {
        partitionKey: { name: 'path', type: dynamodb.AttributeType.STRING },
        serverSideEncryption: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY
    });

    // defines the lambda function
    this.handler = new lambda.Function(this, 'HitCounterHandler', {
      runtime: lambda.Runtime.NODEJS_10_X,
      handler: 'hitcounter.handler',
      code: lambda.Code.fromAsset('lambda'),
      environment: {
        // the original hello lambda
        DOWNSTREAM_FUNCTION_NAME: props.downstream.functionName,
        HITS_TABLE_NAME: table.tableName
      },
      tracing: lambda.Tracing.ACTIVE
    });

    // grant the lambda role read/write permissions to our table
    table.grantReadWriteData(this.handler);

    props.downstream.grantInvoke(this.handler);
  }
}