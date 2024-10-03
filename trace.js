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
const { context, trace } = require('@opentelemetry/api');

// Configure the OTLP trace exporter
const traceExporter = new OTLPTraceExporter({
  url: 'http://localhost:4327', // Ensure this URL is correct and the collector is running
});

// Custom Span Processor to add tenant ID to each span dynamically
class TenantIdSpanProcessor extends SimpleSpanProcessor {
  constructor(spanExporter) {
    super(spanExporter);
  }

  onStart(span, parentContext) {
    super.onStart(span, parentContext);
    
    // Retrieve tenant ID from the current context, if available
    const tenantId = context.active().getValue('tenant.id');
    
    if (tenantId) {
      // Set tenant ID as a span attribute
      span.setAttribute('tenant.id', tenantId);
    }
  }
}

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

// Start the SDK
try {
  sdk.start();
  console.log('OpenTelemetry initialized');
  
  // Add the custom span processor
  sdk._tracerProvider.addSpanProcessor(new TenantIdSpanProcessor(traceExporter));

} catch (err) {
  console.error('Error initializing OpenTelemetry', err);
}

// Function to bind tenant ID to the context
function setTenantId(tenantId) {
  const newContext = context.active().setValue('tenant.id', tenantId);
  return context.with(newContext, () => {});
}

// Export the setTenantId function to be used in server.js
module.exports = {
  setTenantId,
};

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
