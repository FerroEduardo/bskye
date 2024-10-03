import { Platform } from '../types';
import Discord from './discord';

export function getPlatform(userAgent?: string): Platform {
  if (!userAgent) {
    return Discord;
  }

  if (userAgent.includes('discord')) {
    return Discord;
  }

  return Discord;
}
