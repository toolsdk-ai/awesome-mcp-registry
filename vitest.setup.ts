import { afterAll, afterEach, beforeAll } from "vitest";

beforeAll(() => {
  console.log("🧪 Starting test suite");
});

afterAll(() => {
  console.log("✅ Test suite completed");
});

afterEach(() => {
  // Clean up environment variables or global state if needed
});
