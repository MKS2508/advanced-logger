# Project Utils - Sistema de Automatización Completa con AI

## 🚀 Comandos de Workflow Automatizado

### Comandos Individuales
```bash
# Commits automatizados
npm run commit:auto           # Commit automático silencioso
npm run commit:ui            # UI interactiva para commits  

# Versionado automatizado
npm run version:auto         # Auto-detectar tipo de versión
npm run version:patch        # Forzar versión patch
npm run version:minor        # Forzar versión minor  
npm run version:major        # Forzar versión major
npm run version:alpha        # Versión alpha
npm run version:beta         # Versión beta
npm run version:stable       # Versión estable

# GitHub Releases
npm run release:github       # Crear release en GitHub
npm run release:full         # Versión + Build + GitHub + Publish NPM
npm run release:auto         # 🤖 Release completa con AI (RECOMENDADO)
```

### 🤖 Release Automatizado con AI (NUEVO)
```bash
# Release completo con AI - Un solo comando hace todo:
# ✅ Genera nueva versión
# ✅ Build de todos los módulos  
# ✅ Commit inteligente con AI
# ✅ GitHub release con release notes
# ✅ Publicación dual NPM (público + GitHub Packages)

# Ejemplos de uso:
npm run release:auto -- --type minor --prefix alpha --publish-npm
npm run release:auto -- --type patch --publish-npm --publish-github
npm run release:auto -- --dry-run --type minor --prefix beta
```

### Workflows Clásicos (Legacy)
```bash
npm run workflow:full        # Commit + Versión + Build + Release + Publish
npm run workflow:commit      # Solo commit automático
npm run workflow:release     # Versión + Build + GitHub Release
```

## 🔧 Parámetros de Automatización

### 🤖 auto-release-gemini.ts (RECOMENDADO)
```bash
# Release alpha con AI completo
bun project-utils/auto-release-gemini.ts \
  --ai --auto-approve \
  --type minor --prefix alpha \
  --work-type feature --affected-components "exports,handlers" \
  --context "enhanced export functionality" \
  --publish-npm --publish-github

# Release beta con contexto de performance
bun project-utils/auto-release-gemini.ts \
  --type minor --prefix beta \
  --work-type improvement --performance-impact major \
  --context "performance optimizations" \
  --publish-npm

# Solo mostrar qué haría (dry run)
bun project-utils/auto-release-gemini.ts --dry-run \
  --type patch --prefix alpha --publish-npm

# Release para CI/CD
bun project-utils/auto-release-gemini.ts --auto-approve --ai \
  --type patch --publish-npm --publish-github
```

**Parámetros disponibles:**
- **Version Manager**: `--type` (major|minor|patch), `--prefix` (alpha|beta|rc|'')
- **Commit AI**: `--work-type`, `--affected-components`, `--context`, `--performance-impact`
- **Publicación**: `--publish-npm`, `--publish-github`
- **Control**: `--dry-run`, `--auto-approve`, `--ai`/`--no-ai`, `--force`

### Scripts Individuales (Legacy)

#### commit-generator.ts
```bash
bun project-utils/commit-generator.ts \
  --auto-approve --quiet \
  --work-type feature \
  --affected-components "core,styling" \
  --context "logger improvements"
```

#### version-manager.ts
```bash
bun project-utils/version-manager.ts --auto-approve --type minor --prefix alpha
```

#### github-release-manager.ts
```bash
bun project-utils/github-release-manager.ts --auto-approve --force
```

## 📁 Archivos Temporales

Ubicación: `project-utils/.temp/`
- `commit-proposal-YYYYMMDD-HHMMSS.md` - Propuestas de commit
- `gemini-prompt.txt` - Prompts enviados a Gemini
- `gemini-response.md` - Respuestas de Gemini
- `analysis-context.json` - Contexto de análisis

## 🔄 Reutilización de Propuestas

1. Generar propuesta: `npm run commit:generate`
2. Revisar en `project-utils/.temp/commit-proposal-*.md`
3. Ejecutar: `node project-utils/commit-generator.ts --proposal-file <ruta> --auto-approve`

## 🎯 Casos de Uso

### 🤖 Desarrollo con AI (RECOMENDADO)
```bash
# 1. Hacer cambios en código
# 2. Release completo con AI en un comando
npm run release:auto -- --type patch --prefix alpha --publish-npm

# Para releases importantes
npm run release:auto -- \
  --type minor --prefix beta \
  --work-type feature \
  --affected-components "core,exports" \
  --context "major logging enhancements" \
  --publish-npm --publish-github
```

### 🔍 Testing y Validación
```bash
# Ver qué haría sin ejecutar
npm run release:auto -- --dry-run --type minor --prefix alpha --publish-npm

# Testing de instalación después de release
npm install @mks2508/better-logger@0.4.0-alpha.1
npm install @mks2508/better-logger@0.4.0-alpha.1 --registry=https://npm.pkg.github.com
```

### 🌐 CI/CD Pipeline
```bash
# Workflow para CI/CD completamente automatizado
npm run release:auto -- --auto-approve --ai \
  --type patch --publish-npm --publish-github
```

### 🕧 Desarrollo Manual (Legacy)
```bash
npm run commit:auto         # Commit manual
npm run version:minor       # Versión manual
npm run release:github      # Solo GitHub release
```

## ⚙️ Configuración

Todos los scripts respetan los parámetros:
- `--auto-approve`: Ejecución automática sin confirmaciones
- `--quiet`: Solo errores y resultados finales
- `--no-push`: No hacer push (solo commits locales)
- `--force`: Forzar operaciones (recrear releases, etc.)

## 🔒 Validaciones de Seguridad

- Solo funciona en rama `master`
- Validación de conflictos antes de ejecutar  
- Commits atómicos con rollback en caso de error
- Logs completos de todas las operaciones
- Validación de estado del repositorio antes de auto-approve