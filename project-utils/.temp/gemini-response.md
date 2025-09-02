### **ANÁLISIS PRINCIPAL**

Se ha introducido un nuevo y avanzado sistema de gestión de releases (`auto-release-ui.ts`) que permite la creación de versiones de forma interactiva y mediante comandos específicos. Para dar soporte a esta nueva herramienta, se ha realizado una refactorización clave, centralizando toda la configuración del proyecto (componentes, tipos de trabajo, etc.) en un único archivo (`project-config.ts`), mejorando la mantenibilidad y consistencia de las herramientas internas. Adicionalmente, se han añadido los scripts correspondientes en `package.json` y se ha corregido una ruta de ejecución en la herramienta de commits.

---

### **Propuesta de Commit #1**

```markdown
feat(tooling): introduce sistema de release interactivo y centraliza configuración

Se implementa un nuevo sistema de gestión de releases basado en una interfaz de línea de comandos (CLI) interactiva, facilitando la creación de versiones `major`, `feature`, `hotfix`, `alpha`, etc. Este sistema mejora significativamente el flujo de trabajo de despliegue, haciéndolo más rápido, intuitivo y menos propenso a errores.

Como parte de esta mejora, se ha refactorizado la configuración de las herramientas del proyecto, centralizándola en el nuevo archivo `project-config.ts`. Esto elimina la duplicación de código y asegura que todas las utilidades (commit, release, etc.) compartan una única fuente de verdad para la configuración de componentes, tipos de trabajo y modos de construcción.

<technical>
- **Añadido `project-utils/auto-release-ui.ts`**: Nuevo script para la gestión interactiva de releases.
- **Añadido `project-utils/project-config.ts`**: Módulo de configuración centralizado para componentes, tipos de trabajo y constantes del proyecto.
- **Modificado `package.json`**: Se agregaron nuevos scripts `release:ui`, `release:hotfix`, `release:feature`, `release:alpha` y `release:major` para invocar el nuevo sistema.
- **Modificado `project-utils/commit-ui.ts`**: Se corrigió el comando de ejecución para usar `bun` y la ruta correcta del script, estandarizando el uso de herramientas.
</technical>

<changelog>
## [New] 🚀
Se ha implementado un nuevo sistema de release interactivo para agilizar y estandarizar la creación de nuevas versiones del proyecto.
</changelog>
```

---

**DECISIÓN**: Se propone un único commit, ya que todos los cambios están directamente relacionados y forman parte de una única funcionalidad cohesiva: la implementación del nuevo sistema de release y la refactorización de la configuración necesaria para su funcionamiento. Separarlos resultaría en estados intermedios inconsistentes en el repositorio.
