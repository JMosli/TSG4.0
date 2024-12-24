import '@component/Button/index.css';
import { Icon } from '@component';

interface ButtonProps {
  variant?: 'enabled' | 'disabled' | 'active';
  text?: string;
  gap?: number;
  icon?: 'plus' | 'arrow' | 'at' | 'checkmark' | undefined;
  iconPosition?: 'left' | 'right' | 'center';
  rotateIconDeg?: number;
  onClick?: () => void;
  isButtonEnabled?: boolean;
  color?: string;
  border?: string;
  colorText?: string;
  fontWeight?: string;
  children?: any;
  textClass?: string;
  onlyIcon?: boolean;
}

export const Button = (
  {
    variant = 'enabled',
    text,
    gap = 20,
    icon = undefined,
    iconPosition,
    rotateIconDeg = 0,
    onClick,
    isButtonEnabled = true,
    color,
    border = '5px solid rgb(255,215,0)',
    colorText = '',
    fontWeight = 'Gilroy-Light, sans-serif',
    children = null,
    textClass,
    onlyIcon = false,
  }: ButtonProps) => {
  return (
    <>
      {onlyIcon ? (
        <button
          className="flex items-center justify-center"
          onClick={onClick}
          style={{
            background: '#34BA05',
            height: '100px',
            width: '100px',
            borderRadius: '50%',
          }}
        ><Icon icon={icon}></Icon></button>
      ) : (
        <button
          className={'button' + ' ' + variant}
          onClick={onClick}
          disabled={!isButtonEnabled}
          style={{ background: color, border: border, color: colorText, fontWeight: fontWeight, minWidth: '200px' }}
        >
          <div
            className="default flex flex-row items-center"
            style={{ gap: `${gap}px` }}
          >
            {iconPosition === 'left' ? (
              <>
                {icon && <Icon icon={icon} rotateDeg={rotateIconDeg}/>}
                <span>{text}</span>
              </>
            ) : (
              <>
                {children}<span className={textClass}>{text}</span>
                {icon && <Icon icon={icon} rotateDeg={rotateIconDeg}/>}
              </>
            )}
          </div>
        </button>)
      }
    </>
  );
};
