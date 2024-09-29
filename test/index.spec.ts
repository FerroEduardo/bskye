import {} from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('worker', () => {
	it('success', async () => {
		expect('hello').toBe('hello');
	});
});
