export function convertPostUrlToAtPostUri(userHandler: string, postId: string): string {
  return `at://${userHandler}/app.bsky.feed.post/${postId}`;
}

export function generateOembedUrl(host: string, link: string, title: string, author: string, provider: string): string {
  const params = new URLSearchParams({ author, link, title, provider });
  return `${host}/oembed?${params}`;
}

export const metricsFormatter = Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

export function escapeHtml(text: string) {
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function getUserDisplayString(displayName: string | undefined, handle: string): string {
  if (displayName) {
    return `${displayName} (@${handle})`;
  }

  return `@${handle}`;
}
