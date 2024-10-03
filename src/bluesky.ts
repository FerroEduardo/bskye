import { Agent, CredentialSession } from '@atproto/api';
import { type ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { isThreadViewPost, type ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

const agent = new Agent(new CredentialSession(new URL('https://public.api.bsky.app')));

export async function getPostThread(postAtUri: string): Promise<ThreadViewPost> {
  const res = await agent.getPostThread({
    uri: postAtUri,
    depth: 0,
    parentHeight: 0
  });

  if (!res.success) {
    throw new Error(JSON.stringify(res));
  }

  if (!isThreadViewPost(res.data.thread)) {
    throw new Error('Post is invalid');
  }

  return res.data.thread;
}

export async function getProfile(actor: string): Promise<ProfileViewDetailed> {
  const res = await agent.getProfile({
    actor
  });

  if (!res.success) {
    throw new Error(JSON.stringify(res));
  }

  return res.data;
}
