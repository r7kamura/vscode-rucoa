import { execSync } from "child_process";
import { ExtensionContext, WorkspaceFolder, workspace, window } from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
} from "vscode-languageclient/node";
import { inBundlerDirectory } from "./bundler";

const clientByFolder: Map<WorkspaceFolder, LanguageClient> = new Map();

export function activate(context: ExtensionContext) {
  workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration("rucoa.base")) {
      restartClients();
    }
  });

  workspace.onDidChangeWorkspaceFolders(() => {
    ensureClients();
  });

  ensureClients();
}

export function deactivate() {
  stopClients();
}

function ensureClients() {
  if (!workspace.workspaceFolders) {
    return;
  }

  const folders: Set<WorkspaceFolder> = new Set(workspace.workspaceFolders);
  clientByFolder.forEach((_client, folder) => {
    if (!folders.has(folder)) {
      stopClient(folder);
    }
  });

  workspace.workspaceFolders.forEach((folder) => {
    startClient(folder);
  });
}

function startClient(folder: WorkspaceFolder) {
  if (clientByFolder.has(folder)) {
    return;
  }

  if (!canStartClientOn(folder)) {
    return;
  }

  const client = new LanguageClient(
    "rucoa",
    "Rucoa Language Server",
    createServerOptions(folder),
    createClientOptions()
  );
  clientByFolder.set(folder, client);
  client.start();

  window.setStatusBarMessage(`Started rucoa in ${folder.uri.fsPath}...`, 3000);
}

function stopClient(folder: WorkspaceFolder) {
  const client = clientByFolder.get(folder);
  if (!client) {
    return;
  }

  client.stop();
  clientByFolder.delete(folder);
}

function stopClients() {
  clientByFolder.forEach((_client, folder) => {
    stopClient(folder);
  });
}

function restartClients() {
  stopClients();
  ensureClients();
}

function createServerOptions(folder: WorkspaceFolder): ServerOptions {
  const commandAndArguments = createCommandAndArguments(folder);
  return {
    command: commandAndArguments.shift()!,
    args: commandAndArguments,
    options: {
      cwd: folder.uri.fsPath,
    },
  };
}

function createClientOptions(): LanguageClientOptions {
  return {
    documentSelector: [
      {
        language: "ruby",
        scheme: "file",
      },
      {
        language: "ruby",
        scheme: "untitled",
      },
    ],
    synchronize: {
      configurationSection: "rucoa",
    },
  };
}

function createCommandAndArguments(folder: WorkspaceFolder): string[] {
  if (canUseBundlerOn(folder)) {
    return ["bundle", "exec", "rucoa"];
  } else {
    return ["rucoa"];
  }
}

enum ConfigurationValueRucoaEnable {
  Always = "always",
  Auto = "auto",
  Never = "never",
}

function canStartClientOn(folder: WorkspaceFolder): boolean {
  switch (
    workspace
      .getConfiguration("rucoa")
      .get("base.enable") as ConfigurationValueRucoaEnable
  ) {
    case "always":
      return true;
    case "never":
      return false;
    default:
      return checkIfRucoaIsExecutable(folder);
  }
}

enum ConfigurationValueRucoaUseBundler {
  Always = "always",
  Auto = "auto",
  Never = "never",
}

function canUseBundlerOn(folder: WorkspaceFolder): boolean {
  switch (
    workspace
      .getConfiguration("rucoa")
      .get("base.useBundler") as ConfigurationValueRucoaUseBundler
  ) {
    case "always":
      return true;
    case "never":
      return false;
    default:
      return inBundlerDirectory(folder.uri.fsPath);
  }
}

function checkIfRucoaIsExecutable(folder: WorkspaceFolder): boolean {
  try {
    execSync(createCommandAndArguments(folder).concat(["--help"]).join(" "), {
      cwd: folder.uri.fsPath,
    });
    return true;
  } catch (_error) {
    return false;
  }
}
