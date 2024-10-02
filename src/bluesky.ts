import { Profile, ThreadViewPost } from './types';

export async function getPostThread(postAtUri: string): Promise<ThreadViewPost> {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${postAtUri}&depth=0&parentHeight`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  const body = await response.json();

  return body as ThreadViewPost;
}

export async function getProfile(actor: string): Promise<Profile> {
  const url = `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${actor}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
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

  const body = await response.json();

  return body as Profile;
}
