#!/usr/bin/env node
// 契约同步入口：从后端公开仓库拉取 contract.json、落盘并生成前端代码。
//
// 用法：
//   npm run contract:sync -- --ref <sha>   按指定 commit 拉取并重新生成
//   npm run contract:sync                 按 contract/ref.json 里 pin 住的 commit 拉取
//   npm run contract:sync -- --check      只做本地校验（不联网），供 CI 使用

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import {
  assertContract,
  buildGeneratedSource,
  normalizeContract,
} from "./lib/generate-contract.mjs";
import { formatSource } from "./lib/prettier-format.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(SCRIPT_DIR);

const REPOSITORY = "YinXiaoyu-1998/SME_DATA_CENTER";
const REMOTE_CONTRACT_PATH = "packages/web-api-contract/contract.json";
const CONTRACT_FILE = join(ROOT, "contract/contract.json");
const REF_FILE = join(ROOT, "contract/ref.json");
const GENERATED_FILE = join(ROOT, "src/api/generated/contract.ts");

const COMMIT_SHA = /^[0-9a-f]{7,40}$/;
const HASH = /^sha256:[0-9a-f]{64}$/;

class SyncError extends Error {
  constructor(message) {
    super(message);
    this.name = "SyncError";
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }
  if (options.check) {
    await runCheck();
    return;
  }
  await runSync(options.ref);
}

async function runSync(explicitRef) {
  const ref = explicitRef ?? (await readPinnedRef()).ref;
  assertCommitRef(ref);

  const remoteContract = await fetchRemoteContract(ref);
  assertContract(remoteContract);

  // 先在内存里完成全部生成，任何一步失败都不会留下半套文件
  const contractText = await formatSource(
    normalizeContract(remoteContract),
    CONTRACT_FILE,
    "json",
  );
  const generatedText = await buildGeneratedSource(
    remoteContract,
    GENERATED_FILE,
  );
  const hash = sha256(contractText);
  const refDocument = {
    repository: REPOSITORY,
    ref,
    syncedAt: new Date().toISOString(),
    hash,
  };
  const refText = await formatSource(
    JSON.stringify(refDocument, null, 2),
    REF_FILE,
    "json",
  );

  await mkdir(dirname(CONTRACT_FILE), { recursive: true });
  await mkdir(dirname(GENERATED_FILE), { recursive: true });
  await writeFile(CONTRACT_FILE, contractText, "utf8");
  await writeFile(GENERATED_FILE, generatedText, "utf8");
  await writeFile(REF_FILE, refText, "utf8");

  console.log("契约同步完成");
  console.log(`  ref:   ${ref}`);
  console.log(`  hash:  ${hash}`);
  console.log(`  routes: ${remoteContract.routes.length}`);
  for (const file of [CONTRACT_FILE, REF_FILE, GENERATED_FILE]) {
    console.log(`  → ${relative(ROOT, file)}`);
  }
}

async function runCheck() {
  const refDocument = await readJsonFile(REF_FILE);
  assertRefDocument(refDocument);

  const contractText = await readTextFile(CONTRACT_FILE);
  const contract = parseJson(contractText, "contract/contract.json");
  assertContract(contract);

  const problems = [];

  const actualHash = sha256(contractText);
  if (actualHash !== refDocument.hash) {
    problems.push(
      `contract/contract.json 的内容 hash 与 contract/ref.json 不一致（本地 ${actualHash}，记录 ${refDocument.hash}）；请运行 npm run contract:sync -- --ref <sha> 重新同步`,
    );
  }

  const expectedContractText = await formatSource(
    normalizeContract(contract),
    CONTRACT_FILE,
    "json",
  );
  if (contractText !== expectedContractText) {
    problems.push(
      "contract/contract.json 不是 sync 生成的规范化格式，请勿手改并重新同步",
    );
  }

  const generatedText = await readTextFile(GENERATED_FILE);
  const expectedGeneratedText = await buildGeneratedSource(
    contract,
    GENERATED_FILE,
  );
  if (generatedText !== expectedGeneratedText) {
    problems.push(
      "src/api/generated/contract.ts 与 contract/contract.json 不一致；该文件禁止手改，请运行 npm run contract:sync -- --ref <sha> 重新生成",
    );
  }

  if (problems.length > 0) {
    console.error("契约校验未通过：");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
    return;
  }

  console.log("契约校验通过（本地校验，未联网）");
  console.log(`  ref:    ${refDocument.ref}`);
  console.log(`  hash:   ${refDocument.hash}`);
  console.log(`  routes: ${contract.routes.length}`);
}

