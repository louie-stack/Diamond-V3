import Motion from "@/components/Motion";
import Loader from "@/components/Loader";
import SoundToggle from "@/components/SoundToggle";
import Nav from "@/components/Nav";
import Hero from "@/components/hero/Hero";
import Teaser from "@/components/Teaser";
import Ticker from "@/components/Ticker";
import Newspaper from "@/components/Newspaper";
import Sting from "@/components/Sting";
import Checkout from "@/components/Checkout";
import Tape from "@/components/Tape";
import { EvidenceBoard, Wanted, Interrogation } from "@/components/Story";
import Curve from "@/components/Curve";
import { Declassified, Memo, Transcript, Locker, CaseClosed, Surveillance, Footer } from "@/components/Files";

export default function Page() {
  return (
    <main>
      <Motion />
      <Loader />
      <div className="grain" aria-hidden="true" />
      <Nav />
      <Hero />
      <Ticker />
      <Teaser />
      <Newspaper />
      <Curve />
      <EvidenceBoard />
      <Sting />
      <Tape tilt={-2} />
      <Wanted />
      <Interrogation />
      <Declassified />
      <Memo />
      <Transcript />
      <Locker />
      <Tape tilt={2.2} reverse />
      <CaseClosed />
      <Surveillance />
      <Footer />
      <SoundToggle />
      <Checkout />
    </main>
  );
}
