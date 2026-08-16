# Automated Test Suites

Comprehensive automated testing and physics validation suite for the CDI/EDI Design Platform.

## Test Categories
- `unit/`: Individual technology model and physics unit tests (`cdiModel.test.js`, `mCDIModel.test.js`, etc.).
- `engineering/`: Conservation laws, mass balances, SEC accounting, and first-principles audits.
- `integration/`: Cross-technology matrix consistency and end-to-end multi-stage process trains.
- `smoke/`: Master 57-equation registry integrity, full traceability, and 20+ edge-case stress tests.

## Running Tests
```bash
# Run all 25+ test suites
npm test

# Run specific suite
npm run test:unit
npm run test:engineering
npm run test:integration
npm run test:smoke
```
