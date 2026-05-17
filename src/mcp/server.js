const { handleRpcRequest } = require("./core");

let inputBuffer = "";

process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  inputBuffer += chunk;
  const lines = inputBuffer.split("\n");
  inputBuffer = lines.pop() || "";

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

    handleRpcRequest(message)
      .then((response) => {
        process.stdout.write(`${JSON.stringify(response)}\n`);
      })
      .catch((error) => {
      respond(message.id, null, {
        code: -32000,
        message: error.message
      });
      });
  }
});

process.stdin.resume();

function respond(id, result, error) {
  const payload = {
    jsonrpc: "2.0",
    id
  };

  if (error) {
    payload.error = error;
  } else {
    payload.result = result;
  }

  process.stdout.write(`${JSON.stringify(payload)}\n`);
}
