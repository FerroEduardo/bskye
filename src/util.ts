import { View as ImageView, isView as isViewImage } from '@atproto/api/dist/client/types/app/bsky/embed/images';
import {
  isMain as isRecordWithMedia,
  isView as isViewRecordWithMedia
} from '@atproto/api/dist/client/types/app/bsky/embed/recordWithMedia';
import { isMain as isMainVideo, Main as Video } from '@atproto/api/dist/client/types/app/bsky/embed/video';
import { ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';
import { isRecord } from '@atproto/api/dist/client/types/app/bsky/feed/post';

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

export function getPostVideo(thread: ThreadViewPost): Video | undefined {
  if (!isRecord(thread.post.record)) {
    return undefined;
  }

  const record = thread.post.record;
  if (isMainVideo(record.embed)) {
    return record.embed;
  }

  if (isRecordWithMedia(record.embed) && isMainVideo(record.embed.media)) {
    return record.embed.media;
  }

  return undefined;
}

export function getPostImages(thread: ThreadViewPost): ImageView | undefined {
  if (isViewImage(thread.post.embed)) {
    return thread.post.embed;
  }

  console.log({ embed: thread.post.embed });

  if (isViewRecordWithMedia(thread.post.embed) && isViewImage(thread.post.embed.media)) {
    return thread.post.embed.media;
  }

  return undefined;
}
