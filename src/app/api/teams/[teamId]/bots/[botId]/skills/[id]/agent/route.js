import { NextResponse } from 'next/server'
import { consumeStream, convertToModelMessages, hasToolCall, streamText } from 'ai'
import { createOpenAI, openai as openaiProviderDefault } from '@ai-sdk/openai'
import { z } from 'zod'
import embeddableWidgetDocs from '@/pages/documentation/developer/embeddable-chat-widget.md?raw'
import chatAgentDocs from '@/pages/documentation/developer/chat-agent.md?raw'

import { getAuthorizedBotContext } from '@/lib/appRouteAuth'
import { openAiErrorMessage } from '@/lib/openai-error-message'
import { getTeamWithEncryptedOpenAIKey } from '@/lib/dbQueries'
import { decryptKey } from '@/lib/encryption'
import {
  buildSkillContextSummary,
  getSkillFileContent,
  getSkillDraft,
  getSkillDraftDocRef,
  incrementSkillDraftBuilderAgentUsage,
  normalizeEnvBindingForStorage,
  publishSkillDraft,
  replaceSkillMdFrontmatter,
  sanitizeValidationPayload,
  upsertSkillFile,
  updateSkillDraft,
} from '@/lib/skills-builder'
import {
  prepareSkillsBuilderMessagesForModel,
} from '@/lib/skills-builder-chat-recovery'
import { createSkillPatchExecute } from '@/lib/skills-patch-executor'
import { createSkillShellExecute } from '@/lib/skills-shell-executor'
import {
  buildSkillSandboxId,
  SKILLS_SANDBOX_SESSION_ID,
} from '@/lib/skills-sandbox-client'
import { promoteSkillDraftToPublishedCurrent } from '@/lib/skills-r2-package'
import {
  buildSkillsBuilderAgentUsageMetadata,
  countWebSearchToolCallsInSteps,
  isWebSearchToolCallPart,
  SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL,
} from '@/lib/skills-agent-usage'
import { canUserManageBotSettings } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'

const WORKSPACE_ROOT = '/workspace'
const BUILDER_AGENT_MAX_STEPS = 50
const BUILDER_AGENT_STEP_LIMIT_PAUSE_MESSAGE =
  'Paused for safety after many steps. You can tell the builder agent to keep working, and include any direction or corrections you want it to follow.'
