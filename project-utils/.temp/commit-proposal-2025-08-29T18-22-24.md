### **ANÁLISIS PRINCIPAL**

Se ha detectado una refactorización masiva y la implementación de un sistema de automatización completo para el proyecto. Los cambios introducen una infraestructura de CI/CD modular y avanzada, junto con un conjunto de herramientas locales (`project-utils`) para automatizar la generación de commits, el versionado y la creación de releases, incluyendo integración con IA (Gemini). El sistema de build ha sido modificado para soportar compilaciones modulares (`full`, `core`, `styling`, `exports`), alineándose con los nuevos workflows de GitHub Actions.

---

### **Propuesta de Commit #1**

```markdown
feat(build): Implementación de Sistema de Build y Release Modular con IA

Se introduce un sistema de automatización y CI/CD completamente nuevo y avanzado para mejorar la eficiencia del desarrollo y la gestión de releases.

Este sistema reemplaza los flujos de trabajo monolíticos anteriores con una arquitectura modular y potente que permite builds y releases independientes para los distintos componentes de la librería (`core`, `styling`, `exports`). Además, se integra un conjunto de herramientas en `project-utils` que automatizan tareas clave como la generación de commits, el versionado semántico y la publicación en GitHub, utilizando IA para generar análisis y propuestas.

<technical>
- **Sistema de Build Modular**: `vite.config.ts` y `package.json` han sido refactorizados para soportar builds modulares (`full`, `core`, `styling`, `exports`) a través de la variable de entorno `BUILD_MODE`.
- **Nuevos Workflows de CI/CD**: Se ha añadido una suite completa de workflows en `.github/workflows/` para:
  - `ci-quality.yml`: Tests de calidad con builds en matriz.
  - `releases-core.yml`: Releases modulares.
  - `releases-full.yml`: Pipeline de release completa con integración opcional de Gemini.
  - `nightly-auto.yml`: Builds nocturnos con detección inteligente de cambios.
  - `docs-demo.yml`: Despliegue de documentación y demo.
- **Herramientas de Automatización (`project-utils`)**: Se ha creado un nuevo directorio `project-utils` con scripts para:
  - `commit-generator.ts`: Generación de commits analizando los cambios con IA.
  - `version-manager.ts`: Gestión de versiones y `CHANGELOG.json` a partir de commits.
  - `auto-release-gemini.ts`: Orquestación de releases completas.
  - `github-release-manager.ts`: Creación de releases en GitHub.
- **Backup de Workflows Antiguos**: Los workflows anteriores han sido movidos a `.github/workflows-backup/`.
</technical>

<changelog>
## [Build] 🚀
Se ha implementado un sistema de CI/CD y build modular completamente nuevo. Este cambio mejora drásticamente la automatización de releases, la validación de código y la eficiencia del desarrollo interno, sin afectar la funcionalidad de la librería.
</changelog>
```

---

**DECISIÓN**: Se propone un único commit porque todos los cambios están intrínsecamente relacionados y forman parte de un sistema cohesivo. La refactorización del build, los nuevos workflows de CI/CD y las herramientas de automatización son interdependientes y representan la implementación de una única funcionalidad a nivel de proyecto.
