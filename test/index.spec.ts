import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import app from '../src';

describe('Example', () => {
  it('Should return 200 response', async () => {
    const res = await app.request('/', {}, env);

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://github.com/FerroEduardo/bskye');
  });
});
