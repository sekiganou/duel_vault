import { ScrollShadow } from "@heroui/scroll-shadow";

interface CustomScrollShadowProps {
  children: React.ReactNode;
  maxHeightPx?: number;
  className?: string;
}

export const CustomScrollShadow = ({
  children,
  maxHeightPx = 400,
  className,
}: CustomScrollShadowProps) => {
  return (
    <ScrollShadow
      className={`max-h-[${maxHeightPx || 400}px] ${className || ""}`}
    >
      {children}
    </ScrollShadow>
  );
};
