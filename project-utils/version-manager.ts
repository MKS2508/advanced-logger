#!/usr/bin/env node

/**
 * Version Manager para Better Logger
 * Analiza commits, extrae changelog, asigna versiones y actualiza archivos
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface ChangelogEntry {
  type: 'feature' | 'fix' | 'improvement' | 'breaking';
  title: string;
  description: string;
}

interface Version {
  version: string;
  date: string;
  type: 'initial' | 'major' | 'minor' | 'patch';
  title: string;
  changes: ChangelogEntry[];
  technical_notes: string;
  breaking_changes: string[];
  commit_hash: string;
  prefix?: string; // pre-alpha, alpha, beta, rc, o undefined para stable
}

interface ChangelogData {
  current_version: string;
  versions: Version[];
}

interface CommitInfo {
  hash: string;
  date: string;
  title: string;
  description: string;
  technical_section?: string;
  changelog_section?: string;
}

class VersionManager {
  private projectRoot: string;
  private changelogPath: string;
  private packageJsonPath: string;
  private tauriConfigPath: string;
  private cargoTomlPath: string;

  constructor() {
    this.projectRoot = process.cwd();
    this.changelogPath = join(this.projectRoot, 'CHANGELOG.json');
    this.packageJsonPath = join(this.projectRoot, 'package.json');
  }

  /**
   * Ejecuta comando git y devuelve resultado
   */
  private async gitCommand(args: string[]): Promise<string> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const proc = spawn('git', args, {
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
          reject(new Error(`Git error: ${stderr || 'Git command failed'}`));
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
   * Obtiene todos los commits desde un hash específico
   */
  private async getCommitsSince(sinceHash?: string): Promise<CommitInfo[]> {
    const args = ['log', '--pretty=format:%H|%ci|%s', '--reverse'];
    if (sinceHash) {
      args.push(`${sinceHash}..HEAD`);
    }

    const output = await this.gitCommand(args);
    if (!output) return [];

    const commits: CommitInfo[] = [];
    
    for (const line of output.split('\n')) {
      const [hash, date, title] = line.split('|');
      if (!hash) continue;

      // Obtener el mensaje completo del commit
      try {
        const fullMessage = await this.gitCommand(['log', '-1', '--pretty=format:%B', hash]);
        const sections = this.parseCommitMessage(fullMessage);
        
        commits.push({
          hash,
          date: new Date(date).toISOString().split('T')[0],
          title,
          description: fullMessage,
          technical_section: sections.technical,
          changelog_section: sections.changelog
        });
      } catch (error) {
        console.warn(`⚠️ No se pudo obtener mensaje completo para commit ${hash}: ${error}`);
        commits.push({
          hash,
          date: new Date(date).toISOString().split('T')[0],
          title,
          description: title
        });
      }
    }

    return commits;
  }

  /**
   * Extrae secciones <technical> y <changelog> de un mensaje de commit
   */
  private parseCommitMessage(message: string): { technical?: string; changelog?: string } {
    const technicalMatch = message.match(/<technical>([\s\S]*?)<\/technical>/);
    const changelogMatch = message.match(/<changelog>([\s\S]*?)<\/changelog>/);

    return {
      technical: technicalMatch?.[1]?.trim(),
      changelog: changelogMatch?.[1]?.trim()
    };
  }

  /**
   * Convierte sección de changelog en entradas estructuradas
   */
  private parseChangelogSection(changelog: string): ChangelogEntry[] {
    if (!changelog) return [];

    const entries: ChangelogEntry[] = [];
    const lines = changelog.split('\n').map(line => line.trim()).filter(line => line);

    let currentSection = '';
    let currentEntries: string[] = [];

    for (const line of lines) {
      if (line.startsWith('##')) {
        // Procesar sección anterior
        if (currentSection && currentEntries.length > 0) {
          entries.push(...this.processSectionEntries(currentSection, currentEntries));
        }

        // Nueva sección
        currentSection = line.replace(/^##\s*/, '').toLowerCase();
        currentEntries = [];
      } else if (line.startsWith('-')) {
        currentEntries.push(line.replace(/^-\s*/, ''));
      }
    }

    // Procesar última sección
    if (currentSection && currentEntries.length > 0) {
      entries.push(...this.processSectionEntries(currentSection, currentEntries));
    }

    return entries;
  }

  /**
   * Procesa entradas de una sección específica del changelog
   */
  private processSectionEntries(section: string, entries: string[]): ChangelogEntry[] {
    let type: ChangelogEntry['type'] = 'improvement';

    if (section.includes('fix') || section.includes('🐛')) {
      type = 'fix';
    } else if (section.includes('feature') || section.includes('✨')) {
      type = 'feature';
    } else if (section.includes('breaking')) {
      type = 'breaking';
    }

    return entries.map(entry => ({
      type,
      title: entry.split('.')[0] || entry,
      description: entry
    }));
  }

  /**
   * Determina el tipo de versión basado en los cambios
   */
  private determineVersionType(commits: CommitInfo[]): Version['type'] {
    const hasBreaking = commits.some(c => 
      c.changelog_section?.includes('breaking') || 
      c.title.toLowerCase().includes('breaking')
    );
    
    if (hasBreaking) return 'major';

    const hasFeature = commits.some(c => 
      c.title.startsWith('feat(') || 
      c.changelog_section?.includes('✨') ||
      c.changelog_section?.toLowerCase().includes('feature')
    );
    
    if (hasFeature) return 'minor';

    return 'patch';
  }

  /**
   * Incrementa versión según el tipo, considerando prefijos
   */
  private incrementVersion(
    currentVersion: string, 
    type: Version['type'], 
    targetPrefix?: string,
    overrideType?: Version['type']
  ): string {
    // Extraer prefix y versión base
    const { prefix, baseVersion } = this.parseVersionString(currentVersion);
    const [major, minor, patch] = baseVersion.split('.').map(Number);

    // Si se especifica un targetPrefix, usarlo; si no, mantener el actual
    const newPrefix = targetPrefix !== undefined ? targetPrefix : prefix;

    // Si se especifica un override del tipo, usarlo
    const actualType = overrideType || type;

    let newBaseVersion: string;
    switch (actualType) {
      case 'major':
        newBaseVersion = `${major + 1}.0.0`;
        break;
      case 'minor':
        newBaseVersion = `${major}.${minor + 1}.0`;
        break;
      case 'patch':
        newBaseVersion = `${major}.${minor}.${patch + 1}`;
        break;
      default:
        newBaseVersion = baseVersion;
    }

    return this.buildVersionString(newPrefix, newBaseVersion);
  }

  /**
   * Parsea una versión con posible prefijo
   */
  private parseVersionString(version: string): { prefix?: string; baseVersion: string } {
    const prefixMatch = version.match(/^(pre-alpha-|alpha-|beta-|rc-)?(.+)$/);
    if (prefixMatch) {
      return {
        prefix: prefixMatch[1]?.replace(/-$/, ''), // Remover el guión final
        baseVersion: prefixMatch[2]
      };
    }
    return { baseVersion: version };
  }

  /**
   * Construye una versión con prefijo
   */
  private buildVersionString(prefix?: string, baseVersion?: string): string {
    if (!baseVersion) return '1.0.0';
    if (!prefix) return baseVersion; // Sin prefijo = estable
    return `${prefix}-${baseVersion}`;
  }

  /**
   * Valida que la transición de prefijo sea lógica
   */
  private validatePrefixTransition(currentVersion: string, targetPrefix?: string): void {
    const { prefix: currentPrefix } = this.parseVersionString(currentVersion);
    
    // Definir orden de prefijos (undefined = stable)
    const prefixOrder = ['pre-alpha', 'alpha', 'beta', 'rc', undefined];
    const currentIndex = prefixOrder.indexOf(currentPrefix);
    const targetIndex = prefixOrder.indexOf(targetPrefix);

    // Permitir cualquier transición, pero advertir sobre regresiones
    if (currentIndex !== -1 && targetIndex !== -1 && targetIndex < currentIndex) {
      console.warn(`⚠️ Advertencia: Transición de prefijo regresiva ${currentPrefix || 'stable'} → ${targetPrefix || 'stable'}`);
      console.warn('   Esto podría confundir a los usuarios sobre el estado de estabilidad.');
    }

    // Validar prefijos válidos
    const validPrefixes = ['pre-alpha', 'alpha', 'beta', 'rc'];
    if (targetPrefix && !validPrefixes.includes(targetPrefix)) {
      throw new Error(`❌ Prefijo inválido: ${targetPrefix}. Válidos: ${validPrefixes.join(', ')}, o sin prefijo para stable`);
    }
  }

  /**
   * Carga datos actuales del changelog
   */
  private loadChangelogData(): ChangelogData {
    if (existsSync(this.changelogPath)) {
      try {
        const content = readFileSync(this.changelogPath, 'utf-8');
        return JSON.parse(content);
      } catch (error) {
        console.warn('⚠️ Error leyendo changelog.json, creando nuevo');
      }
    }

    return {
      current_version: '0.1.0',
      versions: []
    };
  }

  /**
   * Obtiene el último commit versionado
   */
  private getLastVersionedCommit(data: ChangelogData): string | undefined {
    const sortedVersions = [...data.versions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    return sortedVersions[0]?.commit_hash;
  }

  /**
   * Analiza commits y genera nueva versión
   */
  async analyzeAndVersion(options: {
    type?: Version['type'];
    prefix?: string;
  } = {}): Promise<void> {
    console.log('🚀 Iniciando análisis de versionado...\n');

    try {
      // Cargar datos existentes
      const changelogData = this.loadChangelogData();
      console.log(`📋 Versión actual: ${changelogData.current_version}`);

      // Obtener último commit versionado
      const lastVersionedCommit = this.getLastVersionedCommit(changelogData);
      console.log(`🔍 Último commit versionado: ${lastVersionedCommit || 'ninguno'}`);

      // Obtener commits nuevos
      const newCommits = await this.getCommitsSince(lastVersionedCommit);
      console.log(`📝 Encontrados ${newCommits.length} commits nuevos`);

      if (newCommits.length === 0) {
        console.log('✅ No hay commits nuevos para versionar');
        return;
      }

      // Mostrar commits que se van a versionar
      console.log('\n📋 Commits que se incluirán en la nueva versión:');
      newCommits.forEach(commit => {
        console.log(`  • ${commit.hash.slice(0, 7)} - ${commit.title}`);
      });

      // Determinar tipo de versión
      const detectedVersionType = this.determineVersionType(newCommits);
      const finalVersionType = options.type || detectedVersionType;
      
      // Si se especifica un prefix, validarlo
      if (options.prefix !== undefined) {
        this.validatePrefixTransition(changelogData.current_version, options.prefix);
      }

      const newVersion = this.incrementVersion(
        changelogData.current_version, 
        detectedVersionType, 
        options.prefix,
        finalVersionType
      );
      
      console.log(`\n🏷️ Nueva versión: ${changelogData.current_version} → ${newVersion}`);
      console.log(`📊 Tipo detectado: ${detectedVersionType}${options.type ? ` → Forzado: ${options.type}` : ''}`);
      if (options.prefix !== undefined) {
        const { prefix: currentPrefix } = this.parseVersionString(changelogData.current_version);
        console.log(`🏷️ Prefix: ${currentPrefix || 'stable'} → ${options.prefix || 'stable'}`);
      }

      // Procesar cambios
      const allChanges: ChangelogEntry[] = [];
      let technicalNotes = '';

      for (const commit of newCommits) {
        if (commit.changelog_section) {
          const changes = this.parseChangelogSection(commit.changelog_section);
          allChanges.push(...changes);
        } else {
          // Generar entrada básica desde el título del commit
          let type: ChangelogEntry['type'] = 'improvement';
          if (commit.title.startsWith('feat(')) type = 'feature';
          else if (commit.title.startsWith('fix(')) type = 'fix';

          allChanges.push({
            type,
            title: commit.title.replace(/^(feat|fix|refactor)\([^)]+\)\s*-\s*/, ''),
            description: commit.title
          });
        }

        if (commit.technical_section) {
          technicalNotes += `\n${commit.technical_section}`;
        }
      }

      // Crear nueva versión
      const { prefix } = this.parseVersionString(newVersion);
      const newVersionEntry: Version = {
        version: newVersion,
        date: new Date().toISOString().split('T')[0],
        type: finalVersionType,
        title: this.generateVersionTitle(allChanges, finalVersionType, prefix),
        changes: allChanges,
        technical_notes: technicalNotes.trim(),
        breaking_changes: allChanges
          .filter(c => c.type === 'breaking')
          .map(c => c.description),
        commit_hash: newCommits[newCommits.length - 1].hash,
        prefix
      };

      // Actualizar datos
      changelogData.current_version = newVersion;
      changelogData.versions.unshift(newVersionEntry); // Agregar al principio

      // Guardar changelog actualizado
      writeFileSync(this.changelogPath, JSON.stringify(changelogData, null, 2));
      console.log(`💾 Changelog actualizado: ${this.changelogPath}`);

      // Actualizar todos los archivos de configuración
      await this.updateAllVersionFiles(newVersion);

      console.log(`\n✅ Versionado completado exitosamente!`);
      console.log(`📦 Nueva versión: ${newVersion}`);
      console.log(`📋 Cambios incluidos: ${allChanges.length}`);
      console.log(`📝 Commits procesados: ${newCommits.length}`);
      
      // Sugerir creación de release si hay archivos de distribución disponibles
      const distDir = join(this.projectRoot, 'dist');
      if (existsSync(distDir)) {
        console.log(`\n💡 Archivos de distribución detectados en ${distDir}`);
        console.log(`🚀 Para crear release en GitHub ejecuta:`);
        console.log(`   npm run release:github`);
      }

    } catch (error) {
      console.error('❌ Error durante el versionado:', error);
      throw error;
    }
  }

  /**
   * Genera título descriptivo para la versión
   */
  private generateVersionTitle(changes: ChangelogEntry[], type: Version['type'], prefix?: string): string {
    const features = changes.filter(c => c.type === 'feature');
    const fixes = changes.filter(c => c.type === 'fix');
    const improvements = changes.filter(c => c.type === 'improvement');

    // Prefijo para el título
    const prefixLabel = prefix ? 
      `Versión ${prefix.charAt(0).toUpperCase() + prefix.slice(1)} - ` : '';

    if (type === 'major') {
      return `${prefixLabel}Actualización mayor con cambios significativos`;
    }

    if (features.length > 0) {
      const mainFeature = features[0].title;
      if (features.length === 1) {
        return `${prefixLabel}Nueva funcionalidad: ${mainFeature}`;
      }
      return `${prefixLabel}Nuevas funcionalidades incluyendo ${mainFeature} y ${features.length - 1} más`;
    }

    if (fixes.length > 0) {
      if (fixes.length === 1) {
        return `${prefixLabel}Corrección: ${fixes[0].title}`;
      }
      return `${prefixLabel}Correcciones y mejoras (${fixes.length} fixes, ${improvements.length} mejoras)`;
    }

    return `${prefixLabel}Mejoras y optimizaciones`;
  }

  /**
   * Actualiza versión en todos los archivos de configuración
   */
  private async updateAllVersionFiles(version: string): Promise<void> {
    console.log(`🔄 Sincronizando versión ${version} en todos los archivos...`);
    
    // Actualizar package.json
    await this.updatePackageVersion(version);
    
    // No hay archivos adicionales que actualizar para Better Logger
    
    // Better Logger no requiere sincronización OTA
    
    console.log(`✅ Todas las versiones sincronizadas en ${version}`);
  }

  /**
   * Actualiza versión en package.json
   */
  private async updatePackageVersion(version: string): Promise<void> {
    const packageJson = JSON.parse(readFileSync(this.packageJsonPath, 'utf-8'));
    packageJson.version = version;
    writeFileSync(this.packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`📦 Actualizado package.json → ${version}`);
  }

  /**
   * Actualiza versión en tauri.conf.json
   * Tauri requiere versionado semántico estricto (sin prefijos)
   */
  private async updateTauriVersion(version: string): Promise<void> {
    const tauriConfig = JSON.parse(readFileSync(this.tauriConfigPath, 'utf-8'));
    
    // Extraer solo la versión base para Tauri (sin prefijos)
    const { baseVersion } = this.parseVersionString(version);
    tauriConfig.version = baseVersion;
    
    writeFileSync(this.tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');
    console.log(`🦀 Actualizado tauri.conf.json → ${baseVersion} (sin prefijo para semver)`);
  }

  /**
   * Actualiza versión en Cargo.toml
   * Cargo también requiere versionado semántico estricto (sin prefijos)
   */
  private async updateCargoVersion(version: string): Promise<void> {
    const cargoContent = readFileSync(this.cargoTomlPath, 'utf-8');
    
    // Extraer solo la versión base para Cargo (sin prefijos)
    const { baseVersion } = this.parseVersionString(version);
    const updatedContent = cargoContent.replace(
      /^version\s*=\s*"[^"]*"/m,
      `version = "${baseVersion}"`
    );
    
    writeFileSync(this.cargoTomlPath, updatedContent);
    console.log(`🦀 Actualizado Cargo.toml → ${baseVersion} (sin prefijo para semver)`);
  }

  /**
   * Sincroniza la nueva versión con el sistema OTA
   * Actualiza versions.json y mapea prefijos a canales OTA
   */
  private async syncWithOTASystem(version: string): Promise<void> {
    const versionsPath = join(this.projectRoot, 'versions.json');
    
    try {
      // Extraer información de la versión
      const { prefix, baseVersion } = this.parseVersionString(version);
      
      // Mapear prefix a canal OTA
      let targetChannel = 'stable';
      if (prefix === 'alpha' || prefix === 'beta') {
        targetChannel = 'beta';
      } else if (prefix === 'pre-alpha' || prefix === 'rc') {
        targetChannel = 'dev';
      }
      
      if (!existsSync(versionsPath)) {
        console.log('⚠️ versions.json no existe, creando estructura inicial...');
        await this.createInitialVersionsFile(baseVersion, targetChannel);
        return;
      }

      // Leer versions.json actual
      const versionsData = JSON.parse(readFileSync(versionsPath, 'utf-8'));
      const currentDate = new Date().toISOString();
      const buildNumber = currentDate.replace(/[-:.TZ]/g, '').slice(0, 12);

      // Actualizar versiones principales
      versionsData.frontend.version = baseVersion;
      versionsData.frontend.build = buildNumber;
      versionsData.frontend.lastUpdated = currentDate;
      
      versionsData.backend.version = baseVersion;
      versionsData.backend.build = buildNumber; 
      versionsData.backend.lastUpdated = currentDate;

      // Actualizar canal OTA correspondiente
      versionsData.updateChannels[targetChannel].frontend = version;
      versionsData.updateChannels[targetChannel].backend = version;

      // Agregar entrada de changelog OTA
      const changelogEntry = {
        version: baseVersion,
        date: new Date().toISOString().split('T')[0],
        changes: [`Actualización automática desde version-manager (${version})`]
      };

      // Agregar al inicio del changelog (más reciente primero)
      if (!versionsData.frontend.changelog.find((entry: any) => entry.version === baseVersion)) {
        versionsData.frontend.changelog.unshift(changelogEntry);
        versionsData.backend.changelog.unshift(changelogEntry);
      }

      // Actualizar matriz de compatibilidad
      const compatibilityEntry = versionsData.compatibility.matrix.find((entry: any) => 
        entry.backend === baseVersion
      );
      
      if (!compatibilityEntry) {
        versionsData.compatibility.matrix.unshift({
          backend: baseVersion,
          frontend: [baseVersion]
        });
      }

      // Guardar versions.json actualizado
      writeFileSync(versionsPath, JSON.stringify(versionsData, null, 2));
      console.log(`🔄 Sistema OTA sincronizado → ${baseVersion} (canal: ${targetChannel})`);
      
    } catch (error) {
      console.warn(`⚠️ Error sincronizando sistema OTA: ${error}`);
      console.warn('El versionado principal continuará sin sincronización OTA');
    }
  }

  /**
   * Crea archivo versions.json inicial cuando no existe
   */
  private async createInitialVersionsFile(version: string, channel: string): Promise<void> {
    const currentDate = new Date().toISOString();
    const buildNumber = currentDate.replace(/[-:.TZ]/g, '').slice(0, 12);
    
    const initialVersions = {
      frontend: {
        version,
        build: buildNumber,
        lastUpdated: currentDate,
        changelog: [{
          version,
          date: new Date().toISOString().split('T')[0],
          changes: ['Inicialización automática del sistema OTA']
        }]
      },
      backend: {
        version,
        build: buildNumber,
        lastUpdated: currentDate,
        minimumFrontend: version,
        changelog: [{
          version,
          date: new Date().toISOString().split('T')[0], 
          changes: ['Inicialización automática del sistema OTA']
        }]
      },
      compatibility: {
        matrix: [{
          backend: version,
          frontend: [version]
        }]
      },
      updateChannels: {
        stable: { frontend: version, backend: version },
        beta: { frontend: version, backend: version },
        dev: { frontend: version, backend: version }
      }
    };

    const versionsPath = join(this.projectRoot, 'versions.json');
    writeFileSync(versionsPath, JSON.stringify(initialVersions, null, 2));
    console.log(`🆕 Archivo versions.json creado con versión inicial: ${version}`);
  }

  /**
   * Sincroniza todos los archivos de configuración con la versión actual del changelog
   */
  async syncVersionFiles(): Promise<void> {
    console.log('🔄 Sincronizando archivos de configuración con versión actual...\n');

    try {
      // Cargar datos del changelog
      const changelogData = this.loadChangelogData();
      const currentVersion = changelogData.current_version;
      
      console.log(`📋 Versión actual en changelog: ${currentVersion}`);

      // Actualizar todos los archivos de configuración
      await this.updateAllVersionFiles(currentVersion);

      console.log(`\n✅ Sincronización completada exitosamente!`);
      console.log(`📦 Todos los archivos actualizados a: ${currentVersion}`);

    } catch (error) {
      console.error('❌ Error durante la sincronización:', error);
      throw error;
    }
  }

  /**
   * Procesa todos los commits existentes (para inicialización)
   */
  async initializeFromHistory(): Promise<void> {
    console.log('🔄 Inicializando changelog desde historial completo...\n');

    try {
      // Obtener TODOS los commits
      const allCommits = await this.getCommitsSince();
      console.log(`📝 Encontrados ${allCommits.length} commits totales en el historial`);

      if (allCommits.length === 0) {
        console.log('✅ No hay commits para procesar');
        return;
      }

      // Agrupar commits por tipo y fecha para crear versiones lógicas
      const versionGroups = this.groupCommitsIntoVersions(allCommits);
      console.log(`📊 Agrupados en ${versionGroups.length} versiones lógicas`);

      const changelogData: ChangelogData = {
        current_version: '0.1.0',
        versions: []
      };

      // Procesar cada grupo como una versión
      for (let i = 0; i < versionGroups.length; i++) {
        const group = versionGroups[i];
        const versionNumber = this.generateVersionNumber(i, versionGroups.length);
        
        const allChanges: ChangelogEntry[] = [];
        let technicalNotes = '';

        for (const commit of group.commits) {
          if (commit.changelog_section) {
            const changes = this.parseChangelogSection(commit.changelog_section);
            allChanges.push(...changes);
          } else {
            let type: ChangelogEntry['type'] = 'improvement';
            if (commit.title.startsWith('feat(')) type = 'feature';
            else if (commit.title.startsWith('fix(')) type = 'fix';

            allChanges.push({
              type,
              title: commit.title.replace(/^(feat|fix|refactor)\([^)]+\)\s*-\s*/, ''),
              description: commit.title
            });
          }

          if (commit.technical_section) {
            technicalNotes += `\n${commit.technical_section}`;
          }
        }

        const version: Version = {
          version: versionNumber,
          date: group.date,
          type: group.type,
          title: group.title,
          changes: allChanges,
          technical_notes: technicalNotes.trim(),
          breaking_changes: allChanges
            .filter(c => c.type === 'breaking')
            .map(c => c.description),
          commit_hash: group.commits[group.commits.length - 1].hash
        };

        changelogData.versions.push(version);
      }

      // La versión más reciente es la actual
      if (changelogData.versions.length > 0) {
        changelogData.current_version = changelogData.versions[0].version;
      }

      // Guardar changelog
      writeFileSync(this.changelogPath, JSON.stringify(changelogData, null, 2));
      console.log(`💾 Changelog inicializado: ${this.changelogPath}`);

      // Actualizar archivos de configuración
      await this.updateAllVersionFiles(changelogData.current_version);

      console.log(`\n✅ Inicialización completada!`);
      console.log(`📦 Versión actual: ${changelogData.current_version}`);
      console.log(`📋 Versiones creadas: ${changelogData.versions.length}`);

    } catch (error) {
      console.error('❌ Error durante la inicialización:', error);
      throw error;
    }
  }

  /**
   * Agrupa commits en versiones lógicas
   */
  private groupCommitsIntoVersions(commits: CommitInfo[]): Array<{
    commits: CommitInfo[];
    date: string;
    type: Version['type'];
    title: string;
  }> {
    const groups: Array<{
      commits: CommitInfo[];
      date: string;
      type: Version['type'];
      title: string;
    }> = [];

    // Agrupar por fechas similares y tipos de commits
    let currentGroup: CommitInfo[] = [];
    let currentDate = '';

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      
      // Si es primer commit o fecha muy diferente, crear nuevo grupo
      if (!currentDate || this.daysDifference(currentDate, commit.date) > 7 || currentGroup.length >= 10) {
        if (currentGroup.length > 0) {
          groups.push({
            commits: [...currentGroup],
            date: currentDate,
            type: this.determineVersionType(currentGroup),
            title: this.generateGroupTitle(currentGroup)
          });
        }
        currentGroup = [commit];
        currentDate = commit.date;
      } else {
        currentGroup.push(commit);
      }
    }

    // Agregar último grupo
    if (currentGroup.length > 0) {
      groups.push({
        commits: currentGroup,
        date: currentDate,
        type: this.determineVersionType(currentGroup),
        title: this.generateGroupTitle(currentGroup)
      });
    }

    return groups.reverse(); // Más recientes primero
  }

  /**
   * Calcula diferencia en días entre fechas
   */
  private daysDifference(date1: string, date2: string): number {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    return Math.abs((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  /**
   * Genera título para un grupo de commits
   */
  private generateGroupTitle(commits: CommitInfo[]): string {
    const features = commits.filter(c => c.title.startsWith('feat('));
    const fixes = commits.filter(c => c.title.startsWith('fix('));
    
    if (features.length > 0) {
      return `Nuevas funcionalidades y mejoras`;
    }
    if (fixes.length > 0) {
      return `Correcciones y optimizaciones`;
    }
    return `Mejoras del sistema`;
  }

  /**
   * Genera número de versión para inicialización
   */
  private generateVersionNumber(index: number, total: number): string {
    if (total === 1) return '1.0.0';
    
    if (index === 0) return '1.0.0'; // Versión más reciente
    if (index < 3) return `0.${9 - index}.0`; // Versiones recientes
    
    // Versiones más antiguas
    const patchVersion = Math.max(1, total - index);
    return `0.1.${patchVersion}`;
  }
}

// Ejecutar script
if (import.meta.main) {
  const manager = new VersionManager();
  
  const args = process.argv.slice(2);
  const isInit = args.includes('--init') || args.includes('-i');
  const isSync = args.includes('--sync') || args.includes('-s');
  const autoApprove = args.includes('--auto-approve');
  const noSync = args.includes('--no-sync');
  const quiet = args.includes('--quiet');
  
  // Parsear parámetros adicionales
  const typeIndex = args.indexOf('--type');
  const type = typeIndex > -1 && args[typeIndex + 1] ? args[typeIndex + 1] as Version['type'] : undefined;
  
  const prefixIndex = args.indexOf('--prefix');
  const prefix = prefixIndex > -1 ? (args[prefixIndex + 1] || '') : undefined;
  
  // Validar tipo si se especifica
  if (type && !['major', 'minor', 'patch'].includes(type)) {
    console.error(`❌ Tipo de versión inválido: ${type}. Válidos: major, minor, patch`);
    process.exit(1);
  }

  // Mostrar ayuda
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Version Manager para Better Logger

Uso:
  node project-utils/version-manager.ts [opciones]

Opciones:
  --init, -i              Inicializar desde historial completo
  --sync, -s              Sincronizar archivos de configuración
  --auto-approve          Ejecución automática sin confirmaciones
  --no-sync               No sincronizar archivos de configuración
  --quiet                 Ejecución silenciosa (solo errores y resultados)
  --type <tipo>           Forzar tipo de versión (major|minor|patch)
  --prefix <prefijo>      Cambiar prefijo (pre-alpha|alpha|beta|rc|'' para stable)
  --help, -h              Mostrar esta ayuda

Ejemplos:
  node project-utils/version-manager.ts                         # Análisis automático
  node project-utils/version-manager.ts --auto-approve          # Ejecución silenciosa
  node project-utils/version-manager.ts --type minor --auto-approve
  node project-utils/version-manager.ts --prefix beta --auto-approve
  node project-utils/version-manager.ts --sync --auto-approve
  node project-utils/version-manager.ts --quiet --auto-approve   # Para workflows
`);
    process.exit(0);
  }

  try {
    if (isInit) {
      await manager.initializeFromHistory();
    } else if (isSync) {
      await manager.syncVersionFiles();
    } else {
      await manager.analyzeAndVersion({ 
        type,
        prefix: prefix === '' ? undefined : prefix
      });
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}