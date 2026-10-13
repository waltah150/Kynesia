import { CalendarDays, History, Sparkles, Users, type LucideIcon } from "lucide-react";

export type ItemMenu = {
  href: string;
  titulo: string;
  icono: LucideIcon;
};

/** Las 4 secciones de la app, en el orden en que aparecen en el menú. */
export const ITEMS_MENU: ItemMenu[] = [
  { href: "/agenda", titulo: "Agenda", icono: CalendarDays },
  { href: "/clientes-profesionales", titulo: "Clientes y profesionales", icono: Users },
  { href: "/servicios", titulo: "Servicios y precios", icono: Sparkles },
  { href: "/historial", titulo: "Historial", icono: History },
];
