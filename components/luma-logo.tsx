"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function LumaLogo() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const logoSrc =
    theme === "dark"
      ? "https://cdn-luma.com/public/lumalabs.ai/media-kit/10.svg"
      : "https://cdn-luma.com/public/lumalabs.ai/media-kit/11.svg";

  return <Image src={logoSrc} alt="Luma Logo" width={90} height={70} />;
}
