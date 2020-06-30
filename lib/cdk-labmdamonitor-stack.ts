import * as cdk from '@aws-cdk/core';
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import * as ddb from "@aws-cdk/aws-dynamodb";
import * as sns from "@aws-cdk/aws-sns";
import { Rule, Schedule } from "@aws-cdk/aws-events";
import { LambdaFunction } from "@aws-cdk/aws-events-targets";
import * as sm from "@aws-cdk/aws-secretsmanager";
import * as ssm from "@aws-cdk/aws-ssm";

export interface CronLambdaProps {
  codeReference: lambda.S3Code;
  handlerFullName: string;
  lambdaTimeout: number;
  lambdaMemory: number;
}

export class CdkLabmdamonitorStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here
    const uploadBucketName = this.node.tryGetContext("S3_UPLOAD_BUCKET");
    const vpcId = this.node.tryGetContext("VPC_ID");
    const databaseMasterNodeDns = this.node.tryGetContext("RDS_MASTER_DNS");
    const dbuser = this.node.tryGetContext("DB_USER");
    const smkeydbuser = this.node.tryGetContext("SM_DB_USER");
    const smkeydbpass = this.node.tryGetContext("SM_DB_PASS");
    const ddbtablename = "pgmonitor";
    const snstopicname = "pgmonitorevent";
    const minReplicationCount = "2";
    const maxReplicationLagTime = "60";

    // create bucket for uploading/downloading resources.
    const bucket = new s3.Bucket(this, uploadBucketName);

    // create key/values on Secrete Manager.
    new ssm.StringParameter(this, "SM_DB_USER", {
      stringValue: dbuser,
      parameterName: smkeydbuser,
    });

    // create DDB for monitoring repository
    const replstatusdb = new ddb.Table(this, ddbtablename, {
      partitionKey: {
        name: "connections",
        type: ddb.AttributeType.STRING,
      },
      sortKey: {
        name: "status",
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // create SNS topic for event notification.
    const eventtopic = new sns.Topic(this, snstopicname, {
      displayName: "RDS PG monitor.",
      topicName: snstopicname
    });

    // create lambda function with resources.
    // and register lambda handler to cloudwatch scheduler
    const handler = new lambda.Function(this, "RDSMonitorLambda", {
      runtime: lambda.Runtime.NODEJS_10_X, // So we can use async in widget.js
      code: lambda.Code.asset("resources"),
      handler: "RdsPgMonitor.main",
      vpc:vpcId,
      environment: {
        BUCKET: bucket.bucketName,
        DDB_TABLE_NAME: ddbtablename,
        MIN_REPL_COUNT: minReplicationCount,
        MAX_REPL_LAGTIME: maxReplicationLagTime,
        SNS_TOPIC_ARN: eventtopic.topicArn,
        RDS_MASTER_DNS: databaseMasterNodeDns,
        SM_DB_USER_KEY: smkeydbuser,
        SM_DB_PASS_KEY: smkeydbpass,
      },
    });

    // grant permissions of the resource to the lambda function.
    replstatusdb.grantReadWriteData(handler);
    eventtopic.grantPublish(handler);
    bucket.grantReadWrite(handler); 

    // make scheduler for triggering lambda function.
    new Rule(this, "MonitoringCronRule", {
      enabled: true,
      schedule: Schedule.rate(cdk.Duration.minutes(1)),
      targets: [new LambdaFunction(handler)],
    });

  }
}
