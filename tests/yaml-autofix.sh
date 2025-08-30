#!/bin/bash

# Script de auto-fix para archivos YAML
# Corrige automáticamente problemas comunes de sintaxis y formato

set -e

echo "🔧 Auto-fixing YAML files..."

WORKFLOW_DIR=".github/workflows"
EXIT_CODE=0
FIXED_FILES=0

# Función para auto-fix un archivo YAML
autofix_yaml() {
    local file="$1"
    echo "🔧 Auto-fixing: $file"
    
    local temp_file=$(mktemp)
    local changes_made=false
    
    # 1. Remover trailing spaces
    if sed 's/[[:space:]]*$//' "$file" > "$temp_file"; then
        if ! cmp -s "$file" "$temp_file"; then
            echo "  ✓ Removed trailing spaces"
            changes_made=true
        fi
        cp "$temp_file" "$file"
    fi
    
    # 2. Corregir líneas demasiado largas en comentarios
    if sed -E 's/^([[:space:]]*#.{75}).+$/\1.../' "$file" > "$temp_file"; then
        if ! cmp -s "$file" "$temp_file"; then
            echo "  ✓ Truncated long comment lines"
            changes_made=true
        fi
        cp "$temp_file" "$file"
    fi
    
    # 3. Escapar emojis y caracteres especiales en names
    if sed -E 's/^([[:space:]]*- name: )([^"]*[🔧📄🚀✅❌⚠️🎉📋🔄📥📦🏗️🧪🤖🏷️📤][^"]*)/\1"\2"/' "$file" > "$temp_file"; then
        if ! cmp -s "$file" "$temp_file"; then
            echo "  ✓ Quoted names with special characters"
            changes_made=true
        fi
        cp "$temp_file" "$file"
    fi
    
    # 4. Normalizar boolean values (on -> true/false)
    if sed -E 's/^([[:space:]]*[a-zA-Z_-]+:[[:space:]]*)on([[:space:]]*$)/\1true\2/' "$file" > "$temp_file"; then
        if ! cmp -s "$file" "$temp_file"; then
            echo "  ✓ Normalized boolean values"
            changes_made=true
        fi
        cp "$temp_file" "$file"
    fi
    
    # 5. Corregir indentación básica (2 spaces)
    if sed -E 's/^(  )+/  /' "$file" > "$temp_file"; then
        # Solo aplicar si mejora la indentación
        if yamllint --format parsable "$temp_file" 2>/dev/null | grep -q "wrong indentation"; then
            # Revertir si empeora
            cp "$file" "$temp_file"
        else
            if ! cmp -s "$file" "$temp_file"; then
                echo "  ✓ Fixed basic indentation"
                changes_made=true
            fi
        fi
        cp "$temp_file" "$file"
    fi
    
    # 6. Skip advanced line splitting for now (needs improvement)
    # TODO: Implement smarter line breaking for YAML multiline strings
    
    # Cleanup
    rm -f "$temp_file"
    
    if [ "$changes_made" = true ]; then
        echo "  ✅ Auto-fixes applied to $file"
        FIXED_FILES=$((FIXED_FILES + 1))
    else
        echo "  ℹ️ No fixes needed for $file"
    fi
    
    # Validar después de los fixes
    if command -v yamllint >/dev/null 2>&1; then
        if yamllint "$file" >/dev/null 2>&1; then
            echo "  ✅ YAML syntax valid after fixes"
        else
            echo "  ⚠️ Manual intervention may be needed"
            EXIT_CODE=1
        fi
    fi
    
    echo ""
}

# Verificar que existe el directorio de workflows
if [ ! -d "$WORKFLOW_DIR" ]; then
    echo "❌ Directorio $WORKFLOW_DIR no encontrado"
    exit 1
fi

# Auto-fix todos los archivos YAML en el directorio
echo "🚀 Starting YAML auto-fix..."
echo ""

for file in "$WORKFLOW_DIR"/*.yml "$WORKFLOW_DIR"/*.yaml; do
    if [ -f "$file" ]; then
        autofix_yaml "$file"
    fi
done

# También fix archivos YAML en root si existen
for file in .yamllint .github/dependabot.yml; do
    if [ -f "$file" ]; then
        autofix_yaml "$file"
    fi
done

# Resumen final
echo "============================================================"
echo "🔧 YAML AUTO-FIX SUMMARY"
echo "============================================================"
echo "📄 Files processed: $(find "$WORKFLOW_DIR" -name "*.yml" -o -name "*.yaml" | wc -l | tr -d ' ')"
echo "🔧 Files fixed: $FIXED_FILES"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ ALL FILES AUTO-FIXED SUCCESSFULLY"
    echo "💡 Run 'npm run validate:workflows' to verify fixes"
else
    echo "⚠️ SOME FILES MAY NEED MANUAL INTERVENTION"
    echo "💡 Check yamllint output for remaining issues"
fi

echo "============================================================"

# Mostrar comandos útiles
echo ""
echo "🚀 Next steps:"
echo "  npm run lint:yaml       # Check syntax"
echo "  npm run validate:workflows  # Full validation"
echo "  git diff                # Review changes"

exit $EXIT_CODE