// import {Construct} from "constructs";
// import {SubnetType, Vpc} from "aws-cdk-lib/aws-ec2";
// import {Function} from "aws-cdk-lib/aws-lambda";
//
//
// export class SampleEndpointConsumerLambda extends Construct {
//     constructor(scope: Construct, id: string, props?: {}) {
//         super(scope, id);
//
//         // Private VPC
//         let vpc = new Vpc(this, 'private-vpc', {
//             subnetConfiguration: [{
//                 name: "private-subnet",
//                 subnetType: SubnetType.PRIVATE_WITH_EGRESS,
//                 cidrMask: 24,
//             }],
//             // Keeping costs down
//             maxAzs: 1,
//             natGateways: 1
//         });
//
//
//     }
// }