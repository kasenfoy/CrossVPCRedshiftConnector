import * as cdk from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {
  BaseNetworkListenerProps,
  NetworkLoadBalancer,
  NetworkTargetGroup,
  Protocol
} from "aws-cdk-lib/aws-elasticloadbalancingv2";
import {IpTarget} from "aws-cdk-lib/aws-elasticloadbalancingv2-targets";
import {Vpc, VpcEndpointService} from "aws-cdk-lib/aws-ec2";

/***
 * This Provider Stack is used to generate the connection's necessary for the Consumer stack to connect to your private Database.
 * It works by creating a Network Load Balancer and VPC Endpoint Service that route to your Database/host in a Private Subnet
 *
 * The endpoint Service is how consumers will Connect to this application by
 * deploying their own VPC Endpoint connect to this VPC Endpoint Service.
 *
 * Note that as the application is currently set up it requires manual approval on VPC Endpoint connection requsts.
 * Please see the VPC Endpoint Service declaration below for modifying this behavior.
 */


export interface EndpointProviderProperties extends cdk.StackProps{
  vpcId: string,
  databasePort: number,
  databasePrivateIpAddress: string,
  // Need to know for SSL purposes. This will be used to create an endpoint under this DNS name in your other accounts.
  databaseDomainName: string,
  databaseAZ: string

}

export class EndpointProvider extends Construct {

  public readonly VPCEndpointServiceName: string

  constructor(scope: Construct, id: string, props: EndpointProviderProperties) {
    super(scope, id);

    let vpc = Vpc.fromLookup(this, 'pre-existing-vpc', {
      vpcId: props.vpcId
    });

    let nlb = new NetworkLoadBalancer(this, 'network-load-balancer', {
      vpc: vpc,
      crossZoneEnabled: true, // Disable this if you don't need Cross Zone support.
      internetFacing: false // This should stay false - our NLB is only for routing traffic inside the VPC.
    });

    let nlbListenerProps: BaseNetworkListenerProps = {
      port: props.databasePort,
      protocol: Protocol.TCP // Adjust as necessary - but this is set up to be secure when used with SSL.
    };
    let nlbListener = nlb.addListener('network-load-balancer-listener', nlbListenerProps);

    let nlbTarget = new IpTarget(
        props.databasePrivateIpAddress,
        props.databasePort,
        props.databaseAZ,
    );

    let targetGroup = new NetworkTargetGroup(this, 'network-load-balancer-target-group', {
      vpc: vpc,
      port: props.databasePort,
      protocol: nlbListenerProps.protocol,
      targets: [ nlbTarget ]
    })

    nlbListener.addTargetGroups('network-load-balancer-target-group', targetGroup);

    let vpcEndpointService = new VpcEndpointService(this, 'database-vpc-endpoint-service', {
      vpcEndpointServiceLoadBalancers: [ nlb ],

      // Comment this out if you prefer to lock permissions down via 'allowedPrincipals'
      // allowedPrincipals is better for automation if you know who can access this.
      // As it is currently set up - anyone can request access, but you must manually approve those requests.
      acceptanceRequired: true,

      // Uncomment the below and add your Principals to restrict who can access this.
      // allowedPrincipals: []
    })

    // Assign the VPC Endpoint Service Name to a public readonly variable,
    // so we can access it from our EndpointConsumer class.
    // Alternatively if you want hard links to this stack you can create cfnOutputs/Exports
    this.VPCEndpointServiceName = vpcEndpointService.vpcEndpointServiceName;
  }
}
