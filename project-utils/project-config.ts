/**
 * Configuración centralizada del proyecto Better Logger
 * Define componentes, tipos de trabajo, y otras configuraciones compartidas
 */

export interface ProjectComponent {
  id: string
  name: string
  description: string
  buildCommand?: string
  testCommand?: string
}

export interface WorkTypeConfig {
  id: string
  name: string
  description: string
  emoji: string
}

export const PROJECT_COMPONENTS: ProjectComponent[] = [
  {
    id: "core",
    name: "Core",
    description: "Core logging functionality and Logger class",
    buildCommand: "build:core",
    testCommand: "test:core"
  },
  {
    id: "styling",
    name: "Styling",
    description: "Visual features, themes, and CSS styling system",
    buildCommand: "build:styling",
    testCommand: "test:styling"
  },
  {
    id: "exports",
    name: "Exports",
    description: "Export handlers and remote logging capabilities",
    buildCommand: "build:exports",
    testCommand: "test:exports"
  },
  {
    id: "cli",
    name: "CLI",
    description: "Command-line interface and utilities",
    buildCommand: "build:cli",
    testCommand: "test:cli"
  },
  {
    id: "docs",
    name: "Documentation",
    description: "Documentation, README files, and guides"
  },
  {
    id: "tests",
    name: "Tests",
    description: "Test suites, fixtures, and testing utilities"
  },
  {
    id: "examples",
    name: "Examples",
    description: "Usage examples and sample applications"
  },
  {
    id: "workflows",
    name: "Workflows",
    description: "GitHub Actions workflows and CI/CD configuration"
  }
]

export const WORK_TYPES: WorkTypeConfig[] = [
  {
    id: "feature",
    name: "Feature",
    description: "New functionality or capabilities",
    emoji: "✨"
  },
  {
    id: "fix",
    name: "Fix",
    description: "Bug fixes and issue resolution",
    emoji: "🐛"
  },
  {
    id: "refactor",
    name: "Refactor",
    description: "Code improvements without functional changes",
    emoji: "♻️"
  },
  {
    id: "docs",
    name: "Documentation",
    description: "Documentation updates and improvements",
    emoji: "📝"
  },
  {
    id: "test",
    name: "Tests",
    description: "Testing improvements and new test cases",
    emoji: "🧪"
  },
  {
    id: "chore",
    name: "Chore",
    description: "Maintenance tasks and dependency updates",
    emoji: "🔧"
  },
  {
    id: "perf",
    name: "Performance",
    description: "Performance improvements and optimizations",
    emoji: "⚡"
  },
  {
    id: "style",
    name: "Style",
    description: "Code style and formatting changes",
    emoji: "💄"
  }
]

export const BUILD_MODES = [
  {
    id: "full",
    name: "Full Build",
    description: "Complete bundle with all modules",
    modules: ["core", "styling", "exports", "cli"]
  },
  {
    id: "core",
    name: "Core Only",
    description: "Essential logging functionality (minimal size)",
    modules: ["core"]
  },
  {
    id: "styling",
    name: "Styling Bundle",
    description: "Core + visual features and theming",
    modules: ["core", "styling"]
  },
  {
    id: "exports",
    name: "Exports Bundle", 
    description: "Core + export handlers and remote logging",
    modules: ["core", "exports"]
  },
  {
    id: "selective",
    name: "Selective",
    description: "Choose specific modules to include",
    modules: [] // User selects
  },
  {
    id: "skip",
    name: "Skip Build",
    description: "Use existing build artifacts",
    modules: []
  }
]

export const VERSION_PREFIXES = [
  {
    id: "stable",
    name: "Stable",
    description: "Production-ready release",
    npmTag: "latest"
  },
  {
    id: "alpha",
    name: "Alpha",
    description: "Early testing and development",
    npmTag: "alpha"
  },
  {
    id: "beta", 
    name: "Beta",
    description: "Feature-complete testing phase",
    npmTag: "beta"
  },
  {
    id: "rc",
    name: "Release Candidate",
    description: "Final testing before stable release",
    npmTag: "next"
  },
  {
    id: "pre-alpha",
    name: "Pre-Alpha",
    description: "Experimental and unstable features",
    npmTag: "experimental"
  }
]

export const PERFORMANCE_IMPACTS = [
  {
    id: "none",
    name: "None",
    description: "No performance impact expected"
  },
  {
    id: "minor",
    name: "Minor",
    description: "Small performance improvements or negligible impact"
  },
  {
    id: "major",
    name: "Major",
    description: "Significant performance changes or optimizations"
  }
]

// Helper functions
export function getComponentById(id: string): ProjectComponent | undefined {
  return PROJECT_COMPONENTS.find(c => c.id === id)
}

export function getWorkTypeById(id: string): WorkTypeConfig | undefined {
  return WORK_TYPES.find(w => w.id === id)
}

export function getComponentIds(): string[] {
  return PROJECT_COMPONENTS.map(c => c.id)
}

export function getWorkTypeIds(): string[] {
  return WORK_TYPES.map(w => w.id)
}

export function getBuildModeById(id: string) {
  return BUILD_MODES.find(b => b.id === id)
}

export function getVersionPrefixById(id: string) {
  return VERSION_PREFIXES.find(v => v.id === id)
}

export function formatComponentsList(componentIds: string[]): string {
  const components = componentIds
    .map(id => getComponentById(id))
    .filter(Boolean)
    .map(c => c!.name)
  
  if (components.length === 0) return "none"
  if (components.length === 1) return components[0]
  if (components.length === 2) return components.join(" and ")
  
  return components.slice(0, -1).join(", ") + ", and " + components[components.length - 1]
}

// Project metadata
export const PROJECT_INFO = {
  name: "@mks2508/better-logger",
  displayName: "Better Logger",
  description: "State-of-the-art console logger with advanced CSS styling, SVG support, animations, and CLI interface",
  author: "MKS2508",
  license: "MIT",
  homepage: "https://mks2508.github.io/advanced-logger/",
  repository: "https://github.com/MKS2508/advanced-logger.git"
}