#!/usr/bin/env node

import { execSync } from "child_process"
import { platform } from "os"
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs"
import { join } from "path"
import { 
  PROJECT_COMPONENTS, 
  WORK_TYPES, 
  BUILD_MODES, 
  VERSION_PREFIXES,
  PERFORMANCE_IMPACTS,
  getComponentIds,
  getWorkTypeIds,
  formatComponentsList,
  PROJECT_INFO
} from './project-config'

interface ReleaseOptions {
  // General Configuration
  useAI: boolean
  dryRun: boolean
  autoApprove: boolean
  autoCommit: boolean
  force: boolean
  quiet: boolean
  
  // Version Management
  versionType: 'major' | 'minor' | 'patch' | 'auto'
  versionPrefix: 'alpha' | 'beta' | 'rc' | 'stable' | 'pre-alpha'
  
  // Build Configuration
  buildMode: 'full' | 'core' | 'styling' | 'exports' | 'selective' | 'skip'
  selectedModules: string[]
  docsOnly: boolean
  
  // Commit Configuration  
  workType: 'feature' | 'fix' | 'refactor' | 'docs' | 'test'
  affectedComponents: string[]
  context: string
  performanceImpact: 'none' | 'minor' | 'major'
  
  // Extended Context (from auto-release-gemini.ts)
  focusArea?: string
  targetPlatform?: string
  urgency?: string
  targetAudience?: string
  dependencies?: string
  
  // Publishing
  createGitHubRelease: boolean
  publishNpm: boolean
  publishGitHub: boolean
  npmTag?: string
  
  // Advanced
  skipTests: boolean
  skipTypeCheck: boolean
  keepLocalChanges: boolean
}

interface UIState {
  step: number
  maxStep: number
  config: Partial<ReleaseOptions>
  canGoBack: boolean
  previewCommand: string
  projectStatus: ProjectStatus
  selectedPreset?: string
}

interface ProjectStatus {
  currentVersion: string
  lastRelease: string
  lastReleaseDate: string
  gitStatus: string
  isClean: boolean
  hasUncommitted: boolean
}

interface QuickAction {
  id: string
  name: string
  description: string
  emoji: string
  config: Partial<ReleaseOptions>
  resultingVersion: string
}

class NavigationController {
  private state: UIState
  private history: UIState[] = []
  private tempDir: string
  private stateFile: string
  
  constructor(initialState: UIState) {
    this.state = initialState
    this.tempDir = join(process.cwd(), 'project-utils/.ui-temp')
    this.stateFile = join(this.tempDir, 'ui-state.json')
    
    // Crear directorio temporal
    if (!existsSync(this.tempDir)) {
      mkdirSync(this.tempDir, { recursive: true })
    }
  }
  
  getCurrentState(): UIState {
    return { ...this.state }
  }
  
  goNext(newState: Partial<UIState>): UIState {
    // Guardar estado actual en historial
    this.history.push({ ...this.state })
    
    // Actualizar estado
    this.state = {
      ...this.state,
      ...newState,
      step: this.state.step + 1,
      canGoBack: true
    }
    
    // Persistir estado
    this.persistState()
    return { ...this.state }
  }
  
  goBack(): UIState | null {
    if (this.history.length === 0) {
      return null
    }
    
    // Restaurar estado anterior
    this.state = this.history.pop()!
    this.state.canGoBack = this.history.length > 0
    
    this.persistState()
    return { ...this.state }
  }
  
  updateConfig(config: Partial<ReleaseOptions>): void {
    this.state.config = { ...this.state.config, ...config }
    this.state.previewCommand = this.generatePreviewCommand()
    this.persistState()
  }
  
  private persistState(): void {
    try {
      writeFileSync(this.stateFile, JSON.stringify(this.state, null, 2))
    } catch (error) {
      // Silent fail para evitar crashes
    }
  }
  
  private generatePreviewCommand(): string {
    const config = this.state.config
    const args: string[] = []
    
    if (config.useAI) args.push("--ai")
    if (config.dryRun) args.push("--dry-run")
    if (config.autoApprove) args.push("--auto-approve")
    if (config.force) args.push("--force")
    if (config.versionType && config.versionType !== 'auto') {
      args.push(`--type ${config.versionType}`)
    }
    if (config.versionPrefix && config.versionPrefix !== 'stable') {
      args.push(`--prefix ${config.versionPrefix}`)
    }
    if (config.workType) args.push(`--work-type ${config.workType}`)
    if (config.affectedComponents?.length) {
      args.push(`--affected-components ${config.affectedComponents.join(',')}`)
    }
    if (config.context) args.push(`--context "${config.context}"`)
    if (config.performanceImpact && config.performanceImpact !== 'none') {
      args.push(`--performance-impact ${config.performanceImpact}`)
    }
    
    // Extended context parameters
    if (config.focusArea) args.push(`--focus "${config.focusArea}"`)
    if (config.targetPlatform && config.targetPlatform !== 'universal') {
      args.push(`--target-platform ${config.targetPlatform}`)
    }
    if (config.urgency && config.urgency !== 'normal') {
      args.push(`--urgency ${config.urgency}`)
    }
    if (config.targetAudience && config.targetAudience !== 'public') {
      args.push(`--audience ${config.targetAudience}`)
    }
    if (config.dependencies && config.dependencies !== 'both') {
      args.push(`--dependencies ${config.dependencies}`)
    }
    
    if (config.publishNpm) args.push("--publish-npm")
    if (config.publishGitHub) args.push("--publish-github")
    if (!config.createGitHubRelease) args.push("--no-github")
    
    return `bun auto-release-gemini.ts ${args.join(' ')}`
  }
  
