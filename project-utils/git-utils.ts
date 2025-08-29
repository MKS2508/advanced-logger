/**
 * Utilidades para manejo de Git
 * Funciones auxiliares para el generador de commits
 */

export interface GitFileStatus {
  path: string;
  staged: boolean;
  unstaged: boolean;
  untracked: boolean;
  deleted: boolean;
  renamed?: string;
}

export interface CommitInfo {
  hash: string;
  message: string;
  author: string;
  date: string;
}

/**
 * Parsea la salida de git status --porcelain
 */
export function parseGitStatus(statusOutput: string): GitFileStatus[] {
  const files: GitFileStatus[] = [];
  
  for (const line of statusOutput.split('\n').filter(l => l.trim())) {
    const staged = line[0];
    const unstaged = line[1];
    const filePath = line.substring(3);

    files.push({
      path: filePath,
      staged: staged !== ' ' && staged !== '?',
      unstaged: unstaged !== ' ',
      untracked: staged === '?' && unstaged === '?',
      deleted: staged === 'D' || unstaged === 'D',
      renamed: staged === 'R' ? filePath.split(' -> ')[1] : undefined,
    });
  }

  return files;
}

/**
 * Determina el área funcional de un archivo basado en su ruta
 */
export function getFileArea(filePath: string): string {
  const areas = [
    { pattern: /^src\/components\/|^src\/layouts\//, area: 'ui' },
    { pattern: /^src-tauri\//, area: 'backend' },
    { pattern: /^src\/models\/|types|interfaces/, area: 'types' },
    { pattern: /^src\/stores\/|state/, area: 'state' },
    { pattern: /^src\/pages\/|routing|navigation/, area: 'navigation' },
    { pattern: /^src\/styles\/|\.css$|theme/, area: 'theme' },
    { pattern: /config|\.json$|\.toml$|package\.json/, area: 'config' },
    { pattern: /^project-utils\/|tools|scripts/, area: 'tools' },
    { pattern: /database|migration|sql/, area: 'database' },
    { pattern: /test|spec|\.test\.|\.spec\./, area: 'testing' },
    { pattern: /doc|readme|\.md$/, area: 'docs' },
  ];

  for (const { pattern, area } of areas) {
    if (pattern.test(filePath.toLowerCase())) {
      return area;
    }
  }

  return 'misc';
}

/**
 * Determina si los archivos están relacionados funcionalmente
 */
export function areFilesRelated(files: string[]): boolean {
  if (files.length <= 1) return true;
  
  const areas = files.map(getFileArea);
  const uniqueAreas = [...new Set(areas)];
  
  // Si todos están en la misma área, están relacionados
  if (uniqueAreas.length === 1) return true;
  
  // Áreas que suelen ir juntas
  const relatedAreas = [
    ['ui', 'theme', 'navigation'],
    ['backend', 'database', 'types'],
    ['config', 'tools', 'docs'],
    ['types', 'state'],
  ];
  
  for (const group of relatedAreas) {
    if (uniqueAreas.every(area => group.includes(area))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Sugiere el tipo de commit basado en los cambios
 */
export function suggestCommitType(files: GitFileStatus[]): 'feat' | 'fix' | 'refactor' | 'feat-phase' {
  const hasNewFiles = files.some(f => f.untracked);
  const hasDeletedFiles = files.some(f => f.deleted);
  const modifiedFiles = files.filter(f => f.staged || f.unstaged);
  
  // Si hay muchos archivos nuevos, probablemente es una feature
  if (hasNewFiles && files.length > 3) {
    return 'feat-phase';
  }
  
  // Si hay archivos nuevos pero pocos, es feature completa
  if (hasNewFiles) {
    return 'feat';
  }
  
  // Si solo se modificaron archivos existentes, probablemente es fix o refactor
  if (modifiedFiles.length > 0 && !hasNewFiles) {
    // Si los cambios son grandes, es refactor
    if (modifiedFiles.length > 5) {
      return 'refactor';
    }
    // Si son pocos cambios, probablemente es fix
    return 'fix';
  }
  
  return 'feat';
}

/**
 * Extrae información relevante del diff de un archivo
 */
export function analyzeDiff(diff: string): {
  addedLines: number;
  removedLines: number;
  hasNewFunctions: boolean;
  hasNewTypes: boolean;
  hasNewImports: boolean;
  hasFixes: boolean;
} {
  const lines = diff.split('\n');
  const addedLines = lines.filter(l => l.startsWith('+')).length;
  const removedLines = lines.filter(l => l.startsWith('-')).length;
  
  const addedCode = lines.filter(l => l.startsWith('+')).join('\n');
  const removedCode = lines.filter(l => l.startsWith('-')).join('\n');
  
  return {
    addedLines,
    removedLines,
    hasNewFunctions: /function\s+\w+|const\s+\w+\s*=|async\s+function/.test(addedCode),
    hasNewTypes: /interface\s+\w+|type\s+\w+|enum\s+\w+/.test(addedCode),
    hasNewImports: /import\s+.*from/.test(addedCode),
    hasFixes: /fix|error|bug|issue|problem/i.test(addedCode) || removedCode.includes('TODO') || removedCode.includes('FIXME'),
  };
}

/**
 * Genera un resumen técnico basado en los archivos modificados
 */
export function generateTechnicalSummary(files: GitFileStatus[], diffs: Record<string, string>): string {
  const summary: string[] = [];
  
  for (const file of files) {
    const area = getFileArea(file.path);
    const diff = diffs[file.path];
    
    if (!diff) continue;
    
    const analysis = analyzeDiff(diff);
    const changes: string[] = [];
    
    if (file.untracked) {
      changes.push(`Creado ${file.path}`);
    } else if (file.deleted) {
      changes.push(`Eliminado ${file.path}`);
    } else {
      if (analysis.hasNewFunctions) changes.push('nuevas funciones');
      if (analysis.hasNewTypes) changes.push('nuevos tipos');
      if (analysis.hasNewImports) changes.push('nuevas dependencias');
      if (analysis.hasFixes) changes.push('correcciones');
      
      if (changes.length > 0) {
        changes.unshift(`Modificado ${file.path} con`);
      } else {
        changes.push(`Actualizado ${file.path}`);
      }
    }
    
    if (changes.length > 0) {
      summary.push(`- ${changes.join(' ')}`);
    }
  }
  
  return summary.join('\n');
}