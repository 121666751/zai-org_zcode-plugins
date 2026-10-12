// src/adapters/store-worker.ts
import { parentPort, workerData } from "node:worker_threads";
import { DatabaseSync } from "node:sqlite";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createHash, randomUUID } from "node:crypto";

// src/contract.ts
var DiagramError = class extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = "DiagramError";
  }
};
var MAX_SCENE_BYTES = 6 * 1024 * 1024;

// src/domain/scene.ts
var TYPES = /* @__PURE__ */ new Set([
  "rectangle",
  "ellipse",
  "diamond",
  "text",
  "arrow",
  "line",
  "freedraw",
  "image",
  "frame"
]);
var record = (x) => !!x && typeof x === "object" && !Array.isArray(x);
function validId(id) {
  if (typeof id !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(id))
    throw new DiagramError("invalid_id", "Invalid document or element id");
}
function fail(message) {
  throw new DiagramError("invalid_scene", message);
}
function validateScene(raw) {
  if (!record(raw) || !Array.isArray(raw.elements) || !record(raw.appState) || !record(raw.files))
    fail("Expected elements, appState and files");
  if (raw.elements.length > 5e3) fail("Scene exceeds 5000 elements");
  const ids = /* @__PURE__ */ new Set();
  for (const el of raw.elements) {
    if (!record(el)) fail("Invalid element");
    validId(el.id);
    if (ids.has(el.id)) fail(`Duplicate element: ${el.id}`);
    ids.add(el.id);
    if (!TYPES.has(String(el.type))) fail(`Unsupported element type: ${String(el.type)}`);
    for (const key of ["x", "y", "width", "height", "version"]) {
      if (typeof el[key] !== "number" || !Number.isFinite(el[key]))
        fail(`Invalid ${key} on ${el.id}`);
    }
    if (Number(el.width) < 0 || Number(el.height) < 0) fail("Negative element dimensions");
    if (el.type === "text" && typeof el.text !== "string") fail("Text content is required");
    if (el.type === "image" && !el.isDeleted && (typeof el.fileId !== "string" || !raw.files[el.fileId]))
      fail("Image file is missing");
  }
  for (const file of Object.values(raw.files)) {
    if (!record(file) || typeof file.dataURL !== "string" || !/^data:image\/(png|jpeg|webp|gif|svg\+xml);base64,/.test(file.dataURL))
      fail("Unsupported image data");
  }
  const appState = Object.fromEntries(
    Object.entries(raw.appState).filter(
      ([key]) => ["viewBackgroundColor", "gridSize", "gridStep"].includes(key)
    )
  );
  const scene = { elements: raw.elements, appState, files: raw.files };
  if (new TextEncoder().encode(JSON.stringify(scene)).length > MAX_SCENE_BYTES)
    throw new DiagramError("scene_too_large", "Scene exceeds 6 MiB");
  return structuredClone(scene);
}
function element(input, index) {
  const type = String(input.type ?? "rectangle");
  const id = input.id ?? `element-${index}`;
  validId(id);
  const el = {
    angle: 0,
    strokeColor: "#1e1e1e",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    roundness: null,
    seed: index + 1,
    versionNonce: 0,
    isDeleted: false,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
    ...input,
    id,
    type,
    x: Number(input.x ?? index * 220),
    y: Number(input.y ?? 60),
    width: Number(input.width ?? 180),
    height: Number(input.height ?? 90),
    version: Number(input.version ?? 1)
  };
  delete el.label;
  if (type === "text") {
    const text = String(input.text ?? "");
    const fontSize = Number(input.fontSize ?? 20);
    Object.assign(el, {
      fontSize,
      fontFamily: 5,
      text,
      originalText: text,
      textAlign: "center",
      verticalAlign: "middle",
      containerId: null,
      autoResize: true,
      lineHeight: 1.25,
      ...input,
      id,
      type
    });
    el.width = Number(input.width ?? Math.max(fontSize, text.length * fontSize));
    el.height = Number(input.height ?? text.split("\n").length * fontSize * 1.25);
  }
  if (type === "arrow" || type === "line")
    Object.assign(el, {
      points: [
        [0, 0],
        [el.width, el.height]
      ],
      startBinding: null,
      endBinding: null,
      startArrowhead: null,
      endArrowhead: type === "arrow" ? "arrow" : null,
      elbowed: false,
      ...input,
      id,
      type
    });
  return el;
}
function makeScene(inputs, files = {}) {
  const elements = [];
  inputs.forEach((input, i) => {
    const el = element(input, i);
    elements.push(el);
    if (record(input.label) && typeof input.label.text === "string") {
      const label = element(
        {
          ...input.label,
          id: `${el.id}-label`,
          type: "text",
          x: el.x + 8,
          y: el.y + el.height / 2 - 12.5,
          width: el.width - 16,
          containerId: el.id,
          textAlign: "center"
        },
        elements.length
      );
      el.boundElements = [{ id: label.id, type: "text" }];
      elements.push(label);
    }
  });
  return validateScene({ elements, appState: { viewBackgroundColor: "#ffffff" }, files });
}
function applyOperations(scene, operations) {
  const next = structuredClone(scene);
  for (const op of operations) {
    if (op.type === "add") {
      next.elements.push(...makeScene([op.element], next.files).elements);
      continue;
    }
    const el = next.elements.find((item) => item.id === op.id && !item.isDeleted);
    if (!el) fail(`Element not found: ${op.id}`);
    if (op.type === "delete") {
      const deleted = /* @__PURE__ */ new Set([
        el.id,
        ...next.elements.filter((e) => e.containerId === el.id).map((e) => e.id)
      ]);
      for (const item of next.elements) {
        if (deleted.has(item.id)) {
          item.isDeleted = true;
          item.version++;
        }
        if (Array.isArray(item.boundElements))
          item.boundElements = item.boundElements.filter(
            (b) => !record(b) || !deleted.has(String(b.id))
          );
        for (const key of ["startBinding", "endBinding"])
          if (record(item[key]) && deleted.has(String(item[key].elementId))) item[key] = null;
      }
    } else {
      if ("id" in op.changes || "type" in op.changes)
        fail("Updates cannot change element identity or type");
      const dx = Number(op.changes.x ?? el.x) - el.x;
      const dy = Number(op.changes.y ?? el.y) - el.y;
      Object.assign(el, op.changes, {
        version: el.version + 1,
        versionNonce: el.versionNonce === 1 ? 2 : 1
      });
      if (el.type === "text" && "text" in op.changes) el.originalText = el.text;
      for (const label of next.elements.filter((e) => e.containerId === el.id)) {
        label.x += dx;
        label.y += dy;
        label.version++;
      }
    }
  }
  return validateScene(next);
}

