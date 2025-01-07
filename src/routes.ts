import { Context } from 'hono';
import { getPostThread, getProfile as getProfileData } from './bluesky';
import { getPlatform } from './template';
import { convertPostUrlToAtPostUri, getDirectMediaLink, unescapeHtml } from './util';

export async function getPost(c: Context) {
  const { postId, userHandler, mediaIndex } = c.req.param();
  const postAtUri = convertPostUrlToAtPostUri(userHandler, postId.match('[^|]+')?.[0] ?? postId);

  let postThread;
  try {
    postThread = await getPostThread(postAtUri);
  } catch (err) {
    console.error(
      JSON.stringify({
        message: 'Failed to get post from Bluesky API',
        url: c.req.url,
        error: new String(err)
      }),
      null,
      4
    );

    return c.json({ message: 'Failed to get post from Bluesky API' }, { status: 400 });
  }

  if (c.get('is-direct-media') === true) {
    const index = Number.parseInt(mediaIndex);
    const mediaLink = getDirectMediaLink(postThread, index);

    if (mediaLink) {
      return c.redirect(mediaLink);
    }
  }

  const url = new URL(c.req.url);
  const platform = getPlatform(c.get('platform-name'));
  return c.html(platform.renderPost(`${url.protocol}//${url.host}`, userHandler, postId, postThread));
}

export async function getProfile(c: Context) {
  const { userHandler } = c.req.param();

  let user;
  try {
    user = await getProfileData(userHandler.match('[^|]+')?.[0] ?? userHandler);
  } catch (err) {
    console.error(
      JSON.stringify({
        message: 'Failed to get user from Bluesky API',
        url: c.req.url,
        error: new String(err)
      }),
      null,
      4
    );

    return c.json({ message: 'Failed to get user from Bluesky API' }, { status: 400 });
  }

  const url = new URL(c.req.url);
  const platform = getPlatform(c.get('platform-name'));
  return c.html(platform.renderProfile(`${url.protocol}//${url.host}`, user));
}

export async function oembed(c: Context) {
  const { author, title, provider, link } = c.req.query();

  if (!link || !title) {
    return c.json({ message: 'missing parameters' }, { status: 400 });
  }

  return c.json({
    author_name: author ? unescapeHtml(decodeURIComponent(author)) : '',
    author_url: unescapeHtml(decodeURIComponent(link)),
    provider_name: `bskye${provider ? ' - ' + unescapeHtml(decodeURIComponent(provider)) : ''}`,
    provider_url: unescapeHtml(decodeURIComponent(link)),
    title: `bskye${title ? ' - ' + unescapeHtml(decodeURIComponent(title)) : ''}`,
    type: 'link',
    version: '1.0'
  });
}
