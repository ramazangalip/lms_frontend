"use client";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Uygulama zaten PWA (standalone) olarak açıldıysa gösterme
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault(); // Tarayıcının belirsiz zamanlı varsayılanını durdur
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true); // Kendi banner'ımızı anında ekrana bas
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === "accepted") {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl bg-gray-900 p-4 text-white shadow-2xl border border-gray-700 flex items-center justify-between gap-3 animate-fade-in">
      <div className="flex items-center gap-3">
        <img
          src="/icon-192x192.png"
          alt="App Icon"
          className="w-12 h-12 rounded-xl object-cover bg-white"
        />
        <div>
          <h4 className="text-sm font-semibold">BÜ LMS</h4>
          <p className="text-xs text-gray-400">Hızlı erişim için uygulamayı kur</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsVisible(false)}
          className="text-xs text-gray-400 hover:text-white px-2 py-1.5"
        >
          Sonra
        </button>
        <button
          onClick={handleInstallClick}
          className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl transition"
        >
          Yükle
        </button>
      </div>
    </div>
  );
}