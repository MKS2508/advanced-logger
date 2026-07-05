---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [cli-module](../README.md) / NoopSpinner

# Class: NoopSpinner

Defined in: [playground/spinner.ts:223](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L223)

Spinner degenerate para non-TTY (CI logs, pipes, `outputMode: 'silent'`).

No anima nada: traduce los eventos del ciclo de vida del spinner a llamadas
normales del logger (`info` en start, `success`/`error` en finish). Así el
consumidor mantiene la misma API [ISpinnerHandle](../../index/interfaces/ISpinnerHandle.md) sin saber si está
corriendo en terminal interactiva o en un job de CI.

A diferencia de [SpinnerManager](SpinnerManager.md), **no** toca el `outputMode` del
logger — no hay nada que mutear porque no hay frame animado que proteger.

## Implements

## Example

```ts
// En CI (sin TTY) el TerminalBridge entrega un NoopSpinner automáticamente:
const s = logger.spinner('Running tests...');
s.start();                 // logger.info('Running tests...')
s.succeed('All green');    // logger.success('All green')
```

## See

[SpinnerManager](SpinnerManager.md) para el path interactivo con animación.

## Implements

- [`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md)

## Constructors

### Constructor

> **new NoopSpinner**(`message`, `logger`): `NoopSpinner`

Defined in: [playground/spinner.ts:232](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L232)

#### Parameters

##### message

`string`

Texto base; se reutiliza como mensaje final
  si [succeed](#succeed) / [fail](#fail) se llaman sin argumento.

##### logger

[`Logger`](../../index/classes/Logger.md)

Logger sobre el que se emiten los eventos.

#### Returns

`NoopSpinner`

## Methods

### start()

> **start**(): `void`

Defined in: [playground/spinner.ts:243](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L243)

Emite el mensaje inicial como `logger.info(...)`. No arranca ningún
timer — en non-TTY no hay nada que animar.

#### Returns

`void`

#### Implementation of

[`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md).[`start`](../../index/interfaces/ISpinnerHandle.md#start)

***

### stop()

> **stop**(): `void`

Defined in: [playground/spinner.ts:252](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L252)

No-op — no hay animación que detener ni output que restaurar.

#### Returns

`void`

#### Implementation of

[`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md).[`stop`](../../index/interfaces/ISpinnerHandle.md#stop)

***

### succeed()

> **succeed**(`msg?`): `void`

Defined in: [playground/spinner.ts:263](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L263)

Emite el mensaje final como `logger.success(...)`.

#### Parameters

##### msg?

`string`

Texto final; si se omite usa el `message`
  inicial o el último seteado vía [text](#text).

#### Returns

`void`

#### Implementation of

[`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md).[`succeed`](../../index/interfaces/ISpinnerHandle.md#succeed)

***

### fail()

> **fail**(`msg?`): `void`

Defined in: [playground/spinner.ts:274](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L274)

Emite el mensaje final como `logger.error(...)`.

#### Parameters

##### msg?

`string`

Texto final; si se omite usa el `message`
  inicial o el último seteado vía [text](#text).

#### Returns

`void`

#### Implementation of

[`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md).[`fail`](../../index/interfaces/ISpinnerHandle.md#fail)

***

### text()

> **text**(`msg`): `void`

Defined in: [playground/spinner.ts:285](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/playground/spinner.ts#L285)

Actualiza el mensaje interno (sin output). Solo afecta al texto que
emitirán [succeed](#succeed) / [fail](#fail) cuando se invoquen sin argumento.

#### Parameters

##### msg

`string`

Nuevo texto base.

#### Returns

`void`

#### Implementation of

[`ISpinnerHandle`](../../index/interfaces/ISpinnerHandle.md).[`text`](../../index/interfaces/ISpinnerHandle.md#text)
