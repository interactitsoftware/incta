#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { AartsAllInfraStack } from '../lib/aarts-all-infra-stack';

const app = new cdk.App();

let clientAppName: string, clientAppDirName: string
clientAppName = app.node.tryGetContext("clientAppName")
clientAppDirName = app.node.tryGetContext("clientAppDirName")

new AartsAllInfraStack(app, clientAppName, {clientAppName, clientAppDirName});

app.synth();