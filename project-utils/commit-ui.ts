#!/usr/bin/env node

import { execSync } from "child_process"
import { platform } from "os"

interface CommitOptions {
  context: string
  workType: string
  affectedComponents: string[]
  scope?: string
  breakingChange?: boolean
  performanceImpact?: string
}

class CommitUI {
  private platform = platform()

  async collectCommitInfo(): Promise<CommitOptions> {
    console.log("🚀 Interactive Commit Generator")
    console.log("================================")

    try {
      if (this.platform === "darwin") {
        return await this.macOSDialog()
      } else if (this.platform === "linux") {
        return await this.linuxDialog()
      } else {
        return await this.fallbackDialog()
      }
    } catch (error) {
      console.log("⚠️ GUI not available, falling back to text input")
      return await this.fallbackDialog()
    }
  }

  private async macOSDialog(): Promise<CommitOptions> {
    // Create a unified form using AppleScript
    const formScript = `
      const app = Application.currentApplication()
      app.includeStandardAdditions = true
      
      // First get the context text
      const contextResult = app.displayDialog("📝 Commit Generator\\n\\nDescribe what you implemented/fixed:", {
        defaultAnswer: "",
        withTitle: "🚀 Interactive Commit",
        buttons: ["Cancel", "Next →"],
        defaultButton: "Next →"
      })
      
      const context = contextResult.textReturned
      
      // Then get work type
      const workTypes = ["feature", "fix", "refactor", "docs", "test"]
      const workTypeResult = app.chooseFromList(workTypes, {
        withTitle: "🚀 Interactive Commit - Work Type",
        withPrompt: "Context: " + context + "\\n\\nSelect work type:",
        defaultItems: ["feature"]
      })
      
      if (workTypeResult === false) {
        throw new Error("Cancelled")
      }
      
      const workType = workTypeResult[0]
      
      // Then get components
      const components = ["core", "styling", "exports", "cli", "docs", "tests", "examples"]
      const componentsResult = app.chooseFromList(components, {
        withTitle: "🚀 Interactive Commit - Components",
        withPrompt: "Context: " + context + "\\nType: " + workType + "\\n\\nSelect affected components:",
        multipleSelectionsAllowed: true,
        defaultItems: ["core"]
      })
      
      if (componentsResult === false) {
        throw new Error("Cancelled")
      }
      
      const affectedComponents = componentsResult.join(",")
      
      // Finally get performance impact
      const impacts = ["none", "minor", "major"]
      const performanceResult = app.chooseFromList(impacts, {
        withTitle: "🚀 Interactive Commit - Performance",
        withPrompt: "Context: " + context + "\\nType: " + workType + "\\nComponents: " + affectedComponents + "\\n\\nPerformance impact:",
        defaultItems: ["none"]
      })
      
      const performanceImpact = performanceResult === false ? "none" : performanceResult[0]
      
      // Return all values as JSON
      JSON.stringify({
        context: context,
        workType: workType,
        affectedComponents: affectedComponents,
        performanceImpact: performanceImpact
      })
    `
    
    const result = execSync(`osascript -l JavaScript -e '${formScript}'`, { encoding: 'utf-8' }).trim()
    const parsed = JSON.parse(result)

    return {
      context: parsed.context,
      workType: parsed.workType,
      affectedComponents: parsed.affectedComponents.split(","),
      performanceImpact: parsed.performanceImpact
    }
  }

