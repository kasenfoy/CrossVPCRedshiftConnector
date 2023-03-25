// /***
//  * This sample sets up a VPC and an RDS Database in a Private Subnet.
//  */
// import {Construct} from "constructs";
// import {InstanceClass, InstanceSize, InstanceType, SubnetType, Vpc} from "aws-cdk-lib/aws-ec2";
// import {Credentials, DatabaseCluster, DatabaseClusterEngine} from "aws-cdk-lib/aws-rds";
// import {Secret} from "aws-cdk-lib/aws-secretsmanager";
//
// export class SampleEndpointProviderDatabase extends Construct {
//
//     public readonly vpc: Vpc;
//     public readonly rdsDatabaseCluster: DatabaseCluster
//
//     /***
//      * Make this more secure in your examples - public readable credentials are not very secure.
//      */
//     public readonly rdsSecret: Secret;
//
//     constructor(scope: Construct, id: string, props?: {}) {
//         super(scope, id);
//
//         // Private VPC
//         this.vpc = new Vpc(this, 'private-vpc', {
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
//         // Generated Secret
//         this.rdsSecret = new Secret(this, 'random-secret');
//
//         // Database in private subnet
//         this.rdsDatabaseCluster = new DatabaseCluster(this, 'instance', {
//             engine: DatabaseClusterEngine.AURORA_MYSQL,
//             credentials: Credentials.fromSecret(this.rdsSecret),
//             instanceProps: {
//                 instanceType: InstanceType.of(InstanceClass.BURSTABLE2, InstanceSize.NANO),
//                 vpcSubnets: {
//                     subnetType: SubnetType.PRIVATE_WITH_EGRESS
//                 },
//                 vpc: this.vpc
//             }
//         });
//     }
// }