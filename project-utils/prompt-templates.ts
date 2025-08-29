/**
 * Plantillas de prompts estandarizadas para Gemini CLI
 * @description Asegura respuestas consistentes y parseables en todos los scripts
 * @author TPV EL Haido
 */

export interface GeminiPromptConfig {
  /** Contexto base del proyecto */
  projectContext: {
    name: string;
    description: string;
    version: string;
    techStack: string[];
    targetPlatform: string;
  };
  /** Tipo de análisis requerido */
  analysisType: 'commit' | 'workflow' | 'release';
  /** Contexto adicional específico */
  specificContext?: string;
  /** Datos estructurados para el análisis */
  data?: any;
}

export interface StandardResponseFormat {
  /** Análisis o resumen principal */
  analysis: string;
  /** Recomendaciones o acciones */
  recommendations: string;
  /** Datos estructurados (commits, comandos, etc.) */
  structured_data: any[];
}

/**
 * Configuración base del proyecto Better Logger
 */
export const BETTER_LOGGER_PROJECT_CONFIG = {
  name: 'Better Logger',
  description: 'State-of-the-art console logger with advanced CSS styling, SVG support, animations, and CLI interface',
  version: '0.0.3-alpha.0',
  techStack: ['TypeScript', 'Vite', 'Browser', 'CSS-in-JS', 'SVG'] as const,
  targetPlatform: 'Browser (Chrome, Firefox, Safari, Edge)',
} as const;

// Alias para compatibilidad
export const TPV_PROJECT_CONFIG = BETTER_LOGGER_PROJECT_CONFIG;

/**
 * Prefijo estándar para todos los prompts de Gemini
 */
const STANDARD_PROMPT_PREFIX = `# Sistema de Análisis Inteligente - Better Logger

Eres un asistente especializado en análisis de código y automatización para el proyecto Better Logger. Tu función es proporcionar respuestas estructuradas, precisas y consistentes que puedan ser parseadas automáticamente.

## REGLAS CRÍTICAS DE FORMATO

1. **FORMATO DE RESPUESTA OBLIGATORIO**: Todas tus respuestas deben seguir exactamente el formato especificado más abajo.
2. **CONSISTENCIA**: Mantén la misma estructura sin importar la complejidad del análisis.
3. **PARSEABLE**: El formato debe ser fácil de procesar automáticamente con expresiones regulares.
4. **BLOQUES MARKDOWN**: Usa \`\`\`markdown para bloques de código cuando se especifique.
5. **SECCIONES TÉCNICAS**: Siempre incluye las secciones <technical> y <changelog> cuando sea aplicable.

## Contexto del Proyecto
**Nombre**: ${BETTER_LOGGER_PROJECT_CONFIG.name}
**Descripción**: ${BETTER_LOGGER_PROJECT_CONFIG.description}
**Versión Actual**: ${BETTER_LOGGER_PROJECT_CONFIG.version}
**Stack Tecnológico**: ${BETTER_LOGGER_PROJECT_CONFIG.techStack.join(', ')}
**Plataforma Objetivo**: ${BETTER_LOGGER_PROJECT_CONFIG.targetPlatform}

---
`;

/**
 * Sufijo estándar con instrucciones de formato
 */
const STANDARD_PROMPT_SUFFIX = `

---

## INSTRUCCIONES FINALES

1. **Lee cuidadosamente** toda la información proporcionada
2. **Analiza el contexto** y los datos específicos
3. **Genera una respuesta** siguiendo EXACTAMENTE el formato especificado
4. **Mantén consistencia** en la estructura y sintaxis
5. **No desvíes** del formato requerido bajo ninguna circunstancia

**IMPORTANTE**: La respuesta debe ser parseada automáticamente. Cualquier desviación del formato especificado causará errores en el sistema.`;

/**
 * Genera prompt para análisis de commits
 */
