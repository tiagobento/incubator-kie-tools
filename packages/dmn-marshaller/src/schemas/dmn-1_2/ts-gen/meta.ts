import { Meta } from "@kie-tools/xml-parser-ts";

export const root = {
  element: "DMN12.xsd__definitions",
  type: "DMN12__tDefinitions",
};

export const ns = new Map<string, string>([
  ["http://www.omg.org/spec/DMN/20180521/MODEL/", ""],
  ["", "http://www.omg.org/spec/DMN/20180521/MODEL/"],
  ["http://www.omg.org/spec/DMN/20180521/DMNDI/", "dmndi:"],
  ["dmndi:", "http://www.omg.org/spec/DMN/20180521/DMNDI/"],
  ["http://www.omg.org/spec/DMN/20180521/DC/", "dc:"],
  ["dc:", "http://www.omg.org/spec/DMN/20180521/DC/"],
  ["http://www.omg.org/spec/DMN/20180521/DI/", "di:"],
  ["di:", "http://www.omg.org/spec/DMN/20180521/DI/"],
]);

export const meta: Meta = {
  DMN12__tDMNElement: {
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tNamedElement: {
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tDMNElementReference: {
    "@_href": { type: "string", isArray: false, isOptional: false },
  },
  DMN12__tDefinitions: {
    "@_expressionLanguage": { type: "string", isArray: false, isOptional: true },
    "@_typeLanguage": { type: "string", isArray: false, isOptional: true },
    "@_namespace": { type: "string", isArray: false, isOptional: false },
    "@_exporter": { type: "string", isArray: false, isOptional: true },
    "@_exporterVersion": { type: "string", isArray: false, isOptional: true },
    import: { type: "DMN12__tImport", isArray: true, isOptional: true },
    itemDefinition: { type: "DMN12__tItemDefinition", isArray: true, isOptional: true },
    decision: { type: "DMN12__tDecision", isArray: true, isOptional: true },
    businessKnowledgeModel: { type: "DMN12__tBusinessKnowledgeModel", isArray: true, isOptional: true },
    decisionService: { type: "DMN12__tDecisionService", isArray: true, isOptional: true },
    inputData: { type: "DMN12__tInputData", isArray: true, isOptional: true },
    knowledgeSource: { type: "DMN12__tKnowledgeSource", isArray: true, isOptional: true },
    textAnnotation: { type: "DMN12__tTextAnnotation", isArray: true, isOptional: true },
    association: { type: "DMN12__tAssociation", isArray: true, isOptional: true },
    elementCollection: { type: "DMN12__tElementCollection", isArray: true, isOptional: true },
    performanceIndicator: { type: "DMN12__tPerformanceIndicator", isArray: true, isOptional: true },
    organizationUnit: { type: "DMN12__tOrganizationUnit", isArray: true, isOptional: true },
    "dmndi:DMNDI": { type: "DMNDI12__DMNDI", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tImport: {
    "@_namespace": { type: "string", isArray: false, isOptional: false },
    "@_locationURI": { type: "string", isArray: false, isOptional: true },
    "@_importType": { type: "string", isArray: false, isOptional: false },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tElementCollection: {
    drgElement: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tDRGElement: {
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tDecision: {
    question: { type: "string", isArray: false, isOptional: true },
    allowedAnswers: { type: "string", isArray: false, isOptional: true },
    variable: { type: "DMN12__tInformationItem", isArray: false, isOptional: true },
    informationRequirement: { type: "DMN12__tInformationRequirement", isArray: true, isOptional: true },
    knowledgeRequirement: { type: "DMN12__tKnowledgeRequirement", isArray: true, isOptional: true },
    authorityRequirement: { type: "DMN12__tAuthorityRequirement", isArray: true, isOptional: true },
    supportedObjective: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    impactedPerformanceIndicator: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    decisionMaker: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    decisionOwner: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    usingProcess: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    usingTask: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    literalExpression: { type: "DMN12__tLiteralExpression", isArray: false, isOptional: true },
    invocation: { type: "DMN12__tInvocation", isArray: false, isOptional: true },
    decisionTable: { type: "DMN12__tDecisionTable", isArray: false, isOptional: true },
    context: { type: "DMN12__tContext", isArray: false, isOptional: true },
    functionDefinition: { type: "DMN12__tFunctionDefinition", isArray: false, isOptional: true },
    relation: { type: "DMN12__tRelation", isArray: false, isOptional: true },
    list: { type: "DMN12__tList", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tBusinessContextElement: {
    "@_URI": { type: "string", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tPerformanceIndicator: {
    impactingDecision: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    "@_URI": { type: "string", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tOrganizationUnit: {
    decisionMade: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    decisionOwned: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    "@_URI": { type: "string", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tInvocable: {
    variable: { type: "DMN12__tInformationItem", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tBusinessKnowledgeModel: {
    encapsulatedLogic: { type: "DMN12__tFunctionDefinition", isArray: false, isOptional: true },
    knowledgeRequirement: { type: "DMN12__tKnowledgeRequirement", isArray: true, isOptional: true },
    authorityRequirement: { type: "DMN12__tAuthorityRequirement", isArray: true, isOptional: true },
    variable: { type: "DMN12__tInformationItem", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tInputData: {
    variable: { type: "DMN12__tInformationItem", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tKnowledgeSource: {
    "@_locationURI": { type: "string", isArray: false, isOptional: true },
    authorityRequirement: { type: "DMN12__tAuthorityRequirement", isArray: true, isOptional: true },
    type: { type: "string", isArray: false, isOptional: true },
    owner: { type: "DMN12__tDMNElementReference", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tInformationRequirement: {
    requiredDecision: { type: "DMN12__tDMNElementReference", isArray: false, isOptional: true },
    requiredInput: { type: "DMN12__tDMNElementReference", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tKnowledgeRequirement: {
    requiredKnowledge: { type: "DMN12__tDMNElementReference", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tAuthorityRequirement: {
    requiredDecision: { type: "DMN12__tDMNElementReference", isArray: false, isOptional: true },
    requiredInput: { type: "DMN12__tDMNElementReference", isArray: false, isOptional: true },
    requiredAuthority: { type: "DMN12__tDMNElementReference", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tExpression: {
    "@_typeRef": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tItemDefinition: {
    "@_typeLanguage": { type: "string", isArray: false, isOptional: true },
    "@_isCollection": { type: "boolean", isArray: false, isOptional: true },
    itemComponent: { type: "DMN12__tItemDefinition", isArray: true, isOptional: true },
    typeRef: { type: "string", isArray: false, isOptional: true },
    allowedValues: { type: "DMN12__tUnaryTests", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tLiteralExpression: {
    "@_expressionLanguage": { type: "string", isArray: false, isOptional: true },
    text: { type: "string", isArray: false, isOptional: true },
    importedValues: { type: "DMN12__tImportedValues", isArray: false, isOptional: true },
    "@_typeRef": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tInvocation: {
    literalExpression: { type: "DMN12__tLiteralExpression", isArray: false, isOptional: true },
    invocation: { type: "DMN12__tInvocation", isArray: false, isOptional: true },
    decisionTable: { type: "DMN12__tDecisionTable", isArray: false, isOptional: true },
    context: { type: "DMN12__tContext", isArray: false, isOptional: true },
    functionDefinition: { type: "DMN12__tFunctionDefinition", isArray: false, isOptional: true },
    relation: { type: "DMN12__tRelation", isArray: false, isOptional: true },
    list: { type: "DMN12__tList", isArray: false, isOptional: true },
    binding: { type: "DMN12__tBinding", isArray: true, isOptional: true },
    "@_typeRef": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tBinding: {
    parameter: { type: "DMN12__tInformationItem", isArray: false, isOptional: false },
    literalExpression: { type: "DMN12__tLiteralExpression", isArray: false, isOptional: true },
    invocation: { type: "DMN12__tInvocation", isArray: false, isOptional: true },
    decisionTable: { type: "DMN12__tDecisionTable", isArray: false, isOptional: true },
    context: { type: "DMN12__tContext", isArray: false, isOptional: true },
    functionDefinition: { type: "DMN12__tFunctionDefinition", isArray: false, isOptional: true },
    relation: { type: "DMN12__tRelation", isArray: false, isOptional: true },
    list: { type: "DMN12__tList", isArray: false, isOptional: true },
  },
  DMN12__tInformationItem: {
    "@_typeRef": { type: "string", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tDecisionTable: {
    "@_hitPolicy": { type: "DMN12__tHitPolicy", isArray: false, isOptional: true },
    "@_aggregation": { type: "DMN12__tBuiltinAggregator", isArray: false, isOptional: true },
    "@_preferredOrientation": { type: "DMN12__tDecisionTableOrientation", isArray: false, isOptional: true },
    "@_outputLabel": { type: "string", isArray: false, isOptional: true },
    input: { type: "DMN12__tInputClause", isArray: true, isOptional: true },
    output: { type: "DMN12__tOutputClause", isArray: true, isOptional: false },
    annotation: { type: "DMN12__tRuleAnnotationClause", isArray: true, isOptional: true },
    rule: { type: "DMN12__tDecisionRule", isArray: true, isOptional: true },
    "@_typeRef": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tInputClause: {
    inputExpression: { type: "DMN12__tLiteralExpression", isArray: false, isOptional: false },
    inputValues: { type: "DMN12__tUnaryTests", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tOutputClause: {
    "@_name": { type: "string", isArray: false, isOptional: true },
    "@_typeRef": { type: "string", isArray: false, isOptional: true },
    outputValues: { type: "DMN12__tUnaryTests", isArray: false, isOptional: true },
    defaultOutputEntry: { type: "DMN12__tLiteralExpression", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tRuleAnnotationClause: {
    "@_name": { type: "string", isArray: false, isOptional: true },
  },
  DMN12__tDecisionRule: {
    inputEntry: { type: "DMN12__tUnaryTests", isArray: true, isOptional: true },
    outputEntry: { type: "DMN12__tLiteralExpression", isArray: true, isOptional: false },
    annotationEntry: { type: "DMN12__tRuleAnnotation", isArray: true, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tRuleAnnotation: {
    text: { type: "string", isArray: false, isOptional: true },
  },
  DMN12__tImportedValues: {
    "@_expressionLanguage": { type: "string", isArray: false, isOptional: true },
    importedElement: { type: "string", isArray: false, isOptional: false },
    "@_namespace": { type: "string", isArray: false, isOptional: false },
    "@_locationURI": { type: "string", isArray: false, isOptional: true },
    "@_importType": { type: "string", isArray: false, isOptional: false },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tArtifact: {
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tTextAnnotation: {
    "@_textFormat": { type: "string", isArray: false, isOptional: true },
    text: { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tAssociation: {
    "@_associationDirection": { type: "DMN12__tAssociationDirection", isArray: false, isOptional: true },
    sourceRef: { type: "DMN12__tDMNElementReference", isArray: false, isOptional: false },
    targetRef: { type: "DMN12__tDMNElementReference", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tContext: {
    contextEntry: { type: "DMN12__tContextEntry", isArray: true, isOptional: true },
    "@_typeRef": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tContextEntry: {
    variable: { type: "DMN12__tInformationItem", isArray: false, isOptional: true },
    literalExpression: { type: "DMN12__tLiteralExpression", isArray: false, isOptional: true },
    invocation: { type: "DMN12__tInvocation", isArray: false, isOptional: true },
    decisionTable: { type: "DMN12__tDecisionTable", isArray: false, isOptional: true },
    context: { type: "DMN12__tContext", isArray: false, isOptional: true },
    functionDefinition: { type: "DMN12__tFunctionDefinition", isArray: false, isOptional: true },
    relation: { type: "DMN12__tRelation", isArray: false, isOptional: true },
    list: { type: "DMN12__tList", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tFunctionDefinition: {
    "@_kind": { type: "DMN12__tFunctionKind", isArray: false, isOptional: true },
    formalParameter: { type: "DMN12__tInformationItem", isArray: true, isOptional: true },
    literalExpression: { type: "DMN12__tLiteralExpression", isArray: false, isOptional: true },
    invocation: { type: "DMN12__tInvocation", isArray: false, isOptional: true },
    decisionTable: { type: "DMN12__tDecisionTable", isArray: false, isOptional: true },
    context: { type: "DMN12__tContext", isArray: false, isOptional: true },
    functionDefinition: { type: "DMN12__tFunctionDefinition", isArray: false, isOptional: true },
    relation: { type: "DMN12__tRelation", isArray: false, isOptional: true },
    list: { type: "DMN12__tList", isArray: false, isOptional: true },
    "@_typeRef": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tRelation: {
    column: { type: "DMN12__tInformationItem", isArray: true, isOptional: true },
    row: { type: "DMN12__tList", isArray: true, isOptional: true },
    "@_typeRef": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tList: {
    literalExpression: { type: "DMN12__tLiteralExpression", isArray: true, isOptional: true },
    invocation: { type: "DMN12__tInvocation", isArray: true, isOptional: true },
    decisionTable: { type: "DMN12__tDecisionTable", isArray: true, isOptional: true },
    context: { type: "DMN12__tContext", isArray: true, isOptional: true },
    functionDefinition: { type: "DMN12__tFunctionDefinition", isArray: true, isOptional: true },
    relation: { type: "DMN12__tRelation", isArray: true, isOptional: true },
    list: { type: "DMN12__tList", isArray: true, isOptional: true },
    "@_typeRef": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tUnaryTests: {
    "@_expressionLanguage": { type: "string", isArray: false, isOptional: true },
    text: { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMN12__tDecisionService: {
    outputDecision: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    encapsulatedDecision: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    inputDecision: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    inputData: { type: "DMN12__tDMNElementReference", isArray: true, isOptional: true },
    variable: { type: "DMN12__tInformationItem", isArray: false, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: false },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "@_label": { type: "string", isArray: false, isOptional: true },
    description: { type: "string", isArray: false, isOptional: true },
    extensionElements: { type: "any", isArray: false, isOptional: true },
  },
  DMNDI12__DMNDI: {
    "dmndi:DMNDiagram": { type: "DMNDI12__DMNDiagram", isArray: true, isOptional: true },
    "dmndi:DMNStyle": { type: "DMNDI12__DMNStyle", isArray: true, isOptional: true },
  },
  DMNDI12__DMNDiagram: {
    "dmndi:Size": { type: "DC__Dimension", isArray: false, isOptional: true },
    "dmndi:DMNShape": { type: "DMNDI12__DMNShape", isArray: true, isOptional: true },
    "dmndi:DMNEdge": { type: "DMNDI12__DMNEdge", isArray: true, isOptional: true },
    "@_name": { type: "string", isArray: false, isOptional: true },
    "@_documentation": { type: "string", isArray: false, isOptional: true },
    "@_resolution": { type: "float", isArray: false, isOptional: true },
    "@_sharedStyle": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "di:extension": { type: "any", isArray: false, isOptional: true },
    "dmndi:DMNStyle": { type: "DMNDI12__DMNStyle", isArray: false, isOptional: true },
  },
  DMNDI12__DMNShape: {
    "@_dmnElementRef": { type: "string", isArray: false, isOptional: false },
    "@_isListedInputData": { type: "boolean", isArray: false, isOptional: true },
    "@_isCollapsed": { type: "boolean", isArray: false, isOptional: true },
    "dmndi:DMNLabel": { type: "DMNDI12__DMNLabel", isArray: false, isOptional: true },
    "dmndi:DMNDecisionServiceDividerLine": {
      type: "DMNDI12__DMNDecisionServiceDividerLine",
      isArray: false,
      isOptional: true,
    },
    "dc:Bounds": { type: "DC__Bounds", isArray: false, isOptional: true },
    "@_sharedStyle": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "di:extension": { type: "any", isArray: false, isOptional: true },
    "dmndi:DMNStyle": { type: "DMNDI12__DMNStyle", isArray: false, isOptional: true },
  },
  DMNDI12__DMNDecisionServiceDividerLine: {
    "di:waypoint": { type: "DC__Point", isArray: true, isOptional: true },
    "@_sharedStyle": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "di:extension": { type: "any", isArray: false, isOptional: true },
    "dmndi:DMNStyle": { type: "DMNDI12__DMNStyle", isArray: false, isOptional: true },
  },
  DMNDI12__DMNEdge: {
    "@_dmnElementRef": { type: "string", isArray: false, isOptional: false },
    "dmndi:DMNLabel": { type: "DMNDI12__DMNLabel", isArray: false, isOptional: true },
    "di:waypoint": { type: "DC__Point", isArray: true, isOptional: true },
    "@_sharedStyle": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "di:extension": { type: "any", isArray: false, isOptional: true },
    "dmndi:DMNStyle": { type: "DMNDI12__DMNStyle", isArray: false, isOptional: true },
  },
  DMNDI12__DMNLabel: {
    "dmndi:Text": { type: "string", isArray: false, isOptional: true },
    "dc:Bounds": { type: "DC__Bounds", isArray: false, isOptional: true },
    "@_sharedStyle": { type: "string", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "di:extension": { type: "any", isArray: false, isOptional: true },
    "dmndi:DMNStyle": { type: "DMNDI12__DMNStyle", isArray: false, isOptional: true },
  },
  DMNDI12__DMNStyle: {
    "@_fontFamily": { type: "string", isArray: false, isOptional: true },
    "@_fontSize": { type: "float", isArray: false, isOptional: true },
    "@_fontItalic": { type: "boolean", isArray: false, isOptional: true },
    "@_fontBold": { type: "boolean", isArray: false, isOptional: true },
    "@_fontUnderline": { type: "boolean", isArray: false, isOptional: true },
    "@_fontStrikeThrough": { type: "boolean", isArray: false, isOptional: true },
    "@_labelHorizontalAlignement": { type: "DC__AlignmentKind", isArray: false, isOptional: true },
    "@_labelVerticalAlignment": { type: "DC__AlignmentKind", isArray: false, isOptional: true },
    "dmndi:FillColor": { type: "DC__Color", isArray: false, isOptional: true },
    "dmndi:StrokeColor": { type: "DC__Color", isArray: false, isOptional: true },
    "dmndi:FontColor": { type: "DC__Color", isArray: false, isOptional: true },
    "@_id": { type: "string", isArray: false, isOptional: true },
    "di:extension": { type: "any", isArray: false, isOptional: true },
  },
  DC__Color: {
    "@_red": { type: "integer", isArray: false, isOptional: false },
    "@_green": { type: "integer", isArray: false, isOptional: false },
    "@_blue": { type: "integer", isArray: false, isOptional: false },
  },
  DC__Point: {
    "@_x": { type: "float", isArray: false, isOptional: false },
    "@_y": { type: "float", isArray: false, isOptional: false },
  },
  DC__Dimension: {
    "@_width": { type: "float", isArray: false, isOptional: false },
    "@_height": { type: "float", isArray: false, isOptional: false },
  },
  DC__Bounds: {
    "@_x": { type: "float", isArray: false, isOptional: false },
    "@_y": { type: "float", isArray: false, isOptional: false },
    "@_width": { type: "float", isArray: false, isOptional: false },
    "@_height": { type: "float", isArray: false, isOptional: false },
  },
};
