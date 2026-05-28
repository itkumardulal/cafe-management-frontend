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
    <Drawer open={open} onClose={onClose}>
      <Sidebar className="w-full border-r-0 p-0" />
    </Drawer>
  );
}
