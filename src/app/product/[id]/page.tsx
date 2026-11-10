// src/app/product/[id]/page.tsx
import { Suspense } from 'react';
import ProductDetails from './ProductDetails';

export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center text-2xl font-black bg-[#F9FAFB]">
        Загрузка товара...
      </div>
    }>
      <ProductDetails />
    </Suspense>
  );
}