#!/usr/bin/env node

/***
 * Some notes from development
 *
 * If using PrivateLink Endpoints for connecting to S3 or DynamoDB - switch this up to use PrivateLink Gateway Endpoints
 * https://docs.aws.amazon.com/vpc/latest/privatelink/gateway-endpoints.html
 * Which you are not billed for. There are some caveats so review: https://docs.aws.amazon.com/AmazonS3/latest/userguide/privatelink-interface-endpoints.html#types-of-vpc-endpoints-for-s3
 *
 * This application is also not specific to Redshift - you can swap out any IP/Hostname/Port in the provider stack for static values
 * or alternatively use: https://aws.amazon.com/blogs/database/access-amazon-rds-across-vpcs-using-aws-privatelink-and-network-load-balancer/
 * as a model for connecting non-static IP address targets
 *
 * A quick/cheap way to test this would be use two EC2 servers
 * 1 Provider with a setup script to start a simple web server
 * 1 Consumer to curl the Provider
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { EndpointProvider } from './endpoint_provider';
import { EndpointConsumer } from './endpoint_consumer';

const app = new cdk.App();
const env = {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
}

const redshiftHostName = '<insert-redshift-hostname>'
const redshiftPrivateIp = '<insert-redshift-private-ip>'
const redshiftPort = 5439 // 5439 is default - adjust as necessary.

class ProviderStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: cdk.StackProps ) {
        super(scope, id, props);
        /***
         * Create our Endpoint Provider
         *
         * This assumes that a Redshift cluster in a VPC/Private Subnet already exists
         *
         * This will create a Network Load Balancer, and a VPC Endpoint Service
         */
        let endpointProvider = new EndpointProvider(this, 'endpoint-provider', {
            databaseAZ: "",
            databaseDomainName: redshiftHostName,
            databasePrivateIpAddress: redshiftPrivateIp,
            databasePort: redshiftPort,
            vpcId: "<insert-vpc-id>",
        });

        new cdk.CfnOutput(this, 'vpc-endpoint-service-name', {
            value: endpointProvider.VPCEndpointServiceName,
            exportName: 'vpc-endpoint-service-name'
        })
    }
}

interface ConsumerStackProps extends cdk.StackProps {
    vpcEndpointServiceName: string
}

class ConsumerStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props: ConsumerStackProps) {
        super(scope, id, props);

        /***
         * Create Endpoint Consumer
         * This assumes that a VPC already exists for your consumer application
         *
         * This will deploy a VPC Endpoint into the referenced VPC and a Hosted Zone with an A Record.
         */
        let endpointConsumer = new EndpointConsumer(this, 'endpoint-consumer', {
            vpcId: '<insert-vpc-id>',
            vpcEndpointName: redshiftHostName,
            vpcEndpointPort:redshiftPort,
            vpcEndpointServiceName: props.vpcEndpointServiceName
        })
    }
}

// Create the provider stack
let providerStack = new ProviderStack(app, 'provider', {env: env})


// create the consumer stack - importing our VPC Service Name - you can hardcode this instead if your stacks are not deployed together.
let consumerStack = new ConsumerStack(app, 'consumer', {
    env: env,
    vpcEndpointServiceName: cdk.Fn.importValue('vpc-endpoint-service-name')
});