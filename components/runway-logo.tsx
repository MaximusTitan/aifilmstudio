"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function RunwayLogo() {
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
      ? "https://runway-static-assets.s3.amazonaws.com/site/images/api-page/powered-by-runway-white.png"
      : "https://runway-static-assets.s3.amazonaws.com/site/images/api-page/powered-by-runway-black.png";

  return <Image src={logoSrc} alt="Runway Logo" width={120} height={90} />;
}
