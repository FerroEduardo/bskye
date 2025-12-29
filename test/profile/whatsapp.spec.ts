import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import app from '../../src';
import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import * as bluesky from '../../src/bluesky';
import * as cheerio from 'cheerio';

vi.mock('../../src/bluesky');

const mockProfile: ProfileViewDetailed = {
  did: 'did:plc:z72i4hdhw56rfsilqqqyqj2m',
  handle: 'example.bsky.social',
  displayName: 'Example User',
  description: 'This is a test profile',
  followersCount: 100,
  followsCount: 50,
  postsCount: 25,
  indexedAt: '2024-01-01T00:00:00.000Z',
  createdAt: '2023-01-01T00:00:00.000Z'
};

const mockProfileWithAvatar: ProfileViewDetailed = {
  ...mockProfile,
  avatar: 'https://example.com/avatar.jpg'
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

    const $ = cheerio.load(await res.text());

    // Validate meta tags
    expect(validateProfile($)).toBe(true);
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

    const $ = cheerio.load(await res.text());

    // Validate meta tags
    expect(validateProfile($)).toBe(true);
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

    const $ = cheerio.load(await res.text());

    // Validate meta tags
    expect(validateProfile($)).toBe(true);
  });

  it('should set meta tags for the avatar', async () => {
    vi.mocked(bluesky.getProfile).mockResolvedValue(mockProfileWithAvatar);

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

    const $ = cheerio.load(await res.text());

    // Validate meta tags
    expect(validateProfile($, true)).toBe(true);
  });
});

export const validateProfile = (html: cheerio.CheerioAPI, hasAvatar: boolean = false): boolean => {
  const values = [
    {
      attributeName: 'name',
      attributeValue: 'theme-color',
      content: '#0a7aff'
    },
    {
      attributeName: 'property',
      attributeValue: 'og:title',
      content: 'Example User (@example.bsky.social)'
    },
    {
      attributeName: 'property',
      attributeValue: 'og:description',
      content: 'This is a test profile'
    },
    {
      attributeName: 'property',
      attributeValue: 'og:site_name',
      content: 'bskye'
    },
    {
      attributeName: 'property',
      attributeValue: 'og:url',
      content: 'https://bsky.app/profile/example.bsky.social/'
    },
    {
      attributeName: 'http-equiv',
      attributeValue: 'refresh',
      content: '0; url = https://bsky.app/profile/example.bsky.social/'
    },
    {
      attributeName: 'name',
      attributeValue: 'twitter:card',
      content: 'summary_large_image'
    }
  ];

  if (hasAvatar) {
    values.push(
      {
        attributeName: 'property',
        attributeValue: 'og:image',
        content: 'https://example.com/avatar.jpg'
      },
      {
        attributeName: 'property',
        attributeValue: 'og:image:secure_url',
        content: 'https://example.com/avatar.jpg'
      },
      {
        attributeName: 'property',
        attributeValue: 'og:image:type',
        content: 'image/jpeg'
      },
      {
        attributeName: 'property',
        attributeValue: 'og:image:width',
        content: '600'
      },
      {
        attributeName: 'property',
        attributeValue: 'og:image:height',
        content: '600'
      },
      {
        attributeName: 'property',
        attributeValue: 'og:image:alt',
        content: 'Example User'
      }
    );
  }

  for (const value of values) {
    const meta = html(`meta[${value.attributeName}="${value.attributeValue}"]`);
    if (!meta || meta.length === 0) {
      console.error(`Attribute '${value.attributeName}="${value.attributeValue}"' not found`);
      return false;
    }
    const content = meta.attr('content');
    if (content !== value.content) {
      console.error(`Attribute '${value.attributeName}="${value.attributeValue}"' has content '${content}', expected '${value.content}'`);
      return false;
    }
  }

  return true;
};
