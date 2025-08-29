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
- **Matriz de Pruebas**: Estandarizada para usar `bun` en todas las versiones de Node.
</technical>

<changelog>
## [Infraestructura] ⚙️
- Optimización de la infraestructura de CI/CD para mejorar el rendimiento y la velocidad de los builds.
</changelog>
```

### **Propuesta de Commit #2**

```markdown
refactor(arquitectura): refactorizar a monorepo y modularizar paquetes

Se reestructura el proyecto a una arquitectura de monorepo utilizando workspaces. La librería se ha dividido en tres paquetes independientes: `@advanced-logger/core`, `@advanced-logger/styling` y `@advanced-logger/exports`.

Esta modularización mejora la mantenibilidad, permite el versionado independiente de cada paquete y facilita la reutilización del código. Se han actualizado las configuraciones de build y `package.json` para reflejar la nueva estructura.

<technical>
- **Estructura de Directorios**: Creada la carpeta `packages/` que contiene `core/`, `styling/` y `exports/`.
- **package.json**: Actualizado el `package.json` raíz para definir los workspaces.
- **Paquetes**: Cada paquete (`core`, `styling`, `exports`) tiene su propio `package.json` con sus dependencias y scripts.
- **Build**: Actualizado `vite.config.ts` y los scripts de build para compilar cada paquete de forma independiente.
</technical>

<changelog>
## [Refactor] ♻️
- Arquitectura refactorizada a un monorepo para mayor modularidad. La librería ahora se distribuye en tres paquetes: `@advanced-logger/core`, `@advanced-logger/styling` y `@advanced-logger/exports`.
</changelog>
```

---

**DECISIÓN**: Se proponen dos commits porque los cambios abordan dos áreas conceptualmente distintas: la migración de herramientas de CI/CD (un cambio de infraestructura) y la refactorización a una arquitectura monorepo (un cambio estructural del código base). Separarlos mantiene el historial del repositorio limpio y facilita el seguimiento de cambios específicos.
