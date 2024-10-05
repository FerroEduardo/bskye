import { type OutputSchema as Profile } from '@atproto/api/dist/client/types/app/bsky/actor/getProfile';
import { escapeHtml, getUserDisplayString } from '../../util';

function getMetaTags(host: string, profile: Profile): string[] {
  const profileUrl = `https://bsky.app/profile/${profile.handle}/`;
  const description = profile.description ? escapeHtml(profile.description) : '';
  const title = escapeHtml(getUserDisplayString(profile.displayName, profile.handle));

  const metaTags = [
    `<meta charset="utf-8" />`,
    `<meta name="theme-color" content="#0a7aff" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:site_name" content="bskye" />`,
    `<meta property="og:url" content="${profileUrl}" />`,
    `<meta http-equiv="refresh" content="0; url = ${profileUrl}" />`
  ];

  if (profile.avatar) {
    metaTags.push(
      `<meta property="og:image" content="${profile.avatar}" />`,
      `<meta property="og:image:secure_url" content="${profile.avatar}" />`,
      `<meta property="og:image:type" content="image/jpeg" />`,
      `<meta property="og:image:width" content="600" />`,
      `<meta property="og:image:height" content="600" />`,
      `<meta property="og:image:alt" content="${profile.displayName ? escapeHtml(profile.displayName) : ''}" />`
    );
  }

  return metaTags;
}

export function render(host: string, profile: Profile) {
  const profileUrl = `https://bsky.app/profile/${profile.handle}/`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
	${getMetaTags(host, profile).join('\n')}
</head>

<body><a href="${profileUrl}">Click here</a> or wait to be redirected to the post</body>
</html>`;
}
