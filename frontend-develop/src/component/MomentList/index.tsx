import '@component/MomentList/index.css';
import { MomentItem } from '@component';
import { CartItem, Image, Video } from '@store/slice/cart/types';
import { ChangeEvent } from 'react';


interface MomentListProps {
  cart: CartItem[];
  handlerCheckbox: (e: ChangeEvent<HTMLInputElement>, item: Video | Image) => void
}

export const MomentList = ({ cart, handlerCheckbox }: MomentListProps) => {
  const handlerCheckboxChange = (e: ChangeEvent<HTMLInputElement>, item: Video | Image) => {
    handlerCheckbox(e, item)
  };

  return (
    <div className="moment-list-items mr-4">
      {cart.map((item: Video | Image, index: number) =>
        <div key={index}>
          <MomentItem item={item} handlerCheckbox={handlerCheckboxChange}/>
        </div>
      )}
    </div>
  );
};