const GENERATED_BUNDLE_ARTIFACT_PATH = '.docsbot/bundle/index.js'
const GENERATED_COMPILED_ARTIFACT_PATH = '.docsbot/compiled/index.js'
const DOC_CONTENT_BY_KEY = {
  widget: {
    path: 'src/pages/documentation/developer/embeddable-chat-widget.md',
    content: embeddableWidgetDocs,
  },
  chat_apis: {
    path: 'src/pages/documentation/developer/chat-agent.md',
    content: chatAgentDocs,
  },
  auth_overview: {
    path: 'skills/auth/overview.md',
    content: `# Skill auth providers

Use authProviders when a skill needs API credentials that should not be visible to generated JavaScript. The skill code calls \`ctx.auth.fetch(providerId, request)\`; the runtime validates the provider allowlist, applies authentication internally, performs the request, and returns only the HTTP response.

For authenticated outbound requests, prefer authProviders with provider-scoped allowedDomains and \`ctx.auth.fetch(...)\`. Use global \`networkPolicy.allowedDomains\` with built-in \`fetch()\` only for unauthenticated requests or legacy placeholder-based skills that are already using normal proxy replacement.

Allowed domain entries may be literal hostnames or env binding placeholders such as \`{{SERVICE_HOST}}\`. Env placeholders are valid in both global \`networkPolicy.allowedDomains\` and provider \`authProviders[].allowedDomains\`, but use them only when the hostname is customer-specific or deployment-specific and the skill needs to stay portable. Prefer literal hostnames for stable public API hosts such as \`api.stripe.com\`.

Use \`headerAuth\` for bearer tokens, API keys, and custom static auth headers. Do not treat static bearer/API-key headers as a reason to skip authProviders for new skills.

Read the narrow auth doc for the provider type you need before changing auth-related manifest fields.`,
  },
  auth_basic: {
    path: 'skills/auth/basic.md',
    content: `# basicAuth provider

Use \`basicAuth\` for APIs that require \`Authorization: Basic base64(username:password)\`, such as WordPress Application Passwords.

Manifest example:
\`\`\`json
{
  "envBindings": [{ "envVar": "WORDPRESS_HOST", "description": "WordPress site hostname, for example example.com." }],
  "secretBindings": [
    { "envVar": "WORDPRESS_USERNAME", "description": "WordPress username." },
    { "envVar": "WORDPRESS_APP_PASSWORD", "description": "WordPress application password." }
  ],
  "authProviders": [{
    "id": "wordpress",
    "type": "basicAuth",
    "description": "Authenticates requests to the configured WordPress site.",
    "usernameEnvVar": "WORDPRESS_USERNAME",
    "passwordEnvVar": "WORDPRESS_APP_PASSWORD",
    "allowedDomains": ["{{WORDPRESS_HOST}}"],
    "allowedSchemes": ["https"]
  }]
}
\`\`\`

Code example:
\`\`\`ts
const res = await ctx.auth.fetch("wordpress", {
  url: "https://{{WORDPRESS_HOST}}/wp-json/wp/v2/posts?per_page=5",
  method: "GET",
  headers: { Accept: "application/json" },
});
if (!res.ok) throw new Error(\`WordPress request failed: \${res.status} \${res.text}\`);
const posts = Array.isArray(res.json) ? res.json : [];
\`\`\`

Implementation notes:
- Declare the username and password/application-password as bindings. Use \`secretBindings\` for either value if it is sensitive.
- Use \`allowedDomains\` on the provider, not just the skill-level \`networkPolicy\`, so the credential is scoped to the intended host.
- Dynamic provider hostnames may use env binding placeholders such as \`{{WORDPRESS_HOST}}\` when the site host is customer-specific and the skill needs to be portable; do not use metadata placeholders for hostnames.
- \`ctx.auth.fetch\` returns a plain object with \`ok\`, \`status\`, \`statusText\`, \`headers\`, \`text\`, and optional parsed \`json\`.

Full function example:
\`\`\`ts
import { defineSkillFunction, type SkillContext } from "@docsbot/skills";
import { z } from "zod";

const ListPostsInputSchema = z.object({
  limit: z.number().int().min(1).max(20).default(5),
});

const PostSummarySchema = z.object({
  id: z.number(),
  title: z.string(),
  link: z.string().optional(),
});

const ListPostsOutputSchema = z.object({
  posts: z.array(PostSummarySchema),
});

type ListPostsInput = z.infer<typeof ListPostsInputSchema>;
type ListPostsOutput = z.infer<typeof ListPostsOutputSchema>;

async function listWordPressPosts(
  ctx: SkillContext,
  input: ListPostsInput,
): Promise<ListPostsOutput> {
  const limit = input.limit ?? 5;
  const res = await ctx.auth.fetch("wordpress", {
    url: \`https://{{WORDPRESS_HOST}}/wp-json/wp/v2/posts?per_page=\${encodeURIComponent(String(limit))}\`,
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(\`WordPress request failed: \${res.status} \${res.text.slice(0, 300)}\`);
  }

  const rows = Array.isArray(res.json) ? res.json : [];
  return {
    posts: rows.map((post: any) => ({
      id: Number(post.id),
      title: String(post.title?.rendered || post.title || "Untitled"),
      ...(post.link ? { link: String(post.link) } : {}),
    })),
  };
}

export const listPosts = defineSkillFunction({
  description: "List recent WordPress posts from the configured site.",
  input: ListPostsInputSchema,
  output: ListPostsOutputSchema,
  handler: listWordPressPosts,
});
\`\`\`

Do not ask the user to precompute the Basic header. Do not put the generated Authorization header in code.`,
  },
  auth_header: {
    path: 'skills/auth/header.md',
    content: `# headerAuth provider

Use \`headerAuth\` for bearer tokens, API keys, or custom static auth headers when you want credential-scoped fetch and provider-scoped domains.

Manifest example:
\`\`\`json
{
  "secretBindings": [{ "envVar": "SERVICE_API_KEY", "description": "API key for the service." }],
  "authProviders": [{
    "id": "service",
    "type": "headerAuth",
    "description": "Adds the service API key header.",
    "headers": [{ "name": "Authorization", "valueTemplate": "Bearer {{SERVICE_API_KEY}}" }],
    "allowedDomains": ["api.example.com"],
    "allowedSchemes": ["https"]
  }]
}
\`\`\`

Code example:
\`\`\`ts
const res = await ctx.auth.fetch("service", {
  url: "https://api.example.com/v1/customers/123",
  method: "GET",
  headers: { Accept: "application/json" },
});

if (!res.ok) {
  throw new Error(\`Service request failed: \${res.status} \${res.text.slice(0, 300)}\`);
}

const payload = res.json;
\`\`\`

Multiple headers example:
\`\`\`json
{
  "id": "service",
  "type": "headerAuth",
  "description": "Adds API key and tenant headers.",
  "headers": [
    { "name": "X-API-Key", "valueTemplate": "{{SERVICE_API_KEY}}" },
    { "name": "X-Tenant", "valueTemplate": "{{TENANT_ID}}" }
  ],
  "allowedDomains": ["api.example.com"],
  "allowedSchemes": ["https"]
}
\`\`\`

Implementation notes:
- Prefer \`headerAuth\` for new bearer/API-key integrations so the credential is scoped to specific domains via \`ctx.auth.fetch\`.
- Legacy fetch header placeholders still work for existing simple bearer/API-key skills, but do not choose that pattern for new credentialed requests when \`headerAuth\` fits.
- Do not add Authorization manually in code when the provider injects it; let the runtime own that header.
- Use \`headerAuth\` for static header formats only. Use \`awsSigV4\` or another signing provider for request-specific signatures.`,
  },
  auth_query: {
    path: 'skills/auth/query.md',
    content: `# queryAuth provider

Use \`queryAuth\` only for APIs that require credentials in query parameters.

Manifest example:
\`\`\`json
{
  "secretBindings": [{ "envVar": "SERVICE_API_KEY", "description": "API key for the service." }],
  "authProviders": [{
    "id": "service",
    "type": "queryAuth",
    "description": "Adds the API key query parameter.",
    "params": [{ "name": "api_key", "valueTemplate": "{{SERVICE_API_KEY}}" }],
    "allowedDomains": ["api.example.com"],
    "allowedSchemes": ["https"]
  }]
}
\`\`\`

Code example:
\`\`\`ts
const search = new URLSearchParams({ q: input.query, limit: "10" });
const res = await ctx.auth.fetch("service", {
  url: \`https://api.example.com/v1/search?\${search.toString()}\`,
  method: "GET",
  headers: { Accept: "application/json" },
});

if (!res.ok) {
  throw new Error(\`Search failed: \${res.status} \${res.text.slice(0, 300)}\`);
}
\`\`\`

Implementation notes:
- Avoid this when the API supports headers, because URLs are more likely to be logged by upstream services.
- Do not manually add the credential query parameter in code. The provider appends it.
- Keep user-controlled query parameters separate from provider auth params by building them with \`URLSearchParams\`.
- If a provider needs both query auth and custom headers, prefer \`headerAuth\` if the upstream API allows it. Otherwise ask for runtime support before combining auth mechanisms.`,
  },
  auth_aws_sigv4: {
    path: 'skills/auth/aws-sigv4.md',
    content: `# awsSigV4 provider

Use \`awsSigV4\` for AWS APIs and AWS-compatible APIs, especially S3-compatible storage such as Cloudflare R2, MinIO, Backblaze B2 S3 API, DigitalOcean Spaces, and Wasabi.

The signer uses the actual request URL host and path. This supports custom endpoints and S3-compatible services. Use \`service: "s3"\` for S3-compatible storage unless the provider documents a different signing service. Set \`signingRegion\` when the provider requires a fixed signing region that differs from a display/config region.

Manifest shape:
\`\`\`json
{
  "envBindings": [
    { "envVar": "S3_ENDPOINT_HOST", "description": "S3-compatible endpoint hostname." },
    { "envVar": "S3_REGION", "description": "Signing region required by the provider." }
  ],
  "secretBindings": [
    { "envVar": "S3_ACCESS_KEY_ID", "description": "S3 access key ID." },
    { "envVar": "S3_SECRET_ACCESS_KEY", "description": "S3 secret access key." }
  ],
  "authProviders": [{
    "id": "s3",
    "type": "awsSigV4",
    "description": "Signs requests for the configured S3-compatible endpoint.",
    "accessKeyIdEnvVar": "S3_ACCESS_KEY_ID",
    "secretAccessKeyEnvVar": "S3_SECRET_ACCESS_KEY",
    "regionEnvVar": "S3_REGION",
    "service": "s3",
    "allowedDomains": ["{{S3_ENDPOINT_HOST}}"],
    "allowedSchemes": ["https"],
    "forcePathStyle": true
  }]
}
\`\`\`

Path-style example:
\`\`\`ts
const res = await ctx.auth.fetch("s3", {
  url: "https://{{S3_ENDPOINT_HOST}}/bucket-name/path/object.json",
  method: "GET",
});
\`\`\`

Full function example:
\`\`\`ts
import { defineSkillFunction, type SkillContext } from "@docsbot/skills";
import { z } from "zod";

const ReadObjectInputSchema = z.object({
  bucket: z.string().min(1).describe("Bucket name."),
  key: z.string().min(1).describe("Object key, without a leading slash."),
});

const ReadObjectOutputSchema = z.object({
  bucket: z.string(),
  key: z.string(),
  contentType: z.string().optional(),
  text: z.string(),
});

type ReadObjectInput = z.infer<typeof ReadObjectInputSchema>;
type ReadObjectOutput = z.infer<typeof ReadObjectOutputSchema>;

function s3Path(bucket: string, key: string): string {
  return [bucket, ...key.split("/")]
    .map((part) => encodeURIComponent(part))
    .join("/");
}

async function readObject(
  ctx: SkillContext,
  input: ReadObjectInput,
): Promise<ReadObjectOutput> {
  const path = s3Path(input.bucket, input.key);
  const res = await ctx.auth.fetch("s3", {
    url: \`https://{{S3_ENDPOINT_HOST}}/\${path}\`,
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(\`S3 request failed: \${res.status} \${res.text.slice(0, 300)}\`);
  }

  return {
    bucket: input.bucket,
    key: input.key,
    ...(res.headers["content-type"] ? { contentType: res.headers["content-type"] } : {}),
    text: res.text,
  };
}

export const readS3Object = defineSkillFunction({
  description: "Read a text object from the configured S3-compatible bucket endpoint.",
  input: ReadObjectInputSchema,
  output: ReadObjectOutputSchema,
  handler: readObject,
});
\`\`\`

Upload example:
\`\`\`ts
const res = await ctx.auth.fetch("s3", {
  url: "https://{{S3_ENDPOINT_HOST}}/bucket-name/reports/latest.json",
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ generatedAt: new Date().toISOString(), rows }),
});
if (!res.ok) throw new Error(\`S3 upload failed: \${res.status} \${res.text.slice(0, 300)}\`);
\`\`\`

Caveats:
- Virtual-hosted-style URLs require the bucket host to be covered by \`allowedDomains\`, for example \`bucket.{{S3_ENDPOINT_HOST}}\` or a literal bucket hostname.
- Prefer path-style for generic S3-compatible skills unless the provider requires virtual-hosted style.
- The signer uses the actual request host and path, so custom endpoints work as long as \`allowedDomains\`, \`service\`, and signing region match the provider.
- Do not use AWS SDK clients that require raw credentials in generated skill code. Use \`ctx.auth.fetch\` against the REST API instead.`,
  },
  executable_functions: {
    path: 'skills/executable-functions.md',
    content: `# Executable skill functions

Read this before creating or changing \`scripts/**\`, \`package.json\`, or exported runtime functions.

Executable skills are for capabilities that need code to run, such as API calls, calculations, file generation, or code-driven actions. Markdown-only skills are for simpler behavior that can be described in \`SKILL.md\` and optional \`references/*.md\`.

Required files:
- Author executable code in \`scripts/index.ts\`.
- Include \`package.json\` for executable skills.
- Put \`"zod": "^4.0.0"\` in \`package.json\` dependencies when using \`import { z } from "zod";\`. Do not install it into the workspace; declaring it is enough for remote validation and publish.
- Scripts may depend on npm packages declared in \`package.json\`. If you add one, update \`package.json\` in the bundle. Do not run \`npm install\`, \`npm view\`, or inspect \`node_modules\` just to make validation work; the remote runtime installs/resolves declared dependencies while bundling, and uploaded \`node_modules\` contents are ignored. Use shell installation only when optional local verification truly needs it.

Function contract:
- Import \`defineSkillFunction\` from \`@docsbot/skills\`.
- Import \`z\` from \`zod\`, preferably as \`import { z } from "zod";\`.
- Export named functions with \`export const functionName = defineSkillFunction({...})\`.
- Every exported \`defineSkillFunction(...)\` must include \`description\`, \`input\`, and \`output\`.
- \`input\` and \`output\` must be runtime Zod schema objects created with \`z.object(...)\` or another Zod schema builder. They must not be TypeScript types/interfaces, JSON Schema objects, OpenAI tool schemas, functions that return schemas, examples, or legacy \`inputSchema\`/\`outputSchema\` fields.
- The runtime agent discovers callable functions from named exports, so the export name must be the public function name.
- Define named Zod schema constants, preferably ending in \`Schema\`, then define explicit TypeScript input and output aliases from those schema constants.
- Skill handlers receive arguments in this order: \`handler(ctx, input)\`, where \`ctx\` is the runtime \`SkillContext\` and \`input\` is the object validated against the function's \`input\` Zod schema.
- Never define a two-argument handler as \`(input, ctx)\` or pass a named function with that order. That reverses the runtime context and model-provided input.

Schema design:
- \`description\` should explain when the runtime agent should call the function and what the function does.
- \`input\` must describe only the exact arguments the model truly needs to call the function successfully. Prefer a small, opinionated argument surface over mirroring every upstream API option.
- \`output\` must describe only the structured result fields the deployed agent is likely to use in user responses or downstream chaining.
- Every function output must be valid JSON that matches the declared \`output\` schema. Return structured JSON objects only so the runtime can filter fields and pipe outputs between functions; never return free-form text blobs, markdown, HTML, or other non-JSON content from skill functions.
- If the function can return multiple result variants, express that intentionally in both TypeScript and \`output\` rather than returning ad hoc objects.
- The schemas and named TypeScript aliases you author are used to generate the function context shown to frontend/runtime agents, so include enough structure, field names, descriptions, and result variants for those agents to call functions correctly and interpret outputs reliably.

Implementation guidance:
- Keep implementation logic in a named function and any needed helpers under \`scripts/**\`, not in \`SKILL.md\`.
- Prefer \`handler: namedFunction\` or a thin handler wrapper that delegates to a named function, rather than embedding substantial logic inline inside \`defineSkillFunction(...)\`.
- Do not export plain objects, helper constants, or raw API recipes as callable skill functions. Export only real \`defineSkillFunction(...)\` functions intended for runtime use.
- If there is an official SDK or library for the service you are integrating with, use it to simplify the implementation.
- Minimize external dependencies beyond the SDKs and libraries actually needed for the skill.
- Do not use libraries that rely on FFI, native bindings, or C/C++ extensions.
- Never bake secrets into the code.
- Include proper error handling and logging.
- Include comments explaining complex logic.
- Keep all code in a single file unless the user explicitly asks for a multi-file structure or the complexity clearly requires a helper under \`scripts/**\`.
- If a function consumes fixed deployment config, request metadata, secrets, or network access, register them in the manifest with \`update_manifest\` rather than describing hidden prerequisites in \`SKILL.md\`.

Canonical executable function shape:

\`\`\`ts
import { defineSkillFunction, type SkillContext } from "@docsbot/skills";
import { z } from "zod";

const LookupOrderInputSchema = z.object({
  orderId: z.string().min(1).describe("Order ID supplied by the user."),
});

const LookupOrderOutputSchema = z.object({
  orderId: z.string(),
  status: z.string(),
  total: z.number().optional(),
});

type LookupOrderInput = z.infer<typeof LookupOrderInputSchema>;
type LookupOrderOutput = z.infer<typeof LookupOrderOutputSchema>;

async function lookupOrder(
  ctx: SkillContext,
  input: LookupOrderInput,
): Promise<LookupOrderOutput> {
  const res = await fetch(
    \`https://api.example.com/orders/\${encodeURIComponent(input.orderId)}\`,
    { headers: { Authorization: "Bearer {{SERVICE_API_KEY}}" } },
  );
  if (!res.ok) {
    throw new Error(\`Order lookup failed: \${res.status}\`);
  }
  const order = await res.json();
  return {
    orderId: input.orderId,
    status: String(order.status || "unknown"),
    ...(typeof order.total === "number" ? { total: order.total } : {}),
  };
}

export const lookupOrderById = defineSkillFunction({
  description: "Look up an order by ID when the user asks for order status.",
  input: LookupOrderInputSchema,
  output: LookupOrderOutputSchema,
  handler: lookupOrder,
});
\`\`\`

Validation guidance:
- Author source files only. Do not try to manually create or fix generated artifacts; \`validate_skill_bundle\` and \`publish_skill_bundle\` handle that platform work.
- When validation fails, first inspect the returned validation errors and authored bundle files such as \`scripts/index.ts\`, \`package.json\`, and \`SKILL.md\`.
- Do not debug \`/workspace/node_modules\`, hidden package-manager directories, npm registry state, or local package cache layouts unless a local shell command explicitly failed because a package is missing.`,
  },
  artifacts_files: {
    path: 'skills/artifacts-files.md',
    content: `# Artifacts and generated files

Read this when a skill function creates a user-viewable or downloadable file, such as an image, PDF, CSV, HTML report, document, chart, spreadsheet, or generated text file.

Supported bundle files:
- \`SKILL.md\`
- \`references/*.md\`
- \`assets/*\`
- \`scripts/index.ts\`
- helper files under \`scripts/**\`
- \`package.json\`

Runtime artifacts:
- When a function generates a file the user should view or download, call \`await ctx.artifacts.publish({ filename, contentType, body })\` from the handler.
- The \`filename\` is a user-facing display/download name and does not need to be globally unique; the runtime adds a UUID to the stored artifact path.
- The publish call returns an artifact object shaped like \`{ url, key, filename, contentType, expiresAt }\`, not a bare string URL.
- Do not return large generated file contents directly in JSON. Publish the file as an artifact and return fields such as \`url\`, \`filename\`, and \`contentType\` instead.
- Do not publish secrets, credentials, private tokens, or sensitive files as artifacts; artifact URLs are public links intended to be shown to end users.

Output schema example:
\`\`\`ts
const ArtifactSchema = z.object({
  url: z.string().url(),
  key: z.string(),
  filename: z.string(),
  contentType: z.string(),
  expiresAt: z.string(),
});

const ExportReportOutputSchema = z.object({
  artifact: ArtifactSchema,
});
\`\`\`

Publishing example:
\`\`\`ts
import { defineSkillFunction, type SkillContext } from "@docsbot/skills";
import { z } from "zod";

const ExportReportInputSchema = z.object({
  title: z.string().min(1),
});

const ArtifactSchema = z.object({
  url: z.string().url(),
  key: z.string(),
  filename: z.string(),
  contentType: z.string(),
  expiresAt: z.string(),
});

const ExportReportOutputSchema = z.object({
  artifact: ArtifactSchema,
});

type ExportReportInput = z.infer<typeof ExportReportInputSchema>;
type ExportReportOutput = z.infer<typeof ExportReportOutputSchema>;

async function exportReport(
  ctx: SkillContext,
  input: ExportReportInput,
): Promise<ExportReportOutput> {
  const body = \`<!doctype html><html><body><h1>\${input.title}</h1></body></html>\`;
  const artifact = await ctx.artifacts.publish({
    filename: "report.html",
    contentType: "text/html; charset=utf-8",
    body,
  });
  return { artifact };
}

export const exportReportHtml = defineSkillFunction({
  description: "Generate an HTML report and return a link the user can open.",
  input: ExportReportInputSchema,
  output: ExportReportOutputSchema,
  handler: exportReport,
});
\`\`\`

Common content types:
- HTML: \`text/html; charset=utf-8\`
- CSV: \`text/csv; charset=utf-8\`
- JSON: \`application/json\`
- Plain text: \`text/plain; charset=utf-8\`
- PDF: \`application/pdf\`
- PNG: \`image/png\`
- SVG: \`image/svg+xml\`

Caveats:
- If the artifact contains binary content, pass a supported binary body type from the runtime environment rather than stringifying raw bytes.
- If the function needs to produce multiple files, return an array of artifact objects in the output schema.
- Keep generated filenames clear and user-facing, for example \`refund-report.csv\` or \`site-audit.html\`.
- The runtime handles storage paths and public URLs; do not manually construct artifact URLs.`,
  },
}
export const maxDuration = 800

