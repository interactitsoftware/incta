#!/usr/bin/env node
import cdk = require('@aws-cdk/core');
import { AartsAllInfraStack } from '../lib/aarts-all-infra-stack';

const app = new cdk.App();

const infraCoreStack = new AartsAllInfraStack(app, process.env.AARTS_CLIENT_APP || "AartsAllStack");

app.synth();