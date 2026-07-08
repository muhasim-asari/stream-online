export interface Channel {
  id: string;
  name: string;
  logo: string;
  url: string;
  category: string;
  country?: string;
  isFavorite?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  url: string;
  isCustom: boolean;
}
