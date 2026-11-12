'use client';

import { useState } from 'react';
import { X, Box, Layers, Package, ShoppingCart } from 'lucide-react';

export default function UnitSelectModal({ 
  product, 
  onClose, 
  onAdd 
}: { 
  product: any, 
  onClose: () => void, 
  onAdd: (unitType: 'piece' | 'pack' | 'box', quantity: number) => void 
}) {
  const [selectedUnit, setSelectedUnit] = useState<'piece' | 'pack' | 'box'>('piece');
  const [quantity, setQuantity] = useState<string>('1');

  if (!product) return null;

  const getPrice = () => {
    if (selectedUnit === 'pack' && product.units_per_pack) return product.price * product.units_per_pack;
    if (selectedUnit === 'box' && product.units_per_box) return product.price * product.units_per_box;
    return product.price;
  };

  const getMultiplier = () => {
    if (selectedUnit === 'pack' && product.units_per_pack) return product.units_per_pack;
    if (selectedUnit === 'box' && product.units_per_box) return product.units_per_box;
    return 1;
  };

  const numQuantity = parseInt(quantity) || 0;
  const finalPrice = getPrice() * numQuantity;
  const totalPieces = numQuantity * getMultiplier();

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setQuantity(val);
  };

  const handleAdd = () => {
    if (numQuantity > 0) {
      onAdd(selectedUnit, totalPieces);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-black mb-2 pr-8">{product.name}</h2>
        <p className="text-gray-500 font-medium mb-6">Выберите единицу заказа</p>

        <div className="space-y-3 mb-8">
          <button 
            onClick={() => { setSelectedUnit('piece'); }}
            className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedUnit === 'piece' ? 'border-[#5FC36C] bg-[#E3F2E3]' : 'border-gray-200 hover:border-gray-300'}`}
          >
            <div className="flex items-center gap-3">
              <Box className="w-6 h-6 text-gray-700" />
              <div className="text-left">
                <span className="font-bold block">Штука</span>
                <span className="text-xs text-gray-500">1 шт.</span>
              </div>
            </div>
            <span className="font-black text-lg">{product.price} ₽</span>
          </button>

          {product.units_per_pack && (
            <button 
              onClick={() => { setSelectedUnit('pack'); }}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedUnit === 'pack' ? 'border-[#5FC36C] bg-[#E3F2E3]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3">
                <Layers className="w-6 h-6 text-gray-700" />
                <div className="text-left">
                  <span className="font-bold block">Блок</span>
                  <span className="text-xs text-gray-500">{product.units_per_pack} шт.</span>
                </div>
              </div>
              <span className="font-black text-lg">{product.price * product.units_per_pack} ₽</span>
            </button>
          )}

          {product.units_per_box && (
            <button 
              onClick={() => { setSelectedUnit('box'); }}
              className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${selectedUnit === 'box' ? 'border-[#5FC36C] bg-[#E3F2E3]' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <div className="flex items-center gap-3">
                <Package className="w-6 h-6 text-gray-700" />
                <div className="text-left">
                  <span className="font-bold block">Ящик</span>
                  <span className="text-xs text-gray-500">{product.units_per_box} шт.</span>
                </div>
              </div>
              <span className="font-black text-lg">{product.price * product.units_per_box} ₽</span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between mb-6">
          <span className="font-bold text-gray-700">Количество:</span>
          <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setQuantity(String(Math.max(1, numQuantity - 1)))} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 font-bold">-</button>
            <input 
              type="text" 
              value={quantity} 
              onChange={handleQuantityChange}
              className="w-16 text-center font-black focus:outline-none"
            />
            <button onClick={() => setQuantity(String(numQuantity + 1))} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 font-bold">+</button>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 flex justify-between items-center mb-6">
          <span className="font-bold">Итого:</span>
          <div className="text-right">
            <div className="text-3xl font-black">{finalPrice} ₽</div>
            <div className="text-sm text-gray-500 font-medium">{totalPieces} шт.</div>
          </div>
        </div>

        <button 
          onClick={handleAdd}
          disabled={numQuantity <= 0}
          className="w-full bg-[#5FC36C] text-white py-4 rounded-xl font-black text-lg hover:bg-[#4CAF50] transition-colors shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:text-gray-500"
        >
          <ShoppingCart className="w-5 h-5" /> Добавить в корзину
        </button>
      </div>
    </div>
  );
}