  cleanup(): void {
    try {
      if (existsSync(this.stateFile)) {
        execSync(`rm -f "${this.stateFile}"`)
      }
    } catch (error) {
      // Silent cleanup
    }
  }
}

class AutoReleaseUIv2 {
  private platform = platform()
  private projectRoot = process.cwd()
  private navigation: NavigationController
  
  constructor() {
    const projectStatus = this.getProjectStatus()
    const initialState: UIState = {
      step: 1,
      maxStep: 3,
      config: {},
      canGoBack: false,
      previewCommand: "",
      projectStatus
    }
    
    this.navigation = new NavigationController(initialState)
  }
  
  private getProjectStatus(): ProjectStatus {
    let currentVersion = "unknown"
    let lastRelease = "none"
    let lastReleaseDate = "never"
    let gitStatus = ""
    let isClean = true
    let hasUncommitted = false
    
    // Current version
    try {
      const packageJson = JSON.parse(readFileSync(join(this.projectRoot, 'package.json'), 'utf-8'))
      currentVersion = packageJson.version
    } catch {}
    
    // Last release
    try {
      const changelog = JSON.parse(readFileSync(join(this.projectRoot, 'CHANGELOG.json'), 'utf-8'))
      const latest = changelog.versions[0]
      if (latest) {
        lastRelease = latest.version
        lastReleaseDate = latest.date
      }
    } catch {}
    
    // Git status
    try {
      gitStatus = execSync('git status --porcelain', { encoding: 'utf-8' }).trim()
      isClean = !gitStatus
      hasUncommitted = !!gitStatus
    } catch {}
    
    return {
      currentVersion,
      lastRelease,
      lastReleaseDate,
      gitStatus,
      isClean,
      hasUncommitted
    }
  }
  
  private getQuickActions(): QuickAction[] {
    const current = this.navigation.getCurrentState().projectStatus.currentVersion
    const [major, minor, patch, preRelease] = current.split(/[.-]/)
    
    return [
      {
        id: "hotfix",
        name: "🚨 Hotfix",
        description: "Critical patch + immediate publish",
        emoji: "🚨",
        config: {
          versionType: 'patch',
          versionPrefix: 'stable',
          buildMode: 'full',
          workType: 'fix',
          useAI: true,
          createGitHubRelease: true,
          publishNpm: true,
          autoApprove: true
        },
        resultingVersion: `${major}.${minor}.${parseInt(patch) + 1}`
      },
      {
        id: "feature",
        name: "✨ Feature",
        description: "New feature + GitHub release",
        emoji: "✨",
        config: {
          versionType: 'minor',
          versionPrefix: 'stable',
          buildMode: 'full',
          workType: 'feature',
          useAI: true,
          createGitHubRelease: true,
          publishNpm: false
        },
        resultingVersion: `${major}.${parseInt(minor) + 1}.0`
      },
      {
        id: "alpha",
        name: "🧪 Alpha",
        description: "Testing release + GitHub packages",
        emoji: "🧪",
        config: {
          versionType: 'minor',
          versionPrefix: 'alpha',
          buildMode: 'full',
          workType: 'feature',
          useAI: true,
          createGitHubRelease: true,
          publishGitHub: true,
          publishNpm: false
        },
        resultingVersion: `${major}.${parseInt(minor) + 1}.0-alpha.1`
      },
      {
        id: "major",
        name: "💥 Major",
        description: "Breaking changes + full release",
        emoji: "💥",
        config: {
          versionType: 'major',
          versionPrefix: 'stable',
          buildMode: 'full',
          workType: 'feature',
          useAI: true,
          createGitHubRelease: true,
          publishNpm: true,
          performanceImpact: 'major'
        },
        resultingVersion: `${parseInt(major) + 1}.0.0`
      }
    ]
  }
  
  async collectReleaseInfo(): Promise<ReleaseOptions> {
    try {
      if (this.platform === "darwin") {
        return await this.macOSWizard()
      } else if (this.platform === "linux") {
        return await this.linuxWizard()
      } else {
        return await this.fallbackWizard()
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Cancelled") {
        console.log("❌ Release cancelled by user")
        process.exit(0)
      }
      console.log("⚠️ GUI not available, falling back to text input")
      return await this.fallbackWizard()
    } finally {
      this.navigation.cleanup()
    }
  }
  
  private async macOSWizard(): Promise<ReleaseOptions> {
    let state = this.navigation.getCurrentState()
    
    while (state.step <= state.maxStep) {
      switch (state.step) {
        case 1:
          state = await this.macOSStep1_Welcome(state)
          break
        case 2:
          state = await this.macOSStep2_Configuration(state)
          break
        case 3:
          state = await this.macOSStep3_Confirmation(state)
          break
        default:
          return state.config as ReleaseOptions
      }
    }
    
    return state.config as ReleaseOptions
  }
  
