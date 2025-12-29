import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import app from '../../src';
import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import * as bluesky from '../../src/bluesky';

vi.mock('../../src/bluesky');

const mockProfile: ProfileViewDetailed = {
  did: 'did:plc:z72i4hdhw56rfsilqqqyqj2m',
  handle: 'example.bsky.social',
  displayName: 'Example User',
  avatar: 'https://example.com/avatar.jpg',
  description: 'This is a test profile',
  followersCount: 100,
  followsCount: 50,
  postsCount: 25,
  indexedAt: '2024-01-01T00:00:00.000Z',
  createdAt: '2023-01-01T00:00:00.000Z'
};

describe('Profile Route - WhatsApp', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should redirect to bsky.app when no platform user agent', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'unknown'
        }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://bsky.app/profile/example.bsky.social');
  });

  it('should return 400 when profile is not found', async () => {
    vi.mocked(bluesky.getProfile).mockRejectedValue(new Error('Profile not found'));

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/nonexistent.bsky.social',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'WhatsApp/2.23.20.0'
        }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(400);
    expect(res.headers.get('Content-Type')).toContain('application/json');
    expect(await res.json()).toEqual({ message: 'Failed to get user from Bluesky API' });
  });

  it('should set platform-name header for WhatsApp user agent', async () => {
    vi.mocked(bluesky.getProfile).mockResolvedValue(mockProfile);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'WhatsApp/2.23.20.0'
        }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(res.headers.get('platform-name')).toBe('whatsapp');
  });

  it('should call getProfile with correct actor parameter', async () => {
    vi.mocked(bluesky.getProfile).mockResolvedValue(mockProfile);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'WhatsApp/2.23.20.0'
        }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(bluesky.getProfile).toHaveBeenCalledWith('example.bsky.social');
  });

  it('should handle userHandler with pipe separator for post ID', async () => {
    vi.mocked(bluesky.getProfile).mockResolvedValue(mockProfile);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social|post123',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'WhatsApp/2.23.20.0'
        }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(bluesky.getProfile).toHaveBeenCalledWith('example.bsky.social');
  });

  it('should work with TelegramBot user agent (mapped to WhatsApp)', async () => {
    vi.mocked(bluesky.getProfile).mockResolvedValue(mockProfile);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'TelegramBot (like TwitterBot)'
        }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(res.headers.get('platform-name')).toBe('whatsapp');
  });
});
