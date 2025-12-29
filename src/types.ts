import { AppBskyFeedDefs, AppBskyActorGetProfile, AppBskyActorDefs } from '@atproto/api';

export interface Platform {
  renderPost(host: string, userHandler: string, postId: string, postThread: AppBskyFeedDefs.ThreadViewPost): string;
  renderProfile(host: string, profile: AppBskyActorGetProfile.OutputSchema): string;
}

export interface BskyeVideo {
  author: AppBskyActorDefs.ProfileViewBasic;
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
  author: AppBskyActorDefs.ProfileViewBasic;
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

export interface BskyeGif {
  author: AppBskyActorDefs.ProfileViewBasic;
  url: string;
  mimeType: string | undefined;
  aspectRatio?: {
    width: number;
    height: number;
  };
  title: string;
  quotedPost?: QuotedPost;
}

export interface QuotedPost {
  author: AppBskyActorDefs.ProfileViewBasic;
  text: string;
}
