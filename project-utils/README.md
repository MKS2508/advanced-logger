# Project Utils - Sistema de Automatización Completa

## 🚀 Comandos de Workflow Automatizado

### Comandos Individuales
```bash
# Commits automatizados
npm run commit:auto           # Commit automático silencioso
npm run commit:ui            # UI interactiva para commits  
npm run commit:generate      # Solo generar propuesta

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
npm run release:auto         # Release completa con AI
```

### Workflows Completos
```bash
npm run workflow:full        # Commit + Versión + Build + Release + Publish
npm run workflow:commit      # Solo commit automático
npm run workflow:version     # Versión + Build
npm run workflow:release     # Versión + Build + GitHub Release
```

## 🔧 Parámetros de Automatización

### commit-generator.ts
```bash
# Usar propuesta existente
node project-utils/commit-generator.ts --proposal-file project-utils/.temp/commit-proposal-*.md --auto-approve

# Configuración personalizada
node project-utils/commit-generator.ts \
  --auto-approve \
  --quiet \
  --work-type feature \
  --affected-components "core,styling" \
  --output-dir custom/path
```

### version-manager.ts
```bash
# Versionado automático completo
node project-utils/version-manager.ts --auto-approve --quiet --type minor
```

### github-release-manager.ts
```bash
# Release automática
node project-utils/github-release-manager.ts --auto-approve --quiet
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

### Desarrollo Normal
```bash
# 1. Hacer cambios en código
# 2. Commit automático
npm run commit:auto

# 3. Cuando esté listo para release
npm run workflow:release
```

### CI/CD Pipeline
```bash
# Workflow completo automático
npm run workflow:full
```

### Releases Manuales con Control
```bash
npm run commit:generate     # Revisar propuesta
# Editar si necesario
npm run commit:auto         # Ejecutar commits
npm run version:minor       # Versión específica
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