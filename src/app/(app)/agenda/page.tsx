import type { Metadata } from "next";
import { EncabezadoSeccion } from "@/components/layout/encabezado-seccion";
import { Proximamente } from "@/components/layout/proximamente";

export const metadata: Metadata = {
  title: "Agenda",
};

export default function AgendaPage() {
  return (
    <>
      <EncabezadoSeccion titulo="Agenda" descripcion="Turnos del día, la semana o el mes." />
      <Proximamente fase={5} />
    </>
  );
}
