#!/usr/bin/env node
"use strict";

/**
 * OpenRouter Zero MCP Server
 * Ultra-lightweight, zero-dependency Model Context Protocol (MCP) server for OpenRouter.
 * Features:
 * - Multi-model chat completion (DeepSeek, Gemini, Claude, Llama, Mistral)
 * - Balance and token credits check
 * - Live catalog search with context & pricing
 * - Key management (list, create, delete)
 * 
 * Spec compliant: JSON-RPC 2.0 over stdio with sub-30ms startup.
 */

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";

function getApiKey() {
  return (process.env.OPENROUTER_API_KEY || "").trim();
}

function getManagementKey() {
  return (process.env.OPENROUTER_MANAGEMENT_KEY || "").trim() || getApiKey();
}

let buffer = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  buffer += chunk;
  let newlineIndex;
  while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, newlineIndex).trim();
    buffer = buffer.slice(newlineIndex + 1);
    if (line) handleLine(line);
  }
});

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function result(id, value) {
  send({ jsonrpc: "2.0", id, result: value });
}

function error(id, code, message, data) {
  send({ jsonrpc: "2.0", id, error: { code, message, data } });
}

async function handleLine(line) {
  let request;
  try {
    request = JSON.parse(line);
  } catch (err) {
    error(null, -32700, "Parse error", String(err));
    return;
  }

  // JSON-RPC notifications do not have an 'id' and MUST NOT receive a response
  const isNotification = request.id === undefined || request.id === null;

  try {
    if (request.method === "initialize") {
      result(request.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: { name: "openrouter-zero-mcp", version: "1.0.0" },
      });
      return;
    }

    if (request.method === "ping") {
      if (!isNotification) result(request.id, {});
      return;
    }

    if (isNotification || (typeof request.method === "string" && request.method.startsWith("notifications/"))) {
      return;
    }

    if (request.method === "tools/list") {
      result(request.id, { tools: getToolDefinitions() });
      return;
    }

    if (request.method === "resources/list") {
      result(request.id, { resources: [] });
      return;
    }

    if (request.method === "prompts/list") {
      result(request.id, { prompts: [] });
      return;
    }

    if (request.method === "tools/call") {
      const out = await executeTool(request.params || {});
      result(request.id, out);
      return;
    }

    if (!isNotification) {
      error(request.id, -32601, `Method not found: ${request.method}`);
    }
  } catch (err) {
    if (!isNotification) {
      error(request.id, -32000, err.message || "Tool execution error");
    }
  }
}

function getToolDefinitions() {
  return [
    {
      name: "openrouter_chat_completion",
      description: "Execute chat inference on any model available on OpenRouter (e.g. google/gemini-2.5-flash, anthropic/claude-3.7-sonnet, deepseek/deepseek-v4-flash-0731:US, meta-llama/llama-3.3-70b-instruct).",
      inputSchema: {
        type: "object",
        properties: {
          model: {
            type: "string",
            description: "OpenRouter model ID (default: 'google/gemini-2.5-flash').",
            default: "google/gemini-2.5-flash",
          },
          messages: {
            type: "array",
            description: "Array of messages [{role: 'user'|'system'|'assistant', content: '...'}]",
            items: {
              type: "object",
              properties: {
                role: { type: "string", enum: ["system", "user", "assistant"] },
                content: { type: "string" },
              },
              required: ["role", "content"],
            },
          },
          prompt: {
            type: "string",
            description: "Simple prompt string (fallback if 'messages' is omitted).",
          },
          temperature: {
            type: "number",
            description: "Sampling temperature (0.0 to 2.0).",
          },
          max_tokens: {
            type: "integer",
            description: "Maximum completion tokens limit.",
          },
          reasoning: {
            type: "object",
            description: "Thinking / reasoning config (e.g. { effort: 'high' } or { enabled: true }).",
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: "openrouter_get_credits",
      description: "Retrieve account balance, credits usage, and API key limits from OpenRouter.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
    {
      name: "openrouter_list_models",
      description: "List available AI models on OpenRouter with filters for name, slug, context window size, and pricing.",
      inputSchema: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "Search keyword for model name or slug (e.g. 'claude', 'gemini', 'deepseek', 'free').",
          },
          limit: {
            type: "integer",
            description: "Maximum number of models to return (default: 30, max: 100).",
            default: 30,
          },
        },
        additionalProperties: false,
      },
    },
    {
      name: "openrouter_manage_keys",
      description: "Manage OpenRouter API keys (list, create, delete) via the Management API. Requires OPENROUTER_MANAGEMENT_KEY.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["list", "create", "delete"],
            description: "Action to execute.",
          },
          name: {
            type: "string",
            description: "Name for the new key (required for action: 'create').",
          },
          hash: {
            type: "string",
            description: "Key hash to delete (required for action: 'delete').",
          },
          limit: {
            type: "number",
            description: "Credit limit in USD for the new key (optional for 'create').",
          },
        },
        required: ["action"],
        additionalProperties: false,
      },
    },
  ];
}

