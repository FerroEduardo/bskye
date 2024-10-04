import { Platform } from '../../types';
import { render as renderPost } from './post';
import { render as renderProfile } from './profile';

const Whatsapp: Platform = {
  renderPost,
  renderProfile
};

export default Whatsapp;
