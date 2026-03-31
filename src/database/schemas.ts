import { Schema } from 'mongoose';

export const CounterModelName = 'tcx-counters';
export const JobModelName = 'tcx-jobs';
export const FileModelName = 'tcx-files';
export const ConnectorModelName = 'tcx-storage-connectors';
export const IntentModelName = 'tcx-intents';
export const ClusterModelName = 'tcx-intent-clusters';
export const ProcessMapModelName = 'tcx-merged-maps';
export const ProcessMapIvrModelName = 'tcx-process-maps';
export const AgenticGenerationModelName = 'tcx-agentic-templates';
export const AgenticApiModelName = 'tcx-agent-api';
export const AgenticBlueprintModelName = 'tcx-agent-blueprint';
export const AgenticDeploymentModelName = 'tcx-deployment';
export const UmlDiagramModelName = 'tcx-uml-diagram';
export const RoleModelName = 'tcx-roles';
export const PageModelName = 'tcx-pages';
export const CognitoUserModelName = 'tcx-users';
export const AuditLogModelName = 'tcx-audit-logs';
export const QaJobModelName = 'eval_scenarios';

export const CounterSchema = new Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { collection: CounterModelName, strict: false },
);

export const JobSchema = new Schema(
  {
    jobId: { type: String, unique: true },
    jobName: { type: String, default: '' },
    jobType: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileType: { type: String, default: '' },
    fileLocation: { type: String, default: '' },
    transcriptLocation: { type: String, default: '' },
    status: { type: String, default: 'PENDING_UPLOAD' },
    connector: { type: Schema.Types.ObjectId, ref: ConnectorModelName },
    metadata: {
      expressModeEnabled: { type: Boolean, default: false },
      automatedSteps: { type: Array, default: [] },
      isClusteringOptional: { type: Boolean, default: false },
      clusteringMethod: { type: String, default: '' },
    },
    createdBy: { type: String, default: '' },
    addedOn: { type: Number, default: Date.now },
    modifiedOn: { type: Number, default: Date.now },
  },
  { collection: JobModelName, strict: false },
);

export const FileSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    fileType: { type: String, default: '' },
    filePath: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    transcriptLocation: { type: String, default: '' },
    status: { type: String, default: 'PENDING' },
    addedOn: { type: Number, default: Date.now },
    modifiedOn: { type: Number, default: Date.now },
  },
  { collection: FileModelName, strict: false },
);

export const ConnectorSchema = new Schema(
  {
    connectorType: { type: String, default: '' },
    connectionName: { type: String, default: '' },
    config: { type: Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Number, default: Date.now },
    updateAt: { type: Number, default: Date.now },
  },
  { collection: ConnectorModelName, strict: false },
);

export const IntentSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    addedOn: { type: Number, default: Date.now },
  },
  { collection: IntentModelName, strict: false },
);

export const ClusterSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    clusteringOutput: Schema.Types.Mixed,
    addedOn: { type: Number, default: Date.now },
    version: { type: Number, default: 0 },
  },
  { collection: ClusterModelName, strict: false },
);

export const ProcessMapSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    intentGroupName: { type: String, default: '' },
    mergeOutput: { type: String, default: '' },
    mermaidOutput: { type: String, default: '' },
    addedOn: { type: Number, default: Date.now },
  },
  { collection: ProcessMapModelName, strict: false },
);

export const ProcessMapIvrSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    intentGroupName: { type: String, default: '' },
    mergeOutput: { type: String, default: '' },
    mermaidOutput: { type: String, default: '' },
    addedOn: { type: Number, default: Date.now },
  },
  { collection: ProcessMapIvrModelName, strict: false },
);

export const AgenticGenerationSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    transcriptIdList: { type: Array, default: '' },
    intentGroupName: { type: String, default: '' },
    agentBuilderOutput: { type: String, default: '' },
    addedOn: { type: Number, default: Date.now },
    version: { type: Number, default: 0 },
  },
  { collection: AgenticGenerationModelName, strict: false },
);

export const AgenticApiSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    mainIntent: { type: String, default: '' },
    subGroupIntentName: { type: String, default: '' },
    taskId: { type: String, default: '' },
    userId: { type: String, default: '' },
    sessionId: { type: String, default: '' },
    addedOn: { type: Date, default: Date.now },
    promptToolDefinition: { type: Schema.Types.Mixed, default: {} },
    toolDummyDataJson: { type: Schema.Types.Mixed, default: {} },
    apiExplanationJson: { type: Array, default: [] },
  },
  { collection: AgenticApiModelName, strict: false },
);

export const AgenticBlueprintSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    mainIntent: { type: String, default: '' },
    subGroupIntentName: { type: String, default: '' },
    taskId: { type: String, default: '' },
    userId: { type: String, default: '' },
    sessionId: { type: String, default: '' },
    addedOn: { type: Date, default: Date.now },
    agentsBlueprintJson: { type: Schema.Types.Mixed, default: {} },
    improvedBlueprintJson: { type: Schema.Types.Mixed, default: {} },
    sampleConversationJson: { type: Schema.Types.Mixed, default: {} },
  },
  { collection: AgenticBlueprintModelName, strict: false },
);

export const AgenticDeploymentSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    mainIntent: { type: String, default: '' },
    subGroupIntentName: { type: String, default: '' },
    taskId: { type: String, default: '' },
    userId: { type: String, default: '' },
    sessionId: { type: String, default: '' },
    addedOn: { type: Date, default: Date.now },
    url: { type: String, default: '' },
    path: { type: String, default: '' },
    serviceName: { type: String, default: '' },
  },
  { collection: AgenticDeploymentModelName, strict: false },
);

export const UmlDiagramSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    mainIntent: { type: String, default: '' },
    subGroupIntentName: { type: String, default: '' },
    taskId: { type: String, default: '' },
    userId: { type: String, default: '' },
    sessionId: { type: String, default: '' },
    uml: { type: String, default: '' },
    addedOn: { type: Date, default: Date.now },
  },
  { collection: UmlDiagramModelName, strict: false },
);

export const RoleSchema = new Schema(
  {
    name: { type: String, default: '' },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    addedOn: { type: Number, default: Date.now },
    modifiedOn: { type: Number, default: Date.now },
  },
  { collection: RoleModelName, strict: false },
);

export const PageSchema = new Schema(
  {
    pageName: { type: String, default: '' },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    addedOn: { type: Number, default: Date.now },
    modifiedOn: { type: Number, default: Date.now },
  },
  { collection: PageModelName, strict: false },
);

export const CognitoUserSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String },
    name: { type: String },
    roleName: { type: String },
    roleId: { type: String },
    provider: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date },
  },
  { collection: CognitoUserModelName, strict: false },
);

export const AuditLogSchema = new Schema(
  {
    jobId: { type: String, default: '' },
    eventName: { type: String, default: '' },
    payload: { type: Schema.Types.Mixed, default: {} },
    addedBy: { type: String, default: '' },
    addedOn: { type: Number, default: Date.now },
  },
  { collection: AuditLogModelName, strict: false },
);

export const QaJobSchema = new Schema(
  {
    _id: { type: String, default: '' },
    bot_intent: { type: [String], default: [] },
    status: { type: Schema.Types.Mixed, default: '' },
    bot_goals: { type: Schema.Types.Mixed, default: '' },
    scenarios: { type: Schema.Types.Mixed, default: '' },
    created_at: { type: String, default: '' },
    metadata: { createdBy: { type: String, default: '' } },
  },
  { collection: QaJobModelName, strict: false },
);
