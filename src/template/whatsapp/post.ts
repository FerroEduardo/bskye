import { isView as isExternalView } from '@atproto/api/dist/client/types/app/bsky/embed/external';
import { isMain as isRecordWithMedia } from '@atproto/api/dist/client/types/app/bsky/embed/recordWithMedia';
import { ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { isRecord } from '@atproto/api/dist/client/types/app/bsky/feed/post';
import { escapeHtml, getPostImages, getPostVideo, getUserDisplayString } from '../../util';

function getMetaTags(host: string, userHandler: string, postId: string, thread: ThreadViewPost): string[] {
  if (!isRecord(thread.post.record)) {
    throw new Error('Post record not found');
  }
  const author = thread.post.author;
  const postUrl = `https://bsky.app/profile/${userHandler}/post/${postId}`;

  const description = thread.post.record.text ? escapeHtml(thread.post.record.text) : '';
  const title = escapeHtml(getUserDisplayString(author.displayName, author.handle));

  const metaTags = [
    `<meta charset="utf-8" />`,
    `<meta name="theme-color" content="#0a7aff" />`,
    `<meta property="og:site_name" content="bskye" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="description" content="${description}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${postUrl}" />`,
    `<meta http-equiv="refresh" content="0; url = ${postUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image">`
  ];

  const video = getPostVideo(thread);
  if (video) {
    const videoUrl = video.video.url;
    const mimeType = video.video.mimeType ?? 'video/mp4';

    metaTags.push(
      `<meta property="og:video" content="${videoUrl}" />`,
      `<meta property="og:video:secure_url" content="${videoUrl}" />`,
      `<meta property="og:video:type" content="${mimeType}" />`,
      `<meta property="og:video:width" content="0" />`,
      `<meta property="og:video:height" content="0" />`
    );

    if (isRecordWithMedia(thread.post.embed) && thread.post.embed.thumbnail) {
      metaTags.push(`<meta property="og:image" content="${thread.post.embed.thumbnail}" />`);
    }

    return metaTags;
  }

  const images = getPostImages(thread);
  if (images) {
    for (const image of images.images) {
      const imageUrl = image.url;
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
        `<meta property="og:image:alt" content="${image.alt ? escapeHtml(image.alt) : ''}" />`
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
        `<meta property="og:image:alt" content="${escapeHtml(external.title)}" />`
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
