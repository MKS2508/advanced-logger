---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [cli-module](../README.md) / SpinnerManager

# Class: SpinnerManager

Defined in: [playground/spinner.ts:60](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L60)

Spinner interactivo para TTY: cicla frames braille reescribiendo la l\u00ednea
actual en su sitio (no emite l\u00edneas nuevas hasta el stop).

Para no poluir stdout piped ni entrelazarse con el output normal del
[Logger](../../index/classes/Logger.md), hace dos cosas no obvias:
  1. Escribe SIEMPRE a `process.stderr` (carriage return + `\x1b[K` para
     limpiar la l\u00ednea antes de cada render).
  2. Con `start()` mutea el logger (`outputMode: 'silent'`) y lo restaura a
     `'console'` en cualquier m\u00e9todo de finalizaci\u00f3n (`stop`/`succeed`/`fail`).
     Sin esto, los logs del usuario se imprimir\u00edan encima del frame animado.

No gestiona TTY detection \u2014 quien lo instancia (`TerminalBridge`) ya valid\u00f3
que hay TTY. Para non-TTY ver [NoopSpinner](NoopSpinner.md).

## Implements

## Example

```ts
const spinner = new SpinnerManager('Compilando...', logger.config, logger);
spinner.start();
// ...trabajo as\u00edncrono...
spinner.succeed('Build OK');
// stderr: "  \u2713 Build OK"
```

## See

 - [NoopSpinner](NoopSpinner.md) para el path non-TTY.
 - [ISpinnerHandle](../../index/interfaces/ISpinnerHandle.md) para el contrato de la API p\u00fablica.

## Implements

- [`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md)

## Constructors

### Constructor

> **new SpinnerManager**(`message`, `_config`, `logger`): `SpinnerManager`

Defined in: [playground/spinner.ts:74](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L74)

#### Parameters

##### message

`string`

Texto a mostrar al lado del frame animado.
  Mutables luego v\u00eda [SpinnerManager.text](#text).

##### \_config

[`LoggerConfig`](../../index/interfaces/LoggerConfig.md)

Reservado para configuraci\u00f3n futura;
  actualmente no se lee dentro de la clase (lo conserva solo el caller).

##### logger

[`Logger`](../../index/classes/Logger.md)

Instancia del logger due\u00f1a del spinner. Se
  mutea/restaura con `updateConfig({ outputMode })` en start/stop.

#### Returns

`SpinnerManager`

## Methods

### start()

> **start**(): `void`

Defined in: [playground/spinner.ts:89](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L89)

Arranca la animaci\u00f3n. Idempotente: si ya est\u00e1 corriendo, no hace nada.

Como efecto lateral mutea el logger pasado al constructor cambiando su
`outputMode` a `'silent'` \u2014 cualquier log durante la animaci\u00f3n quedar\u00eda
bufferizado y se descarta al restaurar el modo. Llama siempre a
[stop](#stop), [succeed](#succeed) o [fail](#fail) para restaurar el output.

#### Returns

`void`

#### Implementation of

[`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md).[`start`](../../index/interfaces/ISpinnerHandle.md#start)

***

### stop()

> **stop**(): `void`

Defined in: [playground/spinner.ts:113](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L113)

Detiene la animaci\u00f3n y limpia la l\u00ednea, sin emitir mensaje de estado.
Restaura el `outputMode` del logger a `'console'`.

\u00datil cuando el caller ya emiti\u00f3 su propio output final y solo necesita
desmontar el spinner. Para terminaci\u00f3n con tick/cross usa
[succeed](#succeed) / [fail](#fail).

#### Returns

`void`

#### Implementation of

[`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md).[`stop`](../../index/interfaces/ISpinnerHandle.md#stop)

***

### succeed()

> **succeed**(`msg?`): `void`

Defined in: [playground/spinner.ts:135](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L135)

Detiene la animaci\u00f3n y emite el mensaje con un check verde (`\u2713`).
Restaura el `outputMode` del logger a `'console'`.

#### Parameters

##### msg?

`string`

Texto final a mostrar. Si se omite, reutiliza
  el `message` con el que se construy\u00f3 el spinner (o el \u00faltimo seteado
  v\u00eda [text](#text)).

#### Returns

`void`

#### Example

```ts
spinner.succeed();           // \u2192 "  \u2713 <message inicial>"
spinner.succeed('Hecho');    // \u2192 "  \u2713 Hecho"
```

#### Implementation of

[`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md).[`succeed`](../../index/interfaces/ISpinnerHandle.md#succeed)

***

### fail()

> **fail**(`msg?`): `void`

Defined in: [playground/spinner.ts:162](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L162)

Detiene la animaci\u00f3n y emite el mensaje con una cruz roja (`\u2717`).
Restaura el `outputMode` del logger a `'console'`.

#### Parameters

##### msg?

`string`

Texto final a mostrar. Si se omite, reutiliza
  el `message` con el que se construy\u00f3 el spinner (o el \u00faltimo seteado
  v\u00eda [text](#text)).

#### Returns

`void`

#### Example

```ts
try {
  await build();
  spinner.succeed('Build OK');
} catch (e) {
  spinner.fail(`Build fallido: ${e.message}`);
}
```

#### Implementation of

[`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md).[`fail`](../../index/interfaces/ISpinnerHandle.md#fail)

***

### text()

> **text**(`msg`): `void`

Defined in: [playground/spinner.ts:178](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L178)

Reemplaza el texto mostrado al lado del frame sin reiniciar la animaci\u00f3n
ni perder el frame actual. Pensado para actualizar progreso in-place
(p.ej. contador de items procesados).

#### Parameters

##### msg

`string`

Nuevo texto a mostrar.

#### Returns

`void`

#### Implementation of

[`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md).[`text`](../../index/interfaces/ISpinnerHandle.md#text)
