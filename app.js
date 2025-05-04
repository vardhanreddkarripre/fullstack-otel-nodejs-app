require('./tracer');
const express = require('express');
const path = require('path');
const { metrics, trace } = require('@opentelemetry/api');
const app = express();
const port = process.env.PORT || 3000;
const logsAPI = require('@opentelemetry/api-logs');
const {
  LoggerProvider,
  SimpleLogRecordProcessor,
  ConsoleLogRecordExporter,
} = require('@opentelemetry/sdk-logs');
// Setup
app.use(express.json());
app.use(express.static('public'));

// Views
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

// Dummy products
let cart = [];
const products = [
  { id: 1, name: 'Laptop', price: 999 },
  { id: 2, name: 'Phone', price: 499 }
];

// Custom Metrics
const meter = metrics.getMeter('custom-metrics');
const cartItemsCounter = meter.createCounter('cart_items_count', {
  description: 'Number of items successfully added to cart',
});
const cartAddFailures = meter.createCounter('cart_add_failures', {
  description: 'Number of cart add failures',
});



// Create a LoggerProvider instance
const loggerProvider = new LoggerProvider();

// Add a processor to export log records (to the console in this case)
loggerProvider.addLogRecordProcessor(
  new SimpleLogRecordProcessor(new ConsoleLogRecordExporter())
);

// Set the global logger provider (optional, but useful if you need a global logger)
logsAPI.logs.setGlobalLoggerProvider(loggerProvider);

// Get a logger from the provider (you can pass a custom name for the logger)
const logger = logsAPI.logs.getLogger('cart-logger', '1.0.0');

// Emit a log record
logger.emit({
  severityNumber: logsAPI.SeverityNumber.INFO,
  severityText: 'INFO',
  body: 'Cart updated successfully',
  attributes: { 'log.type': 'LogRecord' },
});

// API: Add to Cart
app.post('/api/cart', (req, res) => {
  const span = trace.getTracer('default').startSpan('AddToCart');
  const product = products.find(p => p.id === req.body.id);

  if (product) {
    cart.push(product);
    cartItemsCounter.add(1);
    logger.emit({
      severityText: 'INFO',
      body: `Added to cart: ${product.name}`,
    });
    span.end();
    res.json({ success: true, cart });
  } else {
    cartAddFailures.add(1);
    logger.emit({
      severityText: 'ERROR',
      body: `Failed to add: invalid product ID ${req.body.id}`,
    });
    span.end();
    res.status(404).json({ success: false, message: 'Invalid product ID' });
  }
});

// View Cart
app.get('/api/cart', (req, res) => {
  res.json({ cart });
});

app.listen(port, () => {
  console.log(`🛒 Server running at http://localhost:${port}`);
});
