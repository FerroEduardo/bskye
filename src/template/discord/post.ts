import {
  escapeHtml,
  generateOembedUrl,
  getPostGif,
  getPostImages,
  getPostVideo,
  getQuotingString,
  getUserDisplayString,
  metricsFormatter
} from '../../util';
import { AppBskyFeedPost, AppBskyFeedDefs, AppBskyEmbedRecord } from '@atproto/api';

function getMetaTags(host: string, userHandler: string, postId: string, thread: AppBskyFeedDefs.ThreadViewPost): string[] {
  if (!AppBskyFeedPost.isRecord(thread.post.record)) {
    throw new Error('Post record not found');
  }
  const author = thread.post.author;
  const postUrl = `https://bsky.app/profile/${userHandler}/post/${postId}`;
  let description = escapeHtml(thread.post.record.text ?? '');
  let oembedDescription = description.slice(0, 250);
  const { likeCount, replyCount, repostCount } = thread.post;

  const userDisplayString = escapeHtml(getUserDisplayString(author.displayName, author.handle));

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

  const metaTags = [
    `<meta charset="utf-8" />`,
    `<meta name="theme-color" content="#0a7aff" />`,
    `<meta name="twitter:title" content="${userDisplayString}" />`,
    `<meta property="og:site_name" content="bskye" />`,
    `<meta property="og:url" content="${postUrl}" />`,
    `<meta http-equiv="refresh" content="0; url = ${postUrl}" />`
  ];

  // TODO: if post text is empty, try to use the text from quote (if present)

  const video = getPostVideo(thread);
  if (video) {
    const videoUrl = video.video.url;
    const mimeType = video.video.mimeType ?? 'video/mp4';

    if (video.quotedPost && video.quotedPost.text.length > 0) {
      const quotedPost = video.quotedPost;
      oembedDescription += getQuotingString(quotedPost.author, escapeHtml(quotedPost.text));
    }

    const oembedJsonUrl = generateOembedUrl(host, postUrl, userDisplayString, oembedDescription.slice(0, 250), title);

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
      `<meta property="og:video:height" content="0" />`,
      `<link rel="alternate" href="${oembedJsonUrl}" type="application/json+oembed" title="@${escapeHtml(userHandler)}" />`
    );
    return metaTags;
  }

  const oembedJsonUrl = generateOembedUrl(host, postUrl, userDisplayString, '', title);
  metaTags.push(`<link rel="alternate" href="${oembedJsonUrl}" type="application/json+oembed" title="@${escapeHtml(userHandler)}" />`);

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
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta property="twitter:image" content="${imageUrl}" />`,
        `<meta property="og:image" content="${imageUrl}" />`,
        `<meta property="og:image:secure_url" content="${imageUrl}" />`,
        `<meta property="og:image:type" content="${mimeType}" />`,
        `<meta property="og:image:width" content="0" />`,
        `<meta property="og:image:height" content="0" />`,
        `<meta property="og:image:alt" content="${image.alt ? escapeHtml(image.alt) : ''}" />`
      );
    }
    return metaTags;
  }

  // GIF
  const gif = getPostGif(thread);
  if (gif) {
    if (gif.quotedPost && gif.quotedPost.text.length > 0) {
      const quotedPost = gif.quotedPost;
      description += getQuotingString(quotedPost.author, escapeHtml(quotedPost.text));
    }

    metaTags.push(
      `<meta property="og:description" content="${description}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta property="twitter:image" content="${gif.url}" />`,
      `<meta property="og:image" content="${gif.url}" />`,
      `<meta property="og:image:secure_url" content="${gif.url}" />`,
      `<meta property="og:image:type" content="image/jpeg" />`,
      `<meta property="og:image:width" content="0" />`,
      `<meta property="og:image:height" content="0" />`,
      `<meta property="og:image:alt" content="${escapeHtml(gif.title)}" />`
    );
    return metaTags;
  }

  if (AppBskyEmbedRecord.isView(thread.post.embed) && AppBskyEmbedRecord.isViewRecord(thread.post.embed.record)) {
    const quotedPost = thread.post.embed.record;
    if (AppBskyFeedPost.isRecord(quotedPost.value)) {
      description += getQuotingString(quotedPost.author, escapeHtml(quotedPost.value.text));
    }
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
