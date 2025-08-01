export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Duel Vault",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Decks",
      href: "/decks",
    },
    {
      label: "Matches",
      href: "/matches",
    },
  ],
  links: {
    docs: "https://heroui.com",
  },
};
