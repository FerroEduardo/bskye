import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import app from '../../src';
import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import * as bluesky from '../../src/bluesky';
import * as cheerio from 'cheerio';
import { toUSVString } from 'node:util';

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

const userAgent = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

describe('Profile Route - Discord', () => {
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

  it('should return 400 when is not found', async () => {
    vi.mocked(bluesky.getProfile).mockRejectedValue(new Error('Profile not found'));

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/nonexistent.bsky.social',
      {
        method: 'GET',
        headers: {
          'User-Agent': userAgent
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

  it('should set platform-name header for Discord user agent', async () => {
    vi.mocked(bluesky.getProfile).mockResolvedValue(mockProfile);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social',
      {
        method: 'GET',
        headers: {
          'User-Agent': userAgent
        }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(res.headers.get('platform-name')).toBe('discord');

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
          'User-Agent': userAgent
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

  it('should set meta tags for the avatar', async () => {
    vi.mocked(bluesky.getProfile).mockResolvedValue(mockProfileWithAvatar);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social',
      {
        method: 'GET',
        headers: {
          'User-Agent': userAgent
        }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/html');
    expect(res.headers.get('platform-name')).toBe('discord');

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
      attributeName: 'name',
      attributeValue: 'twitter:title',
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
    }
  ];

  if (hasAvatar) {
    values.push(
      {
        attributeName: 'name',
        attributeValue: 'twitter:card',
        content: 'summary_large_image'
      },
      {
        attributeName: 'property',
        attributeValue: 'twitter:image',
        content: 'https://example.com/avatar.jpg'
      },
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
        content: '0'
      },
      {
        attributeName: 'property',
        attributeValue: 'og:image:height',
        content: '0'
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

  if (!validateOembed(html)) {
    return false;
  }

  return true;
};

const validateOembed = (html: cheerio.CheerioAPI): boolean => {
  const link = html('head link');
  if (!link || link.length === 0) {
    console.error(`Alternate link tag not found`);
    return false;
  }

  const rel = link.attr('rel');
  if (rel !== 'alternate') {
    console.error(`Alternate link tag has rel '${rel}', expected 'alternate'`);
    return false;
  }

  const linkType = link.attr('type');
  if (linkType !== 'application/json+oembed') {
    console.error(`Alternate link tag has type '${linkType}', expected 'application/json+oembed'`);
    return false;
  }

  const href = link.attr('href');
  const params = new URLSearchParams({
    author: '',
    link: encodeURIComponent(toUSVString('https://bsky.app/profile/example.bsky.social/')),
    title: encodeURIComponent(toUSVString('Example User (@example.bsky.social)')),
    provider: encodeURIComponent(toUSVString(`👥 100 ➡️ 50 📸 25`))
  });
  const expectedHref = `http://localhost/oembed?${params}`;
  if (href !== expectedHref) {
    console.error(`Alternate link tag has href '${href}', expected '${expectedHref}'`);
    return false;
  }

  return true;
};
