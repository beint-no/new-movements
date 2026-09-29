export const documentUrl = process.env.REAI_SITE_OPENAPI_URL || "https://app.reai.no/openapi/site";
export const generatedTypesUrl = new URL("../packages/reai-site-client/site-api.d.ts", import.meta.url);

const generatedHeader = `/**
 * This file was generated from the ReAI Site OpenAPI document.
 * Run npm run generate:site-api instead of editing it.
 */

`;
const methods = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
const parameterLocations = ["query", "header", "path", "cookie"];
const emptyComponents = ["responses", "parameters", "requestBodies", "headers", "pathItems"];

export async function readSiteOpenApi() {
  const response = await fetch(documentUrl, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Could not read ${documentUrl}: HTTP ${response.status}`);
  return response.json();
}

// Declares the OpenAPI 3.1 subset the Site API uses and fails on any schema construct outside it.
export async function generateSiteApiTypes(document) {
  const operations = Object.values(document.paths).flatMap((item) => methods.map((method) => item[method]).filter(Boolean));
  const components = [
    `schemas: ${entries(document.components?.schemas, schemaType)};`,
    ...emptyComponents.map((name) => `${name}: never;`),
  ];
  return `${generatedHeader}${[
    `export interface paths ${entries(document.paths, pathItemType, JSON.stringify)}`,
    "export type webhooks = Record<string, never>;",
    `export interface components ${block(components)}`,
    "export type $defs = Record<string, never>;",
    `export interface operations ${block(operations.map((operation) => `${operation.operationId}: ${operationType(operation)};`))}`,
  ].join("\n")}\n`;
}

function pathItemType(item) {
  return block([
    `parameters: ${parametersType([])};`,
    ...methods.map((method) => {
      const operation = item[method];
      if (!operation) return `${method}?: never;`;
      const doc = comment({ title: operation.summary, description: operation.description });
      return `${doc}${method}: operations[${JSON.stringify(operation.operationId)}];`;
    }),
  ]);
}

function operationType(operation) {
  const body = operation.requestBody;
  return block([
    `parameters: ${parametersType(operation.parameters || [])};`,
    body ? `requestBody${body.required ? "" : "?"}: ${block([`content: ${contentType(body.content)};`])};` : "requestBody?: never;",
    `responses: ${entries(operation.responses, responseType)};`,
  ]);
}

function parametersType(parameters) {
  return block(parameterLocations.map((location) => {
    const matching = parameters.filter((parameter) => parameter.in === location);
    if (!matching.length) return `${location}?: never;`;
    const members = matching.map((parameter) => member(parameter.name, parameter, parameter.required, schemaType(parameter.schema)));
    return `${location}${matching.some((parameter) => parameter.required) ? "" : "?"}: ${block(members)};`;
  }));
}

function responseType(response) {
  return block([
    `headers: ${block(["[name: string]: unknown;"])};`,
    response.content ? `content: ${contentType(response.content)};` : "content?: never;",
  ]);
}

function contentType(content) {
  return entries(content, (media) => schemaType(media.schema), JSON.stringify);
}

function schemaType(schema) {
  if (!schema) return "unknown";
  if (schema.$ref) return `components["schemas"][${JSON.stringify(schema.$ref.replace("#/components/schemas/", ""))}]`;
  if (schema.anyOf) return schema.anyOf.map(schemaType).join(" | ");
  const types = [schema.type].flat();
  const type = types.find((candidate) => candidate !== "null");
  const nullable = types.includes("null");
  if (!type && nullable) return "null";
  const result = nonNullType(schema, type);
  return nullable ? `${result} | null` : result;
}

function nonNullType(schema, type) {
  if (schema.enum) return schema.enum.filter((value) => value !== null).map((value) => JSON.stringify(value)).join(" | ");
  if (type === "string" || type === "boolean") return type;
  if (type === "number" || type === "integer") return "number";
  if (type === "array") {
    const itemType = schemaType(schema.items);
    return /[ |]/.test(itemType) ? `(${itemType})[]` : `${itemType}[]`;
  }
  if (type === "object" || schema.properties) {
    const required = new Set(schema.required || []);
    const members = Object.entries(schema.properties || {})
      .map(([name, property]) => member(name, property, required.has(name), schemaType(property)));
    return members.length ? block(members) : "Record<string, never>";
  }
  throw new Error(`Unsupported Site API schema: ${JSON.stringify(schema)}`);
}

function entries(object = {}, type, name = propertyName) {
  return block(Object.entries(object).map(([key, value]) => `${comment(value)}${name(key)}: ${type(value)};`));
}

function member(name, node, required, type) {
  return `${comment(node)}${propertyName(name)}${required ? "" : "?"}: ${type};`;
}

function comment(node) {
  const lines = [];
  if (node.title) lines.push(node.title);
  if (node.format) lines.push(`Format: ${node.format}`);
  if (node.description) lines.push(`@description ${node.description}`);
  if (node.enum) lines.push(`@enum {${[node.type].flat().find((type) => type !== "null")}}`);
  if (node.example !== undefined) lines.push(`@example ${typeof node.example === "string" ? node.example : JSON.stringify(node.example)}`);
  if (lines.length <= 1) return lines.length ? `/** ${lines[0]} */\n` : "";
  return `/**\n${lines.map((line) => ` * ${line}`).join("\n")}\n */\n`;
}

function block(members) {
  return `{\n${members.join("\n").replace(/^/gm, "    ")}\n}`;
}

function propertyName(name) {
  return /^[A-Za-z_$][\w$]*$|^\d+$/.test(name) ? name : JSON.stringify(name);
}
