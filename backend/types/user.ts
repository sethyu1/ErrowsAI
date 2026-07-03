export interface USER_PROFILE {
  id: string;
  email: string | null;
  mobile: string | null;
  name: string;
  profile: {
    gender: 'male' | 'female' | 'unknown';
    avatar: string | null;
  }
  pixel: USER_PIXEL;
}

export interface USER_SUMMARY {
  id: string;
  name: string;
  avatar: string | null;
}

export interface USER_PIXEL {
  pixel_id: string;
  s?: string;
  c?: string;
  g?: string;
  ad?: string;
  acc?: string;
  pixel?: string;
  fbclid?: string;
  r_pixel_id?: string;
  rdt_cid?: string;
}