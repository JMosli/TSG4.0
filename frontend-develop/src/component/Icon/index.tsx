import '@component/Icon/index.css';

interface IconProps {
  icon?: 'arrow' | 'plus' | 'at' | 'checkmark';
  rotateDeg?: number;
}

export const Icon = ({ icon, rotateDeg = 0 }: IconProps) => {
  const resolveIcon = () => {
    switch (icon) {
      case 'arrow':
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="size-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"/>
          </svg>
        );
      case 'plus':
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                    stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
      case 'at':
        return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5}
                    stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25"/>
        </svg>
      case 'checkmark':
        return <svg width="30" height="28" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 10L7.61905 15L18.5 1" stroke="white" strokeWidth="3"/>
        </svg>
      default:
        return;
    }
  }

  return (
    <div
      className="icon"
      style={{
        transform: `rotate(${rotateDeg}deg)`
      }}>
      {resolveIcon()}
    </div>
  );
}