async function executeTool(params) {
  const name = params.name;
  const args = params.arguments || {};

  switch (name) {
    case "openrouter_chat_completion":
      return handleChatCompletion(args);
    case "openrouter_get_credits":
      return handleGetCredits(args);
    case "openrouter_list_models":
      return handleListModels(args);
    case "openrouter_manage_keys":
      return handleManageKeys(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function handleChatCompletion(args) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not configured.");
  }

  const model = args.model || "google/gemini-2.5-flash";
  let messages = args.messages;

  if (!messages || !messages.length) {
    if (args.prompt) {
      messages = [{ role: "user", content: args.prompt }];
    } else {
      throw new Error("Provide either 'messages' or 'prompt'.");
    }
  }

  const body = {
    model,
    messages,
  };

  if (args.temperature !== undefined) body.temperature = args.temperature;
  if (args.max_tokens !== undefined) body.max_tokens = args.max_tokens;
  if (args.reasoning !== undefined) body.reasoning = args.reasoning;

  const res = await fetch(`${DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/Gabrielrtads/openrouter-zero-mcp",
      "X-Title": "OpenRouter Zero MCP",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    return {
      content: [{
        type: "text",
        text: `[OpenRouter Error ${res.status}]: ${JSON.stringify(json, null, 2)}`,
      }],
      isError: true,
    };
  }

  const content = json.choices?.[0]?.message?.content || "";
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        model: json.model || model,
        content,
        usage: json.usage,
      }, null, 2),
    }],
  };
}

async function handleGetCredits() {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not configured.");
  }

  const [creditsRes, keyRes] = await Promise.all([
    fetch(`${DEFAULT_BASE_URL}/credits`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    }),
    fetch(`${DEFAULT_BASE_URL}/auth/key`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    }),
  ]);

  const creditsJson = await creditsRes.json().catch(() => ({}));
  const keyJson = await keyRes.json().catch(() => ({}));

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        credits: creditsJson.data || creditsJson,
        key_info: keyJson.data || keyJson,
      }, null, 2),
    }],
  };
}

async function handleListModels(args) {
  const search = (args.search || "").toLowerCase().trim();
  const limit = Math.min(Math.max(args.limit || 30, 1), 100);

  const res = await fetch(`${DEFAULT_BASE_URL}/models`);
  if (!res.ok) {
    throw new Error(`Failed to fetch models catalog: HTTP ${res.status}`);
  }

  const json = await res.json();
  const allModels = json.data || [];

  let filtered = allModels;
  if (search) {
    filtered = allModels.filter(m =>
      (m.id && m.id.toLowerCase().includes(search)) ||
      (m.name && m.name.toLowerCase().includes(search)) ||
      (m.description && m.description.toLowerCase().includes(search))
    );
  }

  const results = filtered.slice(0, limit).map(m => ({
    id: m.id,
    name: m.name,
    context_length: m.context_length,
    pricing: {
      prompt: m.pricing?.prompt ? `$${(parseFloat(m.pricing.prompt) * 1000000).toFixed(4)} / 1M` : "Free/Included",
      completion: m.pricing?.completion ? `$${(parseFloat(m.pricing.completion) * 1000000).toFixed(4)} / 1M` : "Free/Included",
    },
    architecture: m.architecture?.modality || "text->text",
  }));

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        total_matched: filtered.length,
        showing: results.length,
        models: results,
      }, null, 2),
    }],
  };
}

async function handleManageKeys(args) {
  const managementKey = getManagementKey();
  if (!managementKey) {
    throw new Error("OPENROUTER_MANAGEMENT_KEY or OPENROUTER_API_KEY is not configured.");
  }

  const action = args.action;

  if (action === "list") {
    const res = await fetch(`${DEFAULT_BASE_URL}/keys`, {
      headers: { "Authorization": `Bearer ${managementKey}` },
    });
    const json = await res.json();
    return {
      content: [{
        type: "text",
        text: JSON.stringify(json, null, 2),
      }],
    };
  }

  if (action === "create") {
    if (!args.name) {
      throw new Error("Parameter 'name' is required to create a key.");
    }
    const body = { name: args.name };
    if (args.limit !== undefined) body.limit = args.limit;

    const res = await fetch(`${DEFAULT_BASE_URL}/keys`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${managementKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return {
      content: [{
        type: "text",
        text: JSON.stringify(json, null, 2),
      }],
    };
  }

  if (action === "delete") {
    if (!args.hash) {
      throw new Error("Parameter 'hash' is required to delete a key.");
    }
    const res = await fetch(`${DEFAULT_BASE_URL}/keys/${args.hash}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${managementKey}` },
    });
    const json = await res.json();
    return {
      content: [{
        type: "text",
        text: JSON.stringify(json, null, 2),
      }],
    };
  }

  throw new Error(`Unsupported action: ${action}`);
}
