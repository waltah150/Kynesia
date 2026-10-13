"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { cerrarSesion } from "@/lib/auth/actions";
import { ITEMS_MENU } from "./navegacion";

type Props = {
  email?: string;
  /** Se llama al elegir una sección (sirve para cerrar el menú en el celular). */
  onNavegar?: () => void;
};

/** Contenido del menú: logo, secciones y cierre de sesión. */
export function MenuLateral({ email, onNavegar }: Props) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-verde-oliva text-dorado-claro">
      <div className="flex justify-center border-b border-dorado/20 py-4">
        <div className="relative size-28 overflow-hidden">
          <Image
            src="/logo-kynesia.jpeg"
            alt="Kynesia Spa"
            fill
            sizes="7rem"
            className="scale-[1.6] object-cover"
          />
        </div>
      </div>

      <nav aria-label="Secciones" className="flex-1 px-3 py-6">
        <ul className="flex flex-col gap-1">
          {ITEMS_MENU.map(({ href, titulo, icono: Icono }) => {
            const activo = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavegar}
                  aria-current={activo ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-md border-l-2 px-3 py-2.5 text-sm transition-colors",
                    activo
                      ? "border-dorado bg-verde-oliva-claro text-crema"
                      : "border-transparent hover:bg-verde-oliva-claro/60 hover:text-crema",
                  )}
                >
                  <Icono
                    className={cn("size-4", activo ? "text-dorado" : "text-dorado/70")}
                    aria-hidden
                  />
                  {titulo}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-dorado/20 px-3 py-4">
        {email && (
          <p className="truncate px-3 pb-2 text-xs text-dorado-claro/80" title={email}>
            {email}
          </p>
        )}
        <form action={cerrarSesion}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors hover:bg-verde-oliva-claro/60 hover:text-crema"
          >
            <LogOut className="size-4 text-dorado/70" aria-hidden />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}
