'use client';

export default function CartWidget({ cartTotal, onClick }: { cartTotal: number, onClick: () => void }) {
  return (
    <div className="fixed bottom-8 right-8 left-8 md:left-auto bg-white border-4 border-black text-black p-4 pr-6 rounded-2xl shadow-[8px_8px_0px_#000] flex items-center justify-between md:justify-start gap-8 z-50">
      <div>
        <p className="text-sm font-black text-gray-500 mb-1 uppercase tracking-wider">В корзине</p>
        <p className="font-black text-2xl">{cartTotal} ₽</p>
      </div>
      <button onClick={onClick} className="bg-[#4A9EDE] text-white px-8 py-3 rounded-xl font-black uppercase tracking-wide border-4 border-black shadow-[4px_4px_0px_#000] hover:translate-y-1 hover:shadow-[0px_0px_0px_#000] transition-all">
        Заказать
      </button>
    </div>
  );
}