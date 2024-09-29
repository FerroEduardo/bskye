import { ThreadViewPost } from './types';

export async function getPostThread(postAtUri: string): Promise<ThreadViewPost> {
	const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${postAtUri}&depth=0&parentHeight`;
	const response = await fetch(url, {
		method: 'GET',
		headers: {
			Accept: 'application/json',
		},
	});

	if (!response.ok) {
		throw new Error(`HTTP error! Status: ${response.status}`);
	}

	const body = await response.json();

	return body as ThreadViewPost;
}
