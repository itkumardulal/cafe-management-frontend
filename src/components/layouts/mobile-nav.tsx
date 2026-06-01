"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "@/src/components/ui/drawer";
import { Sidebar } from "./sidebar";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Navigation menu"
      className="flex flex-col overflow-hidden p-0"
    >
      <div id="mobile-navigation" className="h-full overflow-hidden">
        <Sidebar className="h-full w-full border-r-0" />
      </div>
    </Drawer>
  );
}
