### **ANÁLISIS PRINCIPAL**

Se ha realizado una refactorización significativa del generador de commits (`commit-generator.ts`). La lógica principal ha sido actualizada para procesar y distribuir archivos de manera más inteligente cuando se reciben múltiples propuestas de commit desde la IA. Además, se ha mejorado el sistema para filtrar archivos temporales y de proceso, asegurando que solo el código relevante sea incluido en los commits finales. Los cambios en los archivos del directorio `.temp` reflejan la ejecución y prueba de este nuevo sistema.

---

### **Propuesta de Commit #1**

```markdown
refactor(commit-generator): mejorar el parseo y la distribución de archivos en commits

Se refactoriza el script `commit-generator.ts` para gestionar de forma más inteligente las propuestas de commit múltiples. La nueva implementación permite distribuir los archivos modificados entre varios commits propuestos, en lugar de asignar todos los archivos a cada uno.

Este cambio introduce una lógica de asignación basada en patrones y contexto, y mejora el filtrado para excluir archivos temporales o de metadatos (como los de `.temp/` o notas de release) de las propuestas de commit.

<technical>
- **Archivo Modificado**: `project-utils/commit-generator.ts`.
- **Función `parseCommitProposals`**: Actualizada para aceptar la lista completa de archivos y delegar la distribución si hay múltiples commits.
- **Nueva Función `distributeFilesAcrossCommits`**: Implementada para asignar archivos a commits específicos de manera inteligente.
- **Filtrado de Archivos**: Añadida lógica para excluir rutas que contengan `.temp/`, `.release-notes-` o `->` de los commits generados.
- **Centralización**: Se utiliza `GeminiResponseParser` para el parseo estandarizado de la respuesta de la IA.
</technical>

<changelog>
## [Tooling] 🛠️
- Mejorado el sistema de generación automática de commits para soportar propuestas múltiples y una distribución de archivos más precisa.
</changelog>
```

---

**DECISIÓN**: Se propone un único commit, ya que todos los cambios están directamente relacionados con la refactorización y mejora de una única funcionalidad: el sistema de generación de commits.
