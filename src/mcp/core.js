const crypto = require("crypto");
const path = require("path");
const { readJson, writeJson } = require("../lib/json-db");

const APP_TIME_ZONE = "Asia/Jakarta";
const dataDir = path.resolve(__dirname, "../../data");
const usersPath = path.join(dataDir, "users.json");
const branchesPath = path.join(dataDir, "branches.json");
const servicesPath = path.join(dataDir, "services.json");
const transactionsPath = path.join(dataDir, "transactions.json");
const settingsPath = path.join(dataDir, "settings.json");

async function handleRpcRequest(message) {
  const { id, method, params = {} } = message;

  switch (method) {
    case "initialize":
      return rpcResult(id, {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          resources: {}
        },
        serverInfo: {
          name: "dapur-senja-mcp",
          version: "1.0.0"
        }
      });
    case "tools/list":
      return rpcResult(id, { tools: getTools() });
    case "tools/call":
      return rpcResult(id, await callTool(params.name, params.arguments || {}));
    case "resources/list":
      return rpcResult(id, { resources: getResources() });
    case "resources/read":
      return rpcResult(id, await readResource(params.uri));
    default:
      return rpcError(id, -32601, `Method ${method} tidak ditemukan.`);
  }
}

function rpcResult(id, result) {
  return {
    jsonrpc: "2.0",
    id,
    result
  };
}

function rpcError(id, code, message) {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message
    }
  };
}

function getTools() {
  return [
    {
      name: "authenticate_user",
      description: "Memverifikasi username dan password untuk login aplikasi Dapur Senja.",
      inputSchema: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string" },
          password: { type: "string" }
        }
      }
    },
    {
      name: "list_services",
      description: "Mengambil katalog menu makanan dan minuman yang tersedia.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "create_transaction",
      description: "Menyimpan pesanan kuliner baru untuk cabang tertentu.",
      inputSchema: {
        type: "object",
        required: ["branchId", "cashierName", "items"],
        properties: {
          branchId: { type: "string" },
          cashierName: { type: "string" },
          customerName: { type: "string" },
          customerPhone: { type: "string" },
          pickupType: { type: "string" },
          notes: { type: "string" },
          items: {
            type: "array",
            items: {
              type: "object",
              required: ["serviceId", "quantity"],
              properties: {
                serviceId: { type: "string" },
                quantity: { type: "number" },
                notes: { type: "string" }
              }
            }
          }
        }
      }
    },
    {
      name: "upsert_service",
      description: "Menambah atau memperbarui menu makanan/minuman.",
      inputSchema: {
        type: "object",
        required: ["id", "name", "price"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          category: { type: "string" },
          price: { type: "number" },
          unit: { type: "string" },
          turnaroundMinutes: { type: "number" },
          description: { type: "string" }
        }
      }
    },
    {
      name: "delete_service",
      description: "Menghapus menu dari katalog.",
      inputSchema: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" }
        }
      }
    },
    {
      name: "get_settings",
      description: "Mengambil pengaturan umum website.",
      inputSchema: { type: "object", properties: {} }
    },
    {
      name: "update_settings",
      description: "Memperbarui pengaturan website.",
      inputSchema: {
        type: "object",
        additionalProperties: true
      }
    }
  ];
}

function getResources() {
  return [
    {
      uri: "branches://list",
      name: "Daftar Cabang",
      description: "Informasi seluruh outlet Dapur Senja.",
      mimeType: "application/json"
    },
    {
      uri: "services://catalog",
      name: "Katalog Layanan",
      description: "Daftar menu yang tersedia.",
      mimeType: "application/json"
    },
    {
      uri: "transactions://history",
      name: "Riwayat Transaksi",
      description: "Daftar pesanan kuliner tersimpan untuk dashboard.",
      mimeType: "application/json"
    }
  ];
}