  private async macOSStep1_Welcome(currentState: UIState): Promise<UIState> {
    // First handle commits if needed
    const updatedState = await this.handleUncommittedChanges(currentState)
    
    const status = updatedState.projectStatus
    const quickActions = this.getQuickActions()
    
    // Build the action options with actual values
    const actionOptions = [
      `🚨 Hotfix → ${quickActions[0].resultingVersion} (patch + publish)`,
      `✨ Feature → ${quickActions[1].resultingVersion} (minor + GitHub)`,
      `🧪 Alpha → ${quickActions[2].resultingVersion} (test + packages)`,
      `💥 Major → ${quickActions[3].resultingVersion} (breaking + full)`,
      `⚙️ Custom Configuration...`
    ]
    
    const statusText = `🚀 AUTO-RELEASE MANAGER v2.0\\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n` +
      `📊 PROJECT STATUS:\\n` +
      `${status.isClean ? '✅' : '⚠️'} Git: ${status.isClean ? 'Clean working directory' : 'Has uncommitted changes'}\\n` +
      `📦 Version: ${status.currentVersion}\\n` +
      `📋 Last: ${status.lastRelease} (${status.lastReleaseDate})\\n\\n` +
      `🎯 SELECT ACTION:`
    
    const script = `
      const app = Application.currentApplication()
      app.includeStandardAdditions = true
      
      const statusText = "${statusText}"
      
      const actionOptions = ${JSON.stringify(actionOptions)}
      
      const result = app.chooseFromList(actionOptions, {
        withTitle: "🚀 Auto-Release Manager",
        withPrompt: statusText,
        defaultItems: ["⚙️ Custom Configuration..."],
        multipleSelectionsAllowed: false
      })
      
      if (result === false) {
        throw new Error("Cancelled")
      }
      
      const selected = result[0]
      
      if (selected.includes("Hotfix")) {
        JSON.stringify({ action: "hotfix", preset: "Hotfix" })
      } else if (selected.includes("Feature")) {
        JSON.stringify({ action: "feature", preset: "Feature Release" })
      } else if (selected.includes("Alpha")) {
        JSON.stringify({ action: "alpha", preset: "Alpha Testing" })
      } else if (selected.includes("Major")) {
        JSON.stringify({ action: "major", preset: "Major Release" })
      } else {
        JSON.stringify({ action: "custom", preset: null })
      }
    `
    
    try {
      const result = execSync(`osascript -l JavaScript -e '${script.replace(/'/g, "\\'")}'`, { encoding: 'utf-8' }).trim()
      const choice = JSON.parse(result)
      
      if (choice.action !== "custom") {
        // Quick action selected - apply preset and skip to confirmation
        const quickAction = quickActions.find(qa => qa.id === choice.action)!
        return this.navigation.goNext({
          step: 3, // Skip to confirmation
          config: {
            ...quickAction.config,
            context: `${quickAction.description} release`,
            affectedComponents: ['core']
          },
          selectedPreset: choice.preset,
          projectStatus: updatedState.projectStatus
        })
      } else {
        // Custom configuration
        return this.navigation.goNext({
          config: {
            useAI: true,
            dryRun: false,
            autoApprove: false
          },
          projectStatus: updatedState.projectStatus
        })
      }
    } catch (error) {
      throw new Error("Cancelled")
    }
  }
  
