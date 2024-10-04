import { isView as isExternalView } from '@atproto/api/dist/client/types/app/bsky/embed/external';
import { isView as isViewImage } from '@atproto/api/dist/client/types/app/bsky/embed/images';
import { isMain as isMainVideo, isView as isVideoView, type Main as MainVideo } from '@atproto/api/dist/client/types/app/bsky/embed/video';
import { ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

function getMetaTags(host: string, userHandler: string, postId: string, thread: ThreadViewPost): string[] {
  const author = thread.post.author;
  const postUrl = `https://bsky.app/profile/${userHandler}/post/${postId}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const description = (thread.post.record as any).text ?? '';

  const metaTags = [
    `<meta charset="utf-8" />`,
    `<meta name="theme-color" content="#0a7aff" />`,
    `<meta property="og:site_name" content="bskye" />`,
    `<meta property="og:title" content="${author.displayName} (@${author.handle})" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${postUrl}" />`,
    `<meta http-equiv="refresh" content="0; url = ${postUrl}" />`
  ];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (isMainVideo((thread.post.record as any)?.embed) && isVideoView(thread.post.embed)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const video = (thread.post.record as any)?.embed as MainVideo;
    const mimeType = video.video.mimeType;
    const videoUrl = `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${author.did}&cid=${video.video.ref}`;

    metaTags.push(
      `<meta property="og:video" content="${videoUrl}" />`,
      `<meta property="og:video:secure_url" content="${videoUrl}" />`,
      `<meta property="og:video:type" content="${mimeType}" />`,
      `<meta property="og:video:width" content="0" />`,
      `<meta property="og:video:height" content="0" />`
    );

    const videoEmbed = thread.post.embed;
    if (videoEmbed.thumbnail) {
      metaTags.push(`<meta property="og:image" content="${videoEmbed.thumbnail}" />`);
    }

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
        `<meta property="og:image" content="${imageUrl}" />`,
        `<meta property="og:image:secure_url" content="${imageUrl}" />`,
        `<meta property="og:image:type" content="${mimeType}" />`,
        `<meta property="og:image:width" content="600" />`,
        `<meta property="og:image:height" content="600" />`,
        `<meta property="og:image:alt" content="${image.alt}" />`
      );
    }
    return metaTags;
  }

  // GIF
  if (isExternalView(thread.post.embed)) {
    const external = thread.post.embed.external;
    const imageUrl = external.thumb;

    if (imageUrl) {
      let mimeType = 'image/jpeg';

      const atIndex = imageUrl.lastIndexOf('@');
      if (atIndex !== -1) {
        mimeType = `image/${imageUrl.slice(atIndex + 1)}`;
      }

      metaTags.push(
        `<meta property="og:image" content="${imageUrl}" />`,
        `<meta property="og:image:secure_url" content="${imageUrl}" />`,
        `<meta property="og:image:type" content="${mimeType}" />`,
        `<meta property="og:image:width" content="600" />`,
        `<meta property="og:image:height" content="600" />`,
        `<meta property="og:image:alt" content="${external.title}" />`
      );
      return metaTags;
    }
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