const HOST_ENV_PLACEHOLDER_RE = /^\{\{([A-Za-z_][A-Za-z0-9_]*)\}\}$/
const HOST_LABEL_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
const BLOCKED_HOST_SUFFIXES = ['.localhost', '.local', '.internal', '.lan']

function isIpLiteralHostname(host) {
  const value = String(host || '').trim()
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(value)) return true
  return value.includes(':')
}

function validateAllowedHostnameEntry(value) {
  const host = String(value || '').trim()
  if (!host) return 'Allowed domain must be a non-empty hostname.'
  const placeholder = host.match(HOST_ENV_PLACEHOLDER_RE)
  if (placeholder) return null
  if (host.includes('{{') || host.includes('}}')) {
    return 'Allowed domain placeholders must be exactly one env binding placeholder like {{SERVICE_HOST}}.'
  }
  if (host.includes('*')) return 'Wildcard allowed domains are not supported. Use an exact hostname or an env placeholder like {{SERVICE_HOST}}.'
  if (host.includes('://') || host.includes('/') || host.includes('?') || host.includes('#')) {
    return 'Allowed domains must be hostnames only, not URLs or paths.'
  }
  if (host.includes('@')) return 'Allowed domains must not include credentials or @.'
  if (host.includes(':')) return 'Allowed domains must not include ports. Use only the hostname.'
  if (isIpLiteralHostname(host)) return 'IP literal allowed domains are not supported.'
  const lower = host.toLowerCase().replace(/\.$/, '')
  if (lower === 'localhost' || BLOCKED_HOST_SUFFIXES.some((suffix) => lower.endsWith(suffix))) {
    return 'Local or private hostnames such as localhost, .local, .internal, and .lan are not allowed.'
  }
  if (!lower.includes('.')) {
    return 'Allowed domains must be fully qualified hostnames such as api.example.com, or an env placeholder like {{SERVICE_HOST}}.'
  }
  if (lower.length > 253) return 'Allowed domain hostname is too long.'
  const labels = lower.split('.')
  if (labels.some((label) => !HOST_LABEL_RE.test(label))) {
    return 'Allowed domain must be a valid hostname with DNS labels containing only letters, numbers, and hyphens.'
  }
  return null
}