  private async macOSStep2_Configuration(currentState: UIState): Promise<UIState> {
    const config = currentState.config
    
    // Collect all configuration in a series of dialogs
    const versionScript = `
      const app = Application.currentApplication()
      app.includeStandardAdditions = true
      
      // Version Type Selection - build dynamic versions
      const currentVersion = "${currentState.projectStatus.currentVersion}"
      const versionTypes = [
        "patch → " + currentVersion.replace(/\\d+$/, (m) => String(parseInt(m) + 1)) + " (bug fixes)",
        "minor → " + currentVersion.replace(/\\d+\\.\\d+/, (m) => m.replace(/\\d+$/, (n) => String(parseInt(n) + 1)) + '.0') + " (new features)", 
        "major → " + currentVersion.replace(/^\\d+/, (m) => String(parseInt(m) + 1)) + '.0.0' + " (breaking changes)",
        "auto → AI-detected based on commits"
      ]
      
      const versionResult = app.chooseFromList(versionTypes, {
        withTitle: "📦 VERSIONING (Step 2/6)",
        withPrompt: "Current: " + currentVersion + "\\nLast Release: ${currentState.projectStatus.lastRelease}\\n\\nSelect version increment:",
        defaultItems: [versionTypes[0]]
      })
      
      if (versionResult === false) {
        JSON.stringify({ action: "back" })
      } else {
        const versionType = versionResult[0].split(" ")[0]
        
        // Version Prefix Selection - using centralized config
        const prefixes = [
          "stable (Production-ready release)",
          "alpha (Early testing and development)",
          "beta (Feature-complete testing phase)",
          "rc (Final testing before stable release)",
          "pre-alpha (Experimental and unstable features)"
        ]
        
        const prefixResult = app.chooseFromList(prefixes, {
          withTitle: "🏷️ VERSION PREFIX (Step 3/6)",
          withPrompt: "Version Type: " + versionType + "\\n\\nSelect version prefix:",
          defaultItems: ["stable (production ready)"]
        })
        
        if (prefixResult === false) {
          JSON.stringify({ action: "back" })
        } else {
          const prefix = prefixResult[0].split(" ")[0]
          JSON.stringify({ 
            action: "next",
            versionType: versionType,
            versionPrefix: prefix
          })
        }
      }
    `
    
    try {
      const versionResult = execSync(`osascript -l JavaScript -e '${versionScript.replace(/'/g, "\\'")}'`, { encoding: 'utf-8' }).trim()
      const versionChoice = JSON.parse(versionResult)
      
      if (versionChoice.action === "back") {
        return this.navigation.goBack()!
      }
      
      // Build Configuration
      const buildScript = `
        const app = Application.currentApplication()
        app.includeStandardAdditions = true
        
        // Build modes - using centralized config
        const buildModes = [
          "full (Complete bundle with all modules)",
          "core (Essential logging functionality - minimal size)",
          "styling (Core + visual features and theming)",
          "exports (Core + export handlers and remote logging)",
          "selective (Choose specific modules to include)",
          "skip (Use existing build artifacts)"
        ]
        
        const buildResult = app.chooseFromList(buildModes, {
          withTitle: "🔨 BUILD CONFIGURATION (Step 4/6)",
          withPrompt: "Version: ${versionChoice.versionType} (${versionChoice.versionPrefix})\\n\\nSelect build mode:",
          defaultItems: ["full (all modules + complete bundle)"]
        })
        
        if (buildResult === false) {
          JSON.stringify({ action: "back" })
        } else {
          const buildMode = buildResult[0].split(" ")[0]
          JSON.stringify({
            action: "next",
            buildMode: buildMode
          })
        }
      `
      
      const buildResult = execSync(`osascript -l JavaScript -e '${buildScript.replace(/'/g, "\\'")}'`, { encoding: 'utf-8' }).trim()
      const buildChoice = JSON.parse(buildResult)
      
      if (buildChoice.action === "back") {
        return this.navigation.goBack()!
      }
      
      // Work Details
      const workScript = `
        const app = Application.currentApplication()
        app.includeStandardAdditions = true
        
        // Get context
        const contextResult = app.displayDialog("💭 DESCRIBE CHANGES (Step 5/6)\\n\\nDescribe what you implemented/fixed:", {
          defaultAnswer: "",
          withTitle: "🚀 Release Context",
          buttons: ["← Back", "Next →"],
          defaultButton: "Next →"
        })
        
        if (contextResult.buttonReturned === "← Back") {
          JSON.stringify({ action: "back" })
        } else {
          const context = contextResult.textReturned
          
          // Work type - using centralized config
          const workTypes = [
            "feature (New functionality or capabilities)",
            "fix (Bug fixes and issue resolution)", 
            "refactor (Code improvements without functional changes)",
            "docs (Documentation updates and improvements)",
            "test (Testing improvements and new test cases)",
            "chore (Maintenance tasks and dependency updates)",
            "perf (Performance improvements and optimizations)"
          ]
          
          const workResult = app.chooseFromList(workTypes, {
            withTitle: "🏷️ WORK TYPE (Step 6/6)",
            withPrompt: "Context: " + context + "\\n\\nSelect primary work type:",
            defaultItems: ["feature (new functionality)"]
          })
          
          if (workResult === false) {
            JSON.stringify({ action: "back" })
          } else {
            const workType = workResult[0].split(" ")[0]
            
            // Components - using centralized config
            const components = [
              "core (Core logging functionality and Logger class)",
              "styling (Visual features, themes, and CSS styling system)", 
              "exports (Export handlers and remote logging capabilities)",
              "cli (Command-line interface and utilities)",
              "docs (Documentation, README files, and guides)",
              "tests (Test suites, fixtures, and testing utilities)",
              "examples (Usage examples and sample applications)",
              "workflows (GitHub Actions workflows and CI/CD configuration)"
            ]
            const componentResult = app.chooseFromList(components, {
              withTitle: "📦 AFFECTED COMPONENTS",
              withPrompt: "Context: " + context + "\\nType: " + workType + "\\n\\nSelect affected components:",
              multipleSelectionsAllowed: true,
              defaultItems: ["core (Core logging functionality and Logger class)"]
            })
            
            const affectedComponents = componentResult === false ? ["core"] : componentResult.map(c => c.split(" ")[0])
            
            JSON.stringify({
              action: "next",
              context: context,
              workType: workType,
              affectedComponents: affectedComponents
            })
          }
        }
      `
      
      const workResult = execSync(`osascript -l JavaScript -e '${workScript.replace(/'/g, "\\'")}'`, { encoding: 'utf-8' }).trim()
      const workChoice = JSON.parse(workResult)
      
      if (workChoice.action === "back") {
        return this.navigation.goBack()!
      }
      
      // Publishing options - quick dialog
      const publishScript = `
        const app = Application.currentApplication()
        app.includeStandardAdditions = true
        
        const publishOptions = [
          "GitHub Release only",
          "NPM Registry + GitHub Release", 
          "GitHub Packages + GitHub Release",
          "Full publish (NPM + GitHub + Packages)",
          "No publishing"
        ]
        
        const publishResult = app.chooseFromList(publishOptions, {
          withTitle: "📤 PUBLISHING OPTIONS",
          withPrompt: "Select publishing targets:",
          defaultItems: ["GitHub Release only"]
        })
        
        if (publishResult === false) {
          JSON.stringify({ action: "back" })
        } else {
          const selected = publishResult[0]
          JSON.stringify({
            action: "next",
            publishOption: selected
          })
        }
      `
      
      const publishResult = execSync(`osascript -l JavaScript -e '${publishScript.replace(/'/g, "\\'")}'`, { encoding: 'utf-8' }).trim()
      const publishChoice = JSON.parse(publishResult)
      
      if (publishChoice.action === "back") {
        return this.navigation.goBack()!
      }
      
      // Build final configuration
      const finalConfig: Partial<ReleaseOptions> = {
        ...config,
        versionType: versionChoice.versionType as any,
        versionPrefix: versionChoice.versionPrefix as any,
        buildMode: buildChoice.buildMode as any,
        context: workChoice.context,
        workType: workChoice.workType as any,
        affectedComponents: workChoice.affectedComponents,
        createGitHubRelease: !publishChoice.publishOption.includes("No publishing"),
        publishNpm: publishChoice.publishOption.includes("NPM Registry"),
        publishGitHub: publishChoice.publishOption.includes("GitHub Packages"),
        performanceImpact: 'none',
        useAI: true,
        selectedModules: [],
        docsOnly: false,
        skipTests: false,
        skipTypeCheck: false,
        keepLocalChanges: false
      }
      
      return this.navigation.goNext({
        config: finalConfig
      })
      
    } catch (error) {
      throw new Error("Cancelled")
    }
  }
  
