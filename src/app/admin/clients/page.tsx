import { Suspense } from 'react';
import ClientsContent from './ClientsContent';

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9FAFB]"></div>}>
      <ClientsContent />
    </Suspense>
  );
}