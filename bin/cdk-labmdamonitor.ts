#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkLabmdamonitorStack } from '../lib/cdk-labmdamonitor-stack';

const app = new cdk.App();
new CdkLabmdamonitorStack(app, "CdkLabmdamonitorStack", {
  env: {
    account: "431153255821",
    region: "ap-northeast-2"
  },
});