const allowedDomainSchema = z
  .string()
  .trim()
  .min(1)
  .superRefine((value, ctx) => {
    const message = validateAllowedHostnameEntry(value)
    if (message) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message })
    }
  })

function collectAllowedDomainPlaceholderErrors(input, latest) {
  const existingEnvBindings = latest?.envBindings || latest?.manifest?.envBindings || []
  const incomingEnvBindings = Array.isArray(input?.envBindings) ? input.envBindings : []
  const envNames = new Set(
    [
      ...(Array.isArray(existingEnvBindings) ? existingEnvBindings : []),
      ...incomingEnvBindings,
    ]
      .map((binding) => String(binding?.envVar || '').trim())
      .filter(Boolean),
  )
  const errors = []
  const checkDomains = (domains, field) => {
    for (const domain of Array.isArray(domains) ? domains : []) {
      const match = String(domain || '').trim().match(HOST_ENV_PLACEHOLDER_RE)
      if (match && !envNames.has(match[1])) {
        errors.push(`${field} uses {{${match[1]}}}, but ${match[1]} is not declared in envBindings. Add envBindings entry { envVar: '${match[1]}', value: '...' } or use a literal hostname.`)
      }
    }
  }
  checkDomains(input?.networkPolicy?.allowedDomains, 'networkPolicy.allowedDomains')
  for (const provider of Array.isArray(input?.authProviders) ? input.authProviders : []) {
    checkDomains(provider?.allowedDomains, `authProviders.${provider?.id || '(missing id)'}.allowedDomains`)
  }
  return errors
}

function allowedDomainWarningKey(value) {
  const domain = String(value || '').trim()
  const placeholder = domain.match(HOST_ENV_PLACEHOLDER_RE)
  return placeholder ? `{{${placeholder[1]}}}` : domain.toLowerCase().replace(/\.$/, '')
}

function collectDuplicateAuthAllowedDomainWarnings(manifest) {
  const globalDomains = manifest?.networkPolicy?.allowedDomains || []
  const globalDomainKeys = new Map(
    (Array.isArray(globalDomains) ? globalDomains : [])
      .map((domain) => [allowedDomainWarningKey(domain), String(domain || '').trim()])
      .filter(([key]) => key),
  )
  if (!globalDomainKeys.size) return []

  const duplicatesByProvider = []
  for (const provider of Array.isArray(manifest?.authProviders) ? manifest.authProviders : []) {
    const duplicateDomains = [
      ...new Set(
        (Array.isArray(provider?.allowedDomains) ? provider.allowedDomains : [])
          .map((domain) => allowedDomainWarningKey(domain))
          .filter((key) => globalDomainKeys.has(key))
          .map((key) => globalDomainKeys.get(key)),
      ),
    ]
    if (duplicateDomains.length) {
      duplicatesByProvider.push(`${provider.id || '(missing id)'}: ${duplicateDomains.join(', ')}`)
    }
  }

  if (!duplicatesByProvider.length) return []
  return [
    `These domains are listed in both global networkPolicy.allowedDomains and authProviders[].allowedDomains (${duplicatesByProvider.join('; ')}). For authenticated requests, prefer the auth provider scoped allowedDomains when possible, and keep the global allowlist only for unauthenticated fetch() calls or legacy placeholder-based skills.`,
  ]
}

const loadContextInputSchema = z
  .object({})
  .describe(
    'No parameters. Load the latest skill draft context from the server, including manifest, file tree, validation state, and live test state.',
  )

const authProviderBaseSchema = z.object({
  id: z.string().trim().min(1).regex(/^[a-z][a-z0-9_-]*$/),
  description: z.string().trim().min(1).max(180),
  allowedDomains: z.array(allowedDomainSchema).min(1),
  allowedSchemes: z.array(z.string().trim().min(1)).optional().default(['https']),
})

const authProviderSchema = z.discriminatedUnion('type', [
  authProviderBaseSchema.extend({
    type: z.literal('basicAuth'),
    usernameEnvVar: z.string().trim().min(1),
    passwordEnvVar: z.string().trim().min(1),
  }),
  authProviderBaseSchema.extend({
    type: z.literal('headerAuth'),
    headers: z.array(
      z.object({
        name: z.string().trim().min(1),
        valueTemplate: z.string().trim().min(1),
      }),
    ).min(1),
  }),
  authProviderBaseSchema.extend({
    type: z.literal('queryAuth'),
    params: z.array(
      z.object({
        name: z.string().trim().min(1),
        valueTemplate: z.string().trim().min(1),
      }),
    ).min(1),
  }),
  authProviderBaseSchema.extend({
    type: z.literal('awsSigV4'),
    accessKeyIdEnvVar: z.string().trim().min(1),
    secretAccessKeyEnvVar: z.string().trim().min(1),
    sessionTokenEnvVar: z.string().trim().min(1).optional(),
    service: z.string().trim().min(1),
    region: z.string().trim().min(1).optional(),
    regionEnvVar: z.string().trim().min(1).optional(),
    endpointEnvVar: z.string().trim().min(1).optional(),
    signingRegion: z.string().trim().min(1).optional(),
    forcePathStyle: z.boolean().optional(),
  }),
])

const updateManifestInputSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3)
      .max(64)
      .optional()
      .describe(
        'User-friendly dashboard display name for this skill. This renames the label shown in the dashboard and search only; it does not change the stable skill id, filesystem path, or SKILL.md frontmatter name.',
      ),
    description: z
      .string()
      .min(1)
      .optional()
      .describe(
        'Human-readable summary of what the skill does and when it should be used. Keep aligned with SKILL.md frontmatter description.',
      ),
    internal: z
      .boolean()
      .optional()
      .describe(
        'If true, the skill is intended for internal operators only; otherwise treat it as customer-facing.',
      ),
    networkPolicy: z
      .object({
        allowedDomains: z.array(allowedDomainSchema).optional(),
        allowedSchemes: z.array(z.string()).optional().default(['https']),
      })
      .optional()
      .describe('Outbound policy for the deployed skill runtime.'),
    envBindings: z
      .array(
        z.object({
          envVar: z.string().trim().min(1),
          value: z
            .union([
              z.string().trim().min(1),
              z.number(),
              z.boolean(),
            ])
            .optional()
            .describe(
              'Non-secret saved scalar value for this env var. Omit `value` to keep the previously saved scalar for this key when only updating descriptions, options, or reordering bindings. If `options` is present and `value` is non-empty, `value` must exactly match one of the option keys. Runtime code reads this scalar from `ctx.env.ENV_VAR` or via `{{ENV_VAR}}` placeholders.',
            ),
          options: z
            .record(z.string().trim().min(1), z.string().trim().min(1))
            .optional()
            .describe(
              'Optional public single-select dropdown choices for this bot deployment. Keys are the saved scalar values; values are user-facing labels. When setting options, also set `value` to one of these keys unless intentionally leaving the binding unconfigured. Use only for deployment-scoped choices that stay fixed across skill calls, such as region, data residency, API environment, account mode, support tier, or model/provider variant. Do not use for per-request/user choices; those belong in function input enum schemas. Example: { "gpt-image-1.5": "GPT Image 1.5", "gpt-image-1": "GPT Image 1", "gpt-image-1-mini": "GPT Image 1 Mini" }.',
            ),
          description: z
            .string()
            .trim()
            .max(160)
            .optional()
            .describe(
              'Optional short user-facing explanation of what this environment value is for. Keep it to one sentence.',
            ),
        }),
      )
      .optional()
      .describe(
        'Static non-secret env vars to expose to runtime code and placeholder substitution. Each item is { envVar, value?, options?, description? }. Use scalar `value` for the currently saved value. Add optional object-map `options` when the dashboard should render a single-select dropdown for bot deployment configuration, e.g. { "envVar": "DEFAULT_MODEL", "value": "gpt-image-1.5", "options": { "gpt-image-1.5": "GPT Image 1.5", "gpt-image-1": "GPT Image 1" } }. Use dropdown env bindings only for public deployment-scoped choices that remain fixed for the bot. Do not use env binding dropdowns for dynamic per-skill-call choices; model those as function input enum fields instead.',
      ),
    metadataBindings: z
      .array(
        z.object({
          envVar: z.string().trim().min(1),
          metadataKey: z.string().trim().min(1),
          description: z
            .string()
            .trim()
            .max(160)
            .optional()
            .describe(
              'Optional short user-facing explanation of what this metadata value is for. Keep it to one sentence.',
            ),
        }),
      )
      .optional()
      .describe(
        'Metadata bindings to expose dynamic, per-user/session scoped values to runtime code. The model may optionally prefill a short one-sentence description for each binding.',
      ),
    secretBindings: z
      .array(
        z.object({
          envVar: z.string().trim().min(1),
          description: z
            .string()
            .trim()
            .max(160)
            .optional()
            .describe(
              'Optional short user-facing explanation of what this secret is for. Keep it to one sentence.',
            ),
        }),
      )
      .optional()
      .describe(
        'Secret-backed env var names required by the skill. These are exposed as {{ENV_VAR_NAME}} placeholders in outbound URLs and headers to be replaced with the actual secret values at runtime via proxy.',
      ),
    authProviders: z
      .array(authProviderSchema)
      .optional()
      .describe(
        'Named credential-scoped fetch providers. Use read_docs auth_* pages before adding these. The skill code calls ctx.auth.fetch(providerId, request); raw secrets and generated auth headers are never exposed to skill code.',
      ),
  })
  .describe(
    'Partial manifest update. Include only keys you are changing. Omitted keys keep their previous values.',
  )

