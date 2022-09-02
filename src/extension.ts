import { ExtensionContext, WorkspaceFolder, workspace, window } from "vscode";

import { LanguageClient } from "vscode-languageclient/node";

const clientByFolder: Map<WorkspaceFolder, LanguageClient> = new Map();

export function activate(context: ExtensionContext) {
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
  clientByFolder.forEach((client, folder) => {
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

  const client = new LanguageClient(
    "rucoa",
    "Rucoa Language Server",
    {
      command: "bundle",
      args: ["exec", "rucoa"],
      options: {
        cwd: folder.uri.fsPath,
      },
    },
    {
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
    }
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
