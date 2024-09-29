import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { trimTrailingSlash } from 'hono/trailing-slash';
import { render } from './template';
import { convertPostUrlToAtPostUri } from './util';
import { getPostThread } from './bluesky';

const app = new Hono();

app.use(trimTrailingSlash());

app.get(
	'*',
	cache({
		cacheName: 'bskye',
		cacheControl: 'max-age=3600',
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
				stack: err.stack,
			},
		})
	);

	return c.json({ message: 'Internal error' }, { status: 500 });
});

app.get('/profile/:userHandler/post/:postId', async (c) => {
	const { postId, userHandler } = c.req.param();
	const postAtUri = convertPostUrlToAtPostUri(userHandler, postId);

	let postThread;
	try {
		postThread = await getPostThread(postAtUri);
	} catch (err) {
		console.error(
			JSON.stringify({
				message: 'Failed to get post from Bluesky API',
				url: c.req.url,
				error: new String(err),
			}),
			null,
			4
		);

		return c.json({ message: 'Failed to get post from Bluesky API' }, { status: 400 });
	}

	const url = new URL(c.req.url);
	return c.html(render(`${url.protocol}//${url.host}`, userHandler, postId, postThread));
});

app.get('/oembed', (c) => {
	const text = c.req.query('text');
	const postUrl = c.req.query('url');
	if (!text || !postUrl) {
		return c.json({ message: 'missing parameters' }, { status: 400 });
	}

	return c.json({
		author_name: text,
		author_url: postUrl,
		provider_name: 'bskye',
		provider_url: 'https://bskye.app/',
		title: 'bskye',
		type: 'link',
		version: '1.0',
	});
});

export default app;
