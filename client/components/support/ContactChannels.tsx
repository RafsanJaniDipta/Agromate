import { useTranslations } from "next-intl";
import { ChatIcon, MailIcon, MapPinIcon, PhoneIcon } from "@/components/icons";
import { contact } from "@/lib/contact";

// Phone, WhatsApp, email and office cards; the first three open the matching app.
export default function ContactChannels() {
  const t = useTranslations("supportPage.channels");

  const channels = [
    { id: "phone", Icon: PhoneIcon, value: contact.phone, href: `tel:${contact.phone.replace(/[^\d+]/g, "")}` },
    { id: "whatsapp", Icon: ChatIcon, value: contact.phone, href: `https://wa.me/${contact.whatsapp}` },
    { id: "email", Icon: MailIcon, value: contact.email, href: `mailto:${contact.email}` },
    { id: "office", Icon: MapPinIcon, value: t("office.value"), href: null },
  ] as const;

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {channels.map(({ id, Icon, value, href }) => {
        const content = (
          <>
            <span className="flex size-11 items-center justify-center rounded-full bg-brand text-white">
              <Icon className="size-5" />
            </span>
            <h3 className="mt-5 text-sm text-zinc-500">{t(`${id}.title`)}</h3>
            {/* Phone numbers and emails stay in Latin script so they are easy to type */}
            <p lang={href ? "en" : undefined} className="mt-1 break-all text-lg font-semibold">
              {value}
            </p>
            <p className="mt-2 text-sm text-zinc-500">{t(`${id}.note`)}</p>
          </>
        );

        return (
          <li key={id}>
            {href ? (
              <a
                href={href}
                target={id === "whatsapp" ? "_blank" : undefined}
                rel={id === "whatsapp" ? "noopener noreferrer" : undefined}
                className="block h-full rounded-3xl bg-zinc-100 p-6 transition hover:bg-zinc-200/70"
              >
                {content}
              </a>
            ) : (
              <div className="h-full rounded-3xl bg-zinc-100 p-6">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
