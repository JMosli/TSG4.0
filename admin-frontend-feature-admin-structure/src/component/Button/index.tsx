import "@component/Button/index.css";
import { Icon } from "@component";

interface ButtonProps {
  variant?: "enabled" | "disabled";
  text: string;
  gap?: number;
  icon?: "plus" | "arrow" | "at" | undefined;
  iconPosition?: "left" | "right";
  rotateIconDeg?: number;
  onClick?: () => void;
  isButtonEnabled?: boolean;
  color?: string;
}

export const Button = ({
  variant = "enabled",
  text,
  gap = 20,
  icon = undefined,
  iconPosition,
  rotateIconDeg = 0,
  onClick,
  isButtonEnabled = true,
  color,
}: ButtonProps) => {
  return (
    <button
      className={"button" + " " + variant}
      onClick={onClick}
      disabled={!isButtonEnabled}
      style={{ background: color }}
    >
      <div className="default" style={{ gap: `${gap}px` }}>
        {iconPosition === "left" ? (
          <>
            {icon && <Icon icon={icon} rotateDeg={rotateIconDeg} />}
            <span>{text}</span>
          </>
        ) : (
          <>
            <span>{text}</span>
            {icon && <Icon icon={icon} rotateDeg={rotateIconDeg} />}
          </>
        )}
      </div>
    </button>
  );
};
