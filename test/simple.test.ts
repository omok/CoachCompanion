import { describe, it, expect } from 'vitest';

describe('Testing Infrastructure', () => {
  it('should pass basic arithmetic', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
    expect(10 - 5).toBe(5);
  });

  it('should handle strings', () => {
    expect('hello').toBe('hello');
    expect('world').toContain('or');
    expect('test').toHaveLength(4);
  });

  it('should handle arrays', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toHaveLength(5);
    expect(arr).toContain(3);
    expect(arr[0]).toBe(1);
  });

  it('should handle objects', () => {
    const obj = { name: 'test', value: 42 };
    expect(obj.name).toBe('test');
    expect(obj.value).toBe(42);
    expect(obj).toHaveProperty('name');
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve('async result');
    expect(result).toBe('async result');
  });
}); 