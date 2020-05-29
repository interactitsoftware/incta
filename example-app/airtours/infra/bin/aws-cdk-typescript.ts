#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { AartsCoreInfraStack } from '../lib/aarts-core-infra-stack';

const app = new cdk.App();

const infraCoreStack = new AartsCoreInfraStack(app, process.env.AARTS_CLIENT_APP || "AartsCoreStack");

app.synth();