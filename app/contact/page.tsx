import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact — FO—WAVE",
};

export default function ContactPage() {
  return (
    <main className="contact-page">
      <Link href="/" className="contact-logo" aria-label="FO—WAVE home">
        <Image src="/fo-wave/logo.png" alt="FO—WAVE" width={1134} height={194} loading="eager" />
      </Link>
      <div className="contact-wrapper">
        <ContactForm />
      </div>
    </main>
  );
}
