### **ANÁLISIS PRINCIPAL**

Se ha detectado una refactorización masiva y la implementación de un sistema de automatización completo para el proyecto. Los cambios introducen una infraestructura de CI/CD modular y avanzada, junto con un conjunto de herramientas locales (`project-utils`) para automatizar la generación de commits, el versionado y la creación de releases, incluyendo integración con IA (Gemini). El sistema de build ha sido modificado para soportar compilaciones modulares (`full`, `core`, `styling`, `exports`), alineándose con los nuevos workflows de GitHub Actions.

---

### **Propuesta de Commit #1**

```markdown
feat(build): Implementación de Sistema de Build y Release Modular con IA

Se introduce un sistema de automatización y CI/CD completamente nuevo y avanzado para mejorar la eficiencia del desarrollo y la gestión de releases.

Este sistema reemplaza los flujos de trabajo monolíticos anteriores con una arquitectura modular y potente que permite builds y releases independientes para los distintos componentes de la librería (`core`, `styling`, `exports`). Además, se integra un conjunto de herramientas en `project-utils` que automatizan tareas clave como la generación de commits, el versionado semántico y la publicación en GitHub, utilizando Gemini AI para análisis inteligente.

<technical>
- **Nuevos Workflows de GitHub Actions**: Se añaden flujos de trabajo modulares para CI (`ci-quality.yml`), releases (`releases-core.yml`, `releases-full.yml`), builds nocturnos (`nightly-auto.yml`) y despliegue de la documentación (`docs-demo.yml`). Los workflows antiguos se han movido a `.github/workflows-backup`.
- **Utilidades de Proyecto (`project-utils`)**: Se crea un nuevo directorio con scripts de automatización basados en TypeScript:
  - `commit-generator.ts`: Genera propuestas de commit analizando los cambios.
  - `version-manager.ts`: Gestiona el versionado basado en el historial de commits.
  - `auto-release-gemini.ts`: Orquesta releases completas con integración de IA.
  - `github-release-manager.ts`: Automatiza la creación de releases en GitHub.
  - `prompt-templates.ts`: Centraliza las plantillas para la comunicación con Gemini.
- **Configuración de Vite (`vite.config.ts`)**: Refactorizada para soportar builds modulares a través de la variable de entorno `BUILD_MODE`. Ahora genera salidas separadas para cada módulo en `dist/`.
- **Scripts de `package.json`**: Actualizados para reflejar la nueva estructura de build modular (`build:core`, `build:styling`, etc.) y para invocar los nuevos scripts de automatización.
</technical>

<changelog>
## [Chore] ⚙️
Se ha implementado un sistema de automatización y CI/CD avanzado para mejorar la mantenibilidad y la velocidad de desarrollo del proyecto.
</changelog>
```

---

**DECISIÓN**: Se propone un único commit porque todos los cambios están intrínsecamente relacionados y forman una única unidad funcional: la implementación del nuevo sistema de automatización y build. Separarlos resultaría en estados intermedios no funcionales en el repositorio.
