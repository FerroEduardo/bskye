import { AppBskyFeedDefs, AppBskyActorDefs } from '@atproto/api';

export async function getPostThread(postAtUri: string): Promise<AppBskyFeedDefs.ThreadViewPost> {
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

  if (!AppBskyFeedDefs.isThreadViewPost(body?.thread)) {
    throw new Error('invalid post');
  }

  return body.thread;
}

export async function getProfile(actor: string): Promise<AppBskyActorDefs.ProfileViewDetailed> {
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

  const body = (await response.json()) as AppBskyActorDefs.ProfileViewDetailed;

  return body;
}
