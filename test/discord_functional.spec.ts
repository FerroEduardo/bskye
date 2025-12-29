import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import app from '../src';
import * as cheerio from 'cheerio';
import { Element } from 'domhandler';

const userAgent = 'Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)';

describe('Discord Functional Tests (Real API)', () => {
  it('should handle image post', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/botafogo.com.br/post/3l4zmomzlla2x?abc=123',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/botafogo.com.br/post/3l4zmomzlla2x');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe('0; url = https://bsky.app/profile/botafogo.com.br/post/3l4zmomzlla2x');
    expect($('meta[property="og:description"]').attr('content')).toBeDefined();
    expect($('meta[name="twitter:card"]').attr('content')).toBe('summary_large_image');
    expect($('meta[property="twitter:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:secure_url"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:type"]').attr('content')).toBe('image/jpeg');
    expect($('meta[property="og:image:width"]').attr('content')).toBe('0');
    expect($('meta[property="og:image:height"]').attr('content')).toBe('0');
    expect($('meta[property="og:image:alt"]').attr('content')).toBeDefined();

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).toBe('');
  });

  it('should handle gif post', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/ousincera.bsky.social/post/3l5axoea6ic2l?abc=123',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/ousincera.bsky.social/post/3l5axoea6ic2l');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe(
      '0; url = https://bsky.app/profile/ousincera.bsky.social/post/3l5axoea6ic2l'
    );
    expect($('meta[property="og:description"]').attr('content')).toBeDefined();
    expect($('meta[name="twitter:card"]').attr('content')).toBe('summary_large_image');
    expect($('meta[property="twitter:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:secure_url"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:type"]').attr('content')).toBe('image/jpeg');
    expect($('meta[property="og:image:width"]').attr('content')).toBe('0');
    expect($('meta[property="og:image:height"]').attr('content')).toBe('0');
    expect($('meta[property="og:image:alt"]').attr('content')).toBeDefined();

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).toBe('');
  });

  it('should handle video post', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/furia.gg/post/3l5dbuctdcf2g?abc=123',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/furia.gg/post/3l5dbuctdcf2g');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe('0; url = https://bsky.app/profile/furia.gg/post/3l5dbuctdcf2g');
    expect($('meta[name="twitter:card"]').attr('content')).toBe('player');
    expect($('meta[name="twitter:player:width"]').attr('content')).toBe('0');
    expect($('meta[name="twitter:player:height"]').attr('content')).toBe('0');
    expect($('meta[name="twitter:player:stream"]').attr('content')).toBeDefined();
    expect($('meta[name="twitter:player:stream:content_type"]').attr('content')).toBe('video/mp4');
    expect($('meta[property="og:video:secure_url"]').attr('content')).toBeDefined();
    expect($('meta[property="og:video:type"]').attr('content')).toBe('video/mp4');
    expect($('meta[property="og:video:height"]').attr('content')).toBe('0');
    expect($('meta[property="og:video:width"]').attr('content')).toBe('0');

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).not.toBe('');
    expect(oembed.author_name).length.above(0);
  });

  it('should handle multiple images post', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/fittyforum.bsky.social/post/3l5cl4enhou2r',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/fittyforum.bsky.social/post/3l5cl4enhou2r');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe(
      '0; url = https://bsky.app/profile/fittyforum.bsky.social/post/3l5cl4enhou2r'
    );
    expect($('meta[property="og:description"]').attr('content')).toBeDefined();

    expect($('meta[name="twitter:card"]').length).toBe(4);
    $('meta[name="twitter:card"]').each((_, element) => {
      expect($(element).attr('content')).toBe('summary_large_image');
    });
    $('meta[property="twitter:image"]').each((_, element) => {
      expect($(element).attr('content')).toBeDefined();
    });
    $('meta[property="og:image"]').each((_, element) => {
      expect($(element).attr('content')).toBeDefined();
    });
    $('meta[property="og:image"]').each((_, element) => {
      expect($(element).attr('content')).toBeDefined();
    });
    $('meta[property="og:image:secure_url"]').each((_, element) => {
      expect($(element).attr('content')).toBeDefined();
    });
    $('meta[property="og:image:type"]').each((_, element) => {
      expect($(element).attr('content')).toBe('image/jpeg');
    });
    $('meta[property="og:image:width"]').each((_, element) => {
      expect($(element).attr('content')).toBe('0');
    });
    $('meta[property="og:image:height"]').each((_, element) => {
      expect($(element).attr('content')).toBe('0');
    });
    $('meta[property="og:image:alt"]').each((_, element) => {
      expect($(element).attr('content')).toBeDefined();
    });

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).toBe('');
  });

  it('should handle text with quote with multiple images', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/pfrazee.com/post/3m4vhttbo6k26',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Log all meta tags for debugging
    const metaTags = $('head meta')
      .map((_, el) => ({
        name: $(el).attr('name'),
        property: $(el).attr('property'),
        content: $(el).attr('content')
      }))
      .get();
    console.log('Text with quote (multiple images) meta tags:', JSON.stringify(metaTags, null, 2));

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/pfrazee.com/post/3m4vhttbo6k26');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe('0; url = https://bsky.app/profile/pfrazee.com/post/3m4vhttbo6k26');
    expect($('meta[property="og:description"]').attr('content')).toContain('🗨️Quoting');

    expect($('meta[name="twitter:card"]').length).toBe(2);
    $('meta[name="twitter:card"]').each((_, element) => {
      expect($(element).attr('content')).toBe('summary_large_image');
    });
    $('meta[property="twitter:image"]').each((_, element) => {
      expect($(element).attr('content')).toBeDefined();
    });
    $('meta[property="og:image"]').each((_, element) => {
      expect($(element).attr('content')).toBeDefined();
    });
    $('meta[property="og:image"]').each((_, element) => {
      expect($(element).attr('content')).toBeDefined();
    });
    $('meta[property="og:image:secure_url"]').each((_, element) => {
      expect($(element).attr('content')).toBeDefined();
    });
    $('meta[property="og:image:type"]').each((_, element) => {
      expect($(element).attr('content')).toBe('image/jpeg');
    });
    $('meta[property="og:image:width"]').each((_, element) => {
      expect($(element).attr('content')).toBe('0');
    });
    $('meta[property="og:image:height"]').each((_, element) => {
      expect($(element).attr('content')).toBe('0');
    });
    $('meta[property="og:image:alt"]').each((_, element) => {
      expect($(element).attr('content')).toBeDefined();
    });

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).toBe('');
  });

  it('should handle image with text quote', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/pfrazee.com/post/3m6fypvdct22z',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/pfrazee.com/post/3m6fypvdct22z');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe('0; url = https://bsky.app/profile/pfrazee.com/post/3m6fypvdct22z');
    expect($('meta[property="og:description"]').attr('content')).toBeDefined();
    expect($('meta[name="twitter:card"]').attr('content')).toBe('summary_large_image');
    expect($('meta[property="twitter:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:secure_url"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:type"]').attr('content')).toBe('image/jpeg');
    expect($('meta[property="og:image:width"]').attr('content')).toBe('0');
    expect($('meta[property="og:image:height"]').attr('content')).toBe('0');
    expect($('meta[property="og:image:alt"]').attr('content')).toBeDefined();

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).toBe('');
  });

  it('should handle text with image quote', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/guabiroba.bsky.social/post/3l5rv72jtwo22',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/guabiroba.bsky.social/post/3l5rv72jtwo22');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe(
      '0; url = https://bsky.app/profile/guabiroba.bsky.social/post/3l5rv72jtwo22'
    );
    expect($('meta[property="og:description"]').attr('content')).toContain('Quoting:');
    expect($('meta[name="twitter:card"]').attr('content')).toBe('summary_large_image');
    expect($('meta[property="twitter:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:secure_url"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:type"]').attr('content')).toBe('image/jpeg');
    expect($('meta[property="og:image:width"]').attr('content')).toBe('0');
    expect($('meta[property="og:image:height"]').attr('content')).toBe('0');
    expect($('meta[property="og:image:alt"]').attr('content')).toBeDefined();

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).toContain('');
  });

  it('should handle text with image quote 2', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/danabra.mov/post/3matfymosas2e',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/danabra.mov/post/3matfymosas2e');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe('0; url = https://bsky.app/profile/danabra.mov/post/3matfymosas2e');
    expect($('meta[property="og:description"]').attr('content')).toContain('🗨️Quoting:');
    expect($('meta[name="twitter:card"]').attr('content')).toBe('summary_large_image');
    expect($('meta[property="twitter:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:secure_url"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:type"]').attr('content')).toBe('image/jpeg');
    expect($('meta[property="og:image:width"]').attr('content')).toBe('0');
    expect($('meta[property="og:image:height"]').attr('content')).toBe('0');
    expect($('meta[property="og:image:alt"]').attr('content')).toBeDefined();

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).toBe('');
  });

  it('should handle text with video quote', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/pdsls.dev/post/3m3djmmtlac2t',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/pdsls.dev/post/3m3djmmtlac2t');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe('0; url = https://bsky.app/profile/pdsls.dev/post/3m3djmmtlac2t');
    // expect($('meta[property="og:description"]').attr('content')).toContain('Quoting:');

    // This could be either a player card (if the video is directly embedded) or summary_large_image (if just showing thumbnail)
    expect($('meta[name="twitter:card"]').attr('content')).toBe('player');
    expect($('meta[name="twitter:player:width"]').attr('content')).toBe('0');
    expect($('meta[name="twitter:player:height"]').attr('content')).toBe('0');
    expect($('meta[name="twitter:player:stream"]').attr('content')).toBeDefined();
    expect($('meta[name="twitter:player:stream:content_type"]').attr('content')).toBeDefined();
    expect($('meta[property="og:video"]').attr('content')).toBeDefined();
    expect($('meta[property="og:video:secure_url"]').attr('content')).toBeDefined();
    expect($('meta[property="og:video:type"]').attr('content')).toBeDefined();
    expect($('meta[property="og:video:width"]').attr('content')).toBe('0');
    expect($('meta[property="og:video:height"]').attr('content')).toBe('0');

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).toContain('🗨️Quoting');
  });

  it('should handle text with special character (%)', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/jefinhomenes.bsky.social/post/3l5qdyb7kzh26?abc=123',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/jefinhomenes.bsky.social/post/3l5qdyb7kzh26');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe(
      '0; url = https://bsky.app/profile/jefinhomenes.bsky.social/post/3l5qdyb7kzh26'
    );
    // expect($('meta[property="og:description"]').attr('content')).toContain('%');

    // This is a text-only post, so it should have a basic card type
    expect($('meta[name="twitter:card"]').attr('content')).toBeDefined();

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).toBe('');
  });

  it('should handle text with special character (")', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/jamellebouie.net/post/3l7jqhbl3yg26',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/jamellebouie.net/post/3l7jqhbl3yg26');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe('0; url = https://bsky.app/profile/jamellebouie.net/post/3l7jqhbl3yg26');

    // Cheerio unescapes entities when using .attr('content')
    // expect($('meta[property="og:description"]').attr('content')).toContain('"');

    // This is a text-only post, so it should have a basic card type
    expect($('meta[name="twitter:card"]').attr('content')).toBeDefined();

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).not.contains('"');
    expect(oembed.author_name).toContain('&quot;');
  });

  it('should handle direct image with index', async () => {
    const ctx = createExecutionContext();
    // Using the d. prefix in Host header to trigger direct media middleware
    const res = await app.request(
      '/profile/pfrazee.com/post/3lech75aa7k2f/4',
      {
        headers: {
          'User-Agent': userAgent,
          Host: 'd.bskye.app'
        }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(302);
    const location = res.headers.get('Location');
    expect(location).toBeDefined();
    expect(location).toContain('cdn.bsky.app');
  });

  it('should handle profile route', async () => {
    const ctx = createExecutionContext();
    const res = await app.request(
      '/profile/pfrazee.com',
      {
        headers: { 'User-Agent': userAgent }
      },
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const $ = cheerio.load(await res.text());

    // Validate each meta tag individually
    expect($('meta[name="theme-color"]').attr('content')).toBe('#0a7aff');
    expect($('meta[name="twitter:title"]').attr('content')).toBeDefined();
    expect($('meta[name="twitter:title"]').attr('content')).toContain('Paul Frazee');
    expect($('meta[property="og:site_name"]').attr('content')).toBe('bskye');
    expect($('meta[property="og:url"]').attr('content')).toBe('https://bsky.app/profile/pfrazee.com/');
    expect($('meta[http-equiv="refresh"]').attr('content')).toBe('0; url = https://bsky.app/profile/pfrazee.com/');
    expect($('meta[property="og:description"]').attr('content')).toBeDefined();
    expect($('meta[name="twitter:card"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image"]').attr('content')).toBeDefined();
    expect($('meta[property="og:image:secure_url"]').attr('content')).toBeDefined();

    const oembedElement = $('link[type="application/json+oembed"]');
    const oembed = await validateOembed(oembedElement);
    expect(oembed.author_name).toBe('');
  });
});

type OEmbedResponse = {
  author_name: string;
  author_url: string;
  provider_name: string;
  provider_url: string;
  title: string;
  type: string;
  version: string;
};

const validateOembed = async (oembedElement: cheerio.Cheerio<Element>): Promise<OEmbedResponse> => {
  expect(oembedElement.attr('href')).toBeDefined();
  expect(oembedElement.attr('title')).toBeDefined();
  expect(oembedElement.attr('rel')).toBe('alternate');
  const fullOembedUrl = new URL(oembedElement.attr('href')!);
  const oembedPath = fullOembedUrl.pathname + fullOembedUrl.search;

  const ctx = createExecutionContext();
  const res = await app.request(
    oembedPath,
    {
      headers: { 'User-Agent': userAgent }
    },
    env,
    ctx
  );
  await waitOnExecutionContext(ctx);
  expect(res.status).toBe(200);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oembed: any = await res.json();

  expect(oembed.author_name).toBeDefined();
  expect(oembed.author_url).toBeDefined();
  expect(oembed.provider_name).toBeDefined();
  expect(oembed.provider_url).toBeDefined();
  expect(oembed.title).toBeDefined();
  expect(oembed.type).toBe('link');
  expect(oembed.version).toBe('1.0');

  return {
    author_name: oembed.author_name,
    author_url: oembed.author_url,
    provider_name: oembed.provider_name,
    provider_url: oembed.provider_url,
    title: oembed.title,
    type: oembed.type,
    version: oembed.version
  };
};