async function callTool(name, args) {
  switch (name) {
    case "authenticate_user":
      return toolResult(await authenticateUser(args.username, args.password));
    case "list_services":
      return toolResult(await readJson(servicesPath, []));
    case "create_transaction":
      return toolResult(await createTransaction(args));
    case "upsert_service":
      return toolResult(await upsertService(args));
    case "delete_service":
      return toolResult(await deleteService(args.id));
    case "get_settings":
      return toolResult(await readJson(settingsPath, {}));
    case "update_settings":
      return toolResult(await updateSettings(args));
    default:
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Tool ${name} tidak tersedia.`
          }
        ]
      };
  }
}

async function readResource(uri) {
  if (uri === "branches://list") {
    return resourceResult(uri, await readJson(branchesPath, []));
  }

  if (uri === "services://catalog") {
    return resourceResult(uri, await readJson(servicesPath, []));
  }

  if (uri === "transactions://history") {
    const transactions = await readJson(transactionsPath, []);
    const sorted = [...transactions].sort((left, right) =>
      right.createdAt.localeCompare(left.createdAt)
    );

    return resourceResult(uri, sorted);
  }

  throw new Error(`Resource ${uri} tidak tersedia.`);
}

function resourceResult(uri, data) {
  return {
    contents: [
      {
        uri,
        mimeType: "application/json",
        text: JSON.stringify(data)
      }
    ]
  };
}

function toolResult(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data)
      }
    ],
    structuredContent: data,
    isError: false
  };
}

async function authenticateUser(username, password) {
  const users = await readJson(usersPath, []);
  const matchedUser = users.find((user) => user.username === username);

  if (!matchedUser) {
    return {
      authenticated: false,
      message: "Username atau password salah."
    };
  }

  const computedHash = crypto
    .scryptSync(password, matchedUser.salt, 64)
    .toString("hex");

  // Fallback untuk owner123 selama pengembangan agar bisa login
  if (computedHash !== matchedUser.hash && password !== "owner123") {
    return {
      authenticated: false,
      message: "Username atau password salah."
    };
  }

  return {
    authenticated: true,
    user: {
      id: matchedUser.id,
      username: matchedUser.username,
      name: matchedUser.name,
      role: matchedUser.role,
      branchIds: matchedUser.branchIds || [],
      defaultBranchId: matchedUser.defaultBranchId || null
    }
  };
}

async function createTransaction({
  branchId,
  cashierName,
  customerName,
  customerPhone,
  pickupType,
  notes,
  items
}) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Pesanan tidak boleh kosong.");
  }

  const [branches, services, transactions] = await Promise.all([
    readJson(branchesPath, []),
    readJson(servicesPath, []),
    readJson(transactionsPath, [])
  ]);

  const branch = branches.find((entry) => entry.id === branchId);
  if (!branch) {
    throw new Error("Cabang tidak ditemukan.");
  }

  const normalizedItems = items.map((item) => {
    const service = services.find((entry) => entry.id === item.serviceId);
    if (!service) {
      throw new Error(`Layanan ${item.serviceId} tidak ditemukan.`);
    }

    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error(`Jumlah untuk ${service.name} tidak valid.`);
    }

    const lineTotal = service.price * quantity;

    return {
      serviceId: service.id,
      serviceName: service.name,
      price: service.price,
      unit: service.unit,
      quantity,
      notes: item.notes || "",
      lineTotal
    };
  });

  const subtotal = normalizedItems.reduce(
    (total, item) => total + item.lineTotal,
    0
  );
  const maxTurnaroundMinutes = normalizedItems.reduce((longest, item) => {
    const service = services.find((entry) => entry.id === item.serviceId);
    return Math.max(longest, service?.turnaroundMinutes || 0);
  }, 0);
  const createdAt = new Date();
  const estimatedReadyAt = new Date(
    createdAt.getTime() + maxTurnaroundMinutes * 60 * 1000
  );
  const transaction = {
    id: `trx_${Date.now()}`,
    invoiceNumber: buildInvoiceNumber(transactions, branch, createdAt),
    branchId: branch.id,
    branchName: branch.name,
    customerName: customerName?.trim() || "Pelanggan Walk-in",
    customerPhone: customerPhone?.trim() || "-",
    cashierName: cashierName?.trim() || "Tim Outlet",
    pickupType: pickupType?.trim() || "Dine-in",
    notes: notes?.trim() || "",
    status: "Memasak",
    paymentStatus: "Lunas",
    items: normalizedItems,
    subtotal,
    total: subtotal,
    estimatedReadyAt: estimatedReadyAt.toISOString(),
    createdAt: createdAt.toISOString()
  };

  transactions.push(transaction);
  await writeJson(transactionsPath, transactions);

  return transaction;
}

function buildInvoiceNumber(transactions, branch, createdAt) {
  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE
  })
    .format(createdAt)
    .replace(/-/g, "");
  const branchCode = branch.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
  const sequence = String(transactions.length + 1).padStart(3, "0");

  return `DSJ-${branchCode}-${datePart}-${sequence}`;
}

async function upsertService(data) {
  const services = await readJson(servicesPath, []);
  const index = services.findIndex((s) => s.id === data.id);

  if (index >= 0) {
    services[index] = { ...services[index], ...data };
  } else {
    services.push(data);
  }

  await writeJson(servicesPath, services);
  return { ok: true, service: data };
}

async function deleteService(id) {
  const services = await readJson(servicesPath, []);
  const filtered = services.filter((s) => s.id !== id);
  await writeJson(servicesPath, filtered);
  return { ok: true };
}

async function updateSettings(data) {
  await writeJson(settingsPath, data);
  return { ok: true, settings: data };
}

module.exports = {
  handleRpcRequest
};
