import {Construct} from "constructs";
import {Vpc, InterfaceVpcEndpoint, InterfaceVpcEndpointService} from "aws-cdk-lib/aws-ec2";
import {HostedZone, ARecord, RecordTarget} from "aws-cdk-lib/aws-route53";
import {InterfaceVpcEndpointTarget} from "aws-cdk-lib/aws-route53-targets";

export interface EndpointConsumerProperties {
    /***
     * This is the endpoint name that will be created.
     *
     * Important Note - to appropriately support SSL this must be the same name as your provider's endpoint.
     * For example Redshift has an Endpoint like <<cluster-name>>.<<aws-generated-string>>.<<region>>.redshift.amazonaws.com
     * If you want SSL you will need to copy that Endpoint name and pass it in here.
     */
    vpcEndpointName: string

    /***
     * The port you will use to connect to your VPC Endpoint
     * this is fairly arbitrary but use the same port as the target (database in this case) of
     * our EndpointProvider class to avoid confusion.
     */
    vpcEndpointPort: number

    /***
     * The VPC Endpoint Service name is a string that our EndpointProvider class creates
     * We use this to tell our VPC Endpoint to connect to our VPC Endpoint Service (Note they are two different things)
     * If you're using this application to connect over PrivateLinks to different AWS Services you can reference
     * more about VPC Endpoint Service Names from: https://docs.aws.amazon.com/vpc/latest/privatelink/aws-services-privatelink-support.html
     */
    vpcEndpointServiceName: string

    /***
     * The VPC ID that this VPC endpoint will be deployed to.
     */
    vpcId: string

}

export class EndpointConsumer extends Construct {
    constructor(scope: Construct, id: string, props: EndpointConsumerProperties) {
        super(scope, id);

        // Import our VPC
        const vpc = Vpc.fromLookup(this, 'pre-existing-vpc', {vpcId: props.vpcId})

        // Create the VPC Endpoint
        let vpcEndpoint = new InterfaceVpcEndpoint(this, 'vpc-endpoint', {
            service: new InterfaceVpcEndpointService(
                props.vpcEndpointServiceName,
                props.vpcEndpointPort
            ),
            vpc: vpc
        })

        // Create the Route53 resources (Private hosted zone and A record)
        let hostedZone = new HostedZone(this, 'vpc-endpoint-hosted-zone', {
            zoneName: props.vpcEndpointName,
            vpcs: [ vpc ]
        })

        let aRecord = new ARecord(this, 'a-record', {
            target: RecordTarget.fromAlias(new InterfaceVpcEndpointTarget(vpcEndpoint)),
            zone: hostedZone,
            recordName: props.vpcEndpointName
        })
    }
}