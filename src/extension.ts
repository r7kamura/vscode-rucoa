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
    if (event.affectsConfiguration("rucoa")) {
      restartAllClients();
    }
  });

  workspace.onDidChangeWorkspaceFolders(() => {
    ensureOnlyNecessaryServersAreRunning();
  });

  ensureOnlyNecessaryServersAreRunning();
}

export function deactivate() {
  stopAllClients();
}

function ensureOnlyNecessaryServersAreRunning() {
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

function stopAllClients() {
  clientByFolder.forEach((_client, folder) => {
    stopClient(folder);
  });
}

function restartAllClients() {
  stopAllClients();
  ensureOnlyNecessaryServersAreRunning();
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
  };
}

function createCommandAndArguments(folder: WorkspaceFolder): string[] {
  if (inBundlerDirectory(folder.uri.fsPath)) {
    return ["bundle", "exec", "rucoa"];
  } else {
    return ["rucoa"];
  }
}

function canStartClientOn(folder: WorkspaceFolder): boolean {
  switch (workspace.getConfiguration("rucoa").get("enable")) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return checkIfRucoaIsExecutable(folder);
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
