import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import app from '../../src';
import type { ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import * as bluesky from '../../src/bluesky';
import * as cheerio from 'cheerio';

vi.mock('../../src/bluesky');

const mockAuthor: ProfileViewDetailed = {
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

function validateMetaTags(
  $: cheerio.CheerioAPI,
  expected: {
    title: string;
    description?: string;
    image?: string;
    video?: string;
    card: string;
  }
) {
  const actualTitle = $('meta[property="og:title"]').attr('content');
  expect(actualTitle).toBe(expected.title);

  if (expected.description) {
    const actualDescription = $('meta[property="og:description"]').attr('content');
    expect(actualDescription).toContain(expected.description);
  }

  const actualCard = $('meta[name="twitter:card"]').attr('content');
  expect(actualCard).toBe(expected.card);

  if (expected.image) {
    const actualImage = $('meta[property="og:image"]').attr('content');
    expect(actualImage).toBe(expected.image);
  }

  if (expected.video) {
    const actualVideo = $('meta[property="og:video"]').attr('content');
    // Video URLs have random numbers, so just check it contains the base URL
    expect(actualVideo).toContain(expected.video);
  }

  // Log all meta tags for debugging
  console.log(
    'WhatsApp meta tags:',
    $('head meta')
      .map((_, el) => ({
        name: $(el).attr('name'),
        property: $(el).attr('property'),
        content: $(el).attr('content')
      }))
      .get()
  );
}

describe('Post Route - WhatsApp', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should redirect to bsky.app when no platform user agent', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social/post/123',
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
    expect(res.headers.get('Location')).toBe('https://bsky.app/profile/example.bsky.social/post/123');
  });

  it('should return 400 when post is not found', async () => {
    vi.mocked(bluesky.getPostThread).mockRejectedValue(new Error('Post not found'));

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social/post/nonexistent',
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
    expect(await res.json()).toEqual({ message: 'Failed to get post from Bluesky API' });
  });

  it('should render text-only post', async () => {
    const mockThread: ThreadViewPost = {
      post: {
        uri: 'at://example.bsky.social/app.bsky.feed.post/123',
        cid: 'mock-cid',
        author: mockAuthor,
        record: {
          $type: 'app.bsky.feed.post',
          text: 'This is a test post',
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        replyCount: 5,
        repostCount: 3,
        likeCount: 10,
        indexedAt: '2024-01-01T00:00:00.000Z'
      }
    };

    vi.mocked(bluesky.getPostThread).mockResolvedValue(mockThread);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social/post/123',
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
    validateMetaTags($, {
      title: 'Example User (@example.bsky.social)',
      description: 'This is a test post',
      card: 'summary_large_image'
    });
  });

  it('should render image post', async () => {
    const mockThread: ThreadViewPost = {
      post: {
        uri: 'at://example.bsky.social/app.bsky.feed.post/123',
        cid: 'mock-cid',
        author: mockAuthor,
        record: {
          $type: 'app.bsky.feed.post',
          text: 'Check out this image',
          embed: {
            $type: 'app.bsky.embed.images',
            images: [
              {
                alt: 'A beautiful sunset',
                image: {
                  ref: { $link: 'mock-image-cid' },
                  mimeType: 'image/jpeg',
                  size: 1024
                }
              }
            ]
          },
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        embed: {
          $type: 'app.bsky.embed.images#view',
          images: [
            {
              thumb: 'https://example.com/thumb.jpg',
              fullsize: 'https://example.com/fullsize.jpg@jpeg',
              alt: 'A beautiful sunset'
            }
          ]
        },
        replyCount: 5,
        repostCount: 3,
        likeCount: 10,
        indexedAt: '2024-01-01T00:00:00.000Z'
      }
    };

    vi.mocked(bluesky.getPostThread).mockResolvedValue(mockThread);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social/post/123',
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

    const $ = cheerio.load(await res.text());
    validateMetaTags($, {
      title: 'Example User (@example.bsky.social)',
      description: 'Check out this image',
      image: 'https://example.com/fullsize.jpg@jpeg',
      card: 'summary_large_image'
    });

    // Check image-specific meta tags
    const imageType = $('meta[property="og:image:type"]').attr('content');
    expect(imageType).toBe('image/jpeg');

    const imageAlt = $('meta[property="og:image:alt"]').attr('content');
    expect(imageAlt).toBe('A beautiful sunset');
  });

  it('should render video post', async () => {
    const mockThread: ThreadViewPost = {
      post: {
        uri: 'at://example.bsky.social/app.bsky.feed.post/123',
        cid: 'mock-cid',
        author: mockAuthor,
        record: {
          $type: 'app.bsky.feed.post',
          text: 'Check out this video',
          embed: {
            $type: 'app.bsky.embed.video',
            video: {
              ref: { $link: 'mock-video-cid' },
              mimeType: 'video/mp4',
              size: 1024000
            }
          },
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        embed: {
          $type: 'app.bsky.embed.video#view',
          cid: 'mock-video-cid',
          playlist: 'https://video.example.com/playlist.m3u8'
        },
        replyCount: 5,
        repostCount: 3,
        likeCount: 10,
        indexedAt: '2024-01-01T00:00:00.000Z'
      }
    };

    vi.mocked(bluesky.getPostThread).mockResolvedValue(mockThread);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social/post/123',
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

    const $ = cheerio.load(await res.text());
    validateMetaTags($, {
      title: 'Example User (@example.bsky.social)',
      description: 'Check out this video',
      video: 'https://bsky.social/xrpc/com.atproto.sync.getBlob?did=did:plc:z72i4hdhw56rfsilqqqyqj2m&cid=mock-video-cid&r=',
      card: 'summary_large_image'
    });

    // Check video-specific meta tags
    const videoType = $('meta[property="og:video:type"]').attr('content');
    expect(videoType).toBe('video/mp4');
  });

  it('should render GIF post', async () => {
    const mockThread: ThreadViewPost = {
      post: {
        uri: 'at://example.bsky.social/app.bsky.feed.post/123',
        cid: 'mock-cid',
        author: mockAuthor,
        record: {
          $type: 'app.bsky.feed.post',
          text: 'Check out this GIF',
          embed: {
            $type: 'app.bsky.embed.external',
            external: {
              uri: 'https://media.tenor.com/1234567890/tenor.gif',
              title: 'Funny GIF',
              description: 'A funny animated GIF'
            }
          },
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        embed: {
          $type: 'app.bsky.embed.external#view',
          external: {
            uri: 'https://media.tenor.com/1234567890/tenor.gif',
            title: 'Funny GIF',
            description: 'A funny animated GIF',
            thumb: 'https://media.tenor.com/1234567890/thumb.jpg'
          }
        },
        replyCount: 5,
        repostCount: 3,
        likeCount: 10,
        indexedAt: '2024-01-01T00:00:00.000Z'
      }
    };

    vi.mocked(bluesky.getPostThread).mockResolvedValue(mockThread);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social/post/123',
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

    const $ = cheerio.load(await res.text());
    validateMetaTags($, {
      title: 'Example User (@example.bsky.social)',
      card: 'summary_large_image'
    });

    // Check GIF-specific meta tags
    const imageType = $('meta[property="og:image:type"]').attr('content');
    expect(imageType).toBe('image/jpeg'); // WhatsApp template uses jpeg for GIFs

    const imageAlt = $('meta[property="og:image:alt"]').attr('content');
    expect(imageAlt).toBe('Funny GIF');
  });

  it('should handle direct media access with mediaIndex', async () => {
    const mockThread: ThreadViewPost = {
      post: {
        uri: 'at://example.bsky.social/app.bsky.feed.post/123',
        cid: 'mock-cid',
        author: mockAuthor,
        record: {
          $type: 'app.bsky.feed.post',
          text: 'Multiple images',
          embed: {
            $type: 'app.bsky.embed.images',
            images: [
              {
                alt: 'Image 1',
                image: {
                  ref: { $link: 'image-cid-1' },
                  mimeType: 'image/jpeg',
                  size: 1024
                }
              },
              {
                alt: 'Image 2',
                image: {
                  ref: { $link: 'image-cid-2' },
                  mimeType: 'image/jpeg',
                  size: 1024
                }
              }
            ]
          },
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        embed: {
          $type: 'app.bsky.embed.images#view',
          images: [
            {
              thumb: 'https://example.com/thumb1.jpg',
              fullsize: 'https://example.com/image1.jpg@jpeg',
              alt: 'Image 1'
            },
            {
              thumb: 'https://example.com/thumb2.jpg',
              fullsize: 'https://example.com/image2.jpg@jpeg',
              alt: 'Image 2'
            }
          ]
        },
        replyCount: 5,
        repostCount: 3,
        likeCount: 10,
        indexedAt: '2024-01-01T00:00:00.000Z'
      }
    };

    vi.mocked(bluesky.getPostThread).mockResolvedValue(mockThread);

    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/example.bsky.social/post/123/2',
      {
        method: 'GET',
        headers: {
          'User-Agent': 'WhatsApp/2.23.20.0',
          Host: 'd.example.com'
        }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('https://example.com/image2.jpg@jpeg');
  });
});
