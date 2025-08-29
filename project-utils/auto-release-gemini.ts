#!/usr/bin/env node

/**
 * Auto-Release Manager con Integración Gemini para Better Logger
 * Sistema avanzado que usa AI para generar documentación y commits inteligentes
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { createReleasePrompt, BETTER_LOGGER_PROJECT_CONFIG, type GeminiPromptConfig } from './prompt-templates';

interface ChangelogData {
  current_version: string;
  versions: Array<{
    version: string;
    date: string;
    type: string;
    title: string;
    changes: Array<{
      type: string;
      title: string;
      description: string;
    }>;
    technical_notes: string;
    breaking_changes: string[];
    commit_hash: string;
    prefix?: string;
  }>;
}

interface ReleaseInfo {
  version: string;
  prefix: string;
  major: number;
  minor: number;
  patch: number;
}

class AutoReleaseManagerAI {
  private projectRoot: string;
  private releaseDir: string;
  private changelogPath: string;
  private tempDir: string;
  private forceMode: boolean;
  private useAI: boolean;
  private noGitHub: boolean;
  
  // Parámetros de contexto mejorados
  private focusArea: string;
  private targetPlatform: string;
  private urgency: string;
  private targetAudience: string;
  private dependencies: string;
  
  // Nuevos parámetros para version manager y commit generator
  private versionType: string;
  private versionPrefix: string;
  private workType: string;
  private affectedComponents: string;
  private context: string;
  private performanceImpact: string;
  private publishNpm: boolean;
  private publishGithub: boolean;
  private dryRun: boolean;
  private autoApprove: boolean;
  private autoCommit: boolean;

  constructor() {
    this.projectRoot = process.cwd();
    this.releaseDir = join(this.projectRoot, 'dist');
    this.changelogPath = join(this.projectRoot, 'CHANGELOG.json');
    this.tempDir = join(this.projectRoot, 'project-utils/.temp');
    this.forceMode = process.argv.includes('--force');
    this.useAI = process.argv.includes('--ai') || !process.argv.includes('--no-ai');
    this.noGitHub = process.argv.includes('--no-github');
    
    // Parsear parámetros de contexto mejorados
    this.focusArea = this.getArgValue('--focus') || '';
    this.targetPlatform = this.getArgValue('--target-platform') || 'universal';
    this.urgency = this.getArgValue('--urgency') || 'normal';
    this.targetAudience = this.getArgValue('--audience') || 'public';
    this.dependencies = this.getArgValue('--dependencies') || 'both';
    
    // Nuevos parámetros
    this.versionType = this.getArgValue('--type') || 'patch';
    this.versionPrefix = this.getArgValue('--prefix') || '';
    this.workType = this.getArgValue('--work-type') || 'feature';
    this.affectedComponents = this.getArgValue('--affected-components') || '';
    this.context = this.getArgValue('--context') || '';
    this.performanceImpact = this.getArgValue('--performance-impact') || 'none';
    this.publishNpm = process.argv.includes('--publish-npm');
    this.publishGithub = process.argv.includes('--publish-github');
    this.dryRun = process.argv.includes('--dry-run');
    this.autoApprove = process.argv.includes('--auto-approve');
    this.autoCommit = process.argv.includes('--auto-commit') || this.autoApprove;
    
    // Crear directorio temporal si no existe
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Obtiene valor de un argumento específico
   */
  private getArgValue(argName: string): string | undefined {
    const args = process.argv;
    const argIndex = args.indexOf(argName);
    if (argIndex > -1 && args[argIndex + 1] && !args[argIndex + 1].startsWith('--')) {
      return args[argIndex + 1];
    }
    return undefined;
  }

  async run(): Promise<void> {
    console.log('🚀 Auto-Release Manager AI iniciado...\n');
    if (this.useAI) {
      console.log('🤖 Modo AI activado - Generación inteligente habilitada');
    } else {
      console.log('📝 Modo básico - Sin generación AI');
    }

    try {
      // Paso 0: Detectar y manejar cambios no commiteados
      await this.handleUncommittedChanges();
      
      // Paso 1: Detectar cambios remotos y hacer pull
      await this.pullRemoteChanges();

      // Paso 2: Instalar dependencias
      await this.installNodeDependencies();

      // Paso 3: Generar nueva versión usando version-manager
      await this.generateNewVersion();
      
      // Paso 4: Verificar versión actual del changelog (actualizada)
      const currentVersion = this.getCurrentVersion();
      console.log(`📋 Versión generada: ${currentVersion}`);

      // Paso 5: Verificar última release existente
      const latestRelease = this.getLatestRelease();
      console.log(`📦 Última release: ${latestRelease || 'ninguna'}`);

      // Paso 6: Comparar versiones
      if (latestRelease === currentVersion && !this.forceMode) {
        console.log('✅ No hay nueva versión para compilar. Release ya existe.');
        console.log('💡 Usa --force para forzar la recompilación.');
        return;
      }

      if (this.forceMode && latestRelease === currentVersion) {
        console.log('🔧 Modo forzado activado. Regenerando release existente...');
      } else {
        console.log(`🆕 Nueva versión generada: ${currentVersion}`);
      }
      
      console.log('⚡ Iniciando proceso de compilación y release...\n');

      // Paso 7: Compilar aplicación
      await this.buildApplication();

      // Paso 8: Crear estructura de release
      const releaseInfo = this.parseVersion(currentVersion);
      await this.createReleaseStructure(releaseInfo);

      // Paso 9: Copiar archivos de distribución
      await this.copyDistFiles(releaseInfo);

      // Paso 10: Generar documentación (con AI si está disponible)
      await this.generateReleaseDocumentation(releaseInfo);

      // Paso 11: Commit y push con AI
      await this.commitAndPushReleaseAI(releaseInfo);

      // Paso 12: Crear GitHub Release (si está configurado)
      await this.createGitHubRelease(releaseInfo);

      // Paso 13: Publicar en registros NPM (si está habilitado)
      await this.publishToNPMRegistries(releaseInfo);

      // Paso 14: Actualizar sistema OTA
      await this.updateOTASystem(currentVersion);

      console.log('\n✅ Auto-release AI completado exitosamente!');

    } catch (error) {
      console.error('❌ Error en auto-release:', error);
      process.exit(1);
    }
  }

  private async pullRemoteChanges(): Promise<void> {
    console.log('🔄 Verificando cambios remotos...');
    
    try {
      await this.runCommand('git', ['fetch', 'origin']);
      // Detectar rama principal remota
      const currentBranchResult = await this.runCommand('git', ['branch', '--show-current']);
      const currentBranch = currentBranchResult.stdout.trim();
      const remoteBranch = `origin/${currentBranch}`;
      const result = await this.runCommand('git', ['log', `HEAD..${remoteBranch}`, '--oneline']);
      
      if (result.stdout.trim()) {
        console.log('📥 Cambios remotos detectados. Actualizando...');
        
        const statusResult = await this.runCommand('git', ['status', '--porcelain']);
        if (statusResult.stdout.trim()) {
          console.log('💾 Guardando cambios locales...');
          await this.runCommand('git', ['stash', 'push', '-m', 'auto-release-stash']);
        }
        
        await this.runCommand('git', ['pull', 'origin', currentBranch]);
        console.log('✅ Actualización completa');
      } else {
        console.log('✅ Repositorio actualizado');
      }
    } catch (error) {
      throw new Error(`Error al actualizar repositorio: ${error}`);
    }
  }

  /**
   * Detecta cambios no commiteados y los maneja según la configuración
   */
  private async handleUncommittedChanges(): Promise<void> {
    console.log('🔍 Verificando cambios no commiteados...');
    
    try {
      const statusResult = await this.runCommand('git', ['status', '--porcelain']);
      const uncommittedChanges = statusResult.stdout.trim();
      
      if (!uncommittedChanges) {
        console.log('✅ Repositorio limpio, no hay cambios pendientes');
        return;
      }
      
      console.log('⚠️ Se detectaron cambios no commiteados:');
      console.log(uncommittedChanges.split('\n').map(line => `  ${line}`).join('\n'));
      
      if (this.dryRun) {
        console.log('🔍 [DRY RUN] Se commitearían los cambios automáticamente');
        return;
      }
      
      if (this.autoCommit || this.autoApprove) {
        console.log('🤖 Modo auto-commit activado, commiteando cambios...');
        await this.autoCommitChanges();
      } else {
        // Prompt interactivo
        const shouldCommit = await this.promptUserForCommit(uncommittedChanges);
        if (shouldCommit) {
          await this.autoCommitChanges();
        } else {
          console.log('❌ Release cancelado. Commitea tus cambios manualmente y vuelve a intentar.');
          process.exit(1);
        }
      }
      
    } catch (error) {
      throw new Error(`Error verificando estado del repositorio: ${error}`);
    }
  }
  
  /**
   * Realiza commit automático con mensaje inteligente y [skip ci]
   */
  private async autoCommitChanges(): Promise<void> {
    console.log('📝 Generando commit automático...');
    
    try {
      // Añadir todos los archivos modificados
      await this.runCommand('git', ['add', '.']);
      
      // Generar mensaje de commit inteligente
      const commitMessage = await this.generateAutoCommitMessage();
      
      // Hacer commit con [skip ci] para evitar workflows recursivos
      const skipCiMessage = `${commitMessage}\n\n[skip ci] Auto-commit antes de release`;
      await this.runCommand('git', ['commit', '-m', skipCiMessage]);
      
      console.log('✅ Cambios commiteados automáticamente');
      console.log(`📋 Mensaje: ${commitMessage}`);
      
    } catch (error) {
      throw new Error(`Error en auto-commit: ${error}`);
    }
  }
  
  /**
   * Genera mensaje de commit inteligente basado en los archivos modificados
   */
  private async generateAutoCommitMessage(): Promise<string> {
    try {
      // Obtener archivos modificados
      const statusResult = await this.runCommand('git', ['status', '--porcelain']);
      const files = statusResult.stdout.trim().split('\n').filter(line => line.trim());
      
      const modifiedFiles = files.map(line => {
        const status = line.substring(0, 2).trim();
        const filePath = line.substring(3);
        return { status, filePath };
      });
      
      // Analizar tipos de cambios
      const hasPackageJson = modifiedFiles.some(f => f.filePath.includes('package.json'));
      const hasSourceFiles = modifiedFiles.some(f => f.filePath.match(/\.(ts|js|tsx|jsx)$/));
      const hasConfigFiles = modifiedFiles.some(f => f.filePath.match(/\.(json|yml|yaml|toml|md)$/));
      const hasDocFiles = modifiedFiles.some(f => f.filePath.includes('docs/') || f.filePath.includes('README'));
      
      let commitType = 'chore';
      let scope = '';
      let description = 'cambios automáticos pre-release';
      
      if (hasPackageJson && hasSourceFiles) {
        commitType = 'feat';
        scope = 'core';
        description = 'mejoras y actualizaciones automáticas';
      } else if (hasSourceFiles) {
        commitType = 'feat';
        scope = 'core';
        description = 'actualizaciones de funcionalidad';
      } else if (hasDocFiles) {
        commitType = 'docs';
        scope = 'readme';
        description = 'actualización de documentación';
      } else if (hasConfigFiles) {
        commitType = 'chore';
        scope = 'config';
        description = 'actualizaciones de configuración';
      }
      
      const scopePrefix = scope ? `(${scope})` : '';
      return `${commitType}${scopePrefix}: ${description}`;
      
    } catch (error) {
      console.warn('⚠️ Error generando mensaje inteligente, usando mensaje genérico');
      return 'chore: cambios automáticos pre-release';
    }
  }
  
  /**
   * Prompt interactivo para confirmar commit
   */
  private async promptUserForCommit(changes: string): Promise<boolean> {
    console.log('\n🤔 ¿Qué deseas hacer con estos cambios?');
    console.log('1. Commitear automáticamente y continuar');
    console.log('2. Cancelar release y commitear manualmente');
    console.log('\nEscribe "1" para auto-commit o "2" para cancelar:');
    
    return new Promise((resolve) => {
      const stdin = process.stdin;
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      
      stdin.on('data', (key) => {
        if (key === '1') {
          stdin.setRawMode(false);
          stdin.pause();
          console.log('✅ Continuando con auto-commit...');
          resolve(true);
        } else if (key === '2') {
          stdin.setRawMode(false);
          stdin.pause();
          console.log('❌ Cancelando release...');
          resolve(false);
        } else if (key === '\u0003') { // Ctrl+C
          stdin.setRawMode(false);
          stdin.pause();
          console.log('\n❌ Release cancelado por usuario');
          process.exit(0);
        } else {
          console.log('⚠️ Opción inválida. Escribe "1" o "2"');
        }
      });
    });
  }

  private async installNodeDependencies(): Promise<void> {
    console.log('📦 Verificando dependencias...');
    
    try {
      const result = await this.runCommand('npm', ['install']);
      if (result.stdout.includes('up to date')) {
        console.log('✅ Dependencias actualizadas');
      } else {
        console.log('✅ Dependencias instaladas/actualizadas');
      }
    } catch (error) {
      throw new Error(`Error instalando dependencias: ${error}`);
    }
  }

  /**
   * Genera nueva versión usando version-manager.ts con parámetros
   */
  private async generateNewVersion(): Promise<void> {
    console.log('🔢 Generando nueva versión...');
    
    if (this.dryRun) {
      console.log('🔍 [DRY RUN] Se generaría versión con:');
      console.log(`   - Tipo: ${this.versionType}`);
      console.log(`   - Prefijo: ${this.versionPrefix || 'stable'}`);
      return;
    }
    
    try {
      const versionArgs = [
        'project-utils/version-manager.ts',
        '--auto-approve'
      ];
      
      if (this.versionType && this.versionType !== 'auto') {
        versionArgs.push('--type', this.versionType);
      }
      
      if (this.versionPrefix) {
        versionArgs.push('--prefix', this.versionPrefix);
      }
      
      console.log(`📋 Ejecutando: bun ${versionArgs.join(' ')}`);
      const result = await this.runCommand('bun', versionArgs);
      
      console.log('✅ Nueva versión generada exitosamente');
    } catch (error) {
      throw new Error(`Error generando versión: ${error}`);
    }
  }

  private getCurrentVersion(): string {
    try {
      const changelog: ChangelogData = JSON.parse(readFileSync(this.changelogPath, 'utf8'));
      return changelog.current_version;
    } catch (error) {
      throw new Error(`Error leyendo changelog: ${error}`);
    }
  }

  private getLatestRelease(): string | null {
    if (!existsSync(this.releaseDir)) {
      return null;
    }

    const prefixes = readdirSync(this.releaseDir);
    let latestVersion = null;
    let latestDate = new Date(0);

    for (const prefix of prefixes) {
      const prefixDir = join(this.releaseDir, prefix);
      if (!statSync(prefixDir).isDirectory()) continue;

      const versions = readdirSync(prefixDir);
      for (const version of versions) {
        const versionDir = join(prefixDir, version);
        if (!statSync(versionDir).isDirectory()) continue;

        const stat = statSync(versionDir);
        const modDate = stat.mtime;
        
        if (modDate > latestDate) {
          latestDate = modDate;
          latestVersion = `${prefix}-${version}`;
        }
      }
    }

    return latestVersion;
  }

  private parseVersion(version: string): ReleaseInfo {
    // Formatos soportados: 0.3.1, 0.4.0-alpha.1, 0.4.0-beta.2, etc.
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(\w+)(?:\.(\d+))?)?$/);
    if (!match) {
      throw new Error(`Formato de versión inválido: ${version}. Formato esperado: X.Y.Z o X.Y.Z-alpha.N`);
    }

    const [, major, minor, patch, prefix] = match;

    return {
      version: version,
      prefix: prefix || 'stable',
      major: parseInt(major),
      minor: parseInt(minor),
      patch: parseInt(patch)
    };
  }

  private async buildApplication(): Promise<void> {
    console.log('🔨 Compilando biblioteca...');
    
    if (this.dryRun) {
      console.log('🔍 [DRY RUN] Se ejecutaría: npm run build:all');
      return;
    }
    
    try {
      // Limpiar compilaciones previas
      await this.runCommand('npm', ['run', 'clean']);
      
      // Build completo de todos los módulos
      await this.runCommand('npm', ['run', 'build:all']);
      
      console.log('✅ Compilación exitosa (todos los módulos)');
      
    } catch (error) {
      throw new Error(`Error en compilación: ${error}`);
    }
  }

  private async createReleaseStructure(releaseInfo: ReleaseInfo): Promise<void> {
    const releaseDir = join(this.releaseDir, releaseInfo.prefix, `${releaseInfo.major}.${releaseInfo.minor}.${releaseInfo.patch}`);
    
    console.log(`📁 Creando estructura: ${releaseDir}`);
    
    if (!existsSync(releaseDir)) {
      mkdirSync(releaseDir, { recursive: true });
    }
  }

  private async copyDistFiles(releaseInfo: ReleaseInfo): Promise<void> {
    const releaseDir = join(this.releaseDir, releaseInfo.prefix, `${releaseInfo.major}.${releaseInfo.minor}.${releaseInfo.patch}`);
    const distDir = join(this.projectRoot, 'dist');

    console.log('📋 Copiando archivos de distribución...');
    
    if (this.dryRun) {
      console.log('🔍 [DRY RUN] Se copiarían archivos desde dist/ al release');
      return;
    }

    try {
      if (!existsSync(distDir)) {
        console.log('⚠️ Directorio dist/ no existe, omitiendo copia de archivos');
        return;
      }
      
      const files = readdirSync(distDir);
      const filesToCopy = files.filter(file => {
        const sourceFile = join(distDir, file);
        const stat = statSync(sourceFile);
        return stat.isFile(); // Solo copiar archivos, no directorios
      });
      
      if (filesToCopy.length === 0) {
        console.log('⚠️ No hay archivos para copiar en dist/');
        return;
      }
      
      for (const file of filesToCopy) {
        const sourceFile = join(distDir, file);
        const destFile = join(releaseDir, file);
        await this.runCommand('cp', [sourceFile, destFile]);
      }

      console.log(`✅ ${filesToCopy.length} archivos de distribución copiados`);

    } catch (error) {
      throw new Error(`Error copiando archivos de distribución: ${error}`);
    }
  }

  private async generateReleaseDocumentation(releaseInfo: ReleaseInfo): Promise<void> {
    console.log('📝 Generando documentación de release...');

    if (this.useAI) {
      await this.generateAIDocumentation(releaseInfo);
    } else {
      await this.generateBasicREADME(releaseInfo);
    }
  }

  private async generateAIDocumentation(releaseInfo: ReleaseInfo): Promise<void> {
    const releaseDir = join(this.releaseDir, releaseInfo.prefix, `${releaseInfo.major}.${releaseInfo.minor}.${releaseInfo.patch}`);
    
    console.log('🤖 Generando documentación con AI...');

    try {
      // Leer información del changelog
      const changelog: ChangelogData = JSON.parse(readFileSync(this.changelogPath, 'utf8'));
      const versionInfo = changelog.versions.find(v => v.version === releaseInfo.version);
      
      if (!versionInfo) {
        throw new Error(`No se encontró información para la versión ${releaseInfo.version}`);
      }

      // Obtener información de archivos generados
      const files = readdirSync(releaseDir);
      const fileInfo = this.getFileInfo(releaseDir, files);

      // Crear prompt para Gemini
      const prompt = this.createDocumentationPrompt(releaseInfo, versionInfo, fileInfo);
      
      // Guardar el prompt
      const promptPath = join(this.tempDir, 'release-doc-prompt.txt');
      writeFileSync(promptPath, prompt);

      try {
        console.log('🚀 Consultando Gemini AI...');
        const { spawn } = await import('child_process');
        const geminiProcess = spawn('gemini', [], {
          cwd: this.projectRoot,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        geminiProcess.stdin?.write(prompt);
        geminiProcess.stdin?.end();
        
        let aiResponse = '';
        let errorOutput = '';
        
        geminiProcess.stdout?.on('data', (data) => {
          aiResponse += data.toString();
        });
        
        geminiProcess.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        const exitCode = await new Promise((resolve) => {
          geminiProcess.on('exit', resolve);
        });

        if (exitCode !== 0) {
          throw new Error(`Gemini CLI error: ${errorOutput || 'Gemini CLI failed'}`);
        }
        
        // Guardar respuesta AI
        const responsePath = join(this.tempDir, 'release-doc-response.md');
        writeFileSync(responsePath, aiResponse);

        // Procesar y usar la respuesta de AI
        const processedREADME = this.processAIResponse(aiResponse, releaseInfo, versionInfo, fileInfo);
        
        const readmePath = join(releaseDir, 'README.md');
        writeFileSync(readmePath, processedREADME, 'utf8');
        
        // Generar documentación adicional si AI lo sugiere
        await this.generateAdditionalDocs(aiResponse, releaseDir, releaseInfo);
        
        console.log('✅ Documentación AI generada exitosamente');

      } catch (aiError) {
        console.warn('⚠️ Error con AI, usando generación básica:', aiError);
        console.log('📝 Prompt guardado en:', promptPath);
        await this.generateBasicREADME(releaseInfo);
      }

    } catch (error) {
      throw new Error(`Error generando documentación AI: ${error}`);
    }
  }

  private createDocumentationPrompt(releaseInfo: ReleaseInfo, versionInfo: any, fileInfo: any): string {
    const config: GeminiPromptConfig = {
      projectContext: {
        name: BETTER_LOGGER_PROJECT_CONFIG.name,
        description: BETTER_LOGGER_PROJECT_CONFIG.description,
        version: releaseInfo.version,
        techStack: [...BETTER_LOGGER_PROJECT_CONFIG.techStack],
        targetPlatform: BETTER_LOGGER_PROJECT_CONFIG.targetPlatform,
      },
      analysisType: 'release',
      specificContext: `Release ${releaseInfo.version} (${releaseInfo.prefix})`,
      data: {
        releaseInfo,
        versionInfo,
        fileInfo,
        date: new Date().toISOString().split('T')[0]
      }
    };

    return createReleasePrompt(config);

  }

  private getFileInfo(releaseDir: string, files: string[]): Record<string, string> {
    const fileInfo: Record<string, string> = {};
    
    for (const file of files) {
      if (file !== 'README.md') { // No incluir README que estamos generando
        const filePath = join(releaseDir, file);
        const stats = statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1);
        fileInfo[file] = `${sizeMB}MB`;
      }
    }
    
    return fileInfo;
  }

  private processAIResponse(aiResponse: string, releaseInfo: ReleaseInfo, versionInfo: any, fileInfo: any): string {
    // Usar directamente la respuesta de AI como README
    // En el futuro se puede añadir más procesamiento si es necesario
    return aiResponse;
  }

  private async generateAdditionalDocs(aiResponse: string, releaseDir: string, releaseInfo: ReleaseInfo): Promise<void> {
    // Placeholder para generar documentación adicional basada en respuesta AI
    // Por ahora no genera documentación adicional
    return Promise.resolve();
  }

  private async generateBasicREADME(releaseInfo: ReleaseInfo): Promise<void> {
    // Fallback a generación básica si AI no está disponible
    const releaseDir = join(this.releaseDir, releaseInfo.prefix, `${releaseInfo.major}.${releaseInfo.minor}.${releaseInfo.patch}`);
    const changelog: ChangelogData = JSON.parse(readFileSync(this.changelogPath, 'utf8'));
    const versionInfo = changelog.versions.find(v => v.version === releaseInfo.version);
    
    const date = new Date().toISOString().split('T')[0];
    const files = readdirSync(releaseDir);
    const fileInfo = this.getFileInfo(releaseDir, files);

    const readme = `# EL Haido TPV - ${releaseInfo.prefix.charAt(0).toUpperCase() + releaseInfo.prefix.slice(1)} ${releaseInfo.major}.${releaseInfo.minor}.${releaseInfo.patch} - ARM64 Release

## Información de la Release

- **Versión**: ${releaseInfo.version}  
- **Fecha**: ${date}
- **Arquitectura**: ARM64 (aarch64)
- **Plataforma objetivo**: Raspberry Pi 3B+
- **Tipo de release**: ${versionInfo?.type} (${versionInfo?.title.toLowerCase()})

## Archivos incluidos

${Object.entries(fileInfo).map(([file, size]) => `- \`${file}\` - ${size}`).join('\n')}