const askUserChoiceOptionSchema = z.object({
  id: z.string().min(1),
  label: z
    .string()
    .min(1)
    .describe(
      'User-visible option label. If you believe one option is clearly best, append " (recommended)" to that option label and only that option label.',
    ),
})

const askUserMultipleChoiceQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  kind: z.literal('multiple_choice'),
  options: z.array(askUserChoiceOptionSchema).min(2).max(24),
  allowMultiple: z.boolean().optional(),
})

const askUserOpenEndedQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  kind: z.literal('open_ended'),
  placeholder: z.string().optional(),
  optional: z.boolean().optional(),
})

const askUserQuestionsInputSchema = z.object({
  intro: z.string().optional(),
  questions: z
    .array(
      z.discriminatedUnion('kind', [
        askUserMultipleChoiceQuestionSchema,
        askUserOpenEndedQuestionSchema,
      ]),
    )
    .min(1)
    .max(12),
})

const readDocsInputSchema = z.object({
  doc: z
    .enum([
      'widget',
      'chat_apis',
      'auth_overview',
      'auth_basic',
      'auth_header',
      'auth_query',
      'auth_aws_sigv4',
      'executable_functions',
      'artifacts_files',
    ])
    .describe(
      "Which documentation to load. Use 'widget' for embeddable chat widget setup, 'chat_apis' for chat API docs, auth_* docs for skill auth provider guidance, 'executable_functions' before writing runtime code, and 'artifacts_files' before generating files.",
    ),
})

