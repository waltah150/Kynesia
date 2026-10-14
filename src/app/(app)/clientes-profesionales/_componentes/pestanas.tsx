"use client";

import type { ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Pestana } from "./tipos";

const PESTANAS: { valor: Pestana; titulo: string }[] = [
  { valor: "clientes", titulo: "Clientes" },
  { valor: "profesionales", titulo: "Profesionales" },
  { valor: "horario", titulo: "Horario del spa" },
];

/** Pestañas sincronizadas con la dirección (?tab=…), así al recargar se queda en la misma. */
export function Pestanas({
  activa,
  paneles,
}: {
  activa: Pestana;
  paneles: Record<Pestana, ReactNode>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function cambiar(valor: Pestana) {
    const params = new URLSearchParams(searchParams);
    params.set("tab", valor);
    router.replace(`${pathname}?${params}`, { scroll: false });
  }

  return (
    <Tabs value={activa} onValueChange={(valor) => cambiar(valor as Pestana)} className="w-full gap-6">
      <TabsList variant="line" className="h-auto w-full justify-start gap-4 overflow-x-auto border-b border-border pb-0">
        {PESTANAS.map(({ valor, titulo }) => (
          <TabsTrigger
            key={valor}
            value={valor}
            className="flex-none rounded-none px-1 pb-2 text-base text-texto-suave after:bg-dorado group-data-horizontal/tabs:after:bottom-0 data-active:text-verde-oliva"
          >
            {titulo}
          </TabsTrigger>
        ))}
      </TabsList>
      {PESTANAS.map(({ valor }) => (
        <TabsContent key={valor} value={valor}>
          {paneles[valor]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