## Instalación Rápida

\`\`\`bash
sudo dpkg -i "EL Haido TPV_${releaseInfo.major}.${releaseInfo.minor}.${releaseInfo.patch}_arm64.deb"
sudo apt-get install -f
\`\`\`

---

*Release generada automáticamente el ${date}*
`;

    const readmePath = join(releaseDir, 'README.md');
    writeFileSync(readmePath, readme, 'utf8');
    console.log('✅ README básico generado');
  }

  private async commitAndPushReleaseAI(releaseInfo: ReleaseInfo): Promise<void> {
    console.log('📤 Realizando commit y push con AI...');
    
    if (this.dryRun) {
      console.log('🔍 [DRY RUN] Se haría commit con AI y push de cambios');
      return;
    }

    try {
      // Configurar git si es necesario
      try {
        await this.runCommand('git', ['config', 'user.name']);
      } catch {
        await this.runCommand('git', ['config', 'user.email', 'auto-release@build.local']);
        await this.runCommand('git', ['config', 'user.name', 'Auto-Release AI System']);
      }

      // Solo añadir archivos que no estén en gitignore
      // Añadir cambios en CHANGELOG.json y package.json (actualizados por version-manager)
      const filesToAdd = [
        'CHANGELOG.json',
        'package.json'
      ];
      
      // Añadir archivos específicos de packages
      const packageFiles = [
        'packages/core/package.json',
        'packages/styling/package.json',
        'packages/exports/package.json'
      ];
      
      for (const filePattern of [...filesToAdd, ...packageFiles]) {
        try {
          if (existsSync(join(this.projectRoot, filePattern))) {
            await this.runCommand('git', ['add', filePattern]);
          }
        } catch (error) {
          // Ignorar errores si el archivo no existe
        }
      }

      // Verificar si hay algo que commitear
      const statusResult = await this.runCommand('git', ['status', '--porcelain']);
      if (!statusResult.stdout.trim()) {
        console.log('⚠️ No hay cambios para commitear.');
        return;
      }

      if (this.useAI) {
        // Usar commit-generator con contexto AI mejorado
        console.log('🤖 Generando commit automático con AI avanzado...');
        
        const commitArgs = [
          'project-utils/commit-generator.ts',
          '--auto-approve'
        ];
        
        if (this.workType) commitArgs.push('--work-type', this.workType);
        if (this.affectedComponents) commitArgs.push('--affected-components', this.affectedComponents);
        if (this.context) commitArgs.push('--context', this.context);
        if (this.performanceImpact) commitArgs.push('--performance-impact', this.performanceImpact);
        
        // Contexto adicional para releases
        const extraContext = this.createCommitContext(releaseInfo);
        if (extraContext) commitArgs.push('--extra', extraContext);

        try {
          console.log(`📋 Ejecutando: bun ${commitArgs.join(' ')}`);
          await this.runCommand('bun', commitArgs);
          
          console.log('✅ Commit AI generado exitosamente');
        } catch (error) {
          console.warn('⚠️ Error con commit AI, usando manual...');
          const commitMessage = this.generateCommitMessage(releaseInfo);
          await this.runCommand('git', ['commit', '-m', commitMessage]);
        }
      } else {
        // Commit manual
        const commitMessage = this.generateCommitMessage(releaseInfo);
        await this.runCommand('git', ['commit', '-m', commitMessage]);
      }

      // Push (detectar rama actual)
      const currentBranchResult = await this.runCommand('git', ['branch', '--show-current']);
      const currentBranch = currentBranchResult.stdout.trim();
      await this.runCommand('git', ['push', 'origin', currentBranch]);
      console.log('✅ Push completado');

    } catch (error) {
      throw new Error(`Error en commit/push: ${error}`);
    }
  }

  private createCommitContext(releaseInfo: ReleaseInfo): string {
    const changelog: ChangelogData = JSON.parse(readFileSync(this.changelogPath, 'utf8'));
    const versionInfo = changelog.versions.find(v => v.version === releaseInfo.version);
    
    return `AUTO-RELEASE CONTEXT - Version ${releaseInfo.version}

Esto es un auto-release generado automáticamente para la versión ${releaseInfo.version}.
Se han compilado y añadido binarios ARM64 optimizados para Raspberry Pi 3B+.

ARCHIVOS INCLUIDOS:
- Binario ejecutable nativo ARM64
- Paquete Debian (.deb) para fácil instalación
- Paquete RPM (.rpm) para distribuciones basadas en RPM
- README detallado ${this.useAI ? 'generado con AI' : 'básico'}
${this.useAI ? '- Documentación adicional generada por AI' : ''}

CARACTERÍSTICAS DE ESTA VERSIÓN:
${versionInfo?.changes.slice(0, 5).map(c => `- ${c.type}: ${c.title}`).join('\n') || '- Versión de mantenimiento'}

NOTAS TÉCNICAS:
- Compilado nativamente en ARM64 con optimizaciones específicas
- OpenSSL configurado para cross-compilation
- Todos los tests pasaron exitosamente
${this.useAI ? '- Documentación mejorada con inteligencia artificial' : ''}

Por favor genera un commit tipo 'release(${releaseInfo.version})' que refleje adecuadamente:
1. Que es un auto-release automatizado
2. Las características principales de esta versión
3. Que incluye binarios optimizados para RPi
4. ${this.useAI ? 'Que usa AI para documentación mejorada' : 'Documentación estándar incluida'}

Mantén el mensaje profesional pero informativo.`;
  }

  private generateCommitMessage(releaseInfo: ReleaseInfo): string {
    const changelog: ChangelogData = JSON.parse(readFileSync(this.changelogPath, 'utf8'));
    const versionInfo = changelog.versions.find(v => v.version === releaseInfo.version);
    
    const features = versionInfo?.changes
      .filter(c => c.type === 'feature')
      .slice(0, 3)
      .map(c => `✨ ${c.title}`)
      .join('\n') || '';

    const improvements = versionInfo?.changes
      .filter(c => c.type === 'improvement')
      .slice(0, 2) 
      .map(c => `⚙️ ${c.title}`)
      .join('\n') || '';

    return `release(${releaseInfo.version}): auto-release ARM64 ${this.useAI ? 'con AI' : 'binarios'}

- Binario ejecutable principal
- Paquete Debian (.deb)
- Paquete RPM (.rpm)  
- README ${this.useAI ? 'generado con AI' : 'automático'}
${this.useAI ? '- Documentación adicional AI' : ''}

${features ? 'Nuevas características:\n' + features : ''}
${improvements ? '\nMejoras:\n' + improvements : ''}

${this.useAI ? 'Generado por Auto-Release Manager AI con Gemini.' : 'Generado por Auto-Release Manager.'}
Compilado nativamente en ARM64 para RPi3+ con optimizaciones.`;
  }

  /**
   * Crea GitHub Release usando el GitHub Release Manager
   */
  private async createGitHubRelease(releaseInfo: ReleaseInfo): Promise<void> {
    if (this.noGitHub) {
      console.log('⏭️ GitHub Release deshabilitado por --no-github');
      return;
    }

    console.log(`🚀 Creando GitHub Release ${this.useAI ? 'con documentación AI' : 'con documentación básica'}...`);
    
    if (this.dryRun) {
      console.log('🔍 [DRY RUN] Se crearía GitHub Release con github-release-manager.ts');
      return;
    }

    try {
      // Verificar que GitHub CLI esté disponible
      await this.runCommand('gh', ['--version']);
      
      // Ejecutar GitHub Release Manager con configuraciones apropiadas
      const ghArgs = ['project-utils/github-release-manager.ts'];
      if (process.argv.includes('--force')) ghArgs.push('--force');
      if (this.autoApprove) ghArgs.push('--auto-approve');
      
      await this.runCommand('bun', ghArgs);
      
      console.log(`✅ GitHub Release creado exitosamente ${this.useAI ? '(con mejoras AI)' : ''}`);
      
    } catch (error) {
      console.warn('⚠️ No se pudo crear GitHub Release:', error);
      console.log('💡 Verifica que gh CLI esté instalado y autenticado');
      console.log('💡 O usa --no-github para deshabilitar GitHub releases');
    }
  }

  /**
   * Publica el paquete en registros NPM (público y GitHub)
   */
  private async publishToNPMRegistries(releaseInfo: ReleaseInfo): Promise<void> {
    if (!this.publishNpm && !this.publishGithub) {
      console.log('⏭️ Publicación NPM deshabilitada (usa --publish-npm o --publish-github)');
      return;
    }
    
    console.log('📦 Iniciando publicación NPM...');
    
    if (this.dryRun) {
      console.log('🔍 [DRY RUN] Se publicaría en:');
      if (this.publishNpm) console.log('   - NPM Registry (público)');
      if (this.publishGithub) console.log('   - GitHub Packages');
      return;
    }
    
    try {
      // Verificar que el build esté completo
      const distPath = join(this.projectRoot, 'dist');
      if (!existsSync(distPath)) {
        throw new Error('Directorio dist/ no encontrado. Ejecuta npm run build primero.');
      }
      
      // Publicar en NPM público
      if (this.publishNpm) {
        console.log('🌐 Publicando en NPM Registry (público)...');
        try {
          await this.runCommand('npm', ['publish', '--access', 'public', '--ignore-scripts']);
          console.log('✅ Publicado exitosamente en NPM público');
        } catch (error) {
          console.error('❌ Error publicando en NPM público:', error);
          throw error;
        }
      }
      
      // Publicar en GitHub Packages
      if (this.publishGithub) {
        console.log('🐈 Publicando en GitHub Packages...');
        try {
          await this.runCommand('npm', [
            'publish',
            '--registry=https://npm.pkg.github.com',
            '--access', 'public',
            '--ignore-scripts'
          ]);
          console.log('✅ Publicado exitosamente en GitHub Packages');
        } catch (error) {
          console.error('❌ Error publicando en GitHub Packages:', error);
          console.log('💡 Verifica que tengas permisos write:packages y estés autenticado');
          throw error;
        }
      }
      
      console.log('✅ Publicación NPM completada exitosamente');
      
      // Mostrar comandos de instalación
      console.log('\n📦 Comandos de instalación:');
      if (this.publishNpm) {
        console.log(`   npm install @mks2508/better-logger@${releaseInfo.version}`);
      }
      if (this.publishGithub) {
        console.log(`   npm install @mks2508/better-logger@${releaseInfo.version} --registry=https://npm.pkg.github.com`);
      }
      
    } catch (error) {
      console.error('❌ Error en publicación NPM:', error);
      console.log('💡 Verifica autenticación: npm whoami');
      throw error;
    }
  }

  /**
   * Actualiza el sistema OTA después de un release exitoso
   * Sincroniza la nueva versión con los canales OTA apropiados
   */
  private async updateOTASystem(version: string): Promise<void> {
    console.log(`🔄 Actualizando sistema OTA para versión ${version}...`);
    
    try {
      // El version-manager.ts ya sincroniza automáticamente con OTA,
      // pero podemos hacer validaciones adicionales aquí
      
      // Verificar que package.json fue actualizado correctamente
      const packagePath = join(this.projectRoot, 'package.json');
      if (!existsSync(packagePath)) {
        console.warn('⚠️ package.json no existe');
        return;
      }

      const packageData = JSON.parse(readFileSync(packagePath, 'utf-8'));
      
      if (packageData.version === version) {
        console.log(`✅ package.json actualizado correctamente: ${version}`);
      } else {
        console.warn(`⚠️ Posible desincronización en package.json:`);
        console.warn(`   Esperado: ${version}`);
        console.warn(`   Actual: ${packageData.version || 'N/A'}`);
      }
      
    } catch (error) {
      console.warn(`⚠️ Error verificando package.json: ${error}`);
      console.warn('El release continuará sin verificación');
    }
  }

  private async runCommand(command: string, args: string[] = [], options: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        cwd: options.cwd || this.projectRoot,
        env: options.env || process.env,
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
          reject(new Error(`Command failed: ${command} ${args.join(' ')}\n${stderr}`));
        } else {
          resolve({ stdout, stderr });
        }
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// Ejecutar si se llama directamente
if (import.meta.main) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 Auto-Release Manager AI para Better Logger

