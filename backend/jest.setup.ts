import { afterEach, expect, jest } from '@jest/globals';
import * as matchers from 'jest-extended';

expect.extend(matchers);

afterEach(() => {
  jest.resetAllMocks();
  jest.restoreAllMocks();
});
