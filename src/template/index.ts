import { Platform } from '../types';
import Discord from './discord';
import Whatsapp from './whatsapp';

export function getPlatformName(userAgent?: string): string | undefined {
  if (!userAgent) {
    return undefined;
  }

  userAgent = userAgent.toLowerCase();

  // Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)
  if (userAgent.includes('discord')) {
    return 'discord';
  }

  // WhatsApp/2.23.20.0
  if (userAgent.includes('whatsapp')) {
    return 'whatsapp';
  }

  // TelegramBot (like TwitterBot)
  if (userAgent.includes('telegram')) {
    return 'whatsapp';
  }

  return undefined;
}

export function getPlatform(userAgent?: string): Platform {
  switch (getPlatformName(userAgent)) {
    case 'discord':
      return Discord;
    case 'whatsapp':
      return Whatsapp;
    default:
      return Discord;
  }
}
