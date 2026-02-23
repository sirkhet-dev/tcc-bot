import { config } from '../config.js';
import path from 'node:path';
import fs from 'node:fs';

export interface Project {
  name: string;
  path: string;
  desc: string;
}

const SELF_DIR = 'tcc-bot';

function scanProjects(): Project[] {
  const root = config.WORKSPACE_ROOT;
  const allowSet = new Set(config.PROJECT_ALLOWLIST.map((name) => name.toLowerCase()));
  const entries = fs.readdirSync(root, { withFileTypes: true });
  return entries
    .filter((e) => {
      if (!e.isDirectory()) return false;
      if (e.name.startsWith('.') || e.name === SELF_DIR || e.name === 'node_modules') return false;
      if (allowSet.size > 0 && !allowSet.has(e.name.toLowerCase())) return false;
      return fs.existsSync(path.join(root, e.name, '.git'));
    })
    .map((e) => ({
      name: e.name,
      path: path.join(root, e.name),
      desc: e.name,
    }));
}

export function getProjects(): Project[] {
  return scanProjects();
}

export function findProject(name: string): Project | undefined {
  return getProjects().find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  );
}
