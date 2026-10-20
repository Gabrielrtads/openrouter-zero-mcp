import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, "server.js");

console.log("--- Testing openrouter-zero-mcp Stdio ---");

const proc = spawn(process.execPath, [serverPath], {
  stdio: ["pipe", "pipe", "inherit"],
});

let outputData = "";

proc.stdout.on("data", (chunk) => {
  outputData += chunk.toString();
  const lines = outputData.split("\n");
  outputData = lines.pop(); // keep remainder

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line.trim());
      handleMessage(msg);
    } catch (e) {
      console.error("Non-JSON output:", line);
    }
  }
});

let step = 1;

function sendMessage(msg) {
  proc.stdin.write(JSON.stringify(msg) + "\n");
}

function handleMessage(msg) {
  if (step === 1 && msg.id === 1) {
    console.log("[Test 1 PASS] Initialize response:", msg.result?.serverInfo?.name);
    step = 2;
    sendMessage({
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {},
    });
  } else if (step === 2 && msg.id === 2) {
    const tools = msg.result?.tools || [];
    console.log(`[Test 2 PASS] Tools listed (${tools.length} tools):`, tools.map(t => t.name).join(", "));
    if (tools.length !== 4) {
      throw new Error(`Expected 4 tools, got ${tools.length}`);
    }
    console.log("✅ All MCP Stdio tests passed successfully!");
    proc.kill();
    process.exit(0);
  }
}

// Start handshake
sendMessage({
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
  },
});

setTimeout(() => {
  console.error("❌ Test timed out waiting for MCP response");
  proc.kill();
  process.exit(1);
}, 5000);
