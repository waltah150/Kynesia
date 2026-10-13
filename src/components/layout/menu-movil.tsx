"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MenuLateral } from "./menu-lateral";

/** Barra superior del celular con el botón ☰ que abre el menú. */
export function MenuMovil({ email }: { email?: string }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 bg-verde-oliva px-4 text-dorado-claro md:hidden">
      <Sheet open={abierto} onOpenChange={setAbierto}>
        <SheetTrigger
          aria-label="Abrir menú"
          className="-ml-2 rounded-md p-2 hover:bg-verde-oliva-claro"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" showCloseButton={false} className="w-64 border-none p-0">
          <SheetTitle className="sr-only">Menú</SheetTitle>
          <MenuLateral email={email} onNavegar={() => setAbierto(false)} />
        </SheetContent>
      </Sheet>
      <span className="font-heading text-xl tracking-[0.2em]">KYNESIA</span>
    </header>
  );
}
