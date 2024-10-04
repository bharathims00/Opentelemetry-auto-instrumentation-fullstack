// trace.js

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-grpc');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { GraphQLInstrumentation } = require('@opentelemetry/instrumentation-graphql');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-base');

// Configure the OTLP trace exporter
const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4317', // Ensure this URL is correct
});

// Custom span processor to add tenant_id to every span
class TenantIdSpanProcessor extends SimpleSpanProcessor {
  onStart(span) {
    // Add tenant_id attribute to every span at the start
    span.setAttribute('tenant_id', 86);
  }
}

// Set up the NodeSDK with auto-instrumentation and specific instrumentations
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'simple-login', // Service name
  }),
  traceExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      "@opentelemetry/instrumentation-fs": {
        enabled: false, // Disable fs automatic instrumentation if noisy
      },
    }),
    new HttpInstrumentation(),
    new ExpressInstrumentation(),
    new GraphQLInstrumentation(),
  ],
});

// Start the SDK (no .then() or promises needed)
try {
  sdk.start();
  console.log('OpenTelemetry initialized');
  
  // Add the custom span processor after SDK starts
  sdk._tracerProvider.addSpanProcessor(new TenantIdSpanProcessor());
} catch (err) {
  console.error('Error initializing OpenTelemetry', err);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown().then(() => {
    console.log('OpenTelemetry terminated');
    process.exit(0);
  }).catch(err => {
    console.error('Error terminating OpenTelemetry', err);
    process.exit(1);
  });
});
