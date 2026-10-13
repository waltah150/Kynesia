import type { Metadata } from "next";
import { EncabezadoSeccion } from "@/components/layout/encabezado-seccion";
import { Proximamente } from "@/components/layout/proximamente";

export const metadata: Metadata = {
  title: "Historial",
};

export default function HistorialPage() {
  return (
    <>
      <EncabezadoSeccion titulo="Historial" descripcion="Todos los turnos de un cliente." />
      <Proximamente fase={6} />
    </>
  );
}
