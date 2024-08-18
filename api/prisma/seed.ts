import {
  PrismaClient,
  DataType,
  CicdStepName,
  IntegrationSubStepName,
  DeploymentSubStepName,
  InfrastructureElementCategory
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const NUM_WEEKS = 12; // Generate data for 12 weeks

async function cleanDatabase() {
  // Disable foreign key checks
  await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0;`;

  // Get all table names, excluding views
  const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE';
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

function generateValue(baseValue: number, growth: number, day: number, variance = 0): number {
  const baseGrowth = baseValue + (growth * day) / 7;
  const varianceFactor = 1 + (Math.random() * 2 - 1) * variance;
  return baseGrowth * varianceFactor;
}

function getCategoryEnum(category: string): InfrastructureElementCategory {
  switch (category) {
    case 'Compute':
      return InfrastructureElementCategory.Compute;
    case 'Storage':
      return InfrastructureElementCategory.Storage;
    case 'Databases':
      return InfrastructureElementCategory.Databases;
    case 'Networking':
      return InfrastructureElementCategory.Networking;
    default:
      throw new Error(`Invalid category: ${category}`);
  }
}

async function main() {
  await cleanDatabase();
  console.log('Database cleaned');

  const seedDataPath = path.join(__dirname, 'seed-data.json');
  let seedData: {
    cloudProviders: string[];
    infrastructureServices: any[];
    projects: any[];
  };
  try {
    const rawData = fs.readFileSync(seedDataPath, 'utf-8');
    seedData = JSON.parse(rawData);
  } catch (error) {
    console.error(`Error reading seed data file: ${error.message}`);
    process.exit(1);
  }

  // Seed Cloud Providers
  const cloudProviders: { [key: string]: any } = {};
  for (const providerName of seedData.cloudProviders) {
    const provider = await prisma.cloudProvider.create({
      data: { name: providerName },
    });
    cloudProviders[providerName] = provider;
  }
  console.log('Cloud Providers seeded');

  // Seed Infrastructure Services
  const infrastructureServices: { [key: string]: any } = {};
  for (const service of seedData.infrastructureServices) {
    try {
      const createdService = await prisma.infrastructureService.create({
        data: {
          type: service.type,
          category: getCategoryEnum(service.category),
          cloudProviderId: cloudProviders[service.cloudProvider].id,
        },
      });
      infrastructureServices[service.type] = createdService;
    } catch (error) {
      console.error(`Error creating infrastructure service ${service.type}:`, error);
    }
  }
  console.log('Infrastructure Services seeded');

  // Helper function to create or connect tags
  async function createOrConnectTags(tags: string[]) {
    return tags.map((tag) => ({
      where: { name: tag },
      create: { name: tag },
    }));
  }

  // Seed Projects and related data
  for (const projectData of seedData.projects) {
    const project = await prisma.project.create({
      data: {
        name: projectData.name,
        description: projectData.description,
        tags: {
          connectOrCreate: await createOrConnectTags(projectData.tags),
        },
      },
    });

    // Seed Infrastructure Elements
    for (const element of projectData.infrastructureElements) {
      const service = infrastructureServices[element.service];
      const infraElement = await prisma.operationsInfrastructureElement.create({
        data: {
          name: element.name,
          infrastructureServiceId: service.id,
          tags: {
            connectOrCreate: await createOrConnectTags([
              ...element.tags,
              project.name,
            ]),
          },
        },
      });

      // Seed Consumption Data
      const co2Metric = element.metrics.find(
        (m: any) => m.name === 'Daily CO2 Consumption',
      );
      for (let day = 0; day < NUM_WEEKS * 7; day++) {
        const date = new Date();
        date.setDate(date.getDate() - (NUM_WEEKS * 7 - day));

        await prisma.operationsInfrastructureElementConsumption.create({
          data: {
            infrastructureElementId: infraElement.id,
            date,
            co2Consumption: generateValue(
              co2Metric.baseValue,
              co2Metric.growth,
              day,
              co2Metric.variance,
            ),
          },
        });
      }

      // Seed Metric Values (excluding CO2 consumption)
      for (const metric of element.metrics.filter(
        (m: any) => m.name !== 'Daily CO2 Consumption',
      )) {
        let metricDefinition =
          await prisma.operationsMetricDefinition.findFirst({
            where: { metricName: metric.name },
          });
        if (!metricDefinition) {
          metricDefinition = await prisma.operationsMetricDefinition.create({
            data: {
              metricName: metric.name,
              dataType:
                metric.type === 'integer' ? DataType.integer : DataType.decimal,
              isKeyMetric: metric.isKey,
            },
          });
        }

        // Create or connect AllowedMetric
        const existingAllowedMetric = await prisma.allowedMetric.findFirst({
          where: {
            infrastructureServiceId: service.id,
            metricDefinitionId: metricDefinition.id,
          },
        });

        if (!existingAllowedMetric) {
          await prisma.allowedMetric.create({
            data: {
              infrastructureServiceId: service.id,
              metricDefinitionId: metricDefinition.id,
            },
          });
        }

        for (let day = 0; day < NUM_WEEKS * 7; day++) {
          const date = new Date();
          date.setDate(date.getDate() - (NUM_WEEKS * 7 - day));
          const value = generateValue(
            metric.baseValue,
            metric.growth,
            day,
            metric.variance,
          );

          await prisma.operationsMetricValue.create({
            data: {
              infrastructureElementId: infraElement.id,
              metricDefinitionId: metricDefinition.id,
              valueInt: metric.type === 'integer' ? Math.round(value) : null,
              valueDecimal: metric.type === 'decimal' ? value : null,
              valueString:
                metric.type === 'string'
                  ? `${value}${metric.unit ? ' ' + metric.unit : ''}`
                  : null,
              timestamp: date,
            },
          });
        }
      }
    }

    // Seed CICD Pipelines
    for (const pipelineData of projectData.cicdPipelines) {
      const pipeline = await prisma.cicdPipeline.create({
        data: {
          repoName: pipelineData.repoName,
          branch: pipelineData.branch,
          cloudProvider: pipelineData.cloudProvider,
          pipelineName: pipelineData.name,
          tags: {
            connectOrCreate: await createOrConnectTags([
              ...pipelineData.tags,
              project.name,
            ]),
          },
        },
      });

      for (let week = 0; week < NUM_WEEKS; week++) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (NUM_WEEKS - week) * 7);
        const endDate = new Date(
          startDate.getTime() +
          generateValue(
            pipelineData.baseRunTime,
            pipelineData.runTimeGrowth,
            week * 7,
          ) *
          1000,
        );

        const pipelineRun = await prisma.cicdPipelineRun.create({
          data: {
            cicdPipelineId: pipeline.id,
            runNumber: week + 1,
            startTime: startDate,
            endTime: endDate,
          },
        });

        // Seed CICD Pipeline Step Measurements
        for (const step of pipelineData.steps) {
          const stepName =
            step.type === 'integration'
              ? CicdStepName.integration
              : CicdStepName.deployment;

          let integrationSubStepName: IntegrationSubStepName | null = null;
          let deploymentStage: DeploymentSubStepName | null = null;

          if (step.type === 'integration') {
            integrationSubStepName = IntegrationSubStepName[step.subType as keyof typeof IntegrationSubStepName];
          } else {
            deploymentStage = DeploymentSubStepName[step.subType as keyof typeof DeploymentSubStepName];
          }

          await prisma.cicdPipelineStepMeasurement.create({
            data: {
              cicdPipelineRunId: pipelineRun.id,
              stepName: stepName,
              integrationSubStepName: integrationSubStepName,
              deploymentStage: deploymentStage,
              duration: Math.round(
                generateValue(step.baseTime, step.timeGrowth, week * 7),
              ),
              co2Consumption: generateValue(
                step.baseCO2,
                step.co2Growth,
                week * 7,
              ),
            },
          });
        }
      }
    }

    // Seed User Flows
    for (const flowData of projectData.userFlows) {
      for (let week = 0; week < NUM_WEEKS; week++) {
        await prisma.userFlow.create({
          data: {
            projectId: project.id,
            name: flowData.name,
            co2Consumption: generateValue(
              flowData.baseCO2Consumption,
              flowData.co2Growth,
              week * 7,
            ),
          },
        });
      }
    }
  }

  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });