export enum PaymentErrors {
  PaymentTerminalNotFound = 'payment_terminal_not_found',
  PaymentSessionNotFound = 'payment_session_not_found',
  PaymentSessionNotActive = 'payment_session_not_active',
  VideosNotFound = 'videos_not_found',
  GlobalServerError = 'global_server_error',
}

export const priceOptions = {
  BASE_VIDEO_PRICE: 3 * 100,
  VIDEO_DURATION_COEF: 0.2,
  IS_GRADIENT: true,
  BASE_PHOTO_PRICE: 1 * 100,
};
