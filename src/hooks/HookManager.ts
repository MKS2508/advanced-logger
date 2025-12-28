import type {
    HookLogEntry,
    HookEvent,
    HookCallback,
    MiddlewareFn,
    HookRegistration,
    MiddlewareRegistration,
    IHookManager
} from '../types/index.js';

function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export class HookManager implements IHookManager {
    private hooks: Map<HookEvent, HookRegistration[]> = new Map();
    private middlewares: MiddlewareRegistration[] = [];

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
                        error,
                        hookEvent: event
                    } as HookLogEntry);
                }
            }
        }

        toRemove.forEach(id => this.removeHook(event, id));
        return currentEntry;
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
