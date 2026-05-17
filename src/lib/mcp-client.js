const { spawn } = require("child_process");
const path = require("path");
const { handleRpcRequest } = require("../mcp/core");

class McpClient {
  constructor(serverPath) {
    this.serverPath = serverPath;
    this.child = null;
    this.inlineMode = false;
    this.buffer = "";
    this.requestId = 0;
    this.pending = new Map();
  }

  async start() {
    if (this.child || this.inlineMode) {
      return;
    }

    try {
      this.child = spawn(process.execPath, [this.serverPath], {
        cwd: path.dirname(this.serverPath),
        stdio: ["pipe", "pipe", "pipe"]
      });
    } catch (error) {
      if (error.code === "EPERM") {
        this.inlineMode = true;
        await this.call("initialize", {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "laundry-pos-backend",
            version: "1.0.0"
          }
        });
        return;
      }
      throw error;
    }

    this.child.stdout.setEncoding("utf8");
    this.child.stdout.on("data", (chunk) => this.#handleStdout(chunk));

    this.child.stderr.setEncoding("utf8");
    this.child.stderr.on("data", (chunk) => {
      process.stderr.write(`[mcp] ${chunk}`);
    });

    this.child.on("exit", () => {
      for (const { reject } of this.pending.values()) {
        reject(new Error("MCP server terputus."));
      }
      this.pending.clear();
      this.child = null;
    });

    await this.call("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: {
        name: "laundry-pos-backend",
        version: "1.0.0"
      }
    });
  }

  stop() {
    if (this.child) {
      this.child.kill();
      this.child = null;
    }
    this.inlineMode = false;
  }

  async call(method, params = {}) {
    const id = ++this.requestId;

    if (this.inlineMode) {
      const response = await handleRpcRequest({
        jsonrpc: "2.0",
        id,
        method,
        params
      });

      if (response.error) {
        throw new Error(response.error.message || "MCP error.");
      }

      return response.result;
    }

    if (!this.child) {
      throw new Error("MCP server belum dijalankan.");
    }

    const payload = {
      jsonrpc: "2.0",
      id,
      method,
      params
    };

    const promise = new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
    });

    this.child.stdin.write(`${JSON.stringify(payload)}\n`);
    return promise;
  }

  async callTool(name, args) {
    const result = await this.call("tools/call", {
      name,
      arguments: args
    });

    if (result.isError) {
      throw new Error(result.content?.[0]?.text || "Gagal memanggil tool MCP.");
    }

    return result.structuredContent;
  }

  async readResource(uri) {
    const result = await this.call("resources/read", { uri });
    const firstContent = result.contents?.[0];

    if (!firstContent || typeof firstContent.text !== "string") {
      throw new Error("Resource MCP tidak valid.");
    }

    return JSON.parse(firstContent.text);
  }

  #handleStdout(chunk) {
    this.buffer += chunk;
    const lines = this.buffer.split("\n");
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }

      let message;
      try {
        message = JSON.parse(trimmed);
      } catch (error) {
        continue;
      }

      if (!Object.prototype.hasOwnProperty.call(message, "id")) {
        continue;
      }

      const pendingRequest = this.pending.get(message.id);
      if (!pendingRequest) {
        continue;
      }

      this.pending.delete(message.id);

      if (message.error) {
        pendingRequest.reject(new Error(message.error.message || "MCP error."));
      } else {
        pendingRequest.resolve(message.result);
      }
    }
  }
}

module.exports = {
  McpClient
};
