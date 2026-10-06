import path from 'node:path';
import fs from 'node:fs';
import matter from 'gray-matter';
import { load as yamlLoad } from 'js-yaml';
import { FrontmatterMeta } from '../types/index.js';

export interface ParsedSkill {
  dir: string;
  skillMdPath: string;
  body: string;
  frontmatter: FrontmatterMeta | null;
  frontmatterErrors: string[];
}

export function isSkillDir(dir: string): boolean {
  return fs.existsSync(path.join(dir, 'SKILL.md'));
}

export function parseSkill(dir: string): ParsedSkill {
  const skillMdPath = path.join(dir, 'SKILL.md');
  const content = fs.readFileSync(skillMdPath, 'utf8');
  const parsed = matter(content, {
    engines: { yaml: (s: string) => yamlLoad(s) as any },
    language: 'yaml',
    delimiters: '---'
  });
  const data = parsed.data as any;

  const fm: FrontmatterMeta | null = data ? {
    name: data.name,
    description: data.description,
    license: data.license,
    compatibility: data.compatibility,
    metadata: data.metadata,
    allowedTools: data['allowed-tools'] || data.allowedTools
  } as any : null;

  const errors: string[] = [];
  if (!fm || typeof fm.name !== 'string') {
    errors.push('missing frontmatter.name');
  }
  if (!fm || typeof fm.description !== 'string') {
    errors.push('missing frontmatter.description');
  }

  if (fm && typeof fm.name === 'string') {
    const name = fm.name;
    if (!/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(name)) {
      errors.push('invalid name format: must be 1-64 chars, lowercase alnum + hyphens, no leading/trailing hyphen, no consecutive hyphens');
    }
    if (name.includes('--')) {
      errors.push('invalid name: contains consecutive hyphens');
    }
    const dirName = path.basename(dir);
    if (dirName !== name) {
      errors.push(`name must match directory name: expected ${dirName}, got ${name}`);
    }
  }
  if (fm && typeof fm.description === 'string') {
    const len = fm.description.trim().length;
    if (len < 1 || len > 1024) {
      errors.push('description length must be 1-1024 characters');
    }
  }

  return {
    dir,
    skillMdPath,
    body: parsed.content || '',
    frontmatter: fm,
    frontmatterErrors: errors
  };
}