export function createCommitPrompt(config: GeminiPromptConfig): string {
  const { data, specificContext } = config;
  
  return `${STANDARD_PROMPT_PREFIX}

# ANÁLISIS DE COMMITS

## Datos del Análisis
${JSON.stringify(data, null, 2)}

## Contexto Adicional
${specificContext || 'Ninguno proporcionado'}

---

## FORMATO DE RESPUESTA REQUERIDO

Tu respuesta debe seguir EXACTAMENTE esta estructura:

### **ANÁLISIS PRINCIPAL**

[Descripción general de los cambios detectados]

---

### **Propuesta de Commit #1**

\`\`\`markdown
[prefijo](área - descripción breve)

[Descripción completa en castellano de QUÉ se logró y POR QUÉ]

<technical>
[Detalles técnicos específicos: archivos modificados, funciones añadidas, refactorizaciones, etc.]
</technical>

<changelog>
## [Tipo] [Emoji]
[Entrada para changelog de la app, optimizada para mostrar al usuario]
</changelog>
\`\`\`

### **Propuesta de Commit #2** (solo si es necesario)

[Repetir formato anterior]

---

**DECISIÓN**: [Explicación breve de por qué uno o múltiples commits]

${STANDARD_PROMPT_SUFFIX}`;
}

/**
 * Genera prompt para asistente de workflow
 */
export function createWorkflowPrompt(config: GeminiPromptConfig): string {
  const { data, specificContext } = config;
  
  return `${STANDARD_PROMPT_PREFIX}

# ASISTENTE DE WORKFLOW

## Solicitud del Usuario
"${specificContext}"

## Contexto del Proyecto Actual
${JSON.stringify(data, null, 2)}

---

## FORMATO DE RESPUESTA REQUERIDO

\`\`\`markdown
🎯 **ANÁLISIS**: [Descripción del tipo de trabajo detectado]
📊 **IMPACTO**: [Áreas afectadas y alcance del cambio]
🚀 **RECOMENDACIÓN**: [Tipo de versión y estrategia recomendada]

## 🖥️ COMANDOS PARA macOS
\`\`\`bash
# [Descripción del primer comando]
[comando exacto con parámetros]

# [Descripción del segundo comando]  
[segundo comando exacto]
\`\`\`

## 🐧 COMANDOS PARA LINUX ARM (después de macOS)
\`\`\`bash
# SSH y preparación
ssh user@raspberry-pi
git pull origin master && bun install

# [Descripción del build ARM]
[comandos específicos de ARM]
\`\`\`

## ✅ VERIFICACIONES AUTOMÁTICAS
- [Lista de verificaciones que se ejecutarán]
\`\`\`

${STANDARD_PROMPT_SUFFIX}`;
}

/**
 * Genera prompt para releases automáticas
 */
export function createReleasePrompt(config: GeminiPromptConfig): string {
  const { data, specificContext } = config;
  
  return `${STANDARD_PROMPT_PREFIX}

# ANÁLISIS DE RELEASE

## Información de la Release
${JSON.stringify(data, null, 2)}

## Contexto Específico
${specificContext || 'Release automática'}

---

## FORMATO DE RESPUESTA REQUERIDO

\`\`\`markdown
# 📦 ANÁLISIS DE RELEASE

## 🎯 RESUMEN
[Descripción de los cambios principales incluidos en esta release]

## 📋 CHANGELOG GENERADO

### ✨ Features
[Lista de nuevas funcionalidades]

### 🐛 Fixes
[Lista de correcciones de bugs]

### 🚀 Improvements
[Lista de mejoras]

### 🔧 Technical
[Cambios técnicos internos]

## 🏷️ INFORMACIÓN DE VERSIÓN
- **Versión**: [versión calculada]
- **Prefijo**: [alpha/beta/rc/stable]
- **Canal OTA**: [dev/beta/stable]
- **Tipo de cambio**: [major/minor/patch]

## 📝 NOTAS DE RELEASE
[Texto descriptivo para usuarios finales]
\`\`\`

${STANDARD_PROMPT_SUFFIX}`;
}

/**
 * Parser genérico para respuestas de Gemini
 */
