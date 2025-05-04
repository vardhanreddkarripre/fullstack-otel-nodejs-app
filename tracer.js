const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { AzureMonitorTraceExporter, AzureMonitorMetricExporter } = require('@azure/monitor-opentelemetry-exporter');
const { resourceFromAttributes } = require('@opentelemetry/resources');
const { SEMRESATTRS_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');
const { PeriodicExportingMetricReader } = require('@opentelemetry/sdk-metrics');

// Define your service resource
const resource = resourceFromAttributes({
  [SEMRESATTRS_SERVICE_NAME]: 'cart-app-service',
});

// Temporary solution: Using console.log for logging
const logger = console; // Use console directly

// Emit a test log using console.log
logger.log('INFO: OpenTelemetry log setup complete');

// ---------- TRACE & METRIC SETUP ----------

// Trace exporter to Azure Monitor
const traceExporter = new AzureMonitorTraceExporter({
  connectionString: process.env.APPINSIGHTS_CONNECTION_STRING,
});

// Metric reader with Azure Monitor exporter
const metricReader = new PeriodicExportingMetricReader({
  exporter: new AzureMonitorMetricExporter({
    connectionString: process.env.APPINSIGHTS_CONNECTION_STRING,
  }),
  exportIntervalMillis: 60000, // Export every 60 seconds
});

// Initialize the OpenTelemetry NodeSDK
const sdk = new NodeSDK({
  resource,
  traceExporter,
  metricReader,
  instrumentations: [getNodeAutoInstrumentations()],
});

// Start SDK
(async () => {
  try {
    await sdk.start();
    logger.log('✅ OTEL SDK initialized');
    
    // Emit another test log using console.log
    logger.log('INFO: SDK started and logs flushed');
  } catch (err) {
    logger.error('❌ OTEL init failed', err);
  }
})();