  private async macOSStep3_Confirmation(currentState: UIState): Promise<UIState> {
    const config = currentState.config
    const preview = this.navigation.getCurrentState().previewCommand
    
    const script = `
      const app = Application.currentApplication()
      app.includeStandardAdditions = true
      
      const summary = "🚀 FINAL CONFIRMATION (Step 3/3)\\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n" +
        "✅ READY TO EXECUTE:\\n" +
        "━━━━━━━━━━━━━━━━━━\\n\\n" +
        "🎯 Actions that will be performed:\\n" +
        "1. ${config.autoCommit ? 'Auto-commit pending changes' : 'Use current committed state'}\\n" +
        "2. Generate version: ${config.versionType} (${config.versionPrefix})\\n" +
        "3. Build: ${config.buildMode} modules\\n" +
        "4. ${config.useAI ? 'Generate AI documentation with Gemini' : 'Generate basic documentation'}\\n" +
        "5. Commit: ${config.workType}(${(config.affectedComponents || []).join(',')})\\n" +
        "6. ${config.createGitHubRelease ? 'Create GitHub Release' : 'Skip GitHub Release'}\\n" +
        "7. ${config.publishNpm ? 'Publish to NPM Registry' : ''}${config.publishGitHub ? 'Publish to GitHub Packages' : ''}\\n\\n" +
        "⏱️ Estimated time: 3-5 minutes\\n" +
        "💾 Backup: Auto-backup branch will be created\\n\\n" +
        "🔍 PREVIEW COMMAND:\\n" +
        "${preview}"
      
      const result = app.displayDialog(summary, {
        withTitle: "🚀 Execute Release",
        buttons: ["← Back", "Cancel", "🚀 Execute"],
        defaultButton: "🚀 Execute"
      })
      
      if (result.buttonReturned === "← Back") {
        JSON.stringify({ action: "back" })
      } else if (result.buttonReturned === "Cancel") {
        JSON.stringify({ action: "cancel" })
      } else {
        JSON.stringify({ action: "execute" })
      }
    `
    
    try {
      const result = execSync(`osascript -l JavaScript -e '${script.replace(/'/g, "\\'")}'`, { encoding: 'utf-8' }).trim()
      const choice = JSON.parse(result)
      
      if (choice.action === "back") {
        return this.navigation.goBack()!
      } else if (choice.action === "cancel") {
        throw new Error("Cancelled")
      } else {
        // Ready to execute
        return this.navigation.goNext({
          step: 4 // Beyond maxStep to exit wizard
        })
      }
    } catch (error) {
      throw new Error("Cancelled")
    }
  }
  
  private async linuxWizard(): Promise<ReleaseOptions> {
    // Simplified Linux implementation
    console.log("🐧 Linux wizard not fully implemented yet")
    return this.fallbackWizard()
  }
  
