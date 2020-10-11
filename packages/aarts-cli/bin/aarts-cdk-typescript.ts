#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { AartsAllInfraStack } from '../lib/aarts-all-infra-stack';

const app = new cdk.App();

let clientAppName: string, clientAppDirName: string, copyEntireItemToGsis: string
clientAppName = app.node.tryGetContext("clientAppName")
clientAppDirName = app.node.tryGetContext("clientAppDirName")
copyEntireItemToGsis = app.node.tryGetContext("CopyEntireItemToGSIs")

new AartsAllInfraStack(app, clientAppName, {clientAppName, clientAppDirName, copyEntireItemToGsis});

app.synth();