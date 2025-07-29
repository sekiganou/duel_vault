"use client";

import Link from "next/link";
import {
  IconHome2,
  IconSettings,
  IconFolder,
  IconChevronUp,
  IconChevronDown,
  IconGraph,
} from "@tabler/icons-react";
import { useState } from "react";

const navigation = [
  { name: "General", href: "/", icon: IconHome2 },
  { name: "Projects", href: "/projects", icon: IconFolder },
  { name: "Settings", href: "/settings", icon: IconSettings },
];

const SidebarSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="mt-6">
    <div className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
      {title}
    </div>
    <div className="mt-2 space-y-1">{children}</div>
  </div>
);

const SidebarLink = ({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof IconHome2;
  label: string;
}) => (
  <Link
    href={href}
    className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-[#27272A] rounded-md transition-colors"
  >
    <Icon className="h-5 w-5 mr-3" />
    {label}
  </Link>
);

const SidebarDropdown = ({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof IconHome2;
  label: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center w-full px-4 py-2 text-sm text-gray-200 hover:bg-[#27272A] rounded-md transition-colors"
      >
        <Icon className="h-5 w-5 mr-3" />
        <span className="flex-1 text-left">{label}</span>
        {open ? (
          <IconChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <IconChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && <div className="ml-9 mt-1 space-y-1">{children}</div>}
    </div>
  );
};

export default function Sidebar() {
  return (
    <aside className="bg-[#18181B] text-white min-h-screen w-64 hidden md:flex flex-col fixed">
      <div className="px-6 py-5 text-md font-semibold border-b border-gray-700">
        Duel Vault
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        <SidebarSection title="Home">
          <SidebarDropdown icon={IconGraph} label="Dashboard">
            {navigation.map((item) => (
              <SidebarLink
                key={item.name}
                href={item.href}
                icon={item.icon}
                label={item.name}
              />
            ))}
          </SidebarDropdown>
        </SidebarSection>
      </nav>
    </aside>
  );
}
