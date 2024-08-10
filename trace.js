// otel.js

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-otlp-grpc');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { HttpInstrumentation } = require('@opentelemetry/instrumentation-http');
const { ExpressInstrumentation } = require('@opentelemetry/instrumentation-express');
const { GraphQLInstrumentation } = require('@opentelemetry/instrumentation-graphql');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');



// Configure the OTLP trace exporter
const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4317', // Ensure this URL is correct
});


// Set up the NodeSDK with auto-instrumentation and specific instrumentations
const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'simple-login-mysql', // Service name
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

// Initialize the SDK and start tracing
try {
  sdk.start();
  console.log('OpenTelemetry initialized');
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
