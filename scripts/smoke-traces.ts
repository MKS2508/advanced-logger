/**
 * Smoke de OtlpTraceTransport contra el collector real (sin publicar).
 *
 * Registra un transport de traces con serviceName `blogger-traces-smoke`,
 * emite 1 `event()` + 1 `span(fn)` con un log correlacionado dentro, y
 * flushea. Intercepta `fetch` para reportar el status HTTP del POST real a
 * `/v1/traces` (esperado: 200 `{"partialSuccess":{}}`).
 *
 * El endpoint del collector se pasa por env var (nunca hardcodeado — el
 * collector hace ingest sin auth, la URL es la credential).
 *
 * Uso:
 *   OTLP_ENDPOINT=<url> bun scripts/smoke-traces.ts
 *   # con ingest key (si el collector la exige):
 *   OTLP_ENDPOINT=<url> SIGNOZ_INGEST_KEY=<REDACTED> bun scripts/smoke-traces.ts
 */
import { Logger } from '../src/Logger.js';
import { OtlpTraceTransport } from '../src/transports/OtlpTraceTransport.js';
import { OtlpTransport } from '../src/transports/OtlpTransport.js';

const COLLECTOR = process.env['OTLP_ENDPOINT'] ?? '';
if (!COLLECTOR) {
    console.error('OTLP_ENDPOINT no seteada — export OTLP_ENDPOINT=<url> antes de correr el smoke');
    process.exit(1);
}

const SERVICE_NAME = 'blogger-traces-smoke';

interface FetchReport {
    url: string;
    status: number;
    statusText: string;
    body: string;
}

const reports: FetchReport[] = [];

const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);
    const body = await response.clone().text();
    reports.push({
        url: String(input),
        status: response.status,
        statusText: response.statusText,
        body: body.slice(0, 300)
    });
    return response;
}) as typeof fetch;

async function main(): Promise<void> {
    const logger = new Logger({ verbosity: 'info', outputMode: 'silent', enableStackTrace: false });

    logger.addTransport({
        target: new OtlpTraceTransport({
            endpoint: COLLECTOR,
            serviceName: SERVICE_NAME,
            serviceVersion: '0.18.2-alpha.2',
            environment: 'smoke',
            ...(process.env['SIGNOZ_INGEST_KEY'] ? { ingestKeyEnvVar: 'SIGNOZ_INGEST_KEY' } : {})
        })
    });
    // un transport de logs para verificar que el span NO contamina /v1/logs
    logger.addTransport({
        target: new OtlpTransport({
            endpoint: COLLECTOR,
            serviceName: SERVICE_NAME,
            ...(process.env['SIGNOZ_INGEST_KEY'] ? { ingestKeyEnvVar: 'SIGNOZ_INGEST_KEY' } : {})
        })
    });

    const scope = logger.scope('smoke');

    scope.event('smoke.event', { phase: 'boot', runtime: 'bun' });

    await scope.span('smoke.span', { operation: 'trio-api' }, async (s) => {
        s.set('step', 'emitting-correlated-log');
        await logger.info('log correlacionado dentro del span de smoke');
        await scope.span('smoke.child', async () => {
            s.set('nested', true);
        });
    });

    await logger.flushTransports();
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('=== POST reports ===');
    for (const r of reports) {
        console.log(`${r.status} ${r.statusText} ${r.url}`);
        console.log(`  body: ${r.body}`);
    }

    const traces = reports.filter(r => r.url.includes('/v1/traces'));
    const logs = reports.filter(r => r.url.includes('/v1/logs'));
    const ok = traces.length > 0 && traces.every(r => r.status === 200);
    console.log(`\n/v1/traces POSTs: ${traces.length} (status ${traces.map(r => r.status).join(', ') || 'n/a'})`);
    console.log(`/v1/logs   POSTs: ${logs.length} (status ${logs.map(r => r.status).join(', ') || 'n/a'})`);
    console.log(ok ? '\nSMOKE OK — verificar en ClickHouse serviceName=blogger-traces-smoke' : '\nSMOKE FAILED');
    process.exit(ok ? 0 : 1);
}

void main();