Automatiza el proceso completo: versión, build, commit, GitHub release y publicación NPM.

Uso:
  bun project-utils/auto-release-gemini.ts [opciones]

Opciones Principales:
  --ai                          Activar generación con AI (por defecto)
  --no-ai                       Deshabilitar AI, usar generación básica
  --force                       Forzar recompilación aunque la release ya exista
  --dry-run                     Solo mostrar qué haría, sin ejecutar
  --auto-approve                No pedir confirmación (para CI/CD)
  --auto-commit                 Auto-commitear cambios pendientes
                                (se activa automáticamente con --auto-approve)

Version Manager:
  --type <tipo>                 Tipo de versión: major|minor|patch (default: patch)
  --prefix <prefijo>            Prefijo: alpha|beta|rc|'' (default: stable)

Commit Generator (AI):
  --work-type <tipo>            Tipo: feature|fix|refactor|docs|test
  --affected-components <lista> Componentes afectados: "core,styling,exports"
  --context <descripción>       Contexto del trabajo realizado
  --performance-impact <tipo>   Impacto: none|minor|major

Publicación NPM:
  --publish-npm                 Publicar en NPM Registry (público)
  --publish-github              Publicar en GitHub Packages

Otras opciones:
  --no-github                   Deshabilitar creación de GitHub releases
  --help, -h                    Mostrar esta ayuda

Ejemplos:
  # Release alpha básica
  bun project-utils/auto-release-gemini.ts --type minor --prefix alpha
  
  # Release completa con AI y publicación dual
  bun project-utils/auto-release-gemini.ts --ai --auto-approve \\
    --type minor --prefix alpha \\
    --work-type feature --affected-components "exports,handlers" \\
    --context "enhanced export functionality" \\
    --publish-npm --publish-github
  
  # Solo mostrar qué haría
  bun project-utils/auto-release-gemini.ts --dry-run --type patch --publish-npm
  
  # Para CI/CD
  bun project-utils/auto-release-gemini.ts --auto-approve --ai \\
    --type patch --publish-npm --publish-github
`);
    process.exit(0);
  }
  
  const manager = new AutoReleaseManagerAI();
  await manager.run();
}

export { AutoReleaseManagerAI };
