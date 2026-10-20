# ⚡ OpenRouter Zero MCP (`openrouter-zero-mcp`)

[![Smithery](https://smithery.ai/badge/@Gabrielrtads/openrouter-zero-mcp)](https://smithery.ai/server/@Gabrielrtads/openrouter-zero-mcp)
[![Glama](https://glama.ai/mcp/servers/badge?id=openrouter-zero-mcp)](https://glama.ai/mcp/servers)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Zero-Dependency](https://img.shields.io/badge/Dependencies-Zero-emerald?style=for-the-badge)](#)
[![Startup](https://img.shields.io/badge/Startup-<30ms-brightgreen?style=for-the-badge)](#)

> **The fastest, lightest OpenRouter MCP server.**  
> Built with **zero third-party dependencies** in pure Node.js. Boots in under **30ms**, uses ~15MB of RAM, and supports multi-model inference (DeepSeek, Claude, Gemini, Llama), catalog search, and credits monitoring on **Claude Desktop**, **Cursor**, **Antigravity**, and **Windsurf**.

---

## ⚡ Why OpenRouter Zero?

| Feature | Typical OpenRouter MCPs | `openrouter-zero-mcp` |
|---|---|---|
| **Dependencies** | 100+ npm packages or heavy Python venv | **Zero (0)** native Node.js only |
| **Startup Latency** | 1.2s - 3.5s | **< 30ms** instant boot |
| **Memory Footprint** | ~120MB+ | **~15MB** |
| **JSON-RPC Spec** | Often crashes on notifications | **100% Spec-Compliant** (Handles notifications correctly) |

---

## 🚀 1-Click Install via Smithery

Install automatically into Claude Desktop with Smithery:

```bash
npx -y @smithery/cli install @Gabrielrtads/openrouter-zero-mcp --client claude
```

---

## 💻 Manual Setup

### 1. Claude Desktop

Add this to your `claude_desktop_config.json`:

* **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
* **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "openrouter": {
      "command": "npx",
      "args": ["-y", "openrouter-zero-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
      }
    }
  }
}
```

### 2. Cursor IDE

1. Open **Cursor Settings** (`Ctrl+Shift+J` or `Cmd+Shift+J`).
2. Navigate to **Features > MCP Servers > Add New MCP Server**.
3. Fill in:
   - **Name:** `openrouter`
   - **Type:** `command`
   - **Command:** `npx -y openrouter-zero-mcp`
   - **Environment Variables:** `OPENROUTER_API_KEY=sk-or-v1-your-key-here`

### 3. Antigravity / Windsurf / Claude Code

In your `mcp_config.json`:

```json
{
  "mcpServers": {
    "openrouter": {
      "command": "npx",
      "args": ["-y", "openrouter-zero-mcp"],
      "env": {
        "OPENROUTER_API_KEY": "sk-or-v1-your-key-here"
      }
    }
  }
}
```

---

## 🛠️ Available MCP Tools

### 1. `openrouter_chat_completion`
Executes chat completions on any model in the OpenRouter catalog (DeepSeek V3/R1, Gemini 2.5 Flash, Claude 3.7 Sonnet, Llama 3.3 70B, etc.).
* Parameters: `model`, `messages`, `prompt`, `temperature`, `max_tokens`, `reasoning`.

### 2. `openrouter_get_credits`
Checks real-time credit balance, usage, and key parameters.

### 3. `openrouter_list_models`
Searches and lists models from the OpenRouter API with pricing per 1M tokens and context window size.
* Parameters: `search` (e.g. `'deepseek'`, `'gemini'`, `'free'`), `limit`.

### 4. `openrouter_manage_keys`
Provisions, lists, or revokes API keys via the OpenRouter Management API.
* Parameters: `action` (`'list'`, `'create'`, `'delete'`), `name`, `limit`, `hash`.

---

## 🔒 Security & Privacy

- All API calls are made directly to `https://openrouter.ai/api/v1` with your personal key.
- Zero analytics, zero telemetry, zero middleman proxy.
- Secrets are read exclusively from environment variables.

---

## 📄 License

MIT License — Created with ❤️ by [Gabriel Toledo (@Gabrielrtads)](https://github.com/Gabrielrtads).
