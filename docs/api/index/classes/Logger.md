---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / Logger

# Class: Logger

Defined in: [Logger.ts:116](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L116)

Clase principal Logger con capacidades avanzadas de logging

 Logger

## Description

Sistema completo de logging con temas, badges, contextos y exportación.
             Detecta automáticamente el tema claro/oscuro del navegador.

## Examples

```ts
// Uso básico sin configuración
import logger from '@mks2508/better-logger';
logger.info('Aplicación iniciada');
logger.success('Conexión establecida');
```

```ts
// Aplicar un preset temático
logger.preset('cyberpunk');
logger.warn('Advertencia con estilo neón');
```

```ts
// Logger con scope para componentes
const auth = logger.component('Autenticación');
auth.info('Usuario intentando login');
auth.success('Login exitoso');
```

## Constructors

### Constructor

> **new Logger**(`config?`): `Logger`

Defined in: [Logger.ts:189](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L189)

Crea una nueva instancia del Logger

#### Parameters

##### config?

`Partial`\<[`LoggerConfig`](../interfaces/LoggerConfig.md)\> = `{}`

Configuración opcional del logger

#### Returns

`Logger`

#### Example

```ts
// Logger con configuración personalizada
const logger = new Logger({
  theme: 'neon',
  globalPrefix: 'MiApp',
  verbosity: 'debug',
  bufferSize: 1000
});
```

## Accessors

### cliLevel

#### Get Signature

> **get** **cliLevel**(): [`CLILogLevel`](../type-aliases/CLILogLevel.md)

Defined in: [Logger.ts:2000](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L2000)

Devuelve el nivel de log del CLI actual

##### Returns

[`CLILogLevel`](../type-aliases/CLILogLevel.md)

Nivel de log del CLI actual

## Methods

### getConfig()

> **getConfig**(): [`LoggerConfig`](../interfaces/LoggerConfig.md)

Defined in: [Logger.ts:269](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L269)

Obtiene la configuración actual del logger

#### Returns

[`LoggerConfig`](../interfaces/LoggerConfig.md)

Configuración completa actual

#### Example

```ts
const config = logger.getConfig();
console.log('Verbosidad actual:', config.verbosity);
console.log('Tema actual:', config.theme);
```

***

### updateConfig()

> **updateConfig**(`updates`): `void`

Defined in: [Logger.ts:286](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L286)

Actualiza la configuración del logger

#### Parameters

##### updates

`Partial`\<[`LoggerConfig`](../interfaces/LoggerConfig.md)\>

Propiedades a actualizar

#### Returns

`void`

#### Example

```ts
logger.updateConfig({
  verbosity: 'debug',
  enableTimestamps: false,
  theme: 'cyberpunk'
});
```

***

### setGlobalPrefix()

> **setGlobalPrefix**(`prefix`): `void`

Defined in: [Logger.ts:311](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L311)

Establece el prefijo global para todos los mensajes de log

#### Parameters

##### prefix

`string`

Prefijo a usar

#### Returns

`void`

#### Example

```ts
logger.setGlobalPrefix('MiApp');
logger.info('Iniciado'); // [MiApp] Iniciado
```

***

### setVerbosity()

> **setVerbosity**(`level`): `void`

Defined in: [Logger.ts:326](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L326)

Establece el nivel de verbosidad para filtrar la salida de logs

#### Parameters

##### level

[`Verbosity`](../type-aliases/Verbosity.md)

Nivel mínimo a mostrar ('debug' | 'info' | 'warn' | 'error' | 'critical' | 'silent')

#### Returns

`void`

#### Example

```ts
logger.setVerbosity('warn');  // Solo muestra warn, error y critical
logger.setVerbosity('debug'); // Muestra todos los niveles
logger.setVerbosity('silent'); // No muestra nada
```

***

### setTheme()

> **setTheme**(`theme`): `void`

Defined in: [Logger.ts:341](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L341)

Establece el tema del logger

#### Parameters

##### theme

[`ThemeVariant`](../type-aliases/ThemeVariant.md)

Tema a aplicar ('default' | 'dark' | 'light' | 'neon' | 'minimal' | 'cyberpunk')

#### Returns

`void`

#### Example

```ts
logger.setTheme('neon');      // Tema con colores neón
logger.setTheme('minimal');   // Tema minimalista
logger.setTheme('cyberpunk'); // Tema cyberpunk con efectos
```

***

### setBannerType()

> **setBannerType**(`bannerType`): `void`

Defined in: [Logger.ts:381](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L381)

Establece el tipo de banner para mostrar en la inicialización

#### Parameters

##### bannerType

[`BannerType`](../type-aliases/BannerType.md)

Tipo de banner ('simple' | 'ascii' | 'unicode' | 'svg' | 'animated')

#### Returns

`void`

#### Example

```ts
logger.setBannerType('ascii');    // Banner con arte ASCII
logger.setBannerType('unicode');  // Banner con caracteres Unicode
logger.setBannerType('animated'); // Banner con animación
```

