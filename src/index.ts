import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { getPost, oembed } from './routes';

const app = new Hono();

app.use(trimTrailingSlash());

app.get(
  '*',
  cache({
    cacheName: 'bskye',
    cacheControl: 'max-age=3600'
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

app.get('/profile/:userHandler/post/:postId', getPost);
app.get('/oembed', oembed);

export default app;