async function validateDraftAgainstRuntime({ draft, teamId, botId, firestore }) {
  const runtimeUrl = process.env.SKILLS_RUNTIME_URL
  const runtimeToken = process.env.SKILLS_RUNTIME_TOKEN

  if (!runtimeUrl) {
    throw new Error('SKILLS_RUNTIME_URL is not configured. The builder cannot validate without it.')
  }

  const response = await fetch(`${runtimeUrl.replace(/\/$/, '')}/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(runtimeToken ? { Authorization: `Bearer ${runtimeToken}` } : {}),
    },
    body: JSON.stringify({
      skillName: draft.skillName,
      r2Prefix: draft.r2Prefix,
      manifest: {
        networkPolicy: draft.networkPolicy || { allowedDomains: [], allowedSchemes: ['https'] },
        envBindings: draft.envBindings || [],
        secretBindings: draft.secretBindings || [],
        metadataBindings: draft.metadataBindings || [],
        authProviders: draft.authProviders || [],
      },
      files: (draft.files || [])
        .map((file) => ({
          path: file.path,
          content: file.content,
        }))
        .filter(
          (file) =>
            file.path !== GENERATED_BUNDLE_ARTIFACT_PATH &&
            file.path !== GENERATED_COMPILED_ARTIFACT_PATH,
        ),
    }),
  })

  const payload = await response.json().catch(() => ({
    valid: false,
    errors: ['Invalid runtime test response.'],
    warnings: [],
  }))

  const sanitizedPayload = sanitizeValidationPayload(payload)

  const updated = await updateSkillDraft(
    teamId,
    botId,
    draft.skillName,
    {
      manifest: {
        hasFunctions: Boolean(sanitizedPayload?.hasFunctions),
      },
      validation: sanitizedPayload,
    },
    firestore,
  )

  return {
    ok: response.ok && Boolean(sanitizedPayload?.valid),
    payload: sanitizedPayload,
    draft: updated,
    status: response.status,
  }
}

async function publishDraftBundle({ draft, teamId, botId, userId, firestore }) {
  let latestDraft = draft

  if (!latestDraft.validation?.valid) {
    const validationResult = await validateDraftAgainstRuntime({
      draft: latestDraft,
      teamId,
      botId,
      firestore,
    })
    latestDraft = validationResult.draft

    if (!validationResult.ok) {
      return {
        ok: false,
        draft: latestDraft,
        message:
          validationResult.payload?.message ||
          validationResult.payload?.error ||
          'Validation failed before publish.',
        validation: validationResult.payload,
      }
    }

  }

  const promoted = await promoteSkillDraftToPublishedCurrent(latestDraft.r2Prefix)
  if (!promoted.configured) {
    return {
      ok: false,
      draft: latestDraft,
      message: promoted.message || 'Skills R2 storage is not configured.',
    }
  }

  const published = await publishSkillDraft(
    {
      teamId,
      botId,
      skillName: latestDraft.skillName,
      userId,
      hasFunctions: Boolean(latestDraft.validation?.hasFunctions),
    },
    firestore,
  )

  return {
    ok: true,
    draft: published,
    result: {
      valid: true,
      uploaded: true,
      promoted: promoted.promoted,
      deleted: promoted.deleted,
    },
  }
}
 
function buildSystemPrompt(draft) {
  const audience = draft.manifest?.internal ? 'internal-only' : 'customer-facing'

  return `## Identity
You are the DocsBot Skills Builder coding agent. You help a non-technical DocsBot customer create, revise, validate, and publish a DocsBot skill bundle through this conversation.

A **DocsBot skill** is a versioned package attached to one bot. It always includes \`SKILL.md\` (how the live agent should behave) and may add reference files and, for executable skills, bundled TypeScript the runtime runs. It is not a separate product: it extends this bot’s user chat behavior together with the model, tools, and other settings.

**Why the user has you build them:** To enable new capabilities for their agent (bot) by defining how it should behave, and which steps to take for recurring scenarios—and, when needed, to expose those steps as **functions** the agent calls (typed actions to run code or perform API calls or other remote interactions) instead of improvising or pasting ad hoc integration instructions into chat.

**How they are used at runtime:** After **publish**, the deployed DocsBot agent (bot) uses the skill when a conversation matches what the skill is for: it follows SKILL.md instructions, reads bundled references, and calls exported \`defineSkillFunction\` handlers when a structured action is needed. Published skills can also be offered in the **embeddable chat widget** as user-triggered quick actions; **public** bots only allow **customer-facing** skills in that context, where actions generic or scoped to the specific customer/user interacting with the bot.**internal** skills are for private or staff-side use and may expose more powerful capabilities. This skill is intended for a **${audience}** audience unless the user requests you to change that.

## Context
Build or revise the skill bundle named ${draft.skillName}. The working filesystem root is ${WORKSPACE_ROOT}.

## Runtime file mapping
- The deployed runtime root for this skill is \`/skills/${draft.skillName}/\`.
- Only reference markdown or asset files that belong to this skill. Never cross-reference files from other skills.
- Any cross-reference you author for the runtime agent should use either a path relative to this skill root or an absolute \`/skills/${draft.skillName}/...\` path.
- In the runtime environment, skills are mounted under \`/skills/NAME/...\`. Do not reference \`/.agents/...\` paths.

## Core workflow
- When building a new skill, start by planning the intended behavior before editing files: identify the trigger/use case, expected user-facing outcome, needed function(s), external services, required bindings, and validation path.
- If the user's request leaves meaningful uncertainty about scope, audience, workflow, authentication method, required fields, data source, or success criteria, call \`ask_user_questions\` before implementing. Prefer a short set of specific multiple-choice questions with a "option (recommended)" option when you can make a good default recommendation.
- Use the apply_patch tool for creating, updating, or deleting bundle files under ${WORKSPACE_ROOT}. The apply_patch operation.path must be relative to ${WORKSPACE_ROOT}, for example "scripts/index.ts" or "SKILL.md", not "${WORKSPACE_ROOT}/scripts/index.ts". If you need to rename a file, use shell tool.
- Use the shell tool mainly for inspecting authored source files under ${WORKSPACE_ROOT}, optional local verification, and other CLI workflows that support authoring.
- Treat ${WORKSPACE_ROOT} as the only writable bundle root.
- Use the \`update_manifest\` tool for manifest changes.
- The \`update_manifest.name\` field is a user-facing display label for dashboard/search only. It does not change the stable skill id, package path, or SKILL.md frontmatter \`name\`.
- Use \`ask_user_questions\` when the user must choose a direction, clarify requirements, confirm a plan, or provide non-secret information that cannot reasonably be represented as a configurable manifest binding. When you call it, make that call the only action in the step and stop immediately. Do not call another tool, continue reasoning, or write a fallback text question after \`ask_user_questions\`; wait for the form response.
- Use the \`validate_skill_bundle\` tool after meaningful edits. It validates the current draft files against the remote skill runtime, which is the source of truth for bundle errors.
- If \`validate_skill_bundle\` returns \`ok: true\` or \`validation.valid: true\`, treat validation as passed. Do not continue troubleshooting validation, import, dependency, or package-install issues from earlier reasoning; proceed to publish if the skill is otherwise ready.
- Use the \`publish_skill_bundle\` tool before claiming the task is complete.
- \`publish_skill_bundle\` is not a stopping or pausing tool. After it succeeds, always continue and if done working, send a final assistant message in the same turn. Do not end the turn with only the tool result. Briefly tell the user that the skill was published and summarize the important changes.
- Do not generate, repair, or hand-author platform-generated artifacts yourself. Write source files, then use \`validate_skill_bundle\` and \`publish_skill_bundle\`.

## User-facing messaging
- Do not mention internal platform identifiers, package names, or infrastructure names in user-visible messages.
- Describe your actions in plain language, for example: "I updated the instructions", "I ran validation", or "the skill was published".

## Platform rules
- This chat is the only editing surface. Do not ask the user to manually edit files or manifest fields.
- Do not ask the user to paste secrets, tokens, or integration IDs into chat. Declare required secretBindings instead.
- Build skills as reusable templates for any team that installs them. Do not hard-code a customer's domains, workspace IDs, tenant IDs, account IDs, project IDs, helpdesk hosts, channel IDs, regions, email addresses, or similar deployment-specific values in code, SKILL.md, package files, references, or examples. Model these as env bindings, secret bindings, or metadata bindings in the manifest.
- Keep all authored files within the supported skill bundle layout.
- Before creating or changing executable TypeScript functions, call \`read_docs\` with \`doc: "executable_functions"\`.
- Use TypeScript and ES modules for executable code. Never use Service Worker format.
- Executable skills must export real \`defineSkillFunction(...)\` functions with runtime Zod \`input\` and \`output\` schemas.
- Handler argument order is \`handler(ctx, input)\`; never reverse it.
- Function outputs must be structured JSON that matches the declared output schema.
- If a function generates a file or downloadable artifact, call \`read_docs\` with \`doc: "artifacts_files"\` before writing the implementation.
- Never bake secrets into the code.
- Include proper error handling and logging.
- Author source files only. Do not try to manually create or fix generated artifacts; \`validate_skill_bundle\` and \`publish_skill_bundle\` handle that platform work.
- Keep SKILL.md concise and operational.
- Treat the current audience as ${audience} unless the user explicitly changes it.
- Do not use web_search to look up DocsBot.ai documentation, this skills builder, or how skills work in this environment.

## Progressive docs index
- \`widget\`: Read when the user needs embeddable chat widget setup or help passing manifest-defined metadata from widget embed code.
- \`chat_apis\`: Read when the user needs chat API or chat agent API details.
- \`auth_overview\`: Read before designing authenticated outbound requests, provider-scoped allowlists, or any \`authProviders\` setup.
- \`auth_basic\`: Read for Basic Auth APIs such as WordPress Application Passwords or username + password/API-key credentials.
- \`auth_header\`: Read for bearer tokens, API-key headers, or custom static auth headers that should use credential-scoped \`ctx.auth.fetch\`.
- \`auth_query\`: Read only for APIs that require API keys or credentials in query parameters.
- \`auth_aws_sigv4\`: Read for AWS APIs or AWS-compatible APIs, especially S3-compatible storage endpoints such as R2, MinIO, B2, Spaces, and Wasabi.
- \`executable_functions\`: Read before creating or changing \`scripts/**\`, \`package.json\`, or exported \`defineSkillFunction\` runtime functions.
- \`artifacts_files\`: Read when a function creates a user-viewable or downloadable file, and when deciding supported bundle file locations.

## Env, secrets, and customer metadata in \`update_manifest\` and scripts
- **Register in the manifest** (via \`update_manifest\`): \`envBindings\` is \`{ envVar, value?, options?, description? }\` for fixed non-secret deployment config such as workspace IDs, tenant IDs, account IDs, regions, or environment names. Omit \`value\` to keep the current saved value for that env var. Use a scalar \`value\` for a normal text field.
- **Multiple-choice public env bindings:** When the bot owner must choose one value from a fixed public list for this bot deployment, create a dropdown with scalar \`value\` plus an optional \`options\` object. \`options\` maps saved values to display labels. Example: \`{ "envVar": "DEFAULT_MODEL", "value": "gpt-image-1.5", "options": { "gpt-image-1.5": "GPT Image 1.5", "gpt-image-1": "GPT Image 1", "gpt-image-1-mini": "GPT Image 1 Mini" }, "description": "Default image generation model." }\`. The UI renders a single-select dropdown, stores exactly one selected scalar string in \`value\`, and runtime code reads that scalar from \`ctx.env.ENV_VAR\` or via \`{{ENV_VAR}}\` placeholders. If \`options\` is present and \`value\` is non-empty, \`value\` must exactly match one of the option keys. Do not put arrays or objects in \`value\`.
- **When to use env dropdowns:** Use multiple-choice env bindings only for deployment-scoped choices that stay fixed across skill calls for this bot, such as service region, data residency, API environment, fixed account mode, support tier, or model/provider variant. Do not use env dropdowns for dynamic choices made during each skill usage, choices that depend on the end user/session, or choices the model should decide per request. Those belong in \`defineSkillFunction\` input schemas as enum/union fields, or in \`metadataBindings\` if supplied by widget/session context.
- \`secretBindings\` is \`{ envVar, description? }\` per credential (declare **names only**; never put secret values in chat, bundle files, or *.md). \`metadataBindings\` is \`{ envVar, metadataKey, description? }\` for each value supplied from the widget embed or chat context (\`metadataKey\` matches what the customer sets in embed configuration).
- **Portability rule:** Account-specific non-secret values, including hosts/domains, workspace IDs, tenant IDs, project IDs, channel IDs, regions, and similar identifiers, belong in \`envBindings\` and should be read from \`ctx.env\` or used as \`{{ENV_VAR_NAME}}\` placeholders. If the value varies per end user or session, use \`metadataBindings\` instead. If the value is a credential, token, API key, webhook secret path, or other sensitive value, use \`secretBindings\`.
- **Allowed domain placeholders:** Normal env binding placeholders such as \`{{SERVICE_HOST}}\` may be used in both global \`networkPolicy.allowedDomains\` and provider \`authProviders[].allowedDomains\`. Use placeholder hostnames only when necessary for a portable skill because the hostname is customer-specific or deployment-specific. Prefer literal hostnames for stable public API hosts.
- **Do not ask for identifiers just to code them in.** If a skill needs a service host, workspace or channel ID, repository owner/name, tenant or organization ID, account ID, subdomain, or comparable customer-specific identifier, declare a descriptive env binding such as \`SERVICE_DOMAIN\`, \`WORKSPACE_ID\`, \`CHANNEL_ID\`, \`REPOSITORY_OWNER\`, \`TENANT_ID\`, or \`ACCOUNT_ID\`. This allows the skill to be ported to other teams without updating code. Ask the user only when there is no reasonable generic binding design or when the user must choose between product behaviors.
- **Binding descriptions:** When a binding would be confusing to a non-technical user, include a short one-sentence \`description\` in the manifest update so the UI can explain what the value is for.
- **Env bindings:** The runtime exposes declared env bindings in \`ctx.env\` and as \`{{ENV_VAR_NAME}}\` placeholders in outbound URLs and headers. Use env bindings for non-secret config that stays fixed for this skill bot deployment, not for per-user/session values.
- **Metadata:** The runtime passes metadata bindings into the skill handler through \`ctx.metadata\` (allowlisted values keyed by \`metadataKey\`). Treat missing keys safely. Use metadata for per-user/session context such as user email, customer ID, etc., not for fixed deployment config or raw secrets.
- **Proxy placeholders:** Env bindings, secret bindings, and metadata binding \`envVar\` names can be used as \`{{ENV_VAR_NAME}}\` placeholders in outbound HTTP request URLs and request header values. Use \`ctx.env\` / \`ctx.metadata\` when code logic needs the value; use \`{{ENV_VAR_NAME}}\` when the value only needs to be inserted into an outbound request by the proxy.
- **URL placeholder shape:** Do not use a placeholder as the entire \`fetch\` or \`new Request\` URL, such as \`fetch("{{SLACK_WEBHOOK_URL}}")\`; that URL is invalid before the proxy can rewrite it. Keep the scheme and host literal, and put placeholders only in path segments, query parameters, or headers. For Slack webhooks, register a secret such as \`SLACK_WEBHOOK_PATH\` containing only the path after \`/services/\`, then call \`fetch("https://hooks.slack.com/services/{{SLACK_WEBHOOK_PATH}}", ...)\`.
- **Secrets:** Decrypted secrets are never available in skill code and can not be read from \`ctx.env\`, \`ctx.metadata\`, or \`process.env\`. Secret values may only be referenced as \`{{ENV_VAR_NAME}}\` placeholders in outbound URLs and header values.
- **API authentication:** For authenticated outbound requests, prefer \`authProviders\` with provider-scoped \`allowedDomains\` and \`ctx.auth.fetch(...)\`. Use global \`networkPolicy.allowedDomains\` with built-in \`fetch()\` only for unauthenticated requests or legacy placeholder-based skills that are already using normal proxy replacement. For Basic Auth, static header auth, query auth, AWS SigV4 signing, credential-scoped customer hosts, or anything where raw credentials or computed auth headers should stay outside skill code, call \`read_docs\` with \`auth_overview\` and then the specific supported \`auth_*\` page before editing code or \`authProviders\`.
- **Built-in runtime values:** \`DOCSBOT_TEAM_ID\`, \`DOCSBOT_BOT_ID\`, \`DOCSBOT_CONVERSATION_ID\`, and \`DOCSBOT_SKILL_NAME\` are always available. They are rarely needed, but they can be read from \`ctx.env\` or used as proxy placeholders like \`{{DOCSBOT_TEAM_ID}}\` when appropriate.

## SKILL.md authoring rules
- SKILL.md is the runtime skill file for the finished skill, not a builder checklist.
- Write SKILL.md for the agent that will use the skill in production, not for the builder agent.
- The Overview section should explain what the skill does, when it should be used, and any important execution context the runtime agent needs.
- SKILL.md should describe agent behavior, decision-making, and how the agent should use generated skill functions. It should not be written like implementation notes for a developer.
- Do not put raw API call instructions, request URLs, HTTP parameter recipes, shell commands, coding steps, or TypeScript implementation tasks into SKILL.md.
- If the skill needs external APIs or code-driven actions, those should be implemented in scripts/index.ts or helper files. SKILL.md should only tell the runtime agent when to call those functions, what information to gather first, how to handle ambiguity, and what outcome to produce for the user.
- Do not include builder-only instructions in SKILL.md such as how to build the skill, how to use apply_patch or shell, progressive disclosure guidance, validation steps, publish steps, or secret-handling reminders meant for authors.
- The Constraints section should contain only real runtime constraints for the skill itself, such as business rules, safety rules, API limitations, or things the runtime agent must avoid.
- Keep the frontmatter valid and separated from the markdown body with a blank line after the closing --- marker.

## Validation and publish
- \`validate_skill_bundle\` validates the current draft bundle and updates validation state.
- \`publish_skill_bundle\` publishes the validated draft bundle.
- \`validate_skill_bundle\` and \`publish_skill_bundle\` handle platform-managed generated artifacts; they are not the coding agent's job to create or repair manually.
- Do not claim completion until \`publish_skill_bundle\` succeeds, or you can clearly explain the blocker.
- A successful publish tool result is not a user-facing completion by itself and must not stop the agent. Follow it with a concise assistant message so the conversation never ends silently after publishing.
`.trim()
}

function stepIncludesToolCall(step, toolName) {
  return Array.isArray(step?.toolCalls) && step.toolCalls.some((toolCall) => toolCall?.toolName === toolName)
}

export async function POST(request, context) {
  try {
    const params = await context.params
    const { team, bot, botId, userId, firestore } = await getAuthorizedBotContext(request, params)
    const draft = await getSkillDraft(team.id, botId, params.id, firestore)

    if (!draft) {
      return NextResponse.json({ message: 'Skill draft not found.' }, { status: 404 })
    }

    if (!canUserManageBotSettings(team, userId, bot)) {
      return NextResponse.json(
        { message: 'You are not allowed to manage bot skills.' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const messages = prepareSkillsBuilderMessagesForModel(
      Array.isArray(body.messages) ? body.messages : [],
    )
    const sandboxId = buildSkillSandboxId(team.id, botId, draft.skillName)

    const teamSecrets = await getTeamWithEncryptedOpenAIKey(team.id)
    let teamOpenAiApiKey = null
    if (teamSecrets?.openAIKey) {
      try {
        teamOpenAiApiKey = decryptKey(teamSecrets.openAIKey)
      } catch (err) {
        console.warn('skills builder: could not decrypt team OpenAI key, using platform key', err)
      }
    }
    const useTeamOpenAiKey = Boolean(teamOpenAiApiKey)
    const builderOpenaiModelId = SKILLS_BUILDER_AGENT_DEFAULT_OPENAI_MODEL
    const openaiForBuilder = useTeamOpenAiKey
      ? createOpenAI({ apiKey: teamOpenAiApiKey })
      : openaiProviderDefault
    const systemPrompt = buildSystemPrompt(draft)

    await getSkillDraftDocRef(team.id, botId, draft.skillName, firestore).set(
      {
        agent: {
          sandboxId,
          sessionId: SKILLS_SANDBOX_SESSION_ID,
          ...(draft.agent?.lastResponseId !== undefined
            ? { lastResponseId: draft.agent.lastResponseId }
            : {}),
        },
      },
      { merge: true },
    )

    const tools = {
      load_context: {
        description: 'Load the current skill draft context and its manifest, file tree, validation state, and live test state.',
        inputSchema: loadContextInputSchema,
        execute: async () => {
          const latest = await getSkillDraft(team.id, botId, draft.skillName, firestore)
          return buildSkillContextSummary(latest)
        },
      },
      update_manifest: {
        description: 'Update manifest values and keep SKILL.md frontmatter description aligned.',
        inputSchema: updateManifestInputSchema,
        execute: async (rawInput) => {
          const parsed = updateManifestInputSchema.safeParse(rawInput)
          if (!parsed.success) {
            const messages = parsed.error.issues.map((issue) => {
              const path = issue.path.length ? issue.path.join('.') : 'input'
              return `${path}: ${issue.message}`
            })
            throw new Error(`Invalid update_manifest input: ${messages.join('; ')}`)
          }
          const input = parsed.data
          const latest = await getSkillDraft(team.id, botId, draft.skillName, firestore)
          const domainPlaceholderErrors = collectAllowedDomainPlaceholderErrors(input, latest)
          if (domainPlaceholderErrors.length) {
            throw new Error(`Invalid update_manifest input: ${domainPlaceholderErrors.join('; ')}`)
          }
          const patch = {}

          if (input.name !== undefined) patch.displayName = input.name
          if (input.description !== undefined) patch.description = input.description
          if (input.internal !== undefined) patch.internal = input.internal
          if (input.networkPolicy !== undefined) patch.networkPolicy = input.networkPolicy
          if (input.envBindings !== undefined) {
            const existingEnvByName = new Map(
              (latest?.envBindings || []).map((binding) => [binding.envVar, binding]),
            )
            patch.envBindings = input.envBindings.map((binding) =>
              normalizeEnvBindingForStorage(
                binding,
                existingEnvByName.get(binding.envVar) || {},
              ),
            )
          }
          if (input.metadataBindings !== undefined) patch.metadataBindings = input.metadataBindings
          if (input.authProviders !== undefined) patch.authProviders = input.authProviders
          if (input.secretBindings !== undefined) {
            const existingByEnv = new Map(
              (latest?.secretBindings || []).map((binding) => [
                binding.envVar,
                { secret: binding.secret, description: binding.description },
              ]),
            )
            patch.secretBindings = input.secretBindings.map((binding) => ({
              envVar: binding.envVar,
              secret: existingByEnv.get(binding.envVar)?.secret || '',
              ...(binding.description
                ? { description: binding.description }
                : existingByEnv.get(binding.envVar)?.description
                  ? { description: existingByEnv.get(binding.envVar).description }
                  : {}),
            }))
          }

          let nextFiles = latest.files
          if (input.description !== undefined) {
            nextFiles = upsertSkillFile(latest.files, {
              path: 'SKILL.md',
              content: replaceSkillMdFrontmatter(getSkillFileContent(latest.files, 'SKILL.md'), {
                name: latest.skillName,
                description: input.description,
              }),
            })
          }

          const updated = await updateSkillDraft(
            team.id,
            botId,
            latest.skillName,
            {
              manifest: patch,
              ...(input.description !== undefined ? { files: nextFiles } : {}),
            },
            firestore,
          )

          return {
            manifest: updated.manifest,
            warnings: collectDuplicateAuthAllowedDomainWarnings(updated.manifest),
          }
        },
      },
      validate_skill_bundle: {
        description: 'Validate the current draft bundle against the remote skill runtime.',
        inputSchema: z.object({}),
        execute: async () => {
          const latest = await getSkillDraft(team.id, botId, draft.skillName, firestore)
          const result = await validateDraftAgainstRuntime({
            draft: latest,
            teamId: team.id,
            botId,
            firestore,
          })
          return {
            ok: result.ok,
            validation: result.draft.validation,
            fileTree: result.draft.files.map((file) => file.path),
          }
        },
      },
      publish_skill_bundle: {
        description: 'Publish the validated draft bundle by promoting it to the published package.',
        inputSchema: z.object({}),
        execute: async () => {
          const latest = await getSkillDraft(team.id, botId, draft.skillName, firestore)
          const result = await publishDraftBundle({
            draft: latest,
            teamId: team.id,
            botId,
            userId,
            firestore,
          })

          if (!result.ok) {
            return {
              ok: false,
              message: result.message,
              validation: result.draft?.validation || null,
            }
          }

          return {
            ok: true,
            publishedAt: result.draft.publishedAt,
            skill: buildSkillContextSummary(result.draft),
            result: result.result,
          }
        },
      },
      read_docs: {
        description:
          "Call to load developer docs into context only when needed. Use doc='widget' for embeddable chat widget help, doc='chat_apis' for chat API help, auth_* docs before designing or changing authProviders, doc='executable_functions' before writing runtime code, and doc='artifacts_files' before generating files.",
        inputSchema: readDocsInputSchema,
        execute: async (input) => {
          const docEntry = DOC_CONTENT_BY_KEY[input.doc]
          return {
            doc: input.doc,
            path: docEntry.path,
            content: docEntry.content,
          }
        },
      },
      ask_user_questions: {
        description:
          'Pause and ask the user one or more questions using multiple-choice controls and optional short open-ended fields. Call this tool whenever you need to gather additional information such as direction, clarification, or confirmation from the user to proceed with the task.',
        inputSchema: askUserQuestionsInputSchema,
      },
    }

    const modelMessages = await convertToModelMessages(messages)

    const superAdmin = isSuperAdmin(userId)
    const webSearchUsageAcc = { calls: 0 }
    const shellUsageAcc = { calls: 0, durationMs: 0 }
    let builderStepLimitReached = false
    const builderStepLimitStopCondition = ({ steps = [] }) => {
      const latestStep = steps[steps.length - 1]
      if (steps.length >= BUILDER_AGENT_MAX_STEPS && stepIncludesToolCall(latestStep, 'publish_skill_bundle')) {
        return false
      }
      const reached = steps.length >= BUILDER_AGENT_MAX_STEPS
      if (reached) builderStepLimitReached = true
      return reached
    }

    const stream = streamText({
      model: openaiForBuilder(builderOpenaiModelId),
      system: systemPrompt,
      messages: modelMessages,
      abortSignal: request.signal,
      tools: {
        ...tools,
        web_search: openaiForBuilder.tools.webSearch({
          externalWebAccess: true,
        }),
        shell: openaiForBuilder.tools.shell({
          execute: createSkillShellExecute({
            teamId: team.id,
            botId,
            skillName: draft.skillName,
            abortSignal: request.signal,
            usageAccumulator: shellUsageAcc,
          }),
        }),
        apply_patch: openaiForBuilder.tools.applyPatch({
          execute: createSkillPatchExecute({
            teamId: team.id,
            botId,
            skillName: draft.skillName,
            abortSignal: request.signal,
          }),
        }),
      },
      providerOptions: {
        openai: {
          reasoningEffort: 'high',
          reasoningSummary: 'detailed',
          parallelToolCalls: false,
          truncation: 'auto',
        },
      },
      prepareStep: ({ steps = [] }) => {
        const latestStep = steps[steps.length - 1]
        if (steps.length >= BUILDER_AGENT_MAX_STEPS && stepIncludesToolCall(latestStep, 'publish_skill_bundle')) {
          return {
            activeTools: [],
            toolChoice: 'none',
            system: `${systemPrompt}\n\nThe previous step called \`publish_skill_bundle\` at the safety step limit. You have the publish tool result in context now. Do not call tools. Read the result and send the user a concise final message that says whether publishing succeeded or explains the validation/publish failure and the next fix needed.`,
          }
        }
        return undefined
      },
      // Only the question form intentionally pauses the builder. Publishing must continue so
      // the model can send a user-visible completion message after the tool result.
      stopWhen: [hasToolCall('ask_user_questions'), builderStepLimitStopCondition],
      onFinish: async (event) => {
        try {
          const webSearchCalls = countWebSearchToolCallsInSteps(event.steps)
          const usageMeta = buildSkillsBuilderAgentUsageMetadata(
            event.totalUsage,
            webSearchCalls,
            { ...shellUsageAcc },
            { openaiModelId: builderOpenaiModelId },
          )
          await incrementSkillDraftBuilderAgentUsage(
            getSkillDraftDocRef(team.id, botId, draft.skillName, firestore),
            {
              openaiModelId: builderOpenaiModelId,
              usage: usageMeta.skillsBuilderAgentUsage,
            },
          )
        } catch (err) {
          console.warn('skills builder: failed to persist builder usage totals', err)
        }
      },
    })

    return stream.toUIMessageStreamResponse({
      sendReasoning: true,
      sendSources: true,
      consumeSseStream: consumeStream,
      messageMetadata: ({ part }) => {
        if (superAdmin && part.type === 'tool-call' && !part.invalid && isWebSearchToolCallPart(part)) {
          webSearchUsageAcc.calls += 1
        }
        if (part.type !== 'finish') return undefined

        const meta = {}
        if (builderStepLimitReached) {
          meta.skillsBuilderAgentPaused = {
            reason: 'step_limit',
            maxSteps: BUILDER_AGENT_MAX_STEPS,
            message: BUILDER_AGENT_STEP_LIMIT_PAUSE_MESSAGE,
          }
        }
        if (superAdmin) {
          Object.assign(
            meta,
            buildSkillsBuilderAgentUsageMetadata(
              part.totalUsage,
              webSearchUsageAcc.calls,
              shellUsageAcc,
              { openaiModelId: builderOpenaiModelId },
            ),
          )
        }
        return Object.keys(meta).length ? meta : undefined
      },
      onError: (error) => openAiErrorMessage(error) || 'Unable to run skills builder agent.',
      onFinish: async ({ isAborted }) => {
        await getSkillDraftDocRef(team.id, botId, draft.skillName, firestore).set(
          {
            lastAuthoringSummary: {
              updatedAt: new Date().toISOString(),
              messageCount: messages.length,
              isAborted: Boolean(isAborted),
              stepLimitReached: Boolean(builderStepLimitReached),
              maxSteps: BUILDER_AGENT_MAX_STEPS,
            },
            agent: {
              sandboxId,
              sessionId: SKILLS_SANDBOX_SESSION_ID,
              ...(draft.agent?.lastResponseId !== undefined
                ? { lastResponseId: draft.agent.lastResponseId }
                : {}),
            },
          },
          { merge: true },
        )
      },
    })
  } catch (error) {
    return NextResponse.json(
      { message: openAiErrorMessage(error) || error?.message || 'Unable to run skills builder agent.' },
      { status: error?.status || 500 },
    )
  }
}