// src/adapters/store-worker.ts
await mkdir(workerData.root, { recursive: true });
var db = new DatabaseSync(join(workerData.root, "documents.sqlite"));
db.exec(`PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, title TEXT NOT NULL, revision INTEGER NOT NULL,
  scene TEXT NOT NULL, updatedAt INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS operations (documentId TEXT, operationId TEXT, hash TEXT NOT NULL,
  result TEXT NOT NULL, PRIMARY KEY(documentId, operationId));`);
db.exec("BEGIN IMMEDIATE");
try {
  const columns = db.prepare("PRAGMA table_info(documents)").all();
  for (const column of ["agentRevision", "beforeAgent"]) {
    if (columns.some((item) => item.name === column))
      db.exec(`ALTER TABLE documents DROP COLUMN ${column}`);
  }
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  throw error;
}
function row(id) {
  validId(id);
  const result = db.prepare("SELECT * FROM documents WHERE id=?").get(id);
  if (!result) throw new DiagramError("not_found", "Diagram not found");
  return result;
}
function diagram(r) {
  return {
    id: r.id,
    title: r.title,
    revision: r.revision,
    scene: JSON.parse(r.scene),
    updatedAt: r.updatedAt
  };
}
function mutate(method, args) {
  validId(args.id);
  validId(args.operationId);
  const hash = createHash("sha256").update(JSON.stringify({ method, args })).digest("hex");
  db.exec("BEGIN IMMEDIATE");
  try {
    const previous = db.prepare("SELECT hash,result FROM operations WHERE documentId=? AND operationId=?").get(args.id, args.operationId);
    if (previous) {
      if (previous.hash !== hash)
        throw new DiagramError("operation_conflict", "Operation id reused with different input");
      db.exec("COMMIT");
      return JSON.parse(previous.result);
    }
    const current = row(args.id);
    if (current.revision !== args.expectedRevision)
      throw new DiagramError(
        "revision_conflict",
        `Expected revision ${args.expectedRevision}; current revision ${current.revision}`
      );
    const scene = JSON.stringify(
      method === "apply" ? applyOperations(JSON.parse(current.scene), args.operations) : validateScene(args.scene)
    );
    const revision = current.revision + 1;
    const updatedAt = Date.now();
    db.prepare("UPDATE documents SET scene=?,revision=?,updatedAt=? WHERE id=?").run(
      scene,
      revision,
      updatedAt,
      current.id
    );
    const result = diagram({ ...current, scene, revision, updatedAt });
    db.prepare("INSERT INTO operations VALUES (?,?,?,?)").run(
      args.id,
      args.operationId,
      hash,
      JSON.stringify(result)
    );
    db.prepare(
      "DELETE FROM operations WHERE documentId=? AND rowid NOT IN (SELECT rowid FROM operations WHERE documentId=? ORDER BY rowid DESC LIMIT 32)"
    ).run(args.id, args.id);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
parentPort.on("message", ({ id, method, args }) => {
  try {
    let result;
    if (method === "create") {
      const docId = args.id ?? randomUUID();
      validId(docId);
      const title = String(args.title).trim().slice(0, 200) || "Untitled";
      const scene = validateScene(args.scene);
      db.prepare("INSERT INTO documents(id,title,revision,scene,updatedAt) VALUES (?,?,1,?,?)").run(
        docId,
        title,
        JSON.stringify(scene),
        Date.now()
      );
      result = diagram(row(docId));
    } else if (method === "read") result = diagram(row(args.id));
    else if (method === "list")
      result = db.prepare(
        "SELECT id,title,revision,updatedAt FROM documents ORDER BY updatedAt DESC LIMIT 100"
      ).all();
    else if (method === "commit" || method === "apply") result = mutate(method, args);
    else if (method === "close") db.close();
    else throw new DiagramError("unknown_method", "Unknown store request");
    parentPort.postMessage({ id, result });
  } catch (error) {
    parentPort.postMessage({
      id,
      error: {
        code: error instanceof DiagramError ? error.code : "storage_error",
        message: error instanceof Error ? error.message : String(error)
      }
    });
  }
});
