---
layout: default
---

[**@mks2508/better-logger**](../../README.md)

***

[@mks2508/better-logger](../../README.md) / [index](../README.md) / OutputFormat

# Type Alias: OutputFormat

> **OutputFormat** = `"auto"` \| `"plain"` \| `"ansi"` \| `"build"` \| `"ci"`

Defined in: [types/core.ts:112](https://github.com/MKS2508/advanced-logger/blob/e104f55c026f2d3d70968a0ae336428953e1505d/src/types/core.ts#L112)

Formatos de salida para diferentes entornos

## Description

- auto: Detección automática basada en entorno (recomendado)
- plain: Texto plano sin colores (máxima compatibilidad)
- ansi: Colores ANSI para terminales modernos
- build: Formato optimizado para builds (Next.js, webpack, etc.)
- ci: Formato optimizado para CI/CD (sin emojis, texto simple)
