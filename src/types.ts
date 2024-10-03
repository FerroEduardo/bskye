import { type OutputSchema as Profile } from '@atproto/api/dist/client/types/app/bsky/actor/getProfile';
import { type ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

export interface Platform {
  renderPost(host: string, userHandler: string, postId: string, postThread: ThreadViewPost): string;
  renderProfile(host: string, profile: Profile): string;
}
