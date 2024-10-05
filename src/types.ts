import { ProfileViewBasic } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
import { type OutputSchema as Profile } from '@atproto/api/dist/client/types/app/bsky/actor/getProfile';
import { type ThreadViewPost } from '@atproto/api/dist/client/types/app/bsky/feed/defs';

export interface Platform {
  renderPost(host: string, userHandler: string, postId: string, postThread: ThreadViewPost): string;
  renderProfile(host: string, profile: Profile): string;
}

export interface BskyeVideo {
  author: ProfileViewBasic;
  video: {
    url: string;
    mimeType: string | undefined;
    thumbnailUrl: string | undefined;
    aspectRatio?: {
      width: number;
      height: number;
    };
  };
  quotedPost?: QuotedPost;
}

export interface BskyeImage {
  author: ProfileViewBasic;
  images: {
    url: string;
    mimeType: string | undefined;
    aspectRatio?: {
      width: number;
      height: number;
    };
    alt: string | undefined;
  }[];
  quotedPost?: QuotedPost;
}

export interface QuotedPost {
  author: ProfileViewBasic;
  text: string;
}
