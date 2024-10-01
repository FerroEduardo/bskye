export function convertPostUrlToAtPostUri(userHandler: string, postId: string): string {
	return `at://${userHandler}/app.bsky.feed.post/${postId}`;
}

export function generateOembedUrl(host: string, link: string, title: string, author: string, provider: string): string {
	return `${host}/oembed?author=${encodeURIComponent(author)}&link=${encodeURIComponent(link)}&title=${encodeURIComponent(
		title
	)}&provider=${encodeURIComponent(provider)}`;
}
