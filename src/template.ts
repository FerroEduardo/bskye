import { ThreadViewPost } from './types';

function getMetaTags(host: string, userHandler: string, postId: string, post: ThreadViewPost): string[] {
	const author = post.thread.post.author;
	const postUrl = `https://bsky.app/profile/${userHandler}/post/${postId}`;
	const description = post.thread.post.record.text;

	const metaTags = [
		`<meta charset="utf-8" />`,
		`<meta name="theme-color" content="#0a7aff" />`,
		`<meta name="twitter:title" content="@${userHandler}" />`,
		`<meta property="og:site_name" content="bskye" />`,
		`<meta property="og:url" content="${postUrl}" />`,
		`<meta property="og:description" content="${description}" />`,
		`<meta http-equiv="refresh" content="0; url = ${postUrl}" />`,
	];

	if (post.thread.post.record.embed?.video) {
		const video = post.thread.post.record.embed.video;
		const videoUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${author.did}&cid=${video.ref.$link}`;
		const oembedJsonUrl = `${host}/oembed?text=${encodeURIComponent(description)}&url=${postUrl}`;

		metaTags.push(
			`<meta name="twitter:card" content="player" />`,
			`<meta name="twitter:player:width" content="0" />`,
			`<meta name="twitter:player:height" content="0" />`,
			`<meta name="twitter:player:stream" content="${videoUrl}" />`,
			`<meta name="twitter:player:stream:content_type" content="${video.mimeType}" />`,
			`<meta property="og:video" content="${videoUrl}" />`,
			`<meta property="og:video:secure_url" content="${videoUrl}" />`,
			`<meta property="og:video:type" content="${video.mimeType}" />`,
			`<meta property="og:video:width" content="0" />`,
			`<meta property="og:video:height" content="0" />`,
			`<link rel="alternate" href="${oembedJsonUrl}" type="application/json+oembed" title="@${userHandler}" />`
		);
		return metaTags;
	}

	if (post.thread.post.record.embed?.images) {
		for (const image of post.thread.post.record.embed.images) {
			const imageUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${author.did}&cid=${image.image.ref.$link}`;

			metaTags.push(
				`<meta name="twitter:card" content="summary_large_image" />`,
				`<meta property="twitter:image" content="${imageUrl}" />`,
				`<meta property="og:image" content="${imageUrl}" />`,
				`<meta property="og:image:secure_url" content="${imageUrl}" />`,
				`<meta property="og:image:type" content="${image.image.mimeType}" />`,
				`<meta property="og:image:width" content="0" />`,
				`<meta property="og:image:height" content="0" />`,
				`<meta property="og:image:alt" content="${image.alt}" />`
			);
		}
		return metaTags;
	}

	// GIF
	if (post.thread.post.record.embed?.external && post.thread.post.record.embed.external.thumb) {
		const external = post.thread.post.record.embed.external;
		let imageUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${author.did}&cid=${post.thread.post.record.embed.external.thumb.ref.$link}`;

		if (external.uri.includes('tenor.com')) {
			imageUrl = external.uri;
		}
		metaTags.push(
			`<meta name="twitter:card" content="summary_large_image" />`,
			`<meta property="twitter:image" content="${imageUrl}" />`,
			`<meta property="og:image" content="${imageUrl}" />`,
			`<meta property="og:image:secure_url" content="${imageUrl}" />`,
			`<meta property="og:image:type" content="image/jpeg" />`,
			`<meta property="og:image:width" content="0" />`,
			`<meta property="og:image:height" content="0" />`,
			`<meta property="og:image:alt" content="${external.title}" />`
		);
		return metaTags;
	}

	return metaTags;
}

export function render(host: string, userHandler: string, postId: string, post: ThreadViewPost) {
	const postUrl = `https://bsky.app/profile/${userHandler}/post/${postId}`;

	return `<!DOCTYPE html>
<html lang="en">
<head>
	${getMetaTags(host, userHandler, postId, post).join('\n')}
</head>

<body><a href="${postUrl}">Click here</a> or wait to be redirected to the post</body>
</html>`;
}
