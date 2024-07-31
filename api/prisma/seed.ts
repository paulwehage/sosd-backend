import {
  PrismaClient,
  SdlcStepName,
  DataType,
  InfrastructureElementType,
  CicdStepName,
  IntegrationSubStepName,
  DeploymentSubStepName,
} from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  // Disable foreign key checks
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;

  // Get all table names
  const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE();
  `;

  // Truncate all tables except the Prisma migrations table
  for (const { TABLE_NAME } of tables) {
    if (TABLE_NAME !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${TABLE_NAME}\`;`);
    }
  }

  // Re-enable foreign key checks
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1;`;

  console.log('Database cleaned');
}

async function main() {
  await cleanDatabase();
  console.log('Database cleaned');

  // Seed SDLC Steps
  for (const stepName of Object.values(SdlcStepName)) {
    await prisma.sdlcStep.create({
      data: { name: stepName },
    });
  }
  console.log('SDLC steps seeded');

  // Seed Projects
  const exampleProject = await prisma.project.create({
    data: {
      name: 'Example Project',
      description: 'This is an example project for testing purposes',
    },
  });
  const additionalProject1 = await prisma.project.create({
    data: {
      name: 'Additional Project 1',
      description: 'This is an additional project for testing purposes',
    },
  });
  const additionalProject2 = await prisma.project.create({
    data: {
      name: 'Additional Project 2',
      description: 'This is another additional project for testing purposes',
    },
  });
  console.log('Projects seeded');

  // Seed ProjectSdlcSteps
  const sdlcSteps = await prisma.sdlcStep.findMany();
  for (const project of [
    exampleProject,
    additionalProject1,
    additionalProject2,
  ]) {
    for (const step of sdlcSteps) {
      await prisma.projectSdlcStep.create({
        data: {
          projectId: project.id,
          sdlcStepId: step.id,
        },
      });
    }
  }
  console.log('ProjectSdlcSteps seeded');

  // Seed Cloud Providers
  const aws = await prisma.cloudProvider.create({ data: { name: 'AWS' } });
  const azure = await prisma.cloudProvider.create({ data: { name: 'Azure' } });
  const googleCloud = await prisma.cloudProvider.create({
    data: { name: 'Google Cloud' },
  });
  console.log('Cloud Providers seeded');

  // Seed Infrastructure Services
  const lambda = await prisma.infrastructureService.create({
    data: {
      name: 'Lambda',
      cloudProviderId: aws.id,
      type: InfrastructureElementType.Compute,
    },
  });
  const azureFunctions = await prisma.infrastructureService.create({
    data: {
      name: 'Azure Functions',
      cloudProviderId: azure.id,
      type: InfrastructureElementType.Compute,
    },
  });
  const googleFunctions = await prisma.infrastructureService.create({
    data: {
      name: 'Google Functions',
      cloudProviderId: googleCloud.id,
      type: InfrastructureElementType.Compute,
    },
  });
  console.log('Infrastructure Services seeded');

  // Seed Operations Infrastructure Elements
  const operationsStep = await prisma.sdlcStep.findUnique({
    where: { name: SdlcStepName.operations },
  });
  if (operationsStep) {
    const projectSdlcStep = await prisma.projectSdlcStep.findFirst({
      where: { projectId: exampleProject.id, sdlcStepId: operationsStep.id },
    });
    if (projectSdlcStep) {
      const infraElement = await prisma.operationsInfrastructureElement.create({
        data: {
          infrastructureServiceId: lambda.id,
          tag: 'production',
          projectSdlcStepId: projectSdlcStep.id,
        },
      });
      console.log(`Infrastructure element created with ID: ${infraElement.id}`);

      // Seed Metric Definitions
      const co2Metric = await prisma.operationsMetricDefinition.create({
        data: {
          metricName: 'co2_consumption',
          dataType: DataType.decimal,
          isKeyMetric: true,
          applicableServices: {
            create: [
              { service: { connect: { id: lambda.id } } },
              { service: { connect: { id: azureFunctions.id } } },
            ],
          },
        },
        include: { applicableServices: true },
      });

      const invocationsMetric = await prisma.operationsMetricDefinition.create({
        data: {
          metricName: 'invocations',
          dataType: DataType.integer,
          isKeyMetric: true,
          applicableServices: {
            create: [
              { service: { connect: { id: lambda.id } } },
              { service: { connect: { id: azureFunctions.id } } },
            ],
          },
        },
        include: { applicableServices: true },
      });

      const errorRateMetric = await prisma.operationsMetricDefinition.create({
        data: {
          metricName: 'error_rate',
          dataType: DataType.decimal,
          isKeyMetric: true,
          applicableServices: {
            create: [{ service: { connect: { id: googleFunctions.id } } }],
          },
        },
        include: { applicableServices: true },
      });

      // Seed AllowedMetrics
      await prisma.allowedMetric.createMany({
        data: [
          {
            infrastructureServiceId: lambda.id,
            metricDefinitionId: co2Metric.id,
          },
          {
            infrastructureServiceId: lambda.id,
            metricDefinitionId: invocationsMetric.id,
          },
          {
            infrastructureServiceId: azureFunctions.id,
            metricDefinitionId: co2Metric.id,
          },
          {
            infrastructureServiceId: azureFunctions.id,
            metricDefinitionId: invocationsMetric.id,
          },
          {
            infrastructureServiceId: googleFunctions.id,
            metricDefinitionId: errorRateMetric.id,
          },
        ],
      });

      console.log('Metric definitions and Allowed Metrics seeded');

      console.log('Metric definitions seeded');
      // Seed Metric Values
      await prisma.operationsMetricValue.createMany({
        data: [
          {
            infrastructureElementId: infraElement.id,
            metricDefinitionId: co2Metric.id,
            valueDecimal: 100.5,
            timestamp: new Date(),
          },
          {
            infrastructureElementId: infraElement.id,
            metricDefinitionId: invocationsMetric.id,
            valueInt: 1000,
            timestamp: new Date(),
          },
          {
            infrastructureElementId: infraElement.id,
            metricDefinitionId: errorRateMetric.id,
            valueDecimal: 0.02,
            timestamp: new Date(),
          },
        ],
      });
      console.log('Metric values seeded');
    }
  }

  // Seed CICD Pipeline
  const integrationDeploymentStep = await prisma.sdlcStep.findUnique({
    where: { name: SdlcStepName.integration_deployment },
  });
  if (integrationDeploymentStep) {
    const projectSdlcStep = await prisma.projectSdlcStep.findFirst({
      where: {
        projectId: exampleProject.id,
        sdlcStepId: integrationDeploymentStep.id,
      },
    });
    if (projectSdlcStep) {
      const pipeline = await prisma.cicdPipeline.create({
        data: {
          projectSdlcStepId: projectSdlcStep.id,
          repoName: 'example-repo',
          branch: 'main',
          cloudProvider: 'AWS',
          pipelineName: 'Example Pipeline',
        },
      });
      console.log(`CICD Pipeline created with ID: ${pipeline.id}`);

      const pipelineRun = await prisma.cicdPipelineRun.create({
        data: {
          cicdPipelineId: pipeline.id,
          runNumber: 1,
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000), // 1 hour later
        },
      });
      console.log(`CICD Pipeline Run created with ID: ${pipelineRun.id}`);

      await prisma.cicdPipelineStepMeasurement.createMany({
        data: [
          {
            cicdPipelineRunId: pipelineRun.id,
            stepName: CicdStepName.integration,
            integrationSubStepName: IntegrationSubStepName.build,
            duration: 1800,
            co2Consumption: 50.5,
          },
          {
            cicdPipelineRunId: pipelineRun.id,
            stepName: CicdStepName.deployment,
            deploymentStage: DeploymentSubStepName.dev,
            duration: 900,
            co2Consumption: 25.3,
          },
        ],
      });
      console.log('CICD Pipeline Step Measurements seeded');

      // Create another pipeline run to have more data
      const anotherPipelineRun = await prisma.cicdPipelineRun.create({
        data: {
          cicdPipelineId: pipeline.id,
          runNumber: 2,
          startTime: new Date(Date.now() + 86400000), // 1 day later
          endTime: new Date(Date.now() + 90000000), // 1 day and 1 hour later
        },
      });
      console.log(
        `Another CICD Pipeline Run created with ID: ${anotherPipelineRun.id}`,
      );

      await prisma.cicdPipelineStepMeasurement.createMany({
        data: [
          {
            cicdPipelineRunId: anotherPipelineRun.id,
            stepName: CicdStepName.integration,
            integrationSubStepName: IntegrationSubStepName.build,
            duration: 2000,
            co2Consumption: 60.0,
          },
          {
            cicdPipelineRunId: anotherPipelineRun.id,
            stepName: CicdStepName.deployment,
            deploymentStage: DeploymentSubStepName.prod,
            duration: 1200,
            co2Consumption: 30.5,
          },
        ],
      });
      console.log('Additional CICD Pipeline Step Measurements seeded');
    }
  }

  // Seed User Flows
  await prisma.userFlow.createMany({
    data: [
      {
        projectId: exampleProject.id,
        name: 'Example User Flow',
        co2Consumption: 75.5,
      },
      {
        projectId: additionalProject1.id,
        name: 'User Flow 1',
        co2Consumption: 50.0,
      },
      {
        projectId: additionalProject2.id,
        name: 'User Flow 2',
        co2Consumption: 60.0,
      },
    ],
  });
  console.log('User Flows seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
