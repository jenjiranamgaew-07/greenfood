import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showHome?: boolean;
}

export function Layout({ children, title, showBack = true, showHome = true }: LayoutProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="bg-gray-100 min-h-[100dvh] w-full flex justify-center">
      <div className="w-full max-w-md bg-white min-h-[100dvh] flex flex-col shadow-2xl relative">
        {title && (
          <header className="bg-green-900 text-white flex items-center h-14 px-4 shrink-0 sticky top-0 z-10 shadow-md">
            {showBack && (
              <Button
                variant="ghost"
                size="icon"
                className="text-green-200 hover:text-white hover:bg-green-800 -ml-2 mr-2"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="w-6 h-6" />
              </Button>
            )}
            <img
              src={`${import.meta.env.BASE_URL}greenfood-logo.jpg`}
              alt="Greenfood"
              className="h-8 w-auto mr-3 rounded object-contain bg-white px-1"
            />
            <h1 className="text-base font-bold uppercase tracking-wider flex-1 truncate">
              {title}
            </h1>
            {showHome && (
              <Button
                variant="ghost"
                size="icon"
                className="text-green-200 hover:text-white hover:bg-green-800 -mr-2 ml-2"
                onClick={() => setLocation("/")}
              >
                <Home className="w-6 h-6" />
              </Button>
            )}
          </header>
        )}
        <main className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