***

### withContext()

> **withContext**\<`R`\>(`bindings`, `fn?`): `R` \| `undefined`

Defined in: [Logger.ts:412](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L412)

Ejecuta `fn` dentro de un scope AsyncLocalStorage donde `bindings` se
merguean al contexto para todas las llamadas de log dentro de `fn`.

Sin `fn` (el shape legacy de setter): no-op por backwards compatibility.
Preferir `child()` para bindings persistentes o `withContextAsync()`
para callbacks async.

#### Type Parameters

##### R

`R`

#### Parameters

##### bindings

`Record`\<`string`, `unknown`\>

Pares key-value a adjuntar durante la ejecución de `fn`

##### fn?

() => `R`

Función sincrónica opcional a ejecutar con los bindings en scope

#### Returns

`R` \| `undefined`

El valor de retorno de `fn`, o `undefined` si no se pasa `fn`

#### Examples

```ts
// Callback sincrónico scoped
logger.withContext({ requestId: 'r-42' }, () => {
  doWork(); // los logs de aquí ven requestId en attributes
});
```

```ts
// Binding persistente: usar child()
const reqLog = logger.child({ requestId: 'r-42' });
reqLog.info('handling request'); // attributes incluye requestId
```

#### See

 - [child](#child) para una copia inmutable con el contexto mergueado
 - [withContextAsync](#withcontextasync) para la variante con callback async

***

### withContextAsync()

> **withContextAsync**\<`R`\>(`bindings`, `fn`): `Promise`\<`R`\>

Defined in: [Logger.ts:433](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L433)

Variante async de `withContext`. Ejecuta `fn` dentro de un scope
AsyncLocalStorage para que los bindings estén disponibles a todas las
llamadas de log async dentro de `fn`.

#### Type Parameters

##### R

`R`

#### Parameters

##### bindings

`Record`\<`string`, `unknown`\>

Pares key-value a adjuntar durante la ejecución de `fn`

##### fn

() => `Promise`\<`R`\>

Función async a ejecutar con los bindings en scope

#### Returns

`Promise`\<`R`\>

El valor de retorno de `fn`

#### Example

```ts
await logger.withContextAsync({ requestId: 'r-42' }, async () => {
  await fetchData(); // los logs de aquí ven requestId en attributes
});
```

#### See

 - [child](#child) para un child logger persistente
 - [withContext](#withcontext) para la variante con callback sincrónico

***

### child()

> **child**(`extra`): `Logger`

Defined in: [Logger.ts:451](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L451)

Devuelve una copia inmutable de este logger con el contexto extra bound.
Las llamadas futuras sobre el child emiten con el contexto mergueado,
sin mutar al parent — el patrón canónico de MDC.

#### Parameters

##### extra

`Record`\<`string`, `unknown`\>

Pares key-value a adjuntar (requestId, userId, ...)

#### Returns

`Logger`

Un nuevo Logger con el contexto mergueado

#### Example

```ts
const reqLog = logger.child({ requestId: req.id });
reqLog.info('start');     // emite attributes: { requestId }
logger.info('unrelated'); // NO afectado — el contexto del parent queda intacto
```

***

### clearContext()

> **clearContext**(): `this`

Defined in: [Logger.ts:473](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L473)

Descarta todas las keys del contexto bound. Tras esta llamada, los
records emitidos dejan de llevar `attributes` hasta que
[withContext](#withcontext) o [child](#child) restablezcan uno.

#### Returns

`this`

La misma instancia del logger, ahora sin contexto

***

### getContext()

> **getContext**(): `Readonly`\<`Record`\<`string`, `unknown`\>\>

Defined in: [Logger.ts:484](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L484)

Snapshot del contexto bound. El objeto devuelto es una shallow copy:
mutarlo NO afecta lo que emiten las llamadas de log posteriores.

#### Returns

`Readonly`\<`Record`\<`string`, `unknown`\>\>

Un snapshot read-only del contexto actual

***

### setResource()

> **setResource**(`resource`): `this`

Defined in: [Logger.ts:507](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L507)

Actualiza el resource OTel por defecto (service.name, version, env).
Se persiste en el campo `resource` de cada record emitido, salvo que
el propio record lo override.

#### Parameters

##### resource

`Partial`\<`ILogResourceRef`\>

Resource OTel parcial a merguear con el actual

#### Returns

`this`

La misma instancia del logger, para chaining

#### Example

```ts
logger.setResource({ 'service.name': 'api', 'service.version': '1.2.3' });
```

***

### resetConfig()

> **resetConfig**(): `void`

Defined in: [Logger.ts:521](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L521)

Reinicia el logger a la configuración por defecto

#### Returns

`void`

#### Example

```ts
logger.resetConfig();
// Todo vuelve a la configuración inicial
```

***

### cleanup()

> **cleanup**(): `Promise`\<`void`\>

Defined in: [Logger.ts:551](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L551)

Método de limpieza para eliminar listeners y liberar recursos.

Vacía los transports (drain), limpia timers, suelta la lista de
handlers legacy, resetea el group depth y limpia el context.
Seguro de invocar múltiples veces.

#### Returns

`Promise`\<`void`\>

#### Example

```ts
// Antes de cerrar la aplicación
await logger.cleanup();
```

***

### preset()

> **preset**(`name`): `void`

Defined in: [Logger.ts:591](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L591)

Aplica un preset inteligente - funciona perfectamente sin configuración

#### Parameters

##### name

`string`

Nombre del preset a aplicar

#### Returns

`void`

#### Example

```ts
// Presets disponibles
logger.preset('default');       // Limpio y adaptativo
logger.preset('cyberpunk');     // Colores neón, efectos brillantes
logger.preset('glassmorphism'); // Efectos de blur modernos
logger.preset('minimal');       // Minimalista y elegante
logger.preset('debug');         // Modo desarrollo detallado
logger.preset('production');    // Enfocado en producción
```

***

### presets()

> **presets**(): `string`[]

Defined in: [Logger.ts:624](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L624)

Lista todos los presets disponibles

#### Returns

`string`[]

Array con nombres de presets disponibles

#### Example

```ts
const disponibles = logger.presets();
console.log(disponibles); // ['default', 'cyberpunk', 'glassmorphism', ...]
```

***

### hideTimestamp()

> **hideTimestamp**(): `this`

Defined in: [Logger.ts:638](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L638)

Oculta el timestamp en los logs

#### Returns

`this`

#### Example

```ts
logger.hideTimestamp();
logger.info('Sin marca de tiempo'); // Sin timestamp visible
```

***

### showTimestamp()

> **showTimestamp**(): `this`

Defined in: [Logger.ts:651](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L651)

Muestra el timestamp en los logs

#### Returns

`this`

#### Example

```ts
logger.showTimestamp();
logger.info('Con marca de tiempo'); // [2024-01-15 10:30:45] Con marca de tiempo
```

***

### hideLocation()

> **hideLocation**(): `this`

Defined in: [Logger.ts:664](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L664)

Oculta la información de ubicación (archivo:línea) en los logs

#### Returns

`this`

#### Example

```ts
logger.hideLocation();
logger.debug('Sin ubicación'); // Sin mostrar archivo:línea
```

***

### showLocation()

> **showLocation**(): `this`

Defined in: [Logger.ts:677](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L677)

Muestra la información de ubicación (archivo:línea) en los logs

#### Returns

`this`

#### Example

```ts
logger.showLocation();
logger.debug('Con ubicación'); // app.js:42 Con ubicación
```

***

### hideBadges()

> **hideBadges**(): `this`

Defined in: [Logger.ts:691](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L691)

Oculta los badges en los logs

#### Returns

`this`

#### Example

```ts
logger.hideBadges();
const api = logger.api('REST');
api.info('Sin badges'); // Sin mostrar [API] [REST]
```

***

### showBadges()

> **showBadges**(): `this`

Defined in: [Logger.ts:705](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L705)

Muestra los badges en los logs

#### Returns

`this`

#### Example

```ts
logger.showBadges();
const api = logger.api('GraphQL');
api.info('Con badges'); // [API] [GraphQL] Con badges
```

***

### badges()

> **badges**(`badges`): `this`

Defined in: [Logger.ts:721](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L721)

Establece múltiples badges para los logs

#### Parameters

##### badges

`string`[]

Array de badges a mostrar

#### Returns

`this`

Logger instance para encadenamiento

#### Example

```ts
logger.badges(['v3', 'stable']).info('Release publicado');
logger.badges(['API', 'v2']).warn('Endpoint deprecado');
```

***

### badge()

> **badge**(`badge`): `this`

Defined in: [Logger.ts:736](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L736)

Añade un badge individual a la lista

#### Parameters

##### badge

`string`

Badge a añadir

#### Returns

`this`

Logger instance para encadenamiento

#### Example

```ts
logger.badge('DEBUG').badge('AUTH').info('Token validado');
```

***

### clearBadges()

> **clearBadges**(): `this`

Defined in: [Logger.ts:752](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L752)

Limpia todos los badges activos

#### Returns

`this`

Logger instance para encadenamiento

#### Example

```ts
logger.clearBadges().info('Sin badges');
```

***

### component()

> **component**(`name`): [`ComponentLogger`](ComponentLogger.md)

Defined in: [Logger.ts:778](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L778)

Crea un logger scoped para un componente o módulo del dominio.

El `ComponentLogger` resultante prepends un badge `[name]` a cada
mensaje y comparte configuración, transports y hooks con el logger
padre. Útil para trazar el origen de los logs en apps con muchos
módulos (Auth, DB, Cache, ...).

#### Parameters

##### name

`string`

Nombre del componente que aparecerá como badge

#### Returns

[`ComponentLogger`](ComponentLogger.md)

Logger scoped para el componente

#### Example

```ts
const auth = logger.component('Auth');
auth.info('Validando token');   // [Auth] Validando token
auth.success('Token válido');
```

#### See

 - [api](../functions/api.md) para loggers de endpoints REST/GraphQL
 - [scope](../functions/scope.md) para un scope genérico sin badge de componente

***

### api()

> **api**(`name`): [`APILogger`](APILogger.md)

Defined in: [Logger.ts:798](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L798)

Crea un logger scoped para un endpoint o surface de API.

Como `component()` pero con styling orientado a APIs (badge `[API]`
por defecto más el nombre del sub-scope). Útil para distinguir
tráfico REST vs GraphQL vs WebSocket en los logs.

#### Parameters

##### name

`string`

Nombre de la API o surface (p.ej. `'REST'`, `'GraphQL'`)

#### Returns

[`APILogger`](APILogger.md)

Logger scoped para la API

#### Example

```ts
const rest = logger.api('REST');
rest.info('GET /users/42');     // [API] [REST] GET /users/42
```

#### See

[component](../functions/component.md) para loggers de componentes de dominio

***

### scope()

> **scope**(`name`): [`ScopedLogger`](ScopedLogger.md)

Defined in: [Logger.ts:818](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L818)

Crea un logger scoped genérico con un prefijo.

Variante minimal de `component()` / `api()`: solo aplica un prefijo
de scope sin badges ni styling especial. Útil para sub-módulos que
no encajan en las categorías de `component`/`api`.

#### Parameters

##### name

`string`

Texto del prefijo de scope

#### Returns

[`ScopedLogger`](ScopedLogger.md)

Logger con el scope aplicado

#### Example

```ts
const db = logger.scope('db');
db.info('Pool conectado');      // [db] Pool conectado
```

#### See

[component](../functions/component.md) y [api](../functions/api.md) para variantes con badges

***

### customize()

> **customize**(`overrides`): `void`

Defined in: [Logger.ts:843](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L843)

Personalización simple con configuración mínima

#### Parameters

##### overrides

Opciones de personalización

###### message?

\{ `color?`: `string`; `font?`: `string`; `size?`: `string`; \}

Configuración del mensaje

###### message.color?

`string`

###### message.font?

`string`

###### message.size?

`string`

###### timestamp?

\{ `show?`: `boolean`; `color?`: `string`; \}

Configuración del timestamp

###### timestamp.show?

`boolean`

###### timestamp.color?

`string`

###### location?

\{ `show?`: `boolean`; `color?`: `string`; \}

Configuración de ubicación

###### location.show?

`boolean`

###### location.color?

`string`

###### level?

\{ `uppercase?`: `boolean`; `style?`: `string`; \}

Configuración del nivel

###### level.uppercase?

`boolean`

###### level.style?

`string`

###### prefix?

\{ `show?`: `boolean`; `style?`: `string`; \}

Configuración del prefijo

###### prefix.show?

`boolean`

###### prefix.style?

`string`

###### spacing?

`"normal"` \| `"compact"` \| `"spacious"`

Espaciado: 'compact' | 'normal' | 'spacious'

#### Returns

`void`

#### Example

```ts
logger.customize({
  message: { color: '#00ff00', size: '16px' },
  timestamp: { show: false },
  spacing: 'compact'
});
```

***

### addHandler()

> **addHandler**(`handler`): `void`

Defined in: [Logger.ts:887](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L887)

Añade un handler personalizado para extender funcionalidad

#### Parameters

##### handler

[`ILogHandler`](../interfaces/ILogHandler.md)

Handler que implementa ILogHandler

#### Returns

`void`

#### Examples

```ts
// Handler personalizado para enviar logs a servidor
logger.addHandler({
  handle(level, message, args, metadata) {
    fetch('/logs', { method: 'POST', body: JSON.stringify({ level, message }) });
  }
});
```

```ts
// Para escribir a archivo, usa `addTransport` con un `FileTransport`
logger.addTransport({ target: new FileTransport({ destination: 'app.log' }) });
```

***

### getHandlers()

> **getHandlers**(): [`ILogHandler`](../interfaces/ILogHandler.md)[]

Defined in: [Logger.ts:896](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L896)

Obtiene todos los handlers registrados

#### Returns

[`ILogHandler`](../interfaces/ILogHandler.md)[]

Array de handlers activos

***

### addSerializer()

> **addSerializer**\<`T`\>(`type`, `serializer`, `priority?`): `void`

Defined in: [Logger.ts:917](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L917)

Añade un serializador personalizado para un tipo específico

#### Type Parameters

##### T

`T`

#### Parameters

##### type

(...`args`) => `T`

Constructor del tipo a serializar

##### serializer

[`SerializerFn`](../type-aliases/SerializerFn.md)\<`T`\>

Función de serialización

##### priority?

`number`

Prioridad (mayor = primero)

#### Returns

`void`

#### Example

```ts
logger.addSerializer(Error, (err) => ({
  name: err.name,
  message: err.message,
  stack: err.stack?.split('\n').slice(0, 5)
}));
```

***

### removeSerializer()

> **removeSerializer**\<`T`\>(`type`): `boolean`

Defined in: [Logger.ts:932](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L932)

Elimina un serializador registrado

#### Type Parameters

##### T

`T`

#### Parameters

##### type

(...`args`) => `T`

Constructor del tipo a remover

#### Returns

`boolean`

true si se eliminó

***

### getSerializerRegistry()

> **getSerializerRegistry**(): [`SerializerRegistry`](../../serializers-module/classes/SerializerRegistry.md)

Defined in: [Logger.ts:941](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L941)

Obtiene el registry de serializadores

#### Returns

[`SerializerRegistry`](../../serializers-module/classes/SerializerRegistry.md)

SerializerRegistry

***

### on()

> **on**(`event`, `callback`, `priority?`): () => `void`

Defined in: [Logger.ts:962](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L962)

Registra un hook para un evento

#### Parameters

##### event

[`HookEvent`](../type-aliases/HookEvent.md)

Evento: 'beforeLog' | 'afterLog' | 'onError'

##### callback

[`HookCallback`](../type-aliases/HookCallback.md)

Función a ejecutar

##### priority?

`number`

Prioridad (mayor = primero)

#### Returns

Función para desregistrar

() => `void`

#### Example

```ts
const unsubscribe = logger.on('beforeLog', (entry) => {
  entry.correlationId = getCorrelationId();
  return entry;
});
```

***

### once()

> **once**(`event`, `callback`, `priority?`): () => `void`

Defined in: [Logger.ts:975](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L975)

Registra un hook que se ejecuta solo una vez

#### Parameters

##### event

[`HookEvent`](../type-aliases/HookEvent.md)

Evento: 'beforeLog' | 'afterLog' | 'onError'

##### callback

[`HookCallback`](../type-aliases/HookCallback.md)

Función a ejecutar

##### priority?

`number`

Prioridad (mayor = primero)

#### Returns

Función para desregistrar

() => `void`

***

### off()

> **off**(`event`, `callback`): `boolean`

Defined in: [Logger.ts:987](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L987)

Elimina un hook registrado

#### Parameters

##### event

[`HookEvent`](../type-aliases/HookEvent.md)

Evento del hook

##### callback

[`HookCallback`](../type-aliases/HookCallback.md)

Callback a remover

#### Returns

`boolean`

true si se eliminó

***

### use()

> **use**(`middleware`, `priority?`): () => `void`

Defined in: [Logger.ts:1005](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1005)

Añade un middleware al pipeline

#### Parameters

##### middleware

[`MiddlewareFn`](../type-aliases/MiddlewareFn.md)

Función middleware

##### priority?

`number`

Prioridad (mayor = primero)

#### Returns

Función para desregistrar

() => `void`

#### Example

```ts
logger.use((entry, next) => {
  entry.requestId = asyncLocalStorage.getStore()?.requestId;
  next();
});
```

***

### getHookManager()

> **getHookManager**(): [`HookManager`](../../hooks-module/classes/HookManager.md)

Defined in: [Logger.ts:1014](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1014)

Obtiene el HookManager

#### Returns

[`HookManager`](../../hooks-module/classes/HookManager.md)

HookManager

***

### addTransport()

> **addTransport**(`target`): `string`

Defined in: [Logger.ts:1046](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1046)

Añade un transport para envío de logs

#### Parameters

##### target

[`TransportTarget`](../interfaces/TransportTarget.md)

Configuración del transport

#### Returns

`string`

ID único del transport

#### Examples

```ts
// File transport
logger.addTransport({
  target: 'file',
  options: { destination: '/var/log/app.log' }
});
```

```ts
// HTTP transport con batching
logger.addTransport({
  target: 'http',
  options: {
    url: 'https://logs.example.com',
    batchSize: 100,
    flushInterval: 5000
  },
  level: 'warn'
});
```

***

### removeTransport()

> **removeTransport**(`id`): `boolean`

Defined in: [Logger.ts:1057](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1057)

Elimina un transport

#### Parameters

##### id

`string`

ID del transport a remover

#### Returns

`boolean`

true si se eliminó

***

### flushTransports()

> **flushTransports**(): `Promise`\<`void`\>

Defined in: [Logger.ts:1067](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1067)

Fuerza el flush de todos los transports

#### Returns

`Promise`\<`void`\>

Promise que resuelve cuando todos los buffers están vaciados

***

### closeTransports()

> **closeTransports**(): `Promise`\<`void`\>

Defined in: [Logger.ts:1077](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1077)

Cierra todos los transports

#### Returns

`Promise`\<`void`\>

Promise que resuelve cuando todos están cerrados

***

### getTransportManager()

> **getTransportManager**(): [`TransportManager`](../../transports-module/classes/TransportManager.md) \| `undefined`

Defined in: [Logger.ts:1086](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1086)

Obtiene el TransportManager

#### Returns

[`TransportManager`](../../transports-module/classes/TransportManager.md) \| `undefined`

TransportManager o undefined si no hay transports

***

### dispatchToTransports()

> `protected` **dispatchToTransports**(`level`, `message`, `prefix`, `stackInfo`, `extra?`): `void`

Defined in: [Logger.ts:1173](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1173)

Construye y despacha un `TransportRecord` al [TransportManager](../../transports-module/classes/TransportManager.md)
(no-op si no hay transports registrados). Lo comparten todos los
caminos de log — `log()`, `success()` y los métodos visuales como
`table()` / `group()` / `time()` — para que toda emisión atraviese
el mismo pipeline de transports.

#### Parameters

##### level

`"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"critical"`

Nivel canónico (trace/debug/info/warn/error/critical)

##### message

`string`

Mensaje final, post-hook

##### prefix

`string` \| `undefined`

Prefijo efectivo (global + scope)

##### stackInfo

[`StackInfo`](../interfaces/StackInfo.md) \| `null`

Ubicación del caller, opcional

##### extra?

`Partial`\<[`TransportRecord`](../interfaces/TransportRecord.md)\>

Campos extra a mergear en el record
       (p.ej. `{ tag: 'success' }` o `attributes` adicionales)

#### Returns

`void`

***

### log()

> `protected` **log**(`level`, ...`args`): `Promise`\<`void`\>

Defined in: [Logger.ts:1239](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1239)

Método central de logging. Espera el hook pipeline `beforeLog`
antes de despachar a consola y transports, para que redacciones
o enriquecimientos (PII, correlation IDs) se reflejen en el
mensaje emitido.

Los callers fire-and-forget (p.ej. `logger.info(...)` sin `await`)
siguen funcionando: el `Promise<void>` resultante se descarta.
Se recomienda `await` cuando los hooks `beforeLog` mutan `message`.

El tag opcional (`TransportRecord.tag`) NO se pasa como argumento:
se establece vía `_dispatchTag` (ver `success()` y
logWithBindingsAndTag) antes de invocar este método.

#### Parameters

##### level

`"trace"` \| `"debug"` \| `"info"` \| `"warn"` \| `"error"` \| `"critical"`

Nivel del log

##### args

...`unknown`[]

Argumentos a loggear (mensaje + datos)

#### Returns

`Promise`\<`void`\>

Promesa que resuelve al completar el dispatch

***

### debug()

> **debug**(...`args`): `Promise`\<`void`\>

Defined in: [Logger.ts:1399](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1399)

Registra mensajes de debug (nivel más verboso junto a `trace`).
Pensado para diagnóstico de desarrollo: valores intermedios, flags
de control flow, estado interno. Devuelve `Promise<void>`.

Filtrado por defecto cuando `verbosity > 'debug'` (ver `setVerbosity`).

#### Parameters

##### args

...`unknown`[]

Mensaje + datos a inspeccionar

#### Returns

`Promise`\<`void`\>

Promesa del dispatch

#### Example

```ts
logger.debug('Estado interno:', { conn, queueSize });
logger.debug('Entrando en branch X');
```

#### See

 - [trace](../functions/trace.md) para diagnósticos aún más granulares
 - [setVerbosity](../functions/setVerbosity.md) para controlar el nivel mínimo visible

***

### info()

> **info**(...`args`): `Promise`\<`void`\>

Defined in: [Logger.ts:1414](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1414)

Registra mensajes informativos. El `await` retorna cuando el hook
`beforeLog` y el dispatch a transports han terminado.

#### Parameters

##### args

...`unknown`[]

Mensajes y datos informativos

#### Returns

`Promise`\<`void`\>

#### Example

```ts
logger.info('Servidor iniciado en puerto 3000');
await logger.info('Procesando', totalItems, 'elementos'); // espera hooks
```

***

### warn()

> **warn**(...`args`): `Promise`\<`void`\>

Defined in: [Logger.ts:1424](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1424)

Registra mensajes de advertencia.

#### Parameters

##### args

...`unknown`[]

Mensajes de advertencia

#### Returns

`Promise`\<`void`\>

***

### error()

> **error**(...`args`): `Promise`\<`void`\>

Defined in: [Logger.ts:1434](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1434)

Registra mensajes de error.

#### Parameters

##### args

...`unknown`[]

Mensaje de error y stack traces

#### Returns

`Promise`\<`void`\>

***

### success()

> **success**(...`args`): `Promise`\<`void`\>

Defined in: [Logger.ts:1451](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1451)

Registra mensajes de éxito. Mapeado internamente a nivel `info` con
styling de success y `record.tag = 'success'` para que los transports
puedan distinguirlo (sin perder info semantics para filtering).

#### Parameters

##### args

...`unknown`[]

Mensaje + datos adicionales

#### Returns

`Promise`\<`void`\>

#### Example

```ts
logger.success('Base de datos conectada');
logger.success('Usuario creado con ID:', userId);
logger.success('✓ Tests pasados: 42/42');
```

***

### trace()

> **trace**(...`args`): `void`

Defined in: [Logger.ts:1537](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1537)

Registra información de trace (nivel más bajo, debajo de debug).
Alineado con OpenTelemetry `TRACE` severity (1-4).

#### Parameters

##### args

...`unknown`[]

Datos muy verbosos (entrada/salida de funciones, valores intermedios)

#### Returns

`void`

#### Example

```ts
logger.trace('Entrando en función processData');
logger.trace('Variables intermedias:', { a, b, c });
```

***

### critical()

> **critical**(...`args`): `Promise`\<`void`\>

Defined in: [Logger.ts:1550](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1550)

Registra errores críticos (prioridad más alta).

#### Parameters

##### args

...`unknown`[]

Errores críticos del sistema

#### Returns

`Promise`\<`void`\>

#### Example

```ts
await logger.critical('Sistema caído - reinicio inmediato requerido');
```

***

### table()

> **table**(`data`, `columns?`): `void`

Defined in: [Logger.ts:1567](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1567)

Muestra datos en formato de tabla. Pasa por la pipeline completa
(outputMode-respecting writeOutput + transports + hooks).

#### Parameters

##### data

`unknown`

Array de objetos o matriz

##### columns?

`string`[]

Columnas específicas a mostrar (opcional)

#### Returns

`void`

#### Example

```ts
logger.table([{ id: 1, nombre: 'Juan' }, { id: 2, nombre: 'María' }]);
```

***

### group()

> **group**(`label`, `collapsed?`): `void`

Defined in: [Logger.ts:1617](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1617)

Inicia un grupo colapsable en la consola. Emite un marker a
transports con `attributes.logger.visual = 'groupStart'` para que
backends puedan reconstruir la jerarquía.

#### Parameters

##### label

`string`

Etiqueta del grupo

##### collapsed?

`boolean` = `false`

Si el grupo inicia colapsado (default: false)

#### Returns

`void`

#### Example

```ts
logger.group('Procesando usuarios');
logger.info('Usuario 1 procesado');
logger.groupEnd();
```

***

### groupEnd()

> **groupEnd**(): `void`

Defined in: [Logger.ts:1664](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1664)

Finaliza el grupo actual de la consola. Emite un marker a transports
simétrico al `group()` start, para que backends puedan cerrar la
jerarquía correctamente.

#### Returns

`void`

#### Example

```ts
logger.group('Operaciones');
logger.info('Operación 1');
logger.groupEnd();
```

***

### time()

> **time**(`label`): `void`

Defined in: [Logger.ts:1695](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1695)

Inicia un temporizador con la etiqueta dada

#### Parameters

##### label

`string`

Etiqueta identificadora del temporizador

#### Returns

`void`

#### Example

```ts
logger.time('proceso-datos');
// ... operación costosa ...
logger.timeEnd('proceso-datos'); // ⏱️ Timer ended: proceso-datos - 1523.45ms
```

***

### timeEnd()

> **timeEnd**(`label`): `number`

Defined in: [Logger.ts:1719](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1719)

Finaliza un temporizador y muestra el tiempo transcurrido

#### Parameters

##### label

`string`

Etiqueta del temporizador a finalizar

#### Returns

`number`

Milisegundos transcurridos, o `-1` si no se encuentra el timer

#### Example

```ts
logger.time('consulta-db');
await consultarBaseDatos();
const elapsed = logger.timeEnd('consulta-db'); // ⏱️ Timer ended: consulta-db - 234.56ms
```

***

### showBanner()

> **showBanner**(`bannerType?`): `void`

Defined in: [Logger.ts:1763](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1763)

Muestra un banner con el tipo especificado o configurado

#### Parameters

##### bannerType?

[`BannerType`](../type-aliases/BannerType.md)

Tipo de banner (opcional)

#### Returns

`void`

#### Example

```ts
logger.showBanner('ascii');    // Banner ASCII art
logger.showBanner('unicode');  // Banner con caracteres Unicode
logger.showBanner('svg');      // Banner con gráfico SVG
logger.showBanner();           // Usa el tipo configurado
```

***

### logWithSVG()

> **logWithSVG**(`message`, `svgContent?`, `options?`): `void`

Defined in: [Logger.ts:1785](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1785)

Registra mensaje con imagen SVG de fondo

#### Parameters

##### message

`string`

Mensaje a mostrar

##### svgContent?

`string`

Contenido SVG personalizado (opcional)

##### options?

[`StyleOptions`](../interfaces/StyleOptions.md) = `{}`

Opciones de estilo (ancho, alto, padding)

#### Returns

`void`

#### Examples

```ts
// SVG automático con gradiente
logger.logWithSVG('🎆 Bienvenido a Better Logger');
```

```ts
// SVG personalizado
const customSVG = '<svg>...</svg>';
logger.logWithSVG('Logo', customSVG, { width: 400, height: 100 });
```

***

### logAnimated()

> **logAnimated**(`message`, `duration?`): `void`

Defined in: [Logger.ts:1830](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1830)

Registra mensaje con gradiente animado de fondo

#### Parameters

##### message

`string`

Mensaje a animar

##### duration?

`number` = `3`

Duración de la animación en segundos (default: 3)

#### Returns

`void`

#### Example

```ts
logger.logAnimated('🌈 Animación en progreso');
logger.logAnimated('Cargando...', 5); // Animación de 5 segundos
```

***

### step()

> **step**(`current`, `total`, `message`): `void`

Defined in: [Logger.ts:1888](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1888)

Muestra un indicador de progreso de pasos en la terminal

#### Parameters

##### current

`number`

Número de paso actual

##### total

`number`

Número total de pasos

##### message

`string`

Descripción del paso

#### Returns

`void`

#### Example

```ts
logger.step(1, 5, 'Analyzing repository...');
logger.step(2, 5, 'Generating commit message...');
```

***

### header()

> **header**(`title`, `subtitle?`): `void`

Defined in: [Logger.ts:1902](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1902)

Muestra un header con estilo y subtítulo opcional

#### Parameters

##### title

`string`

Texto del título principal

##### subtitle?

`string`

Subtítulo opcional (se renderiza atenuado)

#### Returns

`void`

#### Example

```ts
logger.header('Commit Wizard', 'v2.0.0');
```

***

### divider()

> **divider**(): `void`

Defined in: [Logger.ts:1913](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1913)

Muestra una línea divisoria horizontal

#### Returns

`void`

#### Example

```ts
logger.divider();
```

***

### blank()

> **blank**(): `void`

Defined in: [Logger.ts:1924](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1924)

Emite una línea en blanco

#### Returns

`void`

#### Example

```ts
logger.blank();
```

***

### box()

> **box**(`content`, `options?`): `void`

Defined in: [Logger.ts:1938](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1938)

Renderiza contenido dentro de un box con borde

#### Parameters

##### content

`string`

String de contenido (puede contener newlines)

##### options?

[`IBoxOptions`](../interfaces/IBoxOptions.md)

Opciones de renderizado del box

#### Returns

`void`

#### Example

```ts
logger.box('3 commits generated\nProvider: Groq', { title: 'Done', borderColor: '#00ff00' });
```

***

### cliTable()

> **cliTable**(`rows`, `options?`): `void`

Defined in: [Logger.ts:1956](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1956)

Renderiza un array de objetos como una tabla ASCII formateada.
Distinto del método `table()` existente, que usa `console.table`.

#### Parameters

##### rows

`Record`\<`string`, `unknown`\>[]

Array de objetos fila

##### options?

[`ITableOptions`](../interfaces/ITableOptions.md)

Opciones de renderizado de la tabla

#### Returns

`void`

#### Example

```ts
logger.cliTable([
  { provider: 'Groq', status: 'Available', model: 'llama-3.3-70b' },
  { provider: 'Gemini', status: 'Configured', model: 'gemini-2.5-flash' },
]);
```

***

### spinner()

> **spinner**(`message`): [`ISpinnerHandle`](../interfaces/ISpinnerHandle.md)

Defined in: [Logger.ts:1974](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1974)

Crea un handle de spinner para mostrar progreso durante operaciones async.
Devuelve un `NoopSpinner` en entornos non-TTY.

#### Parameters

##### message

`string`

Texto inicial del spinner

#### Returns

[`ISpinnerHandle`](../interfaces/ISpinnerHandle.md)

Controller del spinner

#### Example

```ts
const s = logger.spinner('Analyzing repository...');
s.start();
await analyzeRepo();
s.succeed('Analysis complete (1.2s)');
```

***

### setCLILevel()

> **setCLILevel**(`level`): `void`

Defined in: [Logger.ts:1989](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L1989)

Fija el nivel de verbosidad del CLI, controlando a la vez la verbosidad
de logs y la visibilidad de las primitives

#### Parameters

##### level

[`CLILogLevel`](../type-aliases/CLILogLevel.md)

Nivel de log del CLI

#### Returns

`void`

#### Example

```ts
logger.setCLILevel('quiet');   // Solo errors, sin CLI primitives
logger.setCLILevel('verbose'); // Debug logs + todas las CLI primitives
```

***

### cli()

> **cli**(`command`): `Promise`\<`void`\>

Defined in: [Logger.ts:2066](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/Logger.ts#L2066)

Procesador de comandos CLI para configuración y exportación del logger

#### Parameters

##### command

`string`

Comando CLI a ejecutar

#### Returns

`Promise`\<`void`\>

#### Example

```ts
// Comandos disponibles
await logger.cli('export json');      // Exporta logs en JSON
await logger.cli('export csv');       // Exporta logs en CSV
await logger.cli('theme list');       // Lista temas disponibles
await logger.cli('theme set neon');   // Cambia al tema neon
await logger.cli('config show');      // Muestra configuración actual
await logger.cli('history clear');    // Limpia historial de logs
await logger.cli('status');           // Muestra estado del logger
await logger.cli('help');             // Muestra ayuda de comandos
```
