# Console Mocking in Tests

## Overview

Tests in CodePark use intelligent console mocking to catch unexpected errors and warnings while allowing explicit assertions.

## How It Works

### Default Behavior

- All tests fail automatically if `console.error()` or `console.warn()` is called unexpectedly
- This catches bugs that might otherwise be hidden during test runs
- Console calls are mocked (not displayed) to reduce noise

### For Tests That EXPECT Console Output

If your test intentionally generates console warnings or errors, you must explicitly manage the spies:

```javascript
describe("MyComponent", () => {
  it("should log a warning about deprecated API", () => {
    const warnSpy = jest.spyOn(console, "warn");

    // Code that calls console.warn()
    myFunction();

    // Assert on the warning
    expect(warnSpy).toHaveBeenCalledWith("Deprecated API");

    // Clear so afterEach doesn't treat it as unexpected
    warnSpy.mockClear();
  });
});
```

### Using the Helper

For simple assertions:

```javascript
it("should log expected error", () => {
  const errorSpy = jest.spyOn(console, "error");

  myFunction();

  // Use helper
  global.testUtils.expectConsoleCall(errorSpy, "Expected error message");

  errorSpy.mockClear();
});
```

## Why This Approach?

1. **Catches Real Issues** - Unexpected errors/warnings indicate bugs
2. **Cleaner Test Output** - Console isn't polluted with debug output
3. **Explicit About Intent** - Tests that expect console output clearly document this
4. **Prevents Test Noise** - Warnings from dependencies don't clutter output

## Disabling Mocking in Specific Tests

If you need to see actual console output:

```javascript
it("should debug logging behavior", () => {
  const warnSpy = jest.spyOn(console, "warn");

  // Re-enable console to see output
  warnSpy.mockImplementation((...args) => {
    process.stdout.write("WARN: " + args.join(" ") + "\n");
  });

  myFunction();

  warnSpy.mockRestore();
});
```

## Common Issues

### Test Fails with "Unexpected console error/warn"

Your code is calling `console.error()` or `console.warn()` unexpectedly.

**Solutions:**

1. Fix the underlying bug causing the warning
2. Mock the spy before the call if the warning is intentional
3. Use `errorSpy.mockClear()` if you've already asserted on it

### Can't See Debug Output

Console is mocked. Options:

1. Use `console.log()` - this is not mocked
2. Use `process.stderr.write()` for debug output
3. Re-enable for that specific test (see above)
