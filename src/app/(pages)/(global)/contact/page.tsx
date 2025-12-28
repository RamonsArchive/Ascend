import ContactHero from "@/src/components/globalComponents/ContactHero";
import ContactFormSection from "@/src/components/globalComponents/ContactFormSection";
import ContactLinks from "@/src/components/globalComponents/ContactLinks";

const ContactPage = () => {
  return (
    <div className="relative w-full">
      <div className="marketing-bg" />
      <div className="relative flex flex-col items-center justify-center w-full gap-12 md:gap-16 lg:gap-20">
        <ContactHero />
        <ContactFormSection />
        <ContactLinks />
      </div>
    </div>
  );
};

export default ContactPage;
