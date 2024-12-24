import "@component/Tip/Tip.css";
import tip from "@assets/tip-icon.png";

type Props = {
    text: string;
}

export const Tip = ({ text }: Props) => {
    return (
        <div className="tip">
            <img src={tip} alt="tip"/>
            <span>{text}</span>
        </div>
    );
}
