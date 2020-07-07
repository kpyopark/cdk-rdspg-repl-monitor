# RDS Postgres Replication Status Monitoring CDK Example

This cdk project includes monitoring node script to monitor RDS Postgres Replication status. 
PG_REPLICATION_STAT table shows the current status of replication slaves - which one is lagged, how many slaves are connected.

Cloud Watch schedule Event(1 min) triggers Node.JS lambda function for every minutes and lambda function check current replication status
If it find some abnormal status, it will fire SNS message to the topic 'pgmonitorevent' and write the current status into dynamodb table 'pgmonitor'

 * You can modify SNS topic name by setting a value in the field 'SNS_TOPIC_NAME' of cdk.json.
 * You can modify DDB Table name by setting a value in the field 'DDB_TABLE_NAME' of cdk.json

# cdk.json

This cdk has some environment variables to support various environments. All environment you can set up reside in the cdk.json

 * S3_UPLOAD_BUCKET : the lambda source will be pacakged and uploaded into this s3 bucket.
 * VPC_ID : The lambda created by the cdk will be positioned in the target VPC.
 * RDS_MASTER_DNS : The lambda created by the cdk will try to connect this specified DNS.
 * LAMBDA_SUBNETS : This stack will deploy Lambda Function on the subnet of the specified VPC. This values indicates the target subnet ids.
 * RDS_MASTER_DNS : RDS endpoint to be monitored. 
 * SM_DB_PASS_ARN : secret ARN which contains DB connection info - ex: arn:aws:secretsmanager:ap-northeast-2:xxxxxxx:secret:test/db_passkey-xxxx
 * DB_NAME : rds database name - ex: dev

# bin/cdk-labmdamonitor.ts 

CDK doesn't allow the full functionality of aws-secretsmanager / aws-vpc without specifying AWS Account ID in the CDK applicatiton. 
So you should modify bin/cdk-labmdamonitor.ts file to specify your AWS account id. 

```
new CdkLabmdamonitorStack(app, "CdkLabmdamonitorStack", {
  env: {
    account: "<your account id>",
    region: "ap-northeast-2"
  },
});
```

# Before to launch

This lambda function uses AWS Secrets Manager, so  you must create a secret contains the dbuser / password information of RDS instance such like below. 
```
$ aws secretsmanager create-secret --name 'test/db_passkey' --secret-string "[{'username':'testuser', 'password':'1q2w3e4r%'}]"
```
If you use 'test/db_passkey' as a value of SM_DB_PASS, you should set the same value in the cdk.json

```
{
  "app": "npx ts-node bin/cdk-labmdamonitor.ts",
  "context": {
    "@aws-cdk/core:enableStackNameDuplicates": "true",
    "aws-cdk:enableDiffNoFail": "true",
    "S3_UPLOAD_BUCKET" : "cdk-jslambda-xxxxxxx",
    "VPC_ID" : "vpc-xxxxxxxx",
    "RDS_MASTER_DNS" : "rdstest.xxxxxxxxxx.ap-northeast-2.rds.amazonaws.com",
    "SM_DB_PASS" : "test/db_passkey",
  }
}
```

# Prerequsite. 

This stack uses dockerizaing so you should docker (docker desktop on Windows) on your build environment.

1. Install Node
2. Install npm
3. Install aws-cdk

# Installation

$ git clone https://github.com/kpyopark/cdk-rdspg-repl-monitor.git
$ cd cdk-rdspg-repl-monitor
$ npm update
$ # modify cdk.json
$ # modify bin/cdk-lambdamonitor.ts
$ cdk deploy

