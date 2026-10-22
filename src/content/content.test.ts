import { describe, expect, it } from 'vitest';
import { iconExists, readContentFiles } from '../../scripts/content-files.ts';
import { validateContent } from './validate.ts';

describe('учебный контент', () => {
  it('проходит схему и все перекрёстные проверки', () => {
    const result = validateContent(readContentFiles(), { iconExists });
    expect(result.errors).toEqual([]);
    expect(result.weeks.length).toBeGreaterThan(0);
  });
});