async function fetchRemoteContract(ref) {
  const url = `https://raw.githubusercontent.com/${REPOSITORY}/${ref}/${REMOTE_CONTRACT_PATH}`;

  let response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(20_000),
      headers: { "user-agent": "smedc-frontend-contract-sync" },
    });
  } catch (error) {
    throw new SyncError(
      `从 GitHub 拉取契约失败：${url}\n原因：${describeError(error)}\n请检查网络或代理后重试；不会回退到本地旧文件。`,
    );
  }

  if (!response.ok) {
    throw new SyncError(
      `从 GitHub 拉取契约失败：HTTP ${response.status} ${response.statusText}\nURL：${url}\n请确认 --ref 指向包含 ${REMOTE_CONTRACT_PATH} 的提交。`,
    );
  }

  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new SyncError(
      `远端契约不是合法 JSON：${url}\n原因：${describeError(error)}`,
    );
  }
}

function parseArguments(argv) {
  let ref;
  let check = false;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--check") {
      check = true;
    } else if (argument === "--help" || argument === "-h") {
      help = true;
    } else if (argument === "--ref") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("--")) {
        throw new SyncError(
          "--ref 需要一个 commit SHA，例如 --ref 59e0b43b1e6f57a9951fae950c6d15973641950e",
        );
      }
      ref = value;
      index += 1;
    } else if (argument.startsWith("--ref=")) {
      ref = argument.slice("--ref=".length);
    } else {
      throw new SyncError(
        `未知参数「${argument}」；可用参数：--ref <sha>、--check、--help`,
      );
    }
  }

  if (check && ref !== undefined) {
    throw new SyncError(
      "--check 只做本地校验（不联网），不能与 --ref 同时使用；需要按新 ref 同步时去掉 --check。",
    );
  }

  return { ref, check, help };
}

function printUsage() {
  console.log(
    [
      "契约同步脚本",
      "",
      "  npm run contract:sync -- --ref <sha>   从 GitHub 拉取指定 commit 的契约并重新生成",
      "  npm run contract:sync                 按 contract/ref.json 里 pin 的 commit 拉取",
      "  npm run contract:sync -- --check      只校验本地契约与生成物是否一致（不联网）",
    ].join("\n"),
  );
}

async function readPinnedRef() {
  const document = await readJsonFile(REF_FILE);
  assertRefDocument(document);
  return document;
}

function assertRefDocument(document) {
  if (!isPlainObject(document)) {
    throw new SyncError("contract/ref.json 必须是对象");
  }
  if (document.repository !== REPOSITORY) {
    throw new SyncError(
      `contract/ref.json 的 repository 必须是「${REPOSITORY}」，收到「${String(document.repository)}」`,
    );
  }
  assertCommitRef(document.ref);
  if (
    typeof document.syncedAt !== "string" ||
    Number.isNaN(Date.parse(document.syncedAt))
  ) {
    throw new SyncError("contract/ref.json 的 syncedAt 必须是 ISO 时间字符串");
  }
  if (typeof document.hash !== "string" || !HASH.test(document.hash)) {
    throw new SyncError(
      "contract/ref.json 的 hash 必须是 sha256:<64 位小写十六进制>",
    );
  }
}

function assertCommitRef(ref) {
  if (typeof ref !== "string" || !COMMIT_SHA.test(ref)) {
    throw new SyncError(
      `ref 必须是 commit SHA（7–40 位小写十六进制），收到「${String(ref)}」；分支名或 tag 会移动，无法复现生成物`,
    );
  }
}

async function readJsonFile(file) {
  return parseJson(await readTextFile(file), relative(ROOT, file));
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new SyncError(`${label} 不是合法 JSON：${describeError(error)}`);
  }
}

async function readTextFile(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      throw new SyncError(
        `缺少 ${relative(ROOT, file)}；请先运行 npm run contract:sync -- --ref <sha> 生成并提交`,
      );
    }
    throw error;
  }
}

function sha256(content) {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function describeError(error) {
  if (error instanceof Error) return error.message;
  return String(error);
}

main().catch((error) => {
  console.error(`\n✖ ${describeError(error)}\n`);
  process.exitCode = 1;
});
