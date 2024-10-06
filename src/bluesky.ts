import { type ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { isThreadViewPost, type ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

export async function getPostThread(postAtUri: string): Promise<ThreadViewPost> {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${postAtUri}&depth=0&parentHeight`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'br, gzip'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = (await response.json()) as any;

  if (!isThreadViewPost(body?.thread)) {
    throw new Error('invalid post');
  }

  return body.thread;
}

export async function getProfile(actor: string): Promise<ProfileViewDetailed> {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${actor}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'br, gzip'
    }
  });

  if (!response.ok) {
    if (response.status === 400) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body = (await response.json()) as any;
      if (body.message === 'Profile not found') {
        throw new Error(body.message);
      }
    }
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const body = (await response.json()) as ProfileViewDetailed;

  return body;
}
