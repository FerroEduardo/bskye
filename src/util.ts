import { isView as isViewImage } from '@atproto/api/dist/client/types/app/bsky/embed/images';
import { isView as isRecordView, isViewRecord } from '@atproto/api/dist/client/types/app/bsky/embed/record';
import {
  isMain as isRecordWithMedia,
  isView as isViewRecordWithMedia
} from '@atproto/api/dist/client/types/app/bsky/embed/recordWithMedia';
import { isMain as isMainVideo, isView as isViewVideo } from '@atproto/api/dist/client/types/app/bsky/embed/video';
import { ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { isRecord as isPostRecord } from '@atproto/api/dist/client/types/app/bsky/feed/post';
import { BskyeImage, BskyeVideo } from './types';

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
    let aspectRatio;
    if (video.aspectRatio) {
      aspectRatio = {
        width: video.aspectRatio.width,
        height: video.aspectRatio.height
      };
    }

    return {
      author: thread.post.author,
      video: {
        url: getVideoUrl(threadAuthor.did, video.video.ref),
        thumbnailUrl: thumbnailUrl,
        aspectRatio: aspectRatio,
        mimeType: video.video.mimeType
      }
    };
  }

  // Video with quoted post
  if (isRecordWithMedia(record.embed) && isMainVideo(record.embed.media)) {
    const video = record.embed.media;
    let aspectRatio;
    if (video.aspectRatio) {
      aspectRatio = {
        width: video.aspectRatio.width,
        height: video.aspectRatio.height
      };
    }

    let thumbnailUrl: string | undefined;
    if (isRecordWithMedia(thread.post.embed) && isViewVideo(thread.post.embed.media)) {
      thumbnailUrl = thread.post.embed.media.thumbnail;
    }

    return {
      author: thread.post.author,
      video: {
        url: getVideoUrl(threadAuthor.did, video.video.ref),
        thumbnailUrl: thumbnailUrl,
        aspectRatio: aspectRatio,
        mimeType: video.video.mimeType
      }
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

      let aspectRatio;
      if (video.aspectRatio) {
        aspectRatio = {
          width: video.aspectRatio.width,
          height: video.aspectRatio.height
        };
      }

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
        }
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

    return {
      author: threadAuthor,
      images: image.images.map((img) => {
        const imageUrl = img.fullsize;
        let mimeType = 'image/jpeg';

        const atIndex = imageUrl.lastIndexOf('@');
        if (atIndex !== -1) {
          mimeType = `image/${imageUrl.slice(atIndex + 1)}`;
        }

        let aspectRatio;
        if (img.aspectRatio) {
          aspectRatio = {
            width: img.aspectRatio.width,
            height: img.aspectRatio.height
          };
        }

        return {
          url: img.fullsize,
          mimeType: mimeType,
          aspectRatio: aspectRatio,
          alt: img.alt
        };
      })
    };
  }

  // Image with quoted post
  if (isViewRecordWithMedia(thread.post.embed) && isViewImage(thread.post.embed.media)) {
    const image = thread.post.embed.media;

    return {
      author: threadAuthor,
      images: image.images.map((img) => {
        const imageUrl = img.fullsize;
        let mimeType = 'image/jpeg';

        const atIndex = imageUrl.lastIndexOf('@');
        if (atIndex !== -1) {
          mimeType = `image/${imageUrl.slice(atIndex + 1)}`;
        }

        let aspectRatio;
        if (img.aspectRatio) {
          aspectRatio = {
            width: img.aspectRatio.width,
            height: img.aspectRatio.height
          };
        }

        return {
          url: img.fullsize,
          mimeType: mimeType,
          aspectRatio: aspectRatio,
          alt: img.alt
        };
      })
    };
  }

  // Post with no media and quoted post has image
  if (isRecordView(thread.post.embed) && isViewRecord(thread.post.embed.record)) {
    const quotedRecord = thread.post.embed.record;
    const quotedAuthor = quotedRecord.author;
    const quotedEmbeds = quotedRecord.embeds;

    if (quotedEmbeds && quotedEmbeds.length > 0 && isViewImage(quotedEmbeds[0])) {
      // TODO: add warn if has more than 1 embed
      const image = quotedEmbeds[0];

      return {
        author: quotedAuthor,
        images: image.images.map((img) => {
          const imageUrl = img.fullsize;
          let mimeType = 'image/jpeg';

          const atIndex = imageUrl.lastIndexOf('@');
          if (atIndex !== -1) {
            mimeType = `image/${imageUrl.slice(atIndex + 1)}`;
          }

          let aspectRatio;
          if (img.aspectRatio) {
            aspectRatio = {
              width: img.aspectRatio.width,
              height: img.aspectRatio.height
            };
          }

          return {
            url: img.fullsize,
            mimeType: mimeType,
            aspectRatio: aspectRatio,
            alt: img.alt
          };
        })
      };
    }
  }

  return undefined;
}

function getVideoUrl(authorDid: string, videoCid: string) {
  return `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${authorDid}&cid=${videoCid}`;
}
