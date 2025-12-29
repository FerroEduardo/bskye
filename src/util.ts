import { toUSVString } from 'node:util';
import { BskyeGif, BskyeImage, BskyeVideo, QuotedPost } from './types';
import {
  AppBskyFeedPost,
  AppBskyFeedDefs,
  AppBskyEmbedVideo,
  AppBskyEmbedRecordWithMedia,
  AppBskyEmbedRecord,
  AppBskyEmbedImages,
  AppBskyEmbedExternal,
  AppBskyActorDefs
} from '@atproto/api';

export function convertPostUrlToAtPostUri(userHandler: string, postId: string): string {
  return `at://${userHandler}/app.bsky.feed.post/${postId}`;
}

export function generateOembedUrl(host: string, link: string, title: string, author: string, provider: string): string {
  const params = new URLSearchParams({
    author: encodeURIComponent(toUSVString(author)),
    link: encodeURIComponent(toUSVString(link)),
    title: encodeURIComponent(toUSVString(title)),
    provider: encodeURIComponent(toUSVString(provider))
  });
  return `${host}/oembed?${params}`;
}

export const metricsFormatter = Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });

export function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function unescapeHtml(text: string) {
  return text.replace(/&#34;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

export function getUserDisplayString(displayName: string | undefined, handle: string): string {
  if (displayName) {
    return `${displayName} (@${handle})`;
  }

  return `@${handle}`;
}

export function getPostVideo(thread: AppBskyFeedDefs.ThreadViewPost): BskyeVideo | undefined {
  const threadAuthor = thread.post.author;
  const record = thread.post.record;
  if (!AppBskyFeedPost.isRecord(record)) {
    return undefined;
  }

  // Video without quoted post
  if (AppBskyEmbedVideo.isMain(record.embed)) {
    const video = record.embed;
    const thumbnailUrl = AppBskyEmbedVideo.isView(thread.post.embed) ? thread.post.embed.thumbnail : undefined;
    const aspectRatio = getAspectRatio(video.aspectRatio);

    return {
      author: thread.post.author,
      video: {
        url: getVideoUrl(threadAuthor.did, video.video.ref.$link),
        thumbnailUrl: thumbnailUrl,
        aspectRatio: aspectRatio,
        mimeType: video.video.mimeType
      }
    };
  }

  // Video with quoted post
  if (AppBskyEmbedRecordWithMedia.isMain(record.embed) && AppBskyEmbedVideo.isMain(record.embed.media)) {
    const video = record.embed.media;
    const aspectRatio = getAspectRatio(video.aspectRatio);

    let thumbnailUrl: string | undefined;
    let quotedPost: QuotedPost | undefined;
    if (AppBskyEmbedRecordWithMedia.isMain(thread.post.embed)) {
      if (AppBskyEmbedVideo.isView(thread.post.embed.media)) {
        thumbnailUrl = thread.post.embed.media.thumbnail;
      }
    }

    if (AppBskyEmbedRecordWithMedia.isView(thread.post.embed)) {
      if (AppBskyEmbedRecord.isViewRecord(thread.post.embed.record.record)) {
        const quote = thread.post.embed.record.record;
        if (AppBskyFeedPost.isRecord(quote.value)) {
          quotedPost = {
            author: quote.author,
            text: quote.value.text
          };
        }
      }
    }

    return {
      author: thread.post.author,
      video: {
        url: getVideoUrl(threadAuthor.did, video.video.ref.$link),
        thumbnailUrl: thumbnailUrl,
        aspectRatio: aspectRatio,
        mimeType: video.video.mimeType
      },
      quotedPost: quotedPost
    };
  }

  // Post with no media and quoted post has video
  if (AppBskyEmbedRecord.isView(thread.post.embed) && AppBskyEmbedRecord.isViewRecord(thread.post.embed.record)) {
    const quotedRecord = thread.post.embed.record;
    const quotedVideoAuthor = quotedRecord.author;
    const quotedEmbeds = quotedRecord.embeds;

    if (quotedEmbeds && quotedEmbeds.length > 0 && AppBskyEmbedVideo.isView(quotedEmbeds[0])) {
      // TODO: add warn if has more than 1 embed
      const video = quotedEmbeds[0];

      const aspectRatio = getAspectRatio(video.aspectRatio);

      let mimeType: string | undefined;
      if (AppBskyFeedPost.isRecord(quotedRecord.value)) {
        const post = quotedRecord.value;
        if (AppBskyEmbedVideo.isMain(post.embed)) {
          const video = post.embed;
          mimeType = video.video.mimeType;
        }
      }

      return {
        author: thread.post.author,
        video: {
          url: getVideoUrl(quotedVideoAuthor.did, video.cid),
          thumbnailUrl: video.thumbnail,
          aspectRatio: aspectRatio,
          mimeType: mimeType
        },
        quotedPost: AppBskyFeedPost.isRecord(quotedRecord.value)
          ? {
              text: quotedRecord.value.text,
              author: quotedRecord.author
            }
          : undefined
      };
    }
  }

  return undefined;
}

export function getPostImages(thread: AppBskyFeedDefs.ThreadViewPost): BskyeImage | undefined {
  const threadAuthor = thread.post.author;

  // Image without quoted post
  if (AppBskyEmbedImages.isView(thread.post.embed)) {
    const image = thread.post.embed;

    const record = thread.post.record;
    const quotedPost: QuotedPost | undefined =
      AppBskyFeedPost.isRecord(record) && AppBskyEmbedRecord.isViewRecord(record.record) && AppBskyFeedPost.isRecord(record.record.value)
        ? {
            author: record.record.author,
            text: record.record.value.text
          }
        : undefined;

    return {
      author: threadAuthor,
      images: mapImages(image),
      quotedPost: quotedPost
    };
  }

  // Image with quoted post
  if (AppBskyEmbedRecordWithMedia.isView(thread.post.embed) && AppBskyEmbedImages.isView(thread.post.embed.media)) {
    const quotedRecord = thread.post.embed;
    const image = thread.post.embed.media;

    const quotedPost: QuotedPost | undefined =
      AppBskyEmbedRecord.isViewRecord(quotedRecord.record.record) && AppBskyFeedPost.isRecord(quotedRecord.record.record.value)
        ? {
            author: quotedRecord.record.record.author,
            text: quotedRecord.record.record.value.text
          }
        : undefined;

    return {
      author: threadAuthor,
      images: mapImages(image),
      quotedPost: quotedPost
    };
  }

  // Post with no media and quoted post has image
  if (AppBskyEmbedRecord.isView(thread.post.embed) && AppBskyEmbedRecord.isViewRecord(thread.post.embed.record)) {
    const quotedRecord = thread.post.embed.record;
    const quotedAuthor = quotedRecord.author;
    const quotedEmbeds = quotedRecord.embeds;
    const quotedPost: QuotedPost | undefined = AppBskyFeedPost.isRecord(quotedRecord.value)
      ? {
          author: quotedRecord.author,
          text: quotedRecord.value.text
        }
      : undefined;

    if (quotedEmbeds && quotedEmbeds.length > 0 && AppBskyEmbedImages.isView(quotedEmbeds[0])) {
      // TODO: add warn if has more than 1 embed
      const image = quotedEmbeds[0];

      return {
        author: quotedAuthor,
        images: mapImages(image),
        quotedPost: quotedPost
      };
    } else if (
      quotedEmbeds &&
      quotedEmbeds.length > 0 &&
      AppBskyEmbedRecordWithMedia.isView(quotedEmbeds[0]) &&
      AppBskyEmbedImages.isView(quotedEmbeds[0].media)
    ) {
      const image = quotedEmbeds[0].media;

      return {
        author: quotedAuthor,
        images: mapImages(image),
        quotedPost: quotedPost
      };
    }
  }

  return undefined;
}

function getVideoUrl(authorDid: string, videoCid: string) {
  const randomNumber = Math.floor(Math.random() * 100); // Prevent Discord ban/rate limit video
  return `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}&r=${randomNumber}`;
}

function getAspectRatio(aspectRatio?: { width: number; height: number }) {
  return aspectRatio ? { width: aspectRatio.width, height: aspectRatio.height } : undefined;
}

function mapImages(images: AppBskyEmbedImages.View) {
  return images.images.map((img) => {
    const imageUrl = img.fullsize;
    let mimeType = 'image/jpeg';
    const atIndex = imageUrl.lastIndexOf('@');

    if (atIndex !== -1) {
      mimeType = `image/${imageUrl.slice(atIndex + 1)}`;
    }

    return {
      url: imageUrl,
      mimeType,
      aspectRatio: getAspectRatio(img.aspectRatio),
      alt: img.alt
    };
  });
}

export function getQuotingString(author: AppBskyActorDefs.ProfileViewBasic, text: string) {
  return `\n\n🗨️Quoting: ${getUserDisplayString(author.displayName, author.handle)}\n${escapeHtml(text)}`;
}

export function getPostGif(thread: AppBskyFeedDefs.ThreadViewPost): BskyeGif | undefined {
  if (AppBskyEmbedExternal.isView(thread.post.embed)) {
    const external = thread.post.embed.external;
    const imageUrl = external.uri;

    let mimeType = 'image/jpeg';
    const atIndex = imageUrl.lastIndexOf('@');
    if (atIndex !== -1) {
      mimeType = `image/${imageUrl.slice(atIndex + 1)}`;
    }

    return {
      author: thread.post.author,
      url: imageUrl,
      mimeType: mimeType,
      aspectRatio: undefined,
      title: external.title
    };
  }

  if (AppBskyEmbedRecordWithMedia.isView(thread.post.embed) && AppBskyEmbedExternal.isView(thread.post.embed.media)) {
    const media = thread.post.embed.media;
    const external = media.external;
    const imageUrl = external.uri;

    let quotedPost: QuotedPost | undefined;
    if (AppBskyEmbedRecord.isViewRecord(thread.post.embed.record.record)) {
      const quoteRecord = thread.post.embed.record.record;
      if (AppBskyFeedPost.isRecord(quoteRecord.value)) {
        quotedPost = {
          author: quoteRecord.author,
          text: quoteRecord.value.text
        };
      }
    }

    return {
      author: thread.post.author,
      url: imageUrl,
      mimeType: 'image/jpeg',
      aspectRatio: undefined,
      title: external.title,
      quotedPost: quotedPost
    };
  }
}

/**
 * @param mediaIndex index starting from 1
 */
export function getDirectMediaLink(thread: AppBskyFeedDefs.ThreadViewPost, mediaIndex: number): string | undefined {
  if (!AppBskyFeedPost.isRecord(thread.post.record)) {
    throw new Error('Post record not found');
  }

  mediaIndex = mediaIndex - 1;

  const video = getPostVideo(thread);
  if (video) {
    const videoUrl = video.video.url;

    return videoUrl;
  }

  const images = getPostImages(thread);
  if (images) {
    let image;
    if (images.images[mediaIndex]) {
      image = images.images[mediaIndex];
    } else if (mediaIndex >= images.images.length) {
      image = images.images[images.images.length - 1];
    } else {
      image = images.images[0];
    }
    const imageUrl = image.url;

    return imageUrl;
  }

  const gif = getPostGif(thread);
  if (gif) {
    return gif.url;
  }

  return undefined;
}

export function buildPostPathFromParameters({ userHandler, postId }: { userHandler: string; postId?: string }): string {
  if (postId) {
    return `/profile/${userHandler}/post/${postId}`;
  }
  return `/profile/${userHandler}`;
}
