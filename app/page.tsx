import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";
import { CoverRow } from "@/components/CoverRow";
import { HalftoneBackdrop } from "@/components/HalftoneBackdrop";

export default function Home() {
  return (
    <div className="content">
      <section className="page hero">
        <HalftoneBackdrop
          images={{
            lowresUrl: "/fo-wave/flag-256.jpg",
            hiresUrl: "/fo-wave/flag.jpg",
            maskUrl: "/fo-wave/blackmask.png",
            width: 1920,
            height: 1434,
          }}
        />
        <Link href="/contact" className="hero-link" aria-label="Contact FO—WAVE" />
      </section>
      <CoverRow />
      <section className="mobile-contact" aria-labelledby="mobile-contact-title">
        <h2 id="mobile-contact-title" className="mobile-contact-title">
          Contact
        </h2>
        <ContactForm />
      </section>
    </div>
  );
}