  private async fallbackWizard(): Promise<ReleaseOptions> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        readline.question(prompt, resolve)
      })
    }
    
    console.log("\n🚀 AUTO-RELEASE MANAGER")
    console.log("=" .repeat(50))
    
    const status = this.navigation.getCurrentState().projectStatus
    console.log(`📦 Current: ${status.currentVersion}`)
    console.log(`📋 Last: ${status.lastRelease} (${status.lastReleaseDate})`)
    console.log(`${status.isClean ? '✅' : '⚠️'} Git: ${status.isClean ? 'Clean' : 'Has changes'}`)
    
    console.log("\nQuick actions:")
    const quickActions = this.getQuickActions()
    quickActions.forEach((action, i) => {
      console.log(`${i + 1}. ${action.emoji} ${action.name} → ${action.resultingVersion}`)
    })
    console.log(`${quickActions.length + 1}. ⚙️ Custom configuration`)
    
    const choice = await question(`\nSelect (1-${quickActions.length + 1}): `)
    const choiceNum = parseInt(choice)
    
    if (choiceNum >= 1 && choiceNum <= quickActions.length) {
      const selected = quickActions[choiceNum - 1]
      const config: ReleaseOptions = {
        ...selected.config,
        context: `${selected.description} release`,
        affectedComponents: ['core'],
        selectedModules: [],
        docsOnly: false,
        skipTests: false,
        skipTypeCheck: false,
        keepLocalChanges: false
      } as ReleaseOptions
      
      console.log(`\n✅ Selected: ${selected.name}`)
      console.log(`📋 Will create: ${selected.resultingVersion}`)
      
      const confirm = await question("Continue? (y/n): ")
      if (confirm.toLowerCase() !== 'y') {
        throw new Error("Cancelled")
      }
      
      readline.close()
      return config
    } else {
      // Custom configuration - simplified
      console.log("\n⚙️ Custom Configuration")
      const versionType = await question("Version type (patch/minor/major) [patch]: ") || "patch"
      const workType = await question(`Work type (${getWorkTypeIds().slice(0, 5).join('/')}) [feature]: `) || "feature"
      const context = await question("Describe changes: ")
      const componentsInput = await question(`Components (${getComponentIds().join(',')}): `) || "core"
      const publishNpm = await question("Publish to NPM? (y/n) [n]: ")
      
      readline.close()
      
      return {
        versionType: versionType as any,
        versionPrefix: 'stable',
        buildMode: 'full',
        workType: workType as any,
        context,
        affectedComponents: componentsInput.split(",").map(c => c.trim()),
        createGitHubRelease: true,
        publishNpm: publishNpm.toLowerCase() === 'y',
        publishGitHub: false,
        useAI: true,
        dryRun: false,
        autoApprove: false,
        autoCommit: false,
        force: false,
        quiet: false,
        selectedModules: [],
        docsOnly: false,
        performanceImpact: 'none',
        skipTests: false,
        skipTypeCheck: false,
        keepLocalChanges: false
      }
    }
  }
  
  async executeRelease(options: ReleaseOptions): Promise<void> {
    console.log("\n🚀 Executing Auto-Release...")
    console.log("=============================")
    
    // Build command arguments
    const args: string[] = []
    
    if (options.useAI) args.push("--ai")
    if (options.dryRun) args.push("--dry-run")
    if (options.autoApprove) args.push("--auto-approve")
    if (options.autoCommit) args.push("--auto-commit")
    if (options.force) args.push("--force")
    if (options.versionType !== 'auto') {
      args.push("--type", options.versionType)
    }
    if (options.versionPrefix !== 'stable') {
      args.push("--prefix", options.versionPrefix)
    }
    args.push("--work-type", options.workType)
    args.push("--affected-components", options.affectedComponents.join(","))
    args.push("--context", `"${options.context}"`)
    if (options.performanceImpact !== 'none') {
      args.push("--performance-impact", options.performanceImpact)
    }
    
    // Extended context parameters
    if (options.focusArea) {
      args.push("--focus", `"${options.focusArea}"`)
    }
    if (options.targetPlatform && options.targetPlatform !== 'universal') {
      args.push("--target-platform", options.targetPlatform)
    }
    if (options.urgency && options.urgency !== 'normal') {
      args.push("--urgency", options.urgency)
    }
    if (options.targetAudience && options.targetAudience !== 'public') {
      args.push("--audience", options.targetAudience)
    }
    if (options.dependencies && options.dependencies !== 'both') {
      args.push("--dependencies", options.dependencies)
    }
    
    if (!options.createGitHubRelease) args.push("--no-github")
    if (options.publishNpm) args.push("--publish-npm")
    if (options.publishGitHub) args.push("--publish-github")
    
    const command = `bun project-utils/auto-release-gemini.ts ${args.join(" ")}`
    console.log(`\n📋 Executing: ${command}`)
    console.log("=" .repeat(50))
    
    try {
      execSync(command, { stdio: 'inherit' })
      console.log("\n✅ Release completed successfully!")
    } catch (error) {
      console.error("\n❌ Release failed:", error)
      console.log("\n🔧 Troubleshooting:")
      console.log("- Check git status: git status")
      console.log("- View recent commits: git log --oneline -5")
      console.log("- Retry with --dry-run to test")
      process.exit(1)
    }
  }
  
  private async handleUncommittedChanges(currentState: UIState): Promise<UIState> {
    const status = currentState.projectStatus
    
    if (!status.hasUncommitted) {
      // No hay cambios, mostrar commits desde última release
      return await this.showCommitsSinceLastRelease(currentState)
    }
    
    // Hay cambios no commiteados - proponer commit
    if (this.platform === "darwin") {
      return await this.macOSCommitDialog(currentState)
    } else {
      return await this.fallbackCommitDialog(currentState)
    }
  }
  
  private async showCommitsSinceLastRelease(currentState: UIState): Promise<UIState> {
    try {
      // Obtener commits desde la última release
      const lastTag = execSync('git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10"', { encoding: 'utf-8' }).trim()
      const commits = execSync(`git log ${lastTag}..HEAD --oneline`, { encoding: 'utf-8' }).trim()
      
      if (this.platform === "darwin") {
        const script = `
          const app = Application.currentApplication()
          app.includeStandardAdditions = true
          
          const commitsText = "${commits.replace(/\n/g, '\\n')}"
          const message = "📋 COMMITS SINCE LAST RELEASE\\n" +
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n" +
            "✅ Working directory is clean\\n" +
            "📦 Last release: ${currentState.projectStatus.lastRelease}\\n\\n" +
            "🎯 Commits to be included:\\n" +
            (commitsText || "No new commits since last release") + "\\n\\n" +
            "Ready to proceed with release?"
          
          const result = app.displayDialog(message, {
            withTitle: "🚀 Release Preview",
            buttons: ["Cancel", "Continue →"],
            defaultButton: "Continue →"
          })
          
          if (result.buttonReturned === "Cancel") {
            JSON.stringify({ action: "cancel" })
          } else {
            JSON.stringify({ action: "continue" })
          }
        `
        
        const result = execSync(`osascript -l JavaScript -e '${script.replace(/'/g, "\\'")}'`, { encoding: 'utf-8' }).trim()
        const choice = JSON.parse(result)
        
        if (choice.action === "cancel") {
          throw new Error("Cancelled")
        }
        
        return currentState // Continue with existing flow
      } else {
        console.log("\n📋 COMMITS SINCE LAST RELEASE:")
        console.log("=" .repeat(50))
        console.log(`Last release: ${currentState.projectStatus.lastRelease}`)
        console.log("\nCommits to include:")
        console.log(commits || "No new commits since last release")
        console.log("\n✅ Working directory is clean - ready for release")
        
        return currentState
      }
    } catch (error) {
      console.warn("⚠️ Could not fetch commit history")
      return currentState
    }
  }
  
  private async macOSCommitDialog(currentState: UIState): Promise<UIState> {
    const status = currentState.projectStatus
    
    const script = `
      const app = Application.currentApplication()
      app.includeStandardAdditions = true
      
      const changesText = "${status.gitStatus.split('\n').slice(0, 10).join('\\n').replace(/"/g, '\\"')}"
      const message = "⚠️ UNCOMMITTED CHANGES DETECTED\\n" +
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\\n\\n" +
        "📝 Files with changes:\\n" +
        changesText + "\\n\\n" +
        "🤔 What would you like to do?"
      
      const options = [
        "🤖 Use Commit UI (interactive)",
        "📝 Quick commit (auto-generated)",
        "⏭️ Skip commit (use as-is)",
        "❌ Cancel release"
      ]
      
      const result = app.chooseFromList(options, {
        withTitle: "🚀 Handle Changes",
        withPrompt: message,
        defaultItems: ["🤖 Use Commit UI (interactive)"]
      })
      
      if (result === false) {
        JSON.stringify({ action: "cancel" })
      } else {
        const selected = result[0]
        if (selected.includes("Commit UI")) {
          JSON.stringify({ action: "commit-ui" })
        } else if (selected.includes("Quick commit")) {
          JSON.stringify({ action: "quick-commit" })
        } else if (selected.includes("Skip")) {
          JSON.stringify({ action: "skip" })
        } else {
          JSON.stringify({ action: "cancel" })
        }
      }
    `
    
    try {
      const result = execSync(`osascript -l JavaScript -e '${script.replace(/'/g, "\\'")}'`, { encoding: 'utf-8' }).trim()
      const choice = JSON.parse(result)
      
      switch (choice.action) {
        case "commit-ui":
          console.log("🚀 Launching interactive commit UI...")
          execSync('bun project-utils/commit-ui.ts', { stdio: 'inherit' })
          // Refresh project status after commit
          const newStatus = this.getProjectStatus()
          return { ...currentState, projectStatus: newStatus }
          
        case "quick-commit":
          console.log("📝 Creating quick commit...")
          execSync('bun project-utils/commit-generator.ts --auto-approve --context "Pre-release changes"', { stdio: 'inherit' })
          const refreshedStatus = this.getProjectStatus()
          return { ...currentState, projectStatus: refreshedStatus }
          
        case "skip":
          console.log("⏭️ Proceeding with uncommitted changes...")
          return currentState
          
        default:
          throw new Error("Cancelled")
      }
    } catch (error) {
      throw new Error("Cancelled")
    }
  }
  
  private async fallbackCommitDialog(currentState: UIState): Promise<UIState> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        readline.question(prompt, resolve)
      })
    }
    
    console.log("\n⚠️ UNCOMMITTED CHANGES DETECTED")
    console.log("=" .repeat(50))
    console.log("Files with changes:")
    console.log(currentState.projectStatus.gitStatus.split('\n').slice(0, 10).join('\n'))
    
    console.log("\nOptions:")
    console.log("1. 🤖 Interactive Commit UI")
    console.log("2. 📝 Quick auto-commit")
    console.log("3. ⏭️ Skip (proceed as-is)")
    console.log("4. ❌ Cancel")
    
    const choice = await question("\nSelect option (1-4): ")
    readline.close()
    
    switch (choice) {
      case "1":
        console.log("🚀 Launching commit UI...")
        execSync('bun project-utils/commit-ui.ts', { stdio: 'inherit' })
        const newStatus = this.getProjectStatus()
        return { ...currentState, projectStatus: newStatus }
        
      case "2":
        console.log("📝 Creating quick commit...")
        execSync('bun project-utils/commit-generator.ts --auto-approve --context "Pre-release changes"', { stdio: 'inherit' })
        const refreshedStatus = this.getProjectStatus()
        return { ...currentState, projectStatus: refreshedStatus }
        
      case "3":
        console.log("⏭️ Proceeding with uncommitted changes...")
        return currentState
        
      default:
        throw new Error("Cancelled")
    }
  }
}

