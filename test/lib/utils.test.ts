import { describe, it, expect } from 'vitest';
import { cn } from '../../client/src/lib/utils';

describe('Utility Functions', () => {
  describe('cn (className utility)', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional', false && 'excluded')).toBe('base conditional');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'valid')).toBe('base valid');
    });

    it('should merge conflicting Tailwind classes correctly', () => {
      // The cn function should prioritize later classes when they conflict
      expect(cn('p-4', 'p-6')).toBe('p-6');
    });

    it('should handle empty input', () => {
      expect(cn()).toBe('');
    });

    it('should handle array inputs', () => {
      expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3');
    });

    it('should handle object inputs with conditional values', () => {
      expect(cn({
        'base-class': true,
        'conditional-class': false,
        'another-class': true
      })).toBe('base-class another-class');
    });
  });
});