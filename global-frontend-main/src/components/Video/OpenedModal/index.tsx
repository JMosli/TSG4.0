export default function OpenedVideo({
  toggle,
  src,
}: {
  toggle: () => void;
  src: string;
}) {
  return (
    <div className="modal">
      <div className="overlay">
        <div className="modal-content bg-neutral-900 rounded-xl p-6">
          <video src={src} autoPlay controls></video>
        </div>
        <button className="close-modal" onClick={toggle}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
