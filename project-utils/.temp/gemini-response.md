### **ANÁLISIS PRINCIPAL**

Se ha realizado una migración del entorno de desarrollo de NPM a Bun, actualizando la documentación principal para reflejar los nuevos comandos y flujos de trabajo. El archivo `DEVELOPMENT.md` ha sido reescrito para usar `bun` como el gestor de paquetes y runtime principal. Adicionalmente, se ha actualizado el `.gitignore` para excluir archivos temporales generados por las utilidades del proyecto.

---

### **Propuesta de Commit #1**

```markdown
docs(dev-env): Migrar entorno de desarrollo a Bun y actualizar guía

Se reemplaza NPM por Bun como el runtime y gestor de paquetes principal del proyecto para mejorar la velocidad y la eficiencia del desarrollo. La guía `DEVELOPMENT.md` ha sido actualizada exhaustivamente para reflejar este cambio, incluyendo nuevos comandos para instalación, construcción modular y ejecución.

Adicionalmente, se ha añadido el directorio `.project-utils/.temp` al `.gitignore` para evitar que los archivos temporales de análisis de la IA sean rastreados por Git.

<technical>
- **Archivo Modificado**: `docs/DEVELOPMENT.md` ha sido reescrito para usar `bun` en lugar de `npm`.
- **Nuevos Scripts**: Se documentan los nuevos scripts de construcción modular (`build:core`, `build:styling`, etc.).
- **Archivo Modificado**: `.gitignore` actualizado para excluir la carpeta `/project-utils/.temp`.
</technical>

<changelog>
## [Internal] ⚙️
Se migra el entorno de desarrollo a Bun para mejorar el rendimiento y la experiencia del desarrollador.
</changelog>
```

---

**DECISIÓN**: Se propone un único commit porque todos los cambios están directamente relacionados con una sola tarea cohesiva: la migración del entorno de desarrollo a Bun y la actualización de su documentación correspondiente.
