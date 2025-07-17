import Header from "@/app/components/header";
import ChatSection from "./components/chat-section";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-2 sm:p-4 lg:p-24 gap-4 sm:gap-6 lg:gap-10 pt-20 sm:pt-4 lg:pt-24 background-gradient">
      <Header />
      <ChatSection />
    </main>
  );
}
