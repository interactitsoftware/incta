#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { AartsAllInfraStack } from '../lib/aarts-all-infra-stack';
import { sep } from 'path';

const clientAppDirName = __dirname.split(sep).reverse()[2]
const clientAppName = process.env.CLIENT_APP_NAME || clientAppDirName

const app = new cdk.App();

new AartsAllInfraStack(app, clientAppName);

app.synth();