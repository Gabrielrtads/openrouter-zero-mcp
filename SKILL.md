---
name: openrouter-zero-mcp
version: 1.0.0
category: orchestration
description: "Ultra-fast, zero-dependency OpenRouter MCP server. Sub-30ms startup, native JSON-RPC stdio, multi-model inference (DeepSeek V3/R1, Claude 3.7, Gemini 2.5, Llama 3.3), dynamic model search, and live credit monitoring for Claude Desktop, Cursor, and Antigravity. Trigger with /openrouter, 'call openrouter', 'check openrouter credits', or 'list openrouter models'."
tags: [openrouter, mcp, model-context-protocol, zero-dependency, deepseek, claude, gemini, llama, multi-model, inference, ai-agents, claude-code, codex, antigravity]
---

# ⚡ OpenRouter Zero MCP (`openrouter-zero-mcp`)

> **The Fastest, Lightest OpenRouter MCP Server for AI Agents.**  
> Built with **zero third-party dependencies** in pure Node.js. Boots in under **30ms**, uses ~15MB of RAM, and supports multi-model inference (DeepSeek, Claude, Gemini, Llama), catalog search, and credits monitoring on **Claude Desktop**, **Cursor**, **Antigravity**, and **Windsurf**.

---

## ⚡ When to Activate This Skill
- Whenever the user wants to execute completions on non-native frontier models (e.g. DeepSeek R1, Llama 3.3 70B, Claude 3.7 Sonnet) via OpenRouter.
- When you need to check OpenRouter API credit balance or pricing per 1M tokens.
- When listing available models or managing API keys programmatically.

---

## 🚀 Quick Setup

### 1-Click Install via skills.sh (Claude Code / Codex / Antigravity):
```bash
npx skills add Gabrielrtads/openrouter-zero-mcp
```

### Install into Claude Desktop via Smithery:
```bash
npx -y @smithery/cli install @Gabrielrtads/openrouter-zero-mcp --client claude
```

### Or Configure in `mcp_config.json`:
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

1. `openrouter_chat_completion`: Execute inference on any OpenRouter model (DeepSeek, Claude, Gemini).
2. `openrouter_get_credits`: Checks real-time credit balance and usage.
3. `openrouter_list_models`: Searches OpenRouter model catalog with pricing and context windows.
4. `openrouter_manage_keys`: Creates, lists, or revokes API keys.

---

## 📄 License
MIT License. Created by [Gabriel Toledo (@Gabrielrtads)](https://github.com/Gabrielrtads).
