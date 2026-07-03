import React from "react";
import { GiftIcon } from "@errows/icons";
import CoinIcon from "@/assets/gift-coin.png";
import { ListEmpty } from "@/components/list-empty";
import { useTranslation } from "react-i18next";

interface GiftItemProps {
  gift: API.SESSION.SESSION_GIFT;
  onSendGift: (gift: API.SESSION.SESSION_GIFT) => void;
}

interface GiftsProps {
  gifts: API.SESSION.SESSION_GIFT[];
  onSendGift: (gift: API.SESSION.SESSION_GIFT) => void;
}

const GiftItem = ({ gift, onSendGift }: GiftItemProps) => {
  const handleSendGift = () => {
    onSendGift(gift);
  };
  return (
    <div className="w-full h-25 bg-[#090A0A33] cursor-pointer flex-shrink-0 rounded-lg flex flex-col items-center justify-center gap-1 transition-all duration-200 hover:bg-[#090A0A66] hover:scale-105 hover:shadow-lg" onClick={handleSendGift}>
      <img
        className="w-10 h-[51px] object-cover"
        src={gift.picture_url}
        alt="gift"
      />
      <div className="flex items-center justify-center gap-1">
        <img src={CoinIcon} alt="coin" className="w-4 h-4" />
        <span className="text-sm text-white">{gift.price}</span>
      </div>
    </div>
  );
};

export const Gifts: React.FC<GiftsProps> = ({ gifts, onSendGift }) => {
  const { t } = useTranslation();
  
  if (gifts.length === 0) {
    return (
      <div className="w-[317px] h-[206px] flex items-center justify-center">
        <ListEmpty title={t("common.noMoreData")} />
      </div>
    );
  }
  
  return (
    <div className="w-[317px] h-[206px] grid grid-cols-4 gap-2 overflow-y-auto scrollbar-hide">
      {gifts.map((gift) => (
        <GiftItem key={gift.id} gift={gift} onSendGift={onSendGift} />
      ))}
    </div>
  );
};
