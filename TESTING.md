# Testing

## Unit / Integration (Jest + Testing Library)

Install dev deps:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run coverage (configured for >70% global thresholds):

```bash
npm run test:coverage
```

Notes:
- Jest config: `jest.config.js`
- Global mocks/setup: `jest.setup.ts`
- Tests live in `__tests__/`

## E2E (Detox)

Detox is scaffolded for iOS simulator (Debug).

1) Install deps:

```bash
npm install
```

2) Build the app for the simulator:

```bash
npm run e2e:build:ios
```

3) Run the tests:

```bash
npm run e2e:test:ios
```

Files:
- Detox config: `.detoxrc.json`
- E2E tests: `e2e/`

