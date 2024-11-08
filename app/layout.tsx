import DeployButton from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { GeistSans } from "geist/font/sans";
import { ThemeProvider } from "next-themes";
import Link from "next/link";
import "./globals.css";
import Image from "next/image";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "https://www.aifilmstudio.co";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "iGen Studio",
  description:
    "Generate Images and Videos with AI in seconds using iGen Studio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className} suppressHydrationWarning>
      <head><script defer data-website-id="6729bf97c08ff2d51e8608d6" data-domain="app.igen.studio" src="https://datafa.st/js/script.js"></script></head>
      <body className="bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <main className="min-h-screen flex flex-col items-center">
            <nav className="top-0 left-0 w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background z-50">
              <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                <div className="flex gap-5 items-center font-semibold">
                  <Link href={"/"} className="text-2xl">
                    <Image
                      src="https://wdfrtqeljulkoqnllxad.supabase.co/storage/v1/object/public/generated-images/igenstudio.png"
                      alt="iGen Studio"
                      width={100}
                      height={100}
                    />
                  </Link>
                </div>
                {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
              </div>
            </nav>
            <div className="flex-1 w-full flex flex-col gap-20 items-center pt-16">
              <div className="flex flex-col gap-20 max-w-6xl p-5">
                {children}
              </div>

              <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-16">
                <p>
                  Powered by{" "}
                  <a
                    href="https://www.igebra.ai/"
                    target="_blank"
                    className="font-bold hover:underline"
                    rel="noreferrer"
                  >
                    {"{igebra.ai}"}
                  </a>
                </p>
                <ThemeSwitcher />
              </footer>
            </div>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
