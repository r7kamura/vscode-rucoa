import { existsSync, readlinkSync } from "fs";
import path = require("path");

export function inBundlerDirectory(directoryPath: string): boolean {
  return itselfOrAncestorDirectories(directoryPath).some(hasGemfileOrGemsRb);
}

function hasGemfileOrGemsRb(directory: string): boolean {
  return hasGemfile(directory) || hasGemsRb(directory);
}

function hasGemfile(directory: string): boolean {
  return existsSync(path.join(directory, "Gemfile"));
}

function hasGemsRb(directory: string): boolean {
  return existsSync(path.join(directory, "gems.rb"));
}

function itselfOrAncestorDirectories(itself: string): string[] {
  const directories = [];
  let directory: string | null = itself;
  while (directory) {
    directories.push(directory);
    try {
      directory = parentDirectory(directory);
    } catch (error) {
      directory = null;
    }
  }
  return directories;
}

function parentDirectory(directory: string): string {
  const parent = readlinkSync(path.join(directory, ".."));
  return path.join(directory, parent);
}
