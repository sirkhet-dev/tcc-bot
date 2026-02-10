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
  const entries = fs.readdirSync(root, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('.') && e.name !== SELF_DIR && e.name !== 'node_modules')
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
