import { AppBskyFeedPost, AppBskyFeedDefs, AppBskyEmbedRecordWithMedia } from '@atproto/api';
import { escapeHtml, getPostGif, getPostImages, getPostVideo, getQuotingString, getUserDisplayString } from '../../util';

function getMetaTags(host: string, userHandler: string, postId: string, thread: AppBskyFeedDefs.ThreadViewPost): string[] {
  if (!AppBskyFeedPost.isRecord(thread.post.record)) {
    throw new Error('Post record not found');
  }
  const author = thread.post.author;
  const postUrl = `https://bsky.app/profile/${userHandler}/post/${postId}`;

  let description = thread.post.record.text ? escapeHtml(thread.post.record.text) : '';
  const title = escapeHtml(getUserDisplayString(author.displayName, author.handle));

  const metaTags = [
    `<meta charset="utf-8" />`,
    `<meta name="theme-color" content="#0a7aff" />`,
    `<meta property="og:site_name" content="bskye" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="description" content="${description}" />`,
    `<meta property="og:url" content="${postUrl}" />`,
    `<meta http-equiv="refresh" content="0; url = ${postUrl}" />`,
    `<meta name="twitter:card" content="summary_large_image">`
  ];

  // TODO: if post text is empty, try to use the text from quote (if present)

  const video = getPostVideo(thread);
  if (video) {
    const videoUrl = video.video.url;
    const mimeType = video.video.mimeType ?? 'video/mp4';

    if (video.quotedPost && video.quotedPost.text.length > 0) {
      const quotedPost = video.quotedPost;
      description += getQuotingString(quotedPost.author, escapeHtml(quotedPost.text));
    }

    metaTags.push(
      `<meta property="og:description" content="${description}" />`,
      `<meta property="og:video" content="${videoUrl}" />`,
      `<meta property="og:video:secure_url" content="${videoUrl}" />`,
      `<meta property="og:video:type" content="${mimeType}" />`,
      `<meta property="og:video:width" content="0" />`,
      `<meta property="og:video:height" content="0" />`
    );

    if (AppBskyEmbedRecordWithMedia.isMain(thread.post.embed) && thread.post.embed.thumbnail) {
      metaTags.push(`<meta property="og:image" content="${thread.post.embed.thumbnail}" />`);
    }

    return metaTags;
  }

  const images = getPostImages(thread);
  if (images) {
    if (images.quotedPost && images.quotedPost.text.length > 0) {
      const quotedPost = images.quotedPost;
      description += getQuotingString(quotedPost.author, escapeHtml(quotedPost.text));
    }

    metaTags.push(`<meta property="og:description" content="${description}" />`);

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
  const gif = getPostGif(thread);
  if (gif) {
    metaTags.push(
      `<meta property="og:image" content="${gif.url}" />`,
      `<meta property="og:image:secure_url" content="${gif.url}" />`,
      `<meta property="og:image:type" content="${gif.mimeType}" />`,
      `<meta property="og:image:width" content="600" />`,
      `<meta property="og:image:height" content="600" />`,
      `<meta property="og:image:alt" content="${escapeHtml(gif.title)}" />`
    );
    return metaTags;
  }

  metaTags.push(`<meta property="og:description" content="${description}" />`);

  return metaTags;
}

export function render(host: string, userHandler: string, postId: string, postThread: AppBskyFeedDefs.ThreadViewPost) {
  const postUrl = `https://bsky.app/profile/${userHandler}/post/${postId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
	${getMetaTags(host, userHandler, postId, postThread).join('\n')}
</head>

<body><a href="${postUrl}">Click here</a> or wait to be redirected to the post</body>
</html>`;
}
