import NextLogo from "./next-logo";
import SupabaseLogo from "./supabase-logo";
import LumaLogo from "./luma-logo";
import RunwayLogo from "./runway-logo";

export default function Header() {
  return (
    <div className="flex flex-col gap-16 items-center">
      <div className="flex gap-8 justify-center items-center">
        <a href="https://www.igebra.ai/" target="_blank" rel="noreferrer">
          <SupabaseLogo />
        </a>
        <span className="border-l rotate-45 h-6" />
        <a href="https://blackforestlabs.ai/" target="_blank" rel="noreferrer">
          <NextLogo />
        </a>
        <span className="border-l rotate-45 h-6" />
        <a href="https://lumalabs.ai/" target="_blank" rel="noreferrer">
          <LumaLogo />
        </a>
        <span className="border-l rotate-45 h-6" />
        <a href="https://runwayml.com/" target="_blank" rel="noreferrer">
          <RunwayLogo />
        </a>
      </div>
      <h1 className="sr-only">AI Film Studio</h1>
      <div className="text-md lg:text-3xl !leading-tight mx-auto max-w-xl text-center">
        Generate Images and Videos with
        <br />
        AI in seconds using
        <p className="font-bold">AI Film Studio</p>
      </div>
      <div />
    </div>
  );
}
