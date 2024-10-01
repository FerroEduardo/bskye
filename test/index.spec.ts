import {} from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('worker', () => {
  it('success', async () => {
    expect('hello').toBe('hello');
  });
});
