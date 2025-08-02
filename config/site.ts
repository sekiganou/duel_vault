export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Duel Vault",
  description: "A modern web app for managing card game decks and matches.",
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
    {
      label: "Tournaments",
      href: "/tournaments",
    },
  ],
};
