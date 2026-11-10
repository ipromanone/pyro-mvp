import Footer from '../../components/Footer';

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      <div className="flex-grow">
        {children}
      </div>
      <Footer />
    </div>
  );
}