import { expect } from "vitest";

export function isPagination(obj) {
  expect(obj).toHaveProperty('count', expect.any(Number));
  expect(obj).toHaveProperty('data', expect.any(Array));
}