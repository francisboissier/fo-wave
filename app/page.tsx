import { CoverGrid } from "@/components/CoverGrid";
import { Intro } from "@/components/Intro";
import { Masthead } from "@/components/Masthead";

export default function Home() {
  return (
    <>
      <Intro />
      <div className="site">
        <Masthead />
        <main className="site-main">
          <h1 className="sr-only">FO—WAVE Issue One</h1>
          <CoverGrid />
        </main>
      </div>
    </>
  );
}
