/**
 * Ambient declarations for DOM globals that the runtime `typeof X !==
 * 'undefined'` guards reference. We declare them as `any` so the guards
 * compile cleanly under either `lib: ["ES2022"]` (Node) or
 * `lib: ["ES2022", "DOM", "DOM.Iterable"]` (browser) — and so the guards
 * remain the runtime safety net that protects against Node builds that
 * accidentally try to touch DOM APIs.
 *
 */
declare const document: any;
declare const window: any;
declare const navigator: any;
declare const localStorage: any;
declare const self: any;
declare const MediaQueryListEvent: any;
declare const MediaQueryList: any;
declare type MediaQueryListEvent = any;