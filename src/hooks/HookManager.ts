import type {
    HookLogEntry,
    HookEvent,
    HookCallback,
    MiddlewareFn,
    HookRegistration,
    MiddlewareRegistration,
    IHookManager
} from '../types/index.js';

const MAX_ONERROR_DEPTH = 5;

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export class HookManager implements IHookManager {
    private hooks: Map<HookEvent, HookRegistration[]> = new Map();
    private middlewares: MiddlewareRegistration[] = [];
    /**
     * Tracks current recursion depth for each hook event so `onError` chains
     * that throw can't loop forever. Reset when the outer emit returns.
     */
    private _onErrorDepth: Map<HookEvent, number> = new Map();

    constructor() {
        this.hooks.set('beforeLog', []);
        this.hooks.set('afterLog', []);
        this.hooks.set('onError', []);
    }

    on(event: HookEvent, callback: HookCallback, priority: number = 50): () => void {
        const registration: HookRegistration = {
            id: generateId(),
            event,
            callback,
            priority,
            once: false
        };

        const hooks = this.hooks.get(event)!;
        hooks.push(registration);
        hooks.sort((a, b) => b.priority - a.priority);

        return () => this.removeHook(event, registration.id);
    }

    once(event: HookEvent, callback: HookCallback, priority: number = 50): () => void {
        const registration: HookRegistration = {
            id: generateId(),
            event,
            callback,
            priority,
            once: true
        };

        const hooks = this.hooks.get(event)!;
        hooks.push(registration);
        hooks.sort((a, b) => b.priority - a.priority);

        return () => this.removeHook(event, registration.id);
    }

    off(event: HookEvent, callback: HookCallback): boolean {
        const hooks = this.hooks.get(event);
        if (!hooks) return false;

        const index = hooks.findIndex(h => h.callback === callback);
        if (index >= 0) {
            hooks.splice(index, 1);
            return true;
        }
        return false;
    }

    private removeHook(event: HookEvent, id: string): void {
        const hooks = this.hooks.get(event);
        if (hooks) {
            const index = hooks.findIndex(h => h.id === id);
            if (index >= 0) {
                hooks.splice(index, 1);
            }
        }
    }

    use(middleware: MiddlewareFn, priority: number = 50): () => void {
        const registration: MiddlewareRegistration = {
            id: generateId(),
            fn: middleware,
            priority
        };

        this.middlewares.push(registration);
        this.middlewares.sort((a, b) => b.priority - a.priority);

        return () => {
            const index = this.middlewares.findIndex(m => m.id === registration.id);
            if (index >= 0) {
                this.middlewares.splice(index, 1);
            }
        };
    }

    async emit(event: HookEvent, entry: HookLogEntry): Promise<HookLogEntry> {
        // Re-entrancy guard. Without this, an onError hook that itself throws
        // would re-enter emit('onError', ...) and either spin forever or
        // recurse until the stack blows. We allow a small burst (MAX_ONERROR_DEPTH)
        // so legitimate fan-out keeps working, but break the cycle.
        const depth = (this._onErrorDepth.get(entry.hookEvent ?? event) ?? 0);
        if (event === 'onError' && depth >= MAX_ONERROR_DEPTH) {
            // eslint-disable-next-line no-console
            console.error('HookManager: onError recursion limit reached, dropping entry:', entry);
            return entry;
        }
        this._onErrorDepth.set(event, depth + 1);

        try {
            const hooks = this.hooks.get(event) || [];
            let currentEntry = { ...entry };
            const toRemove: string[] = [];

            for (const hook of hooks) {
                try {
                    const result = await hook.callback(currentEntry);
                    if (result) {
                        currentEntry = { ...currentEntry, ...result };
                    }
                    if (hook.once) {
                        toRemove.push(hook.id);
                    }
                } catch (error) {
                    if (event !== 'onError') {
                        await this.emit('onError', {
                            ...currentEntry,
                            error: error instanceof Error ? error : new Error(String(error)),
                            hookEvent: event
                        });
                    } else {
                        // An onError hook threw — surface to console (single shot)
                        // without dispatching another onError (which would recurse).
                        // eslint-disable-next-line no-console
                        console.error('HookManager: onError hook threw, swallowed to break recursion:', error);
                    }
                }
            }

            toRemove.forEach(id => this.removeHook(event, id));
            return currentEntry;
        } finally {
            this._onErrorDepth.set(event, depth);
        }
    }

    async process(entry: HookLogEntry): Promise<HookLogEntry> {
        let currentEntry = { ...entry };

        currentEntry = await this.emit('beforeLog', currentEntry);

        if (this.middlewares.length > 0) {
            let index = 0;

            const executeNext = async (): Promise<void> => {
                if (index < this.middlewares.length) {
                    const middleware = this.middlewares[index++];
                    if (middleware) {
                        await middleware.fn(currentEntry, executeNext);
                    }
                }
            };

            await executeNext();
        }

        return currentEntry;
    }

    async afterProcess(entry: HookLogEntry): Promise<void> {
        await this.emit('afterLog', entry);
    }

    clear(): void {
        this.hooks.forEach(hooks => hooks.length = 0);
        this.middlewares.length = 0;
    }

    getStats(): { hooks: Record<HookEvent, number>; middlewares: number } {
        return {
            hooks: {
                beforeLog: this.hooks.get('beforeLog')?.length || 0,
                afterLog: this.hooks.get('afterLog')?.length || 0,
                onError: this.hooks.get('onError')?.length || 0
            },
            middlewares: this.middlewares.length
        };
    }
}

let _defaultHookManager: HookManager | null = null;

export function getDefaultHookManager(): HookManager {
    if (!_defaultHookManager) {
        _defaultHookManager = new HookManager();
    }
    return _defaultHookManager;
}
