import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { isView as isExternalView } from '@atproto/api/dist/client/types/app/bsky/embed/external';
import { isView as isViewImage, View as ViewImage } from '@atproto/api/dist/client/types/app/bsky/embed/images';
import { isView as isRecordView, isViewRecord } from '@atproto/api/dist/client/types/app/bsky/embed/record';
import {
  isMain as isRecordWithMedia,
  isView as isViewRecordWithMedia
} from '@atproto/api/dist/client/types/app/bsky/embed/recordWithMedia';
import { isMain as isMainVideo, isView as isViewVideo } from '@atproto/api/dist/client/types/app/bsky/embed/video';
import { ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { isRecord as isPostRecord } from '@atproto/api/dist/client/types/app/bsky/feed/post';
import { BskyeGif, BskyeImage, BskyeVideo, QuotedPost } from './types';

export function convertPostUrlToAtPostUri(userHandler: string, postId: string): string {
  return `at://${userHandler}/app.bsky.feed.post/${postId}`;
}

export function generateOembedUrl(host: string, link: string, title: string, author: string, provider: string): string {
  const params = new URLSearchParams({
    author: encodeURIComponent(author),
    link: encodeURIComponent(link),
    title: encodeURIComponent(title),
    provider: encodeURIComponent(provider)
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

export function getPostVideo(thread: ThreadViewPost): BskyeVideo | undefined {
  const threadAuthor = thread.post.author;
  const record = thread.post.record;
  if (!isPostRecord(record)) {
    return undefined;
  }

  // Video without quoted post
  if (isMainVideo(record.embed)) {
    const video = record.embed;
    const thumbnailUrl = isViewVideo(thread.post.embed) ? thread.post.embed.thumbnail : undefined;
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
  if (isRecordWithMedia(record.embed) && isMainVideo(record.embed.media)) {
    const video = record.embed.media;
    const aspectRatio = getAspectRatio(video.aspectRatio);

    let thumbnailUrl: string | undefined;
    let quotedPost: QuotedPost | undefined;
    if (isRecordWithMedia(thread.post.embed)) {
      if (isViewVideo(thread.post.embed.media)) {
        thumbnailUrl = thread.post.embed.media.thumbnail;
      }
    }

    if (isViewRecordWithMedia(thread.post.embed)) {
      if (isViewRecord(thread.post.embed.record.record)) {
        const quote = thread.post.embed.record.record;
        if (isPostRecord(quote.value)) {
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
  if (isRecordView(thread.post.embed) && isViewRecord(thread.post.embed.record)) {
    const quotedRecord = thread.post.embed.record;
    const quotedVideoAuthor = quotedRecord.author;
    const quotedEmbeds = quotedRecord.embeds;

    if (quotedEmbeds && quotedEmbeds.length > 0 && isViewVideo(quotedEmbeds[0])) {
      // TODO: add warn if has more than 1 embed
      const video = quotedEmbeds[0];

      const aspectRatio = getAspectRatio(video.aspectRatio);

      let mimeType: string | undefined;
      if (isPostRecord(quotedRecord.value)) {
        const post = quotedRecord.value;
        if (isMainVideo(post.embed)) {
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
        quotedPost: isPostRecord(quotedRecord.value)
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

export function getPostImages(thread: ThreadViewPost): BskyeImage | undefined {
  const threadAuthor = thread.post.author;

  // Image without quoted post
  if (isViewImage(thread.post.embed)) {
    const image = thread.post.embed;

    const record = thread.post.record;
    const quotedPost: QuotedPost | undefined =
      isPostRecord(record) && isViewRecord(record.record) && isPostRecord(record.record.value)
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
  if (isViewRecordWithMedia(thread.post.embed) && isViewImage(thread.post.embed.media)) {
    const quotedRecord = thread.post.embed;
    const image = thread.post.embed.media;

    const quotedPost: QuotedPost | undefined =
      isViewRecord(quotedRecord.record.record) && isPostRecord(quotedRecord.record.record.value)
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
  if (isRecordView(thread.post.embed) && isViewRecord(thread.post.embed.record)) {
    const quotedRecord = thread.post.embed.record;
    const quotedAuthor = quotedRecord.author;
    const quotedEmbeds = quotedRecord.embeds;
    const quotedPost: QuotedPost | undefined = isPostRecord(quotedRecord.value)
      ? {
          author: quotedRecord.author,
          text: quotedRecord.value.text
        }
      : undefined;

    if (quotedEmbeds && quotedEmbeds.length > 0 && isViewImage(quotedEmbeds[0])) {
      // TODO: add warn if has more than 1 embed
      const image = quotedEmbeds[0];

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

function mapImages(images: ViewImage) {
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

export function getQuotingString(author: ProfileViewBasic, text: string) {
  return `\n\n🗨️Quoting: ${getUserDisplayString(author.displayName, author.handle)}\n${escapeHtml(text)}`;
}

export function getPostGif(thread: ThreadViewPost): BskyeGif | undefined {
  if (isExternalView(thread.post.embed)) {
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

  if (isViewRecordWithMedia(thread.post.embed) && isExternalView(thread.post.embed.media)) {
    const media = thread.post.embed.media;
    const external = media.external;
    const imageUrl = external.uri;

    let quotedPost: QuotedPost | undefined;
    if (isViewRecord(thread.post.embed.record.record)) {
      const quoteRecord = thread.post.embed.record.record;
      if (isPostRecord(quoteRecord.value)) {
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
