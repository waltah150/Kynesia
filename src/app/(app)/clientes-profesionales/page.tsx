import type { Metadata } from "next";
import { EncabezadoSeccion } from "@/components/layout/encabezado-seccion";
import { Proximamente } from "@/components/layout/proximamente";

export const metadata: Metadata = {
  title: "Clientes y profesionales",
};

export default function ClientesProfesionalesPage() {
  return (
    <>
      <EncabezadoSeccion
        titulo="Clientes y profesionales"
        descripcion="Fichas de clientes y profesionales, sus horarios y el horario del spa."
      />
      <Proximamente fase={4} />
    </>
  );
}
