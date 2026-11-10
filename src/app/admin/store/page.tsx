import { Suspense } from 'react';
import StoreContent from './StoreContent';

export default function StorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB]"></div>}>
      <StoreContent />
    </Suspense>
  );
}