async function runTypeCheck(): Promise<void> {
  console.log('🔍 Running type check...')
  
  try {
    execSync('npm run type-check', { 
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8'
    })
    console.log('✅ Type check passed')
  } catch (error) {
    console.log('❌ Type check failed:', error)
    process.exit(1)
  }
}

async function main() {
  const ui = new AutoReleaseUIv2()
  
  // Check for quick mode with presets
  const args = process.argv.slice(2)
  
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
🚀 Interactive Auto-Release UI v2.0

Usage:
  bun project-utils/auto-release-ui.ts [options]

Quick Actions:
  --hotfix           🚨 Critical patch + immediate publish
  --feature          ✨ New feature + GitHub release  
  --alpha            🧪 Testing release + GitHub packages
  --major            💥 Breaking changes + full release
  
Options:
  --help, -h         Show this help

Features:
  ✅ Smart commit detection & integration with commit-ui
  ✅ Navigation with Back/Forward buttons  
  ✅ Comprehensive project status display
  ✅ Preview commands before execution
  ✅ Quick actions for common release types
  ✅ Robust error handling & cancellation
  ✅ Cross-platform support (macOS/Linux/fallback)

Examples:
  bun project-utils/auto-release-ui.ts              # Interactive wizard
  npm run release:ui                                # Via npm script
  npm run release:hotfix                           # Quick hotfix
  npm run release:alpha                            # Alpha release
`)
    process.exit(0)
  }
  
  // Quick mode shortcuts
  let quickOptions: ReleaseOptions | null = null
  
  if (args.includes("--hotfix")) {
    quickOptions = {
      versionType: 'patch',
      versionPrefix: 'stable',
      buildMode: 'full',
      workType: 'fix',
      affectedComponents: ['core'],
      context: 'Critical hotfix release',
      performanceImpact: 'none',
      createGitHubRelease: true,
      publishNpm: true,
      publishGitHub: false,
      useAI: true,
      dryRun: false,
      autoApprove: true,
      autoCommit: true,
      force: false,
      quiet: false,
      selectedModules: [],
      docsOnly: false,
      skipTests: false,
      skipTypeCheck: false,
      keepLocalChanges: false
    }
  } else if (args.includes("--feature")) {
    quickOptions = {
      versionType: 'minor',
      versionPrefix: 'stable',
      buildMode: 'full',
      workType: 'feature',
      affectedComponents: ['core'],
      context: 'Feature release',
      performanceImpact: 'none',
      createGitHubRelease: true,
      publishNpm: false,
      publishGitHub: false,
      useAI: true,
      dryRun: false,
      autoApprove: false,
      autoCommit: false,
      force: false,
      quiet: false,
      selectedModules: [],
      docsOnly: false,
      skipTests: false,
      skipTypeCheck: false,
      keepLocalChanges: false
    }
  } else if (args.includes("--alpha")) {
    quickOptions = {
      versionType: 'minor',
      versionPrefix: 'alpha',
      buildMode: 'full',
      workType: 'feature',
      affectedComponents: ['core'],
      context: 'Alpha testing release',
      performanceImpact: 'none',
      createGitHubRelease: true,
      publishNpm: false,
      publishGitHub: true,
      useAI: true,
      dryRun: false,
      autoApprove: false,
      autoCommit: false,
      force: false,
      quiet: false,
      selectedModules: [],
      docsOnly: false,
      skipTests: false,
      skipTypeCheck: false,
      keepLocalChanges: false
    }
  } else if (args.includes("--major")) {
    quickOptions = {
      versionType: 'major',
      versionPrefix: 'stable',
      buildMode: 'full',
      workType: 'feature',
      affectedComponents: ['core', 'styling', 'exports'],
      context: 'Major version release',
      performanceImpact: 'major',
      createGitHubRelease: true,
      publishNpm: true,
      publishGitHub: false,
      useAI: true,
      dryRun: false,
      autoApprove: false,
      autoCommit: false,
      force: false,
      quiet: false,
      selectedModules: [],
      docsOnly: false,
      skipTests: false,
      skipTypeCheck: false,
      keepLocalChanges: false
    }
  }
  
  try {
    let options: ReleaseOptions
    
    if (quickOptions) {
      console.log("🚀 Using quick mode preset")
      options = quickOptions
    } else {
      // Interactive mode with commit handling
      console.log("🚀 Starting interactive release wizard...")
      
      // First check and handle commits
      let state = ui['navigation'].getCurrentState()
      state = await ui['handleUncommittedChanges'](state)
      
      // Then collect release configuration  
      options = await ui.collectReleaseInfo()
    }
    
    // Execute release
    await ui.executeRelease(options)
    
  } catch (error) {
    if (error instanceof Error && error.message === "Cancelled") {
      console.log("❌ Release cancelled by user")
      process.exit(0)
    }
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}