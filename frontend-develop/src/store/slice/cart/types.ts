export interface Video {
  client: number,
  video: {
    id: number,
    isFull: boolean,
    duration: number,
  },
  selected?: boolean
  type: string
}

export interface Image {
  client: number,
  image: {
    shot: number,
    frame: string,
  },
  selected?: boolean,
  type: string
}


export type CartItem = Video | Image;

export const isVideo = (item: Video | Image): item is Video => {
  return 'video' in item;
};

export const isImage = (item: Video | Image): item is Image => {
  return 'image' in item;
};