export class GeminiResponseParser {
  /**
   * Extrae múltiples propuestas de commit del formato estándar
   */
  static parseCommitProposals(response: string): Array<{
    title: string;
    description: string;
    technical: string;
    changelog: string;
  }> {
    const proposals: Array<{
      title: string;
      description: string; 
      technical: string;
      changelog: string;
    }> = [];

    // Buscar todas las propuestas con el formato: ### **Propuesta de Commit #N**
    const proposalPattern = /###\s*\*\*Propuesta de Commit #\d+\*\*/g;
    const proposalMatches = Array.from(response.matchAll(proposalPattern));
    
    if (proposalMatches.length === 0) {
      // Formato de un solo commit sin numeración
      const codeBlock = this.extractCodeBlock(response);
      if (codeBlock) {
        const parsed = this.parseCommitContent(codeBlock);
        if (parsed) proposals.push(parsed);
      }
    } else {
      // Múltiples propuestas numeradas
      for (let i = 0; i < proposalMatches.length; i++) {
        const startIndex = proposalMatches[i].index!;
        const endIndex = proposalMatches[i + 1]?.index || response.length;
        const proposalSection = response.substring(startIndex, endIndex);
        
        const codeBlock = this.extractCodeBlock(proposalSection);
        if (codeBlock) {
          const parsed = this.parseCommitContent(codeBlock);
          if (parsed) proposals.push(parsed);
        }
      }
    }

    return proposals;
  }

  /**
   * Extrae bloque de código markdown
   */
  private static extractCodeBlock(text: string): string | null {
    const patterns = [
      /```markdown\s*\n([\s\S]*?)\n```/,  // ```markdown
      /```\s*\n([\s\S]*?)\n```/,        // ``` genérico  
      /```([\s\S]*?)```/                 // sin saltos
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[1].trim();
    }
    
    return null;
  }

  /**
   * Parsea el contenido de un commit individual
   */
  private static parseCommitContent(content: string): {
    title: string;
    description: string;
    technical: string;
    changelog: string;
  } | null {
    const lines = content.split('\n');
    
    // Título (primera línea no vacía)
    let title = '';
    let titleIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim()) {
        title = lines[i].trim();
        titleIndex = i;
        break;
      }
    }

    if (!title) return null;

    // Extraer secciones
    let description = '';
    let technical = '';
    let changelog = '';
    let currentSection = 'description';

    for (let i = titleIndex + 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('<technical>')) {
        currentSection = 'technical';
        continue;
      } else if (line.includes('</technical>')) {
        currentSection = 'none';
        continue;
      } else if (line.includes('<changelog>')) {
        currentSection = 'changelog';
        continue;
      } else if (line.includes('</changelog>')) {
        currentSection = 'none';
        continue;
      }

      if (currentSection === 'description' && line.trim()) {
        description += line + '\n';
      } else if (currentSection === 'technical') {
        technical += line + '\n';
      } else if (currentSection === 'changelog') {
        changelog += line + '\n';
      }
    }

    return {
      title,
      description: description.trim(),
      technical: technical.trim(),
      changelog: changelog.trim()
    };
  }

  /**
   * Parsea respuesta de workflow en formato estándar
   */
  static parseWorkflowResponse(response: string): {
    analysis: string;
    impact: string;
    recommendation: string;
    macosCommands: string[];
    linuxCommands: string[];
    verifications: string[];
  } {
    const analysisMatch = response.match(/🎯\s*\*\*ANÁLISIS\*\*:\s*(.+)/);
    const impactMatch = response.match(/📊\s*\*\*IMPACTO\*\*:\s*(.+)/);
    const recommendationMatch = response.match(/🚀\s*\*\*RECOMENDACIÓN\*\*:\s*(.+)/);

    // Extraer comandos macOS
    const macosSection = response.match(/##\s*🖥️\s*COMANDOS PARA macOS\s*```bash\s*([\s\S]*?)\s*```/);
    const macosCommands = macosSection ? macosSection[1].split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    ) : [];

    // Extraer comandos Linux ARM
    const linuxSection = response.match(/##\s*🐧\s*COMANDOS PARA LINUX ARM[\s\S]*?```bash\s*([\s\S]*?)\s*```/);
    const linuxCommands = linuxSection ? linuxSection[1].split('\n').filter(line => 
      line.trim() && !line.startsWith('#')
    ) : [];

    // Extraer verificaciones
    const verificationsSection = response.match(/##\s*✅\s*VERIFICACIONES AUTOMÁTICAS\s*([\s\S]*?)```/);
    const verifications = verificationsSection ? verificationsSection[1].split('\n').filter(line =>
      line.trim().startsWith('-')
    ).map(line => line.replace(/^-\s*/, '')) : [];

    return {
      analysis: analysisMatch?.[1] || 'No disponible',
      impact: impactMatch?.[1] || 'No disponible', 
      recommendation: recommendationMatch?.[1] || 'No disponible',
      macosCommands,
      linuxCommands,
      verifications
    };
  }
}