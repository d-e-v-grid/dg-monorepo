// Common test setup
jest.setTimeout(30000);

// Force exit after tests
afterAll(() => {
  // Give a small delay for cleanup
  return new Promise(resolve => setTimeout(resolve, 100));
});