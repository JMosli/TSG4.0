import { MathJax } from "better-react-mathjax";
import dedent from "dedent";
import React from "react";

export type ConfDescription = {
  description: string | React.ReactNode;
  name: string;
  accessible?: boolean;
};

export const confDescriptions: { [key: string]: ConfDescription } = {
  "camera.recognition.faces_to_recognize": {
    description: dedent`Specifies how many faces will be taken into account when performing the recognition task.
            The larger the better recognition result, but slower performance.
            Recommended value: 2-15.`,
    name: "Faces to recognize",
  },
  "camera.onvif.ports": {
    description: dedent`Specifies what ports will the system try to connect to when searching for cameras.
            8889 and 2020 are the most common.`,
    name: "Search ports",
  },
  "camera.detection.lane.min_faces": {
    description: dedent`Specifies the minimum amount of faces required on the lane camera for system to save recordings and train recognizer.
      Recommended value: 20-40. So if 20-40 frames with faces overall was collected, system will know that the client was actually on the lane.`,
    name: "Lane minimum faces",
  },
  "camera.inactive_timeout": {
    description: dedent`Specifies the time in milliseconds after which the system will think the camera is disconnected if it does not accept any connections
        Recommended value: 300000`,
    name: "Timeout to remove inactive cameras",
  },
  "payment.email.thank_you_text": {
    description: dedent`Specifies the email text after the payment. 
        Note that {link} will be replaced with the media link for user to access the media`,
    name: "Email text",
    accessible: true,
  },
  "payment.video.base_price": {
    description: dedent`Specifies the base price for each video. The global backend can ignore this value.`,
    name: "Video price",
  },
  "payment.photo.base_price": {
    description: dedent`Specifies the base price for each photo. The global backend can ignore this value.`,
    name: "Photo price",
  },
  "payment.video.duration_coef": {
    description: (
      <>
        Specifies the coefficient by which the sum of all video duration will be
        multiplied to form a price:
        <span className="text-center">
          <MathJax>{"\\(NB + k\\sum_{i=0}^N{D[i]}\\)"}</MathJax>
        </span>
        where N is a number of videos, B is a base price
        (payment.video.base_price), k is this parameter and D[i] is duration of
        video with index i
      </>
    ),
    name: "Video duration coefficient",
  },
  "camera.recognition.workers_num": {
    description: dedent`Specifies the number of recognition workers. 
        The larger the better, but if this number if larger that it needs to be, it will not make any difference, but can even make performance worse.
        The recommended value depends on the number of clients per kiosk and lanes: n_k * 6 + n_l / 4, 
        where n_k is number of kiosks and n_l is number of lanes. So in case of 1 kiosk and 20 lanes, the recommended value would be 1*6 + 20/4 = 11`,
    name: "Number of recognition workers",
  },
  "camera.subnet_probe_interval": {
    description: dedent`Specifies the interval between the subnet probing tasks.
        When performing the subnet probing task, the system makes a request to each possible IP address in the camera subnet to find new entities.
        Some cameras will not reply to authentication requests until subnet probe happened, but the frequent probe may result in congestion, bad performance and even in situations when the camera does not accept a connection from the system.
        Recommended value: 60000, but if the number of cameras is large, its recommended to increase this value twice or even three times larger.`,
    name: "Subnet probe interval",
  },
  "camera.detection.lane.max_frames_without_faces": {
    description: dedent`Specifies the number of frames without faces for system to assume that client has left the lane.
        Recommended value: 100.`,
    name: "Number of frames without faces on the lane camera",
  },
  "camera.detection.kiosk.max_frames_without_faces": {
    description: dedent`See camera.detection.lane.max_frames_without_faces (Number of frames without faces on the lane camera)`,
    name: "Number of frames without faces on the kiosk camera",
  },
  "camera.detection.kiosk.session_timeout": {
    description: dedent`Specifies the maximum session time (in milliseconds) on the kiosk. After this timeout exceeds, the kiosk will try to recognize a face again.
        Recommended value: 20000`,
    name: "Maximum kiosk session time",
  },
  "camera.disconnected_db_remove": {
    description: dedent`Specifies the timeout (in milliseconds) after which disconnected cameras will be deleted from the database completely.
        Recommended value: 259200000`,
    name: "Remove disconnected camera timeout",
  },
  "camera.stream.silence_db": {
    description: dedent`Specifies the threshold sound volume for system to register a shot (in db).
        Recommended value: "-1" to "5"`,
    name: "Shot volume",
  },
  "camera.detection.kiosk.min_start_faces": {
    description: dedent`Specifies the minimum amount of faces that needs to be collected for system to assume that client came to the kiosk. 
        The larger value, the more frequent and quicker face recognitions will be, but the performance MAY get worse.
        Recommended value: 10`,
    name: "Kiosk min faces to recognize",
  },
  "camera.onvif.passwords": {
    description: dedent`Specifies an array of credentials for system to try while first connecting to the camera when performing the probe task.`,
    name: "Camera credentials list",
  },
  "camera.detection.lane.min_start_faces": {
    description: dedent`Specifies the minimum amount of face that needs to be collected for system to assume that client came to the lane and start recording.
        Recommended value: 20-25`,
    name: "Lane min faces to record",
  },
  "camera.remove_face_interval": {
    description: dedent`Specifies the interval (in seconds) between the system removes an information about old client's faces
        Recommended value: 10800`,
    name: "Remove face interval",
  },
  "camera.detection.use_live_model_detection": {
    description: dedent`Specifies if the face detector will also use a live AI model to detect faces. 
        If this feature is disabled, the system will use classifying method, which is faster, but gives more errors.
        If this feature is enabled, the system will use face detector model, which is slower, but more accurate.
        It's recommended to keep the feature off if you have less powerful hardware.`,
    name: "Use live face detection model",
  },
  "camera.recognition.similarity_level": {
    description: dedent`Specifies the minimum level of face similarity for system to match the faces. 
        The similarity is a value between 0 and 1, where 0 tells that two compared faces are fully not the same, and 1 tells that two faces are fully the same. 
        The good value is 0.6-0.7, which accounts for photo errors and matcher errors.`,
    name: "Minimum face similarity",
  },
  "camera.stream.sound_peak_record_delta": {
    description: (
      <>
        Specifies the time (in seconds) which the system will record before and
        after the shot registration. The starting, ending time and length is
        calculated like this: S<sub>t</sub> - D<sub>t</sub> ; S<sub>t</sub> + D
        <sub>t</sub> ; D<sub>t</sub> * 2 + 1 accordingly, where S<sub>t</sub> is
        shot time and D<sub>t</sub> is this parameter (delta time) Recommended
        value: 1, so if the shot was detected at time 5, the system will record
        from time 4 to 6. If this value is too large, the system will merge
        interfering segments and it will just become the full video.
      </>
    ),
    name: "Recording time delta",
  },
  "camera.disconnected_retry_interval": {
    description: dedent`Specifies the interval (in seconds) between connection retries on disconnected cameras.
        Recommended value: 3600, because the retry also fires a subnet probe.`,
    name: "Interval between retries on disconnected cameras",
  },
  "camera.remove_garbage_interval": {
    description: dedent`Specifies the interval (in seconds) between the system clears up a filesystem and a database from the unnecessary information.
        Recommended value: 30`,
    name: "Interval between garbage collection",
  },
  "camera.probe_interval": {
    description: dedent`Specifies the interval (in ms) between the onvif camera probing task.
        Recommended value: 20000, because it does not actually make requests to every ip address, but rather accepts them from the multicast address specified in the onvif specification.`,
    name: "Camera onvif probe interval",
  },
  "camera.detection.min_face_size": {
    description: dedent`Specifies the minimum face size when detecting it. 
        The larger, the greater performance, but the system may skip and not find some of actual faces if it is too small.
        The recommended value change depending on camera conditions and requires testing.`,
    name: "Minimum face size",
  },
  "camera.detection.multiscale_scale_factor": {
    description: dedent`Specifies a scale factor in cascade classification process.
        The larger, the greater performance, but the system may skip some faces.
        Recommended value: 1.4`,
    name: "Cascade scale factor",
  },
  "camera.detection.kiosk.classifier": {
    description: dedent`Specifies a classifier to use to detect faces on a kiosk camera.`,
    name: "Kiosk cascade classifier name",
  },
  "camera.detection.lane.classifier": {
    description: dedent`Specifies a classifier to use to detect faces on a lane camera.`,
    name: "Lane cascade classifier name",
  },
  "ui.kiosk.logo": {
    description: dedent`Specifies the logo source.`,
    name: "Logo",
  },
  "ui.kiosk.thank_you.title": {
    description: dedent`Thank you page title`,
    name: "Thank you page title",
    accessible: true,
  },
  "ui.kiosk.thank_you.description": {
    description: "Thank you page description",
    name: "Thank you page description",
    accessible: true,
  },
  "ui.kiosk.poll": {
    description: "Poll configuration",
    name: "Poll configuration",
  },
  "ui.kiosk.poll.enabled": {
    description:
      "If true, a poll will be displayed on the kiosk when video preview is open.",
    name: "Poll enabled",
    accessible: true,
  },
  "ui.kiosk.display.card_size": {
    description: "Card size on the kiosk",
    name: "Card size",
  },
  "ui.kiosk.display.photo_after_video": {
    description: "Specifies a number of photos after each video on kiosk",
    name: "Number of photos after a video",
  },
  "ui.kiosk.payment.go_back_timeout": {
    description:
      "Specifies a timeout after which kiosk will return to the main page after payment",
    name: "Reset after payment timeout",
  },
};