  private async linuxDialog(): Promise<CommitOptions> {
    // Check if zenity is available
    try {
      execSync("which zenity", { stdio: 'ignore' })
    } catch {
      throw new Error("zenity not available")
    }

    // Context Input first
    const context = execSync(`zenity --entry --title="🚀 Interactive Commit" --text="📝 Describe what you implemented/fixed:" --width=400`, { encoding: 'utf-8' }).trim()

    // Work Type Selection with context shown
    const workType = execSync(`zenity --list --title="🚀 Interactive Commit - Work Type" --text="Context: ${context}\\n\\nSelect work type:" --radiolist --column="Select" --column="Type" --column="Description" --width=450 --height=300 \\
      TRUE "feature" "New functionality" \\
      FALSE "fix" "Bug fixes" \\
      FALSE "refactor" "Code refactoring" \\
      FALSE "docs" "Documentation" \\
      FALSE "test" "Tests"`, { encoding: 'utf-8' }).trim()

    // Components Selection with previous values shown
    const componentsResult = execSync(`zenity --list --title="🚀 Interactive Commit - Components" --text="Context: ${context}\\nType: ${workType}\\n\\nSelect affected components:" --checklist --column="Select" --column="Component" --width=450 --height=300 \\
      TRUE "core" \\
      FALSE "styling" \\
      FALSE "exports" \\
      FALSE "cli" \\
      FALSE "docs" \\
      FALSE "tests" \\
      FALSE "examples"`, { encoding: 'utf-8' }).trim()
    
    const affectedComponents = componentsResult.split("|").filter(Boolean)

    // Performance Impact with summary
    const performanceImpact = execSync(`zenity --list --title="🚀 Interactive Commit - Performance" --text="Context: ${context}\\nType: ${workType}\\nComponents: ${affectedComponents.join(', ')}\\n\\nSelect performance impact:" --radiolist --column="Select" --column="Impact" --width=450 --height=250 \\
      TRUE "none" \\
      FALSE "minor" \\
      FALSE "major"`, { encoding: 'utf-8' }).trim()

    return {
      context,
      workType,
      affectedComponents,
      performanceImpact
    }
  }

  private async fallbackDialog(): Promise<CommitOptions> {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        readline.question(prompt, resolve)
      })
    }

    console.log("\n📝 Text-based commit input")
    
    const workType = await question("Work type (feature/fix/refactor/docs/test): ") || "feature"
    const context = await question("Describe what you implemented/fixed: ")
    const componentsInput = await question("Components changed (core,styling,exports,cli,docs,tests,examples): ") || "core"
    const affectedComponents = componentsInput.split(",").map(c => c.trim())
    const performanceImpact = await question("Performance impact (none/minor/major): ") || "none"

    readline.close()

    return {
      context,
      workType,
      affectedComponents,
      performanceImpact
    }
  }

  async generateCommit(options: CommitOptions): Promise<void> {
    const args = [
      "--context", `"${options.context}"`,
      "--work-type", options.workType,
      "--affected-components", options.affectedComponents.join(",")
    ]

    if (options.performanceImpact && options.performanceImpact !== "none") {
      args.push("--performance-impact", options.performanceImpact)
    }

    console.log("\n🔄 Generating commit...")
    console.log(`📋 Context: ${options.context}`)
    console.log(`🏷️ Type: ${options.workType}`)
    console.log(`📦 Components: ${options.affectedComponents.join(", ")}`)
    console.log(`⚡ Performance: ${options.performanceImpact}`)

    const command = `node src/commit-generator.ts ${args.join(" ")} --auto-approve`
    console.log(`\n🚀 Running: ${command}`)
    
    try {
      execSync(command, { stdio: 'inherit' })
      console.log("✅ Commits executed successfully!")
    } catch (error) {
      console.error("❌ Error executing commits:", error)
      process.exit(1)
    }
  }
}

async function runTypeCheck(): Promise<void> {
  console.log('🔍 Ejecutando typecheck...')
  
  try {
    execSync('npm run type-check', { 
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8'
    })
    console.log('✅ Typecheck completado correctamente')
  } catch (error) {
    console.log('❌ Typecheck falló:', error)
    process.exit(1)
  }
}

async function main() {
  // Ejecutar typecheck antes de continuar
  await runTypeCheck()
  
  const ui = new CommitUI()
  
  // Check for quick mode
  if (process.argv.includes("--quick")) {
    const quickOptions: CommitOptions = {
      context: "Quick commit via UI",
      workType: "feature",
      affectedComponents: ["core"],
      performanceImpact: "none"
    }
    await ui.generateCommit(quickOptions)
    return
  }
  
  try {
    const options = await ui.collectCommitInfo()
    await ui.generateCommit(options)
  } catch (error) {
    if (error instanceof Error && error.message === "Cancelled") {
      console.log("❌ Commit cancelled by user")
      process.exit(0)
    }
    console.error("❌ Error:", error)
    process.exit(1)
  }
}

if (import.meta.main) {
  main()
}