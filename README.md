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
 * SM_DB_PASS : The lambda create by the cdk will try to use userid/password values of this specified key from the AWS Secrets Manager.

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

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template
# cdk-rdspg-repl-monitor
