# Testing Guide - 5D Character Creator

## Quick Start

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

```
src/
├── lib/
│   └── __tests__/
│       ├── fuzzySearch.test.ts        (46 tests)
│       └── store-stubs.test.ts        (58 tests)
└── hooks/
    └── __tests__/
        └── useMentionDetection.test.tsx (58 tests)
```

## What's Tested

### Phase 1 Week 2 @ Mention System
- **Fuzzy Search** (`fuzzySearch.ts`)
  - Levenshtein distance calculation
  - Entity searching with exact/partial/typo matching
  - Alias support
  - Multi-word queries

- **Mention Detection** (`useMentionDetection.ts`)
  - @ mention parsing
  - Boundary detection (punctuation, spaces)
  - Position tracking
  - Entity resolution
  - Fuzzy suggestions for typos

- **Entity Stubs** (`store.ts`)
  - Character stub creation (#NAME_XXX)
  - World stub creation (@NAME_XXX)
  - Project stub creation ($NAME_XXX)
  - Development queue management

## Coverage Thresholds

- `fuzzySearch.ts`: 80% across all metrics ✅
- `useMentionDetection.ts`: 70% branches, 80% others ✅

## Test Results

**Total:** 162 tests
**Status:** ✅ All passing

```
Test Suites: 3 passed, 3 total
Tests:       162 passed, 162 total
```

## Coverage Summary

| File                    | Statements | Branches | Functions | Lines  |
|-------------------------|------------|----------|-----------|--------|
| fuzzySearch.ts          | 92.3%      | 86.27%   | 100%      | 91.76% |
| useMentionDetection.ts  | 83.33%     | 71.87%   | 89.47%    | 81.35% |

## Running Specific Tests

```bash
# Run tests for fuzzySearch only
npm test fuzzySearch

# Run tests for useMentionDetection only
npm test useMentionDetection

# Run tests for store-stubs only
npm test store-stubs

# Run tests matching a pattern
npm test "levenshteinDistance"
```

## Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run tests with coverage details
npm test -- --coverage --verbose

# Run a single test file
npm test -- src/lib/__tests__/fuzzySearch.test.ts
```

## Writing New Tests

### Test File Naming
- Unit tests: `*.test.ts` or `*.test.tsx`
- Place in `__tests__` folder next to source files

### Example Test Structure
```typescript
import { functionToTest } from '../myModule';

describe('Module Name', () => {
  describe('functionToTest', () => {
    test('does something specific', () => {
      const result = functionToTest('input');
      expect(result).toBe('expected');
    });
  });
});
```

### Testing React Hooks
```typescript
import { renderHook } from '@testing-library/react';
import { useMyHook } from '../useMyHook';

test('hook returns expected value', () => {
  const { result } = renderHook(() => useMyHook('param'));
  expect(result.current.value).toBe('expected');
});
```

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run tests
  run: npm test

- name: Run tests with coverage
  run: npm run test:coverage
```

## Troubleshooting

### Tests fail with module resolution errors
- Check that `@/` path alias is configured in `jest.config.js`
- Verify `tsconfig.json` paths match

### Coverage threshold errors
- Run `npm run test:coverage` to see detailed coverage
- Update thresholds in `jest.config.js` if needed
- Add more tests to increase coverage

### React hook tests fail
- Ensure `@testing-library/react` is installed
- Check that `jest-environment-jsdom` is configured
- Verify `jest.setup.js` is loaded

## Known Limitations

See `docs/testing/PHASE1-WEEK2-TEST-REPORT.md` for detailed information on:
- Regex constraints for special characters
- Unicode handling limitations
- Multi-word mention boundary detection

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

*For detailed test report, see `docs/testing/PHASE1-WEEK2-TEST-REPORT.md`*
