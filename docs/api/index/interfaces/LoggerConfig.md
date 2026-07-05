---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / LoggerConfig

# Interface: LoggerConfig

Defined in: [types/core.ts:189](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L189)

Configuración de una instancia de `Logger`. Los campos booleanos activan
o desactivan features visuales (colores, timestamps, stack traces); los
campos selectores controlan tema, banner y formato de salida. Todos los
campos son opcionales salvo `verbosity`, `enableColors` y
`enableTimestamps`, que el constructor del logger rellena desde
`DEFAULT_CONFIG` cuando no se proveen.

## Example

```ts
const config: LoggerConfig = {
  globalPrefix: 'MiApp',
  verbosity: 'info',
  enableColors: true,
  enableTimestamps: true,
  enableStackTrace: false,
  theme: 'cyberpunk',
  bannerType: 'animated',
  bufferSize: 500,
  autoDetectTheme: true
};
```

## Properties

### globalPrefix?

> `optional` **globalPrefix?**: `string`

Defined in: [types/core.ts:190](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L190)

***

### verbosity

> **verbosity**: [`Verbosity`](../type-aliases/Verbosity.md)

Defined in: [types/core.ts:191](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L191)

***

### enableColors

> **enableColors**: `boolean`

Defined in: [types/core.ts:192](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L192)

***

### enableTimestamps

> **enableTimestamps**: `boolean`

Defined in: [types/core.ts:193](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L193)

***

### enableStackTrace

> **enableStackTrace**: `boolean`

Defined in: [types/core.ts:194](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L194)

***

### theme?

> `optional` **theme?**: [`ThemeVariant`](../type-aliases/ThemeVariant.md)

Defined in: [types/core.ts:195](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L195)

***

### bannerType?

> `optional` **bannerType?**: [`BannerType`](../type-aliases/BannerType.md)

Defined in: [types/core.ts:196](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L196)

***

### bufferSize?

> `optional` **bufferSize?**: `number`

Defined in: [types/core.ts:197](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L197)

***

### autoDetectTheme?

> `optional` **autoDetectTheme?**: `boolean`

Defined in: [types/core.ts:198](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L198)

***

### outputFormat?

> `optional` **outputFormat?**: [`OutputFormat`](../type-aliases/OutputFormat.md)

Defined in: [types/core.ts:199](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L199)

***

### outputMode?

> `optional` **outputMode?**: `OutputMode`

Defined in: [types/core.ts:201](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L201)

Modo de output: 'console' (default), 'silent' o 'custom'.

***

### outputWriter?

> `optional` **outputWriter?**: `OutputWriter`

Defined in: [types/core.ts:203](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L203)

Writer custom cuando outputMode es 'custom'.

***

### cliLevel?

> `optional` **cliLevel?**: [`CLILogLevel`](../type-aliases/CLILogLevel.md)

Defined in: [types/core.ts:205](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L205)

Nivel de verbosidad CLI para controlar el output primitivo.

***

### resource?

> `optional` **resource?**: `Partial`\<`ILogResourceRef`\>

Defined in: [types/core.ts:210](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L210)

Recurso OTel por defecto adjuntado a cada record que no lo sobreescriba.
Se setea una vez por proceso (service.name, service.version, deployment.environment).
