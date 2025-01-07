# bskye

**Embed Bluesky videos, GIFs and images on Discord.**

Written in TypeScript as a [Cloudflare Worker](https://workers.cloudflare.com/).

[![Production](https://github.com/FerroEduardo/bskye/actions/workflows/deploy-production.yaml/badge.svg)](https://github.com/FerroEduardo/bskye/actions/workflows/deploy-production.yaml)
[![Test](https://github.com/FerroEduardo/bskye/actions/workflows/test.yaml/badge.svg)](https://github.com/FerroEduardo/bskye/actions/workflows/test.yaml)

----

## Add `e` after `bsky` to make it `bskye.app`

## Embed Videos

![Video Embed Example](/.docs/embed-example/video.png)

## Embed GIFs

![GIF Embed Example](/.docs/embed-example/gif.png)

## Embed Images

![Single Image Embed Example](/.docs/embed-example/single-image.png)
![Multiple Images Embed Example](/.docs/embed-example/multiple-images.png)

## Embed Quotes

![Profile Embed Example](/.docs/embed-example/quote.png)

## Direct media links

To access media directly, simply prepend `d.` to the domain (`d.bskye.app`):

![Direct media links](/.docs/embed-example/direct-video.png)

> [!NOTE]  
> GIF animations are not properly supported due to Discord's limitations. When accessed directly, GIFs will display as static images rather than animated content.

### Gallery

Additionally, you can target specific media items within a post by appending an index number (starting from 1) to the URL:

> `https://d.bskye.app/profile/pfrazee.com/post/3lech75aa7k2f/4`

![Direct media links](/.docs/embed-example/gallery.png)

## Embed Profiles

![Profile Embed Example](/.docs/embed-example/profile.png)

## Disclaimer

While bskye supports Discord, full functionality for WhatsApp and Telegram may be limited.