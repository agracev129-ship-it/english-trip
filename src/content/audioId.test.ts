import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { audioId, sha1Hex } from './audioId.ts';

const nodeSha1 = (s: string) => createHash('sha1').update(s, 'utf8').digest('hex');

describe('sha1Hex', () => {
  it('совпадает с node:crypto на разных строках', () => {
    const samples = [
      '',
      'abc',
      'bf_emma|Can I see your boarding pass?',
      'Привет, мир — ёлка',
      'x'.repeat(55),
      'y'.repeat(56),
      'z'.repeat(64),
      'long '.repeat(500),
    ];
    for (const s of samples) expect(sha1Hex(s)).toBe(nodeSha1(s));
  });
});

describe('audioId', () => {
  it('12 символов от sha1(voice|text)', () => {
    const id = audioId('bf_emma', 'boarding pass');
    expect(id).toBe(nodeSha1('bf_emma|boarding pass').slice(0, 12));
    expect(id).toMatch(/^[0-9a-f]{12}$/);
  });
});
