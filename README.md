# Transform CX Backend

This Nest app is now shaped to receive the functionality currently living in the Lambda project `tcx-backend-dev-cefa81f6-0ab9-4ad5-9878-a03fee68fb4b`.

## What was in the Lambda

The Lambda entrypoint in `index.mjs` handled three different workloads in one file:

- HTTP routing for all REST endpoints
- Event processing for S3 and SQS records
- Cognito trigger handling for user sync

Business logic lived mostly in:

- `modules/jobs/index.mjs`
- `modules/files/index.mjs`
- `modules/intents/index.mjs`
- `modules/connector/index.mjs`
- `modules/rbac/index.mjs`
- `modules/qa/index.mjs`

Infrastructure and integration logic lived mostly in:

- `manager/dataScienceServices.mjs`
- `manager/s3manager.mjs`
- `manager/sqsManager.mjs`
- `utility.mjs`

Persistence lived in the `models/*.mjs` files with direct Mongoose usage.

## Nest target structure

The Nest app now includes starter modules that mirror the Lambda domains:

- `src/modules/jobs`
- `src/modules/files`
- `src/modules/connectors`
- `src/modules/intents`
- `src/modules/rbac`
- `src/modules/qa`

These controllers already expose the same HTTP paths used by the Lambda, but currently return migration placeholders showing which Lambda method each route should map to.

## Route mapping

### Jobs

- `GET /job-list` -> `JobsService.getJobList()` -> Lambda `modules/jobs/index.mjs#getJobList`
- `POST /v2/create-job` -> `JobsService.createJob()` -> Lambda `modules/jobs/index.mjs#createJobV2`
- `DELETE /job` -> `JobsService.deleteJob()` -> Lambda `modules/jobs/index.mjs#deleteJob`
- `GET /job` -> `JobsService.getJob()` -> Lambda `modules/jobs/index.mjs#getJobData`
- `PUT /job` -> `JobsService.updateJob()` -> Lambda `modules/jobs/index.mjs#updateJobData`
- `POST /intent-analysis` -> `JobsService.triggerIntentAnalysis()` -> Lambda `modules/jobs/index.mjs#triggerIntentAnalysis`
- `POST /agent-builder/generate-uml` -> `JobsService.triggerIntentAnalysis()`
- `POST /agent-builder/generate-api` -> `JobsService.triggerIntentAnalysis()`
- `POST /agent-builder/generate-blueprint` -> `JobsService.triggerIntentAnalysis()`
- `POST /agent-builder/build-deploy-agent` -> `JobsService.triggerIntentAnalysis()`

### Files

- `POST /file-upload` -> `FilesService.generateUploadUrl()` -> Lambda `modules/files/index.mjs#generateFileUploadURL`
- `GET /job/files` -> `FilesService.listFiles()` -> Lambda `modules/files/index.mjs#listFiles`

### Connectors

- `POST /connector-storage` -> `ConnectorsService.createConnector()` -> Lambda `modules/connector/index.mjs#saveNewConnector`
- `PUT /connector-storage?id=...` -> `ConnectorsService.updateConnector()` -> Lambda `modules/connector/index.mjs#updateConnector`
- `GET /connector-storage` -> `ConnectorsService.getConnectors()` -> Lambda `modules/connector/index.mjs#getConnectorsList`
- `GET /list-files` -> `ConnectorsService.listFiles()` -> Lambda `modules/connector/index.mjs#getFilesList`

### Intents and agent builder

- `GET /jobs-list` -> `IntentsService.getJobsList()`
- `POST /merge-clusters` -> `IntentsService.mergeClusters()`
- `GET /intent` -> `IntentsService.getIntents()`
- `PUT /intent` -> `IntentsService.triggerIntentUpdate()`
- `GET /intent-clusters` -> `IntentsService.getIntentClusters()`
- `GET /process-maps` -> `IntentsService.getProcessMaps()`
- `GET /agentic-template` -> `IntentsService.getAgenticTemplate()`
- `POST /agentic-template` -> `IntentsService.createAgenticTemplate()`
- `GET /agentic-blueprint` -> `IntentsService.getAgenticBlueprint()`
- `GET /agent-builder/generate-uml` -> `IntentsService.getGeneratedUml()`
- `GET /agent-builder/build-deploy-agent` -> `IntentsService.getBuildDeployAgent()`
- `GET /agent-builder/process-status` -> `IntentsService.getProcessStatus()`

### RBAC

- `POST /role` -> `RbacService.createRole()`
- `PUT /role` -> `RbacService.updateRole()`
- `DELETE /role?roleId=...` -> `RbacService.deleteRole()`
- `GET /get-roles` -> `RbacService.getRoles()`
- `POST /page` -> `RbacService.createPage()`
- `PUT /page` -> `RbacService.updatePage()`
- `GET /get-pages` -> `RbacService.getPages()`
- `GET /users` -> `RbacService.getUsers()`
- `PUT /users` -> `RbacService.updateUserRole()`
- `GET /user-permissions` -> `RbacService.getUserPermissions()`

### QA

- `GET /qa-analysis/jobs` -> `QaService.getJobs()`
- `POST /qa-analysis/generate-scenario` -> `QaService.generateScenario()`
- `POST /qa-analysis/process-scenario` -> `QaService.processScenario()`
- `POST /qa-analysis/goal-entities` -> `QaService.getGoalsEntities()`

## What should not stay in controllers

When you do the real port, move Lambda logic into layers like this:

- Controllers: only parse HTTP params and call services
- Services: business rules from `modules/*.mjs`
- Repositories or Mongoose models: persistence logic from `models/*.mjs`
- Integration providers: AWS, Cognito, S3, SQS, Secrets Manager, DS APIs

## Non-HTTP Lambda workloads

These need their own Nest strategy and should not be mixed into controllers:

- Cognito trigger `event.triggerSource`
  - best fit: a dedicated webhook/consumer adapter or keep as a separate Lambda until Cognito integration is redesigned
- S3 trigger `event.Records[0].eventSource === 'aws:s3'`
  - best fit: separate worker or Nest microservice consumer
- SQS trigger `event.Records[0].eventSource === 'aws:sqs'`
  - best fit: queue consumer or worker process

If you want one deployable Nest service, keep HTTP in Nest first and move S3/SQS/Cognito processing into separate workers after that.

## Recommended migration order

1. Add shared infrastructure first:
   `@nestjs/config`, `@nestjs/mongoose`, validation pipes, env config, and exception filters.
2. Port models from `models/*.mjs` into Mongoose schemas.
3. Port read-only endpoints first:
   jobs list, job detail, files list, connectors list, intents reads, RBAC reads, QA reads.
4. Port write endpoints next:
   connector save/update, role/page writes, job update, agentic template versioning.
5. Port file upload flow:
   signed URL generation, job creation, audit logging.
6. Port async pipelines last:
   SQS push, S3 callbacks, Cognito sync, DS job orchestration.

## First real implementation targets

Start with these because they are the least risky and define the backbone of the app:

- Mongo connection setup
- Job schema and repository
- File schema and repository
- `GET /job-list`
- `GET /job`
- `GET /job/files`
- `GET /connector-storage`

After that, the next important feature is:

- `POST /file-upload`

That route creates the job and file records, and it anchors the rest of the workflow.
