import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Masthead } from "@/components/Masthead";

export const metadata: Metadata = {
  title: "Contact — FO—WAVE",
};

export default function ContactPage() {
  return (
    <div className="site">
      <Masthead />
      <main className="site-main">
        <h1 className="sr-only">Contact FO—WAVE</h1>
        <ContactForm />
      </main>
    </div>
  );
}
