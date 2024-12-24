export enum KioskErrors {
  KioskNotFound = 'kiosk_not_found',
  CameraIsAttached = 'camera_is_attached',
  AlreadyAttached = 'camera_already_attached',
}

export interface PollSetting {
  question_id: number;
  text: string;
  answers: Array<{
    answer_id: number;
    text: string;
  }>;
}

export const uiSettings = {
  POLL: [
    {
      question_id: 1,
      text: 'Does this capture the media you want?',
      answers: [
        { answer_id: 1, text: 'Yes' },
        { answer_id: 2, text: 'No' },
      ],
    },
    {
      question_id: 2,
      text: 'Would you like to add this media to your cart for ${full_price}?',
      answers: [
        { answer_id: 1, text: 'Yes' },
        { answer_id: 2, text: 'No' },
      ],
    },
  ] as Array<PollSetting>,
};
