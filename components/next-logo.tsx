"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function NextLogo() {
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
      ? "https://pbs.twimg.com/profile_images/1818986461028343808/iW5r4YPl_400x400.jpg"
      : "https://media.licdn.com/dms/image/v2/D4E0BAQGFQfb1fgg9Yg/company-logo_200_200/company-logo_200_200/0/1722515273647/bflml_logo?e=1735171200&v=beta&t=1lZwKtvmMe8xIXtQ9BdAB4iIAxS-tICKEY-7jJw15k0";

  return <Image src={logoSrc} alt="Luma Logo" width={90} height={70} />;
}
