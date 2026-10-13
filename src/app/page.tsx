import { redirect } from "next/navigation";

// La pantalla principal de la app es la agenda.
export default function Home() {
  redirect("/agenda");
}
