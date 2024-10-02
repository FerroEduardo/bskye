import { Profile } from '../types';
import { generateOembedUrl } from '../util';

function getMetaTags(host: string, profile: Profile): string[] {
  const profileUrl = `https://bsky.app/profile/${profile.handle}/`;
  const description = profile.description ?? '';
  const title = '';
  const oembedJsonUrl = generateOembedUrl(host, profileUrl, `${profile.displayName} (@${profile.handle})`, description, title);

  const metaTags = [
    `<meta charset="utf-8" />`,
    `<meta name="theme-color" content="#0a7aff" />`,
    `<meta name="twitter:title" content="${profile.displayName} (@${profile.handle})" />`,
    `<meta property="og:site_name" content="bskye" />`,
    `<meta property="og:url" content="${profileUrl}" />`,
    `<meta http-equiv="refresh" content="0; url = ${profileUrl}" />`,
    `<link rel="alternate" href="${oembedJsonUrl}" type="application/json+oembed" title="@${profile.handle}" />`
  ];

  if (profile.avatar) {
    metaTags.push(
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta property="twitter:image" content="${profile.avatar}" />`,
      `<meta property="og:image" content="${profile.avatar}" />`,
      `<meta property="og:image:secure_url" content="${profile.avatar}" />`,
      `<meta property="og:image:type" content="image/jpeg" />`,
      `<meta property="og:image:width" content="0" />`,
      `<meta property="og:image:height" content="0" />`,
      `<meta property="og:image:alt" content="${profile.displayName}" />`
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
