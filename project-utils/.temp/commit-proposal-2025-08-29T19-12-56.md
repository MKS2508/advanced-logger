### **ANÁLISIS PRINCIPAL**

Se ha realizado una migración completa de la infraestructura de CI/CD de NPM a Bun para mejorar el rendimiento. Paralelamente, se ha refactorizado la arquitectura del proyecto a un monorepo, dividiendo la librería en tres paquetes modulares e independientes: `core`, `styling` y `exports`. Las herramientas de build y automatización han sido actualizadas para soportar esta nueva estructura.

---

### **Propuesta de Commit #1**

```markdown
chore(ci): migrar la infraestructura de CI/CD de NPM a Bun

Se reemplaza `npm` con `bun` en todos los flujos de trabajo de GitHub Actions para estandarizar las herramientas y acelerar los tiempos de ejecución. Esto afecta la instalación de dependencias, la ejecución de scripts y la configuración del entorno de pruebas.

<technical>
- **Workflows de GitHub Actions**: Modificados `ci-quality.yml`, `docs-demo.yml`, `nightly-auto.yml`, `releases-core.yml` y `releases-full.yml`.
- **Setup**: Reemplazado `actions/setup-node` por `oven-sh/setup-bun`.
- **Instalación**: Cambiado `npm run ci:install` por `bun install --frozen-lockfile`.
- **Ejecución de Scripts**: Actualizados todos los comandos `npm run` a `bun run`.
- **Matriz de Pruebas**: La matriz en `ci-quality.yml` ahora prueba contra versiones de `bun` en lugar de `node`.
</technical>

<changelog>
## [Improvement] [🚀]
Infraestructura de CI/CD migrada a Bun para mayor rendimiento y eficiencia.
</changelog>
```

### **Propuesta de Commit #2**

```markdown
feat(build): implementar arquitectura de monorepo modular

Se refactoriza el proyecto a una arquitectura de monorepo para mejorar la modularidad y mantenibilidad. Se crean tres paquetes publicables e independientes: `@mks2508/better-logger-core`, `@mks2508/better-logger-styling` y `@mks2508/better-logger-exports`.

Este cambio permite un versionado más granular y facilita la reutilización de componentes. El sistema de build y las herramientas de automatización se han actualizado para ser compatibles con esta nueva estructura.

<technical>
- **Estructura de Paquetes**: Creados los directorios `packages/core`, `packages/styling` y `packages/exports`, cada uno con su propio `package.json`.
- **Configuración de Build**: Actualizado `vite.config.ts` para dirigir las salidas de compilación a los directorios `dist/` de cada paquete modular.
- **Gestión de Versiones**: Modificado `project-utils/version-manager.ts` para detectar y actualizar las versiones de todos los paquetes del monorepo.
- **Herramientas de Release**: Mejorados los scripts en `project-utils` para manejar correctamente la nueva estructura de paquetes y las ramas de git.
- **Versionado**: La versión principal del proyecto se actualiza a `0.2.0` para reflejar este cambio arquitectónico significativo.
</technical>

<changelog>
## [Feature] [✨]
Implementada arquitectura de monorepo con paquetes modulares (`core`, `styling`, `exports`).
</changelog>
```

---

**DECISIÓN**: Se proponen dos commits para separar lógicamente dos cambios significativos e independientes: la migración de la infraestructura de CI a Bun y la refactorización arquitectónica a un monorepo. Esto mejora la claridad y legibilidad del historial de cambios.
