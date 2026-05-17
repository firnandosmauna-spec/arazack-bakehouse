const crypto = require("crypto");
const fs = require("fs/promises");
const http = require("http");
const path = require("path");
const { McpClient } = require("./lib/mcp-client");

const APP_TIME_ZONE = "Asia/Jakarta";
const publicDir = path.resolve(__dirname, "../public");
const mcpServerPath = path.resolve(__dirname, "./mcp/server.js");

function createApp() {
  const mcpClient = new McpClient(mcpServerPath);
  const sessions = new Map();

  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`);

      if (url.pathname.startsWith("/api/")) {
        await handleApi(req, res, url, mcpClient, sessions);
        return;
      }

      await serveStatic(req, res, url);
    } catch (error) {
      sendJson(res, 500, {
        error: "Terjadi kesalahan pada server.",
        detail: error.message
      });
    }
  });

  return {
    server,
    mcpClient,
    shutdown() {
      mcpClient.stop();
      return new Promise((resolve) => {
        server.close(() => resolve());
      });
    }
  };
}

async function startServer(preferredPort) {
  // Manual .env loading
  try {
    const envContent = await fs.readFile(path.resolve(__dirname, "../.env"), "utf8");
    envContent.split("\n").forEach(line => {
      const [key, value] = line.split("=");
      if (key && value) process.env[key.trim()] = value.trim();
    });
  } catch (err) {
    // .env not found, ignore
  }

  let port = preferredPort || Number(process.env.PORT || 3000);
  const app = createApp();
  await app.mcpClient.start();

  return new Promise((resolve, reject) => {
    app.server.on("error", (err) => {
      if (err.code === "EADDRINUSE" || err.code === "EACCES") {
        console.log(`Port ${port} tidak dapat digunakan (${err.code}), mencoba port ${port + 1}...`);
        port++;
        app.server.listen(port);
      } else {
        reject(err);
      }
    });

    app.server.on("listening", () => {
      resolve(app);
    });

    app.server.listen(port);
  });
}

async function handleApi(req, res, url, mcpClient, sessions) {
  if (req.method === "POST" && url.pathname === "/api/login") {
    const body = await parseBody(req);
    const result = await mcpClient.callTool("authenticate_user", {
      username: body.username || "",
      password: body.password || ""
    });

    if (!result.authenticated) {
      sendJson(res, 401, { error: result.message });
      return;
    }

    const token = crypto.randomBytes(24).toString("hex");
    sessions.set(token, {
      user: result.user,
      createdAt: Date.now()
    });

    res.setHeader(
      "Set-Cookie",
      `pos_session=${token}; HttpOnly; Path=/; SameSite=Strict`
    );

    sendJson(res, 200, { user: result.user });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/logout") {
    const token = getSessionToken(req);
    if (token) {
      sessions.delete(token);
    }

    res.setHeader(
      "Set-Cookie",
      "pos_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict"
    );

    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/public-overview") {
    const [branches, services, transactions] = await Promise.all([
      mcpClient.readResource("branches://list"),
      mcpClient.readResource("services://catalog"),
      mcpClient.readResource("transactions://history")
    ]);

    sendJson(res, 200, {
      summary: {
        branchCount: branches.length,
        serviceCount: services.length,
        dailyCapacityKg: branches.reduce(
          (total, branch) => total + Number(branch.capacityKgPerDay || 0),
          0
        ),
        cityCount: new Set(branches.map((branch) => branch.city)).size,
        latestTransactions: transactions.length
      },
      branches: branches.map((branch) => ({
        id: branch.id,
        name: branch.name,
        city: branch.city,
        address: branch.address,
        phone: branch.phone,
        hours: branch.hours,
        managerName: branch.managerName,
        capacityKgPerDay: branch.capacityKgPerDay
      }))
    });
    return;
  }

  // PUBLIC ENDPOINTS
  if (req.method === "GET" && url.pathname === "/api/settings") {
    const settings = await mcpClient.callTool("get_settings", {});
    sendJson(res, 200, settings);
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/services") {
    const services = await mcpClient.readResource("services://catalog");
    sendJson(res, 200, { services });
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/transactions") {
    const body = await parseBody(req);
    const transaction = await mcpClient.callTool("create_transaction", {
      branchId: body.branchId || "br_yogyakarta_pusat",
      cashierName: "Online Shop Customer",
      customerName: body.customerName || "Pelanggan Online",
      items: body.items || []
    });
    sendJson(res, 201, { transaction });
    return;
  }

  const session = requireAuth(req, res, sessions);
  if (!session) {
    return;
  }

  const branches = await mcpClient.readResource("branches://list");
  const allowedBranches = getAllowedBranches(session.user, branches);

  if (req.method === "GET" && url.pathname === "/api/me") {
    sendJson(res, 200, {
      user: {
        ...session.user,
        branches: allowedBranches
      }
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/branches") {
    sendJson(res, 200, { branches: allowedBranches });
    return;
  }



  if (req.method === "GET" && url.pathname === "/api/transactions") {
    const branchId = url.searchParams.get("branchId") || "all";
    if (
      branchId !== "all" &&
      !hasBranchAccess(session.user, branchId, allowedBranches)
    ) {
      sendJson(res, 403, {
      error: "Cabang pesanan tidak dapat diakses."
      });
      return;
    }

    const transactions = await mcpClient.readResource("transactions://history");
    const filtered = filterTransactionsForUser(
      session.user,
      allowedBranches,
      transactions,
      branchId
    );

    sendJson(res, 200, {
      transactions: filtered.slice(0, 20),
      summary: buildSummary(filtered, allowedBranches, branchId)
    });
    return;
  }



  if (req.method === "POST" && url.pathname === "/api/services") {
    const body = await parseBody(req);
    if (session.user.role !== "owner") {
      sendJson(res, 403, { error: "Akses ditolak. Hanya owner yang bisa mengubah menu." });
      return;
    }

    const result = await mcpClient.callTool("upsert_service", body);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "DELETE" && url.pathname.startsWith("/api/services/")) {
    const serviceId = url.pathname.split("/").pop();
    if (session.user.role !== "owner") {
      sendJson(res, 403, { error: "Akses ditolak. Hanya owner yang bisa menghapus menu." });
      return;
    }

    const result = await mcpClient.callTool("delete_service", { id: serviceId });
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/settings") {
    const body = await parseBody(req);
    if (session.user.role !== "owner") {
      sendJson(res, 403, { error: "Akses ditolak." });
      return;
    }
    const result = await mcpClient.callTool("update_settings", body);
    sendJson(res, 200, result);
    return;
  }

  sendJson(res, 404, { error: "Endpoint tidak ditemukan." });
}

function getAllowedBranches(user, branches) {
  if ((user.branchIds || []).includes("*")) {
    return branches;
  }

  return branches.filter((branch) => (user.branchIds || []).includes(branch.id));
}

function hasBranchAccess(user, branchId, allowedBranches) {
  if ((user.branchIds || []).includes("*")) {
    return allowedBranches.some((branch) => branch.id === branchId);
  }

  return (user.branchIds || []).includes(branchId);
}

function filterTransactionsForUser(user, allowedBranches, transactions, branchId) {
  const allowedBranchIds = new Set(allowedBranches.map((branch) => branch.id));
  const visible = transactions.filter((transaction) =>
    allowedBranchIds.has(transaction.branchId)
  );

  if (!branchId || branchId === "all") {
    return visible;
  }

  if (!hasBranchAccess(user, branchId, allowedBranches)) {
    throw new Error("Outlet pesanan tidak dapat diakses.");
  }

  return visible.filter((transaction) => transaction.branchId === branchId);
}

function requireAuth(req, res, sessions) {
  const token = getSessionToken(req);
  const session = token ? sessions.get(token) : null;

  if (!session) {
    sendJson(res, 401, { error: "Silakan login terlebih dahulu." });
    return null;
  }

  return session;
}

function getSessionToken(req) {
  const rawCookie = req.headers.cookie || "";
  const cookies = rawCookie.split(";").map((item) => item.trim());
  const matched = cookies.find((item) => item.startsWith("pos_session="));
  return matched ? matched.slice("pos_session=".length) : null;
}

async function parseBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  if (!rawBody) {
    return {};
  }

  return JSON.parse(rawBody);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

async function serveStatic(req, res, url) {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method tidak diizinkan." });
    return;
  }

  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: "Akses file ditolak." });
    return;
  }

  try {
    const fileContent = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": getMimeType(filePath)
    });
    res.end(fileContent);
  } catch (error) {
    if (error.code === "ENOENT") {
      sendJson(res, 404, { error: "File tidak ditemukan." });
      return;
    }
    throw error;
  }
}

function getMimeType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeMap = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8"
  };

  return mimeMap[extension] || "application/octet-stream";
}

function buildSummary(transactions, allowedBranches, branchId) {
  const today = formatDateKey(new Date());
  const todayTransactions = transactions.filter((transaction) =>
    formatDateKey(transaction.createdAt) === today
  );
  const todayRevenue = todayTransactions.reduce(
    (total, transaction) => total + Number(transaction.total || 0),
    0
  );
  const singleBranchLabel =
    allowedBranches.length === 1 ? allowedBranches[0]?.name || "Cabang" : null;
  const activeBranchLabel =
    branchId && branchId !== "all"
      ? allowedBranches.find((branch) => branch.id === branchId)?.name || "Cabang"
      : singleBranchLabel || "Semua cabang";

  return {
    totalTransactions: transactions.length,
    todayTransactions: todayTransactions.length,
    todayRevenue,
    activeBranchCount:
      branchId && branchId !== "all" ? 1 : allowedBranches.length,
    activeBranchLabel
  };
}

function formatDateKey(value) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE
  }).format(new Date(value));
}

if (require.main === module) {
  startServer()
    .then((app) => {
      const address = app.server.address();
      console.log(`Dapur Senja POS aktif di http://localhost:${address.port}`);

      const shutdown = () => {
        app.shutdown().finally(() => process.exit(0));
      };

      process.on("SIGINT", shutdown);
      process.on("SIGTERM", shutdown);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  createApp,
  startServer
};
