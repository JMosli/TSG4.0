import { createSlice } from '@reduxjs/toolkit';
import { CartItem, Image, isImage, isVideo, Video } from './types'


interface CartState {
  cart: CartItem[];
}

const initialState: CartState = {
  cart: [],
};

const updateCartItem = (
  state: CartState,
  item: Video | Image,
  checkFn: (item: CartItem) => boolean
) => {
  const index = state.cart.findIndex(checkFn);

  if (index === -1) {
    item.selected = true;
    state.cart.push(item);
  } else {
    state.cart.splice(index, 1);
  }
};

export const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart: (state, action) => {
      const item = action.payload;

      if (isVideo(item)) {
        updateCartItem(state, item, (cartItem: CartItem): cartItem is Video =>
          isVideo(cartItem) &&
          cartItem.video.id === item.video.id &&
          cartItem.client === item.client
        );
      }

      if (isImage(item)) {
        updateCartItem(state, item, (cartItem: CartItem): cartItem is Image =>
          isImage(cartItem) &&
          cartItem.image.shot === item.image.shot &&
          cartItem.client === item.client
        );
      }
    },
    removeFromCart: (state, action) => {
      action.payload.forEach((item: Video | Image) => {
        const index = state.cart.findIndex((existingItem) =>
          existingItem.client === item.client &&
          ((isVideo(item) &&
              isVideo(existingItem) &&
              existingItem.video.id === item.video.id) ||
            (isImage(item) &&
              isImage(existingItem) &&
              existingItem.image.shot === item.image.shot))
        );

        if (index !== -1) {
          state.cart.splice(index, 1);
        }
      });
    },
  },
});

export const { setCart, removeFromCart } = cartSlice.actions;
export default cartSlice.reducer;
