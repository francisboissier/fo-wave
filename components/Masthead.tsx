import Image from "next/image";
import Link from "next/link";

export function Masthead() {
  return (
    <header className="masthead">
      <Link href="/" className="masthead-logo" aria-label="FO—WAVE home">
        <Image src="/fo-wave/logo.png" alt="FO—WAVE" width={1134} height={194} loading="eager" />
      </Link>
      <nav aria-label="Main">
        <Link href="/contact">Contact</Link>
      </nav>
    </header>
  );
}
