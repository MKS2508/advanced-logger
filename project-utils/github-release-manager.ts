#!/usr/bin/env node

/**
 * GitHub Release Manager para Better Logger
 * Crea releases automáticamente en GitHub con los archivos de distribución
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';

interface ReleaseInfo {
  version: string;
  prefix?: string;
  baseVersion: string;
  path: string;
  files: string[];
  readme: string;
  isPrerelease: boolean;
}

interface ChangelogEntry {
  type: 'feature' | 'fix' | 'improvement' | 'breaking';
  title: string;
  description: string;
}

interface VersionData {
  version: string;
  date: string;
  type: 'initial' | 'major' | 'minor' | 'patch';
  title: string;
  changes: ChangelogEntry[];
  technical_notes: string;
  breaking_changes: string[];
}

class GitHubReleaseManager {
  private projectRoot: string;
  private releasesDir: string;
  private changelogPath: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.releasesDir = join(this.projectRoot, 'dist');
    this.changelogPath = join(this.projectRoot, 'CHANGELOG.json');
  }

  /**
   * Ejecuta comando gh CLI
   */
  private async ghCommand(args: string[]): Promise<string> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const proc = spawn('gh', args, {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`GitHub CLI error: ${stderr || 'gh command failed'}`));
        } else {
          resolve(stdout.trim());
        }
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Verifica si gh CLI está instalado y autenticado
   */
  private async checkGitHubCLI(): Promise<void> {
    try {
      await this.ghCommand(['auth', 'status']);
      console.log('✅ GitHub CLI autenticado correctamente');
    } catch (error) {
      console.error('❌ GitHub CLI no está instalado o no estás autenticado');
      console.log('💡 Instala gh CLI: https://cli.github.com/');
      console.log('💡 Autentica con: gh auth login');
      throw error;
    }
  }

  /**
   * Obtiene todas las releases existentes en GitHub
   */
  private async getExistingReleases(): Promise<Set<string>> {
    try {
      const output = await this.ghCommand(['release', 'list', '--json', 'tagName']);
      const releases = JSON.parse(output);
      return new Set(releases.map((r: any) => r.tagName));
    } catch (error) {
      console.warn('⚠️ No se pudieron obtener releases existentes:', error);
      return new Set();
    }
  }

  /**
   * Obtiene información de la release actual desde package.json y dist/
   */
  private getCurrentRelease(): ReleaseInfo | null {
    try {
      // Leer versión de package.json
      const packagePath = join(this.projectRoot, 'package.json');
      if (!existsSync(packagePath)) {
        console.warn('⚠️ package.json no existe');
        return null;
      }
      
      const packageData = JSON.parse(readFileSync(packagePath, 'utf-8'));
      const version = packageData.version;
      
      if (!existsSync(this.releasesDir)) {
        console.warn('⚠️ Directorio dist/ no existe');
        return null;
      }

      // Obtener solo archivos de la distribución (no directorios)
      const files = readdirSync(this.releasesDir)
        .map(file => join(this.releasesDir, file))
        .filter(filePath => {
          try {
            const stat = statSync(filePath);
            return stat.isFile();
          } catch {
            return false;
          }
        });

      // Determinar si es prerelease
      const isPrerelease = version.includes('-alpha') || version.includes('-beta') || version.includes('-rc') || version.includes('-pre');
      
      // Extraer prefix y base version
      const match = version.match(/^(.*?)(-alpha|-beta|-rc|-pre)?(.*)$/);
      const baseVersion = match ? match[1] + (match[3] || '') : version;
      const prefix = match && match[2] ? match[2].substring(1) : undefined;
      return {
        version,
        prefix,
        baseVersion,
        path: this.releasesDir,
        files,
        readme: this.generateREADME(version),
        isPrerelease
      };
    } catch (error) {
      console.error('❌ Error obteniendo release actual:', error);
      return null;
    }
  }

  /**
   * Genera README básico para la release
   */
  private generateREADME(version: string): string {
    const date = new Date().toISOString().split('T')[0];
    return `# Better Logger v${version}
    
## Instalación

\`\`\`bash
npm install @mks2508/better-logger@${version}
\`\`\`

## Uso

\`\`\`javascript
import { Logger } from '@mks2508/better-logger';

const logger = new Logger();
logger.info('¡Hola mundo!');
\`\`\`

---

*Release generada automáticamente el ${date}*`;
  }

  /**
   * Carga información del changelog para una versión específica
   */
  private getChangelogForVersion(version: string): VersionData | null {
    try {
      const changelogData = JSON.parse(readFileSync(this.changelogPath, 'utf-8'));
      return changelogData.versions.find((v: VersionData) => v.version === version) || null;
    } catch (error) {
      console.warn(`⚠️ No se pudo cargar changelog para ${version}`);
      return null;
    }
  }

  /**
   * Genera las release notes basadas en changelog y README
   */
  private generateReleaseNotes(release: ReleaseInfo): string {
    const changelog = this.getChangelogForVersion(release.version);
    
    let notes = `# Better Logger - ${release.version}\n\n`;
    
    if (changelog) {
      notes += `## 📋 Resumen\n${changelog.title}\n\n`;
      
      // Agrupar cambios por tipo
      const features = changelog.changes.filter(c => c.type === 'feature');
      const fixes = changelog.changes.filter(c => c.type === 'fix');
      const improvements = changelog.changes.filter(c => c.type === 'improvement');
      const breaking = changelog.changes.filter(c => c.type === 'breaking');
      
      if (features.length > 0) {
        notes += `## ✨ Nuevas Funcionalidades\n`;
        features.forEach(f => notes += `- ${f.title}\n`);
        notes += '\n';
      }
      
      if (fixes.length > 0) {
        notes += `## 🐛 Correcciones\n`;
        fixes.forEach(f => notes += `- ${f.title}\n`);
        notes += '\n';
      }
      
      if (improvements.length > 0) {
        notes += `## 🚀 Mejoras\n`;
        improvements.forEach(i => notes += `- ${i.title}\n`);
        notes += '\n';
      }
      
      if (breaking.length > 0) {
        notes += `## 💥 Cambios Importantes\n`;
        breaking.forEach(b => notes += `- ${b.title}\n`);
        notes += '\n';
      }
    }
    
    // Agregar información de instalación del README
    const readmeLines = release.readme.split('\n');
    const installIndex = readmeLines.findIndex(line => line.includes('## Instalación'));
    const compatIndex = readmeLines.findIndex(line => line.includes('## Compatibilidad'));
    
    if (installIndex !== -1) {
      notes += `## 📦 Instalación\n\n`;
      const endIndex = compatIndex !== -1 ? compatIndex : readmeLines.length;
      const installSection = readmeLines.slice(installIndex + 1, endIndex);
      notes += installSection.join('\n') + '\n\n';
    }
    
    // Información de archivos
    notes += `## 📁 Archivos de la Release\n\n`;
    release.files.forEach(file => {
      const fileName = basename(file);
      const stats = statSync(file);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
      notes += `- **${fileName}** (${sizeMB} MB)\n`;
    });
    
    notes += `\n---\n\n`;
    notes += `🏗️ **Plataforma objetivo**: Universal (Browser/Node.js)\n`;
    notes += `🗓️ **Fecha**: ${changelog?.date || new Date().toISOString().split('T')[0]}\n`;
    
    if (release.isPrerelease) {
      notes += `\n⚠️ **Nota**: Esta es una versión ${release.prefix} en desarrollo. No recomendada para producción.\n`;
    }

    return notes;
  }

  /**
   * Crea una release en GitHub
   */
  private async createGitHubRelease(release: ReleaseInfo): Promise<void> {
    console.log(`🚀 Creando release ${release.version}...`);
    
    const tagName = `v${release.version}`;
    const title = `Better Logger v${release.version}`;
    const notes = this.generateReleaseNotes(release);
    
    // Crear archivo temporal con las release notes
    const notesFile = join(this.projectRoot, `.release-notes-${release.version}.md`);
    const { writeFileSync } = await import('fs');
    writeFileSync(notesFile, notes, 'utf-8');
    
    try {
      // Crear la release
      const args = [
        'release', 'create', tagName,
        '--title', title,
        '--notes-file', notesFile,
        ...release.files
      ];
      
      if (release.isPrerelease) {
        args.push('--prerelease');
      }
      
      await this.ghCommand(args);
      console.log(`✅ Release ${release.version} creada exitosamente`);
      
      // Limpiar archivo temporal
      const { unlinkSync } = await import('fs');
      try { unlinkSync(notesFile); } catch {}
      
    } catch (error) {
      console.error(`❌ Error creando release ${release.version}:`, error);
      throw error;
    }
  }

  /**
   * Procesa todas las releases
   */
  async processReleases(force = false): Promise<void> {
    console.log('🔍 GitHub Release Manager iniciado\n');
    
    try {
      await this.checkGitHubCLI();
      
      const currentRelease = this.getCurrentRelease();
      
      if (!currentRelease) {
        console.log('❌ No se pudo obtener información de la release actual');
        return;
      }
      
      console.log(`📦 Release actual: ${currentRelease.version}`);
      
      const existingReleases = await this.getExistingReleases();
      console.log(`📋 ${existingReleases.size} releases ya existen en GitHub`);
      
      const tagName = `v${currentRelease.version}`;
      
      if (existingReleases.has(tagName) && !force) {
        console.log(`⏭️ Release ${currentRelease.version} ya existe, omitiendo`);
        console.log('💡 Usa --force para forzar recreación');
        return;
      }
      
      if (force && existingReleases.has(tagName)) {
        console.log(`🔄 Eliminando release existente ${currentRelease.version}...`);
        try {
          await this.ghCommand(['release', 'delete', tagName, '--yes']);
        } catch (error) {
          console.warn(`⚠️ No se pudo eliminar release ${tagName}:`, error);
        }
      }
      
      await this.createGitHubRelease(currentRelease);
      console.log(`\n✅ Procesamiento completado: Release ${currentRelease.version} creada exitosamente`);
      
    } catch (error) {
      console.error('❌ Error en el procesamiento:', error);
      throw error;
    }
  }

  /**
   * Monitorea el directorio releases para cambios
   */
  async watchForNewReleases(): Promise<void> {
    console.log('👀 Monitoreando directorio releases para nuevas versiones...');
    // Implementación futura con file watchers
    console.log('💡 Funcionalidad de monitoreo en desarrollo');
  }
}

