import { MenuLateral } from "@/components/layout/menu-lateral";
import { MenuMovil } from "@/components/layout/menu-movil";
import { createClient } from "@/lib/supabase/server";

/**
 * Marco de todas las pantallas internas: menú lateral en computadora y
 * barra con menú desplegable en el celular. src/proxy.ts ya garantiza que
 * solo se llega acá con sesión iniciada.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;

  return (
    <div className="flex min-h-dvh flex-1 flex-col md:flex-row">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 md:block">
        <MenuLateral email={email} />
      </aside>
      <MenuMovil email={email} />
      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
