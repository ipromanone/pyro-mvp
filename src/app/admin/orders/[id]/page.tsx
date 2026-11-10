import { Suspense } from 'react';
import OrderDetailsContent from './OrderDetailsContent';

export default function OrderDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xl font-bold bg-[#F9FAFB]">Загрузка заказа...</div>}>
      <OrderDetailsContent />
    </Suspense>
  );
}