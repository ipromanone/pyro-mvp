import { Suspense } from 'react';
import InvoicesContent from './InvoicesContent';

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB]"></div>}>
      <InvoicesContent />
    </Suspense>
  );
}