export function convertPostUrlToAtPostUri(userHandler: string, postId: string): string {
	return `at://${userHandler}/app.bsky.feed.post/${postId}`;
}