// Función helper para obtener releases existentes (fix de scope)
async function getExistingReleases(): Promise<Set<string>> {
  try {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const proc = spawn('gh', ['release', 'list', '--json', 'tagName'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('exit', (code) => {
        if (code !== 0) {
          resolve(new Set());
        } else {
          try {
            const releases = JSON.parse(stdout);
            resolve(new Set(releases.map((r: any) => r.tagName)));
          } catch {
            resolve(new Set());
          }
        }
      });

      proc.on('error', () => {
        resolve(new Set());
      });
    });
  } catch (error) {
    return new Set();
  }
}

// Ejecutar script
if (import.meta.main) {
  const manager = new GitHubReleaseManager();
  
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const watch = args.includes('--watch') || args.includes('-w');
  const autoApprove = args.includes('--auto-approve');
  const quiet = args.includes('--quiet');
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 GitHub Release Manager para Better Logger

Uso:
  node project-utils/github-release-manager.ts [opciones]

Opciones:
  --auto-approve  Crear release automáticamente sin confirmación
  --force, -f     Recrear releases existentes
  --quiet         Ejecución silenciosa (solo errores y resultados)
  --watch, -w     Monitorear cambios (en desarrollo)
  --help, -h      Mostrar esta ayuda

Ejemplos:
  node project-utils/github-release-manager.ts                    # Release interactiva
  node project-utils/github-release-manager.ts --auto-approve     # Release automática
  node project-utils/github-release-manager.ts --force --auto-approve  # Forzar recreación
  node project-utils/github-release-manager.ts --quiet --auto-approve   # Para workflows
`);
    process.exit(0);
  }
  
  try {
    if (watch) {
      await manager.watchForNewReleases();
    } else {
      await manager.processReleases(force);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}