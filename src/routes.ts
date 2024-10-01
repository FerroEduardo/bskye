import { Context } from "hono";
import { convertPostUrlToAtPostUri } from "./util";
import { getPostThread } from "./bluesky";
import { render } from "./template";

export async function getPost(c: Context) {
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
}

export async function oembed(c: Context) {
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
}