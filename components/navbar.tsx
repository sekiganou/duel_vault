"use client";

import {
  Navbar as HeroUINavbar,
  NavbarContent,
  NavbarMenu,
  NavbarMenuToggle,
  NavbarBrand,
  NavbarItem,
  NavbarMenuItem,
} from "@heroui/navbar";
import { Link } from "@heroui/link";
import { link as linkStyles } from "@heroui/theme";
import NextLink from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/config/site";
import { ThemeSwitch } from "@/components/theme-switch";
import { Logo } from "@/components/icons";
import { useEffect, useState } from "react";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(
    siteConfig.navItems[0].label
  );

  useEffect(() => {
    const currentPath = window.location.pathname;
    const currentNavItem = siteConfig.navItems.find(
      (item) => item.href === currentPath
    );
    if (currentNavItem) {
      setSelectedLabel(currentNavItem.label);
    }
  }, []);

  const handleSelectLabel = (label: string) => {
    setSelectedLabel(label);
    setIsMenuOpen(false);
  };

  return (
    <HeroUINavbar
      maxWidth="xl"
      position="sticky"
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="gap-3 max-w-fit">
          <NextLink
            className="flex justify-start items-center gap-1"
            href="/"
            onClick={() => setSelectedLabel(siteConfig.navItems[0].label)}
          >
            <Logo />
            <p className="font-bold text-inherit">DUEL VAULT</p>
          </NextLink>
        </NavbarBrand>
        <ul className="hidden sm:flex gap-4 justify-start ml-2">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                onClick={() => setSelectedLabel(item.label)}
                className={clsx(
                  linkStyles({
                    color: "foreground",
                  }),
                  "data-[active=true]:text-primary data-[active=true]:font-medium"
                )}
                color={"foreground"}
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent
        className="hidden sm:flex basis-1/5 sm:basis-full"
        justify="end"
      >
        <NavbarItem className="hidden sm:flex gap-2">
          <ThemeSwitch />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
        <ThemeSwitch />
        <NavbarMenuToggle />
      </NavbarContent>

      <NavbarMenu>
        <div className="mx-4 mt-2 flex flex-col gap-2">
          {siteConfig.navItems.map((item, index) => (
            <NavbarMenuItem key={`${item}-${index}`}>
              <Link
                onClick={() => handleSelectLabel(item.label)}
                color={selectedLabel === item.label ? "primary" : "foreground"}
                href={item.href}
                size="lg"
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
        </div>
      </NavbarMenu>
    </HeroUINavbar>
  );
};
