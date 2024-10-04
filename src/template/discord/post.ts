import { isView as isExternalView } from '@atproto/api/dist/client/types/app/bsky/embed/external';
import { isView as isViewImage } from '@atproto/api/dist/client/types/app/bsky/embed/images';
import { isMain as isMainVideo, type Main as MainVideo } from '@atproto/api/dist/client/types/app/bsky/embed/video';
import { ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { generateOembedUrl, metricsFormatter } from '../../util';

function getMetaTags(host: string, userHandler: string, postId: string, thread: ThreadViewPost): string[] {
  const author = thread.post.author;
  const postUrl = `https://bsky.app/profile/${userHandler}/post/${postId}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const description = (thread.post.record as any).text ?? '';
  const { likeCount, replyCount, repostCount } = thread.post;

  let title = '';
  if (replyCount !== undefined) {
    title += `💬 ${metricsFormatter.format(replyCount)} `;
  }
  if (repostCount !== undefined) {
    title += `🔁 ${metricsFormatter.format(repostCount)} `;
  }
  if (likeCount !== undefined) {
    title += `❤️ ${metricsFormatter.format(likeCount)}`;
  }
  const oembedJsonUrl = generateOembedUrl(host, postUrl, `${author.displayName} (@${author.handle})`, description, title);

  const metaTags = [
    `<meta charset="utf-8" />`,
    `<meta name="theme-color" content="#0a7aff" />`,
    `<meta name="twitter:title" content="${author.displayName} (@${author.handle})" />`,
    `<meta property="og:site_name" content="bskye" />`,
    `<meta property="og:url" content="${postUrl}" />`,
    `<meta http-equiv="refresh" content="0; url = ${postUrl}" />`,
    `<link rel="alternate" href="${oembedJsonUrl}" type="application/json+oembed" title="@${userHandler}" />`
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (isMainVideo((thread.post.record as any)?.embed)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const video = (thread.post.record as any)?.embed as MainVideo;
    const mimeType = video.video.mimeType;
    const videoUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${author.did}&cid=${video.video.ref}`;

    metaTags.push(
      `<meta name="twitter:card" content="player" />`,
      `<meta name="twitter:player:width" content="0" />`,
      `<meta name="twitter:player:height" content="0" />`,
      `<meta name="twitter:player:stream" content="${videoUrl}" />`,
      `<meta name="twitter:player:stream:content_type" content="${mimeType}" />`,
      `<meta property="og:video" content="${videoUrl}" />`,
      `<meta property="og:video:secure_url" content="${videoUrl}" />`,
      `<meta property="og:video:type" content="${mimeType}" />`,
      `<meta property="og:video:width" content="0" />`,
      `<meta property="og:video:height" content="0" />`
    );
    return metaTags;
  }

  if (isViewImage(thread.post.embed)) {
    for (const image of thread.post.embed.images) {
      const imageUrl = image.fullsize;
      let mimeType = 'image/jpeg';

      const atIndex = imageUrl.lastIndexOf('@');
      if (atIndex !== -1) {
        mimeType = `image/${imageUrl.slice(atIndex + 1)}`;
      }

      metaTags.push(
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta property="twitter:image" content="${imageUrl}" />`,
        `<meta property="og:image" content="${imageUrl}" />`,
        `<meta property="og:image:secure_url" content="${imageUrl}" />`,
        `<meta property="og:image:type" content="${mimeType}" />`,
        `<meta property="og:image:width" content="0" />`,
        `<meta property="og:image:height" content="0" />`,
        `<meta property="og:image:alt" content="${image.alt}" />`
      );
    }
    return metaTags;
  }

  // GIF
  if (isExternalView(thread.post.embed)) {
    const external = thread.post.embed.external;
    const imageUrl = external.uri;

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

export function render(host: string, userHandler: string, postId: string, postThread: ThreadViewPost) {
  const postUrl = `https://bsky.app/profile/${userHandler}/post/${postId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
	${getMetaTags(host, userHandler, postId, postThread).join('\n')}
</head>

<body><a href="${postUrl}">Click here</a> or wait to be redirected to the post</body>
</html>`;
}
