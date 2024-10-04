import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { createMiddleware } from 'hono/factory';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { getPost, getProfile, oembed } from './routes';
import { getPlatformName } from './template';

const app = new Hono();

const setupPlatform = createMiddleware(async (c, next) => {
  const platform = getPlatformName(c.req.header('user-agent'));
  if (platform) {
    c.res.headers.set('platform-Name', platform);
  }
  c.set('platform-name', platform);
  await next();
});

const redirectToBlueskyIfNotFromAnyPlatform = createMiddleware(async (c, next) => {
  if (!c.get('platform-name')) {
    return c.redirect('https://bsky.app' + c.req.path);
  }
  await next();
});

app.use(trimTrailingSlash());

app.get(
  '*',
  setupPlatform,
  cache({
    cacheName: 'bskye',
    cacheControl: 'max-age=3600',
    keyGenerator: (c) => {
      const platform = c.get('platform-name') ?? 'discord';

      const url = new URL(c.req.url);
      url.searchParams.set('platform-name', platform);

      return url.toString();
    }
  })
);

app.onError((err, c) => {
  console.error(
    JSON.stringify({
      message: 'Internal error',
      url: c.req.url,
      error: {
        name: err.name,
        message: err.message,
        stack: err.stack
      }
    })
  );

  return c.json({ message: 'Internal error' }, { status: 500 });
});

app.get('/', (c) => {
  return c.redirect('https://github.com/FerroEduardo/bskye');
});

app.get('/profile/:userHandler/post/:postId', redirectToBlueskyIfNotFromAnyPlatform, getPost);
app.get('/profile/:userHandler', redirectToBlueskyIfNotFromAnyPlatform, getProfile);
app.get('/oembed', oembed);

export default app;
