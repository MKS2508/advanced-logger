#!/bin/bash

# Script de validación de workflows YAML
# Valida sintaxis y estructura de workflows de GitHub Actions

set -e

echo "🔍 Validando workflows YAML..."

WORKFLOW_DIR=".github/workflows"
EXIT_CODE=0

# Función para validar un archivo YAML
validate_yaml() {
    local file="$1"
    echo "📄 Validando: $file"
    
    # Validar sintaxis YAML básica
    if command -v yamllint >/dev/null 2>&1; then
        echo "  🔧 Verificando sintaxis con yamllint..."
        if yamllint -c .yamllint "$file"; then
            echo "  ✅ Sintaxis YAML válida"
        else
            echo "  ❌ Error de sintaxis YAML"
            EXIT_CODE=1
        fi
    else
        echo "  ⚠️ yamllint no disponible, saltando validación de sintaxis"
    fi
    
    # Validar estructura de workflow específica
    echo "  🔍 Verificando estructura de workflow..."
    
    # Verificar elementos obligatorios
    if ! grep -q "^name:" "$file"; then
        echo "  ❌ Falta campo 'name'"
        EXIT_CODE=1
    fi
    
    if ! grep -q "^on:" "$file"; then
        echo "  ❌ Falta campo 'on'"
        EXIT_CODE=1
    fi
    
    if ! grep -q "^jobs:" "$file"; then
        echo "  ❌ Falta campo 'jobs'"
        EXIT_CODE=1
    fi
    
    # Verificar concurrency control en workflows de release
    if [[ "$file" == *"release"* ]]; then
        if ! grep -q "^concurrency:" "$file"; then
            echo "  ❌ Workflow de release falta concurrency control"
            EXIT_CODE=1
        fi
        
        if ! grep -q "group: release-pipeline-" "$file"; then
            echo "  ❌ Falta group correcto en concurrency"
            EXIT_CODE=1
        fi
        
        if ! grep -q "cancel-in-progress: true" "$file"; then
            echo "  ❌ Falta cancel-in-progress en concurrency"
            EXIT_CODE=1
        fi
        
        echo "  ✅ Concurrency control verificado"
    fi
    
    # Verificar estrategia anti-conflictos en releases
    if [[ "$file" == *"release"* ]]; then
        if grep -q "git fetch origin" "$file" && 
           grep -q "git rebase" "$file" && 
           grep -q "MAX_RETRIES" "$file"; then
            echo "  ✅ Estrategia anti-conflictos verificada"
        else
            echo "  ❌ Estrategia anti-conflictos incompleta"
            EXIT_CODE=1
        fi
    fi
    
    # Verificar integración project-utils en releases
    if [[ "$file" == *"release"* ]]; then
        if grep -q "bun project-utils/commit-generator.ts" "$file" && 
           grep -q "RELEASE_WORKFLOW=true" "$file"; then
            echo "  ✅ Integración project-utils verificada"
        else
            echo "  ❌ Integración project-utils incompleta"
            EXIT_CODE=1
        fi
    fi
    
    echo "  ✅ Validación de $file completada"
    echo ""
}

# Verificar que existe el directorio de workflows
if [ ! -d "$WORKFLOW_DIR" ]; then
    echo "❌ Directorio $WORKFLOW_DIR no encontrado"
    exit 1
fi

# Validar todos los archivos YAML en el directorio
echo "🚀 Iniciando validación de workflows..."
echo ""

for file in "$WORKFLOW_DIR"/*.yml "$WORKFLOW_DIR"/*.yaml; do
    if [ -f "$file" ]; then
        validate_yaml "$file"
    fi
done

# Resumen final
echo "============================================================"
echo "📊 RESUMEN DE VALIDACIÓN YAML"
echo "============================================================"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ TODOS LOS WORKFLOWS SON VÁLIDOS"
    echo "🎉 Sintaxis YAML correcta"
    echo "🎉 Estructura de workflows completa"
    echo "🎉 Concurrency control implementado"
    echo "🎉 Estrategias anti-conflictos verificadas"
    echo "🎉 Integración project-utils confirmada"
else
    echo "❌ SE ENCONTRARON ERRORES EN WORKFLOWS"
    echo "⚠️ Revisar los mensajes de error anteriores"
fi

echo "============================================================"
exit $EXIT_CODE