import type { Metadata } from "next";
import { EncabezadoSeccion } from "@/components/layout/encabezado-seccion";
import { Proximamente } from "@/components/layout/proximamente";

export const metadata: Metadata = {
  title: "Servicios y precios",
};

export default function ServiciosPage() {
  return (
    <>
      <EncabezadoSeccion
        titulo="Servicios y precios"
        descripcion="Grupos, servicios, paquetes y promociones."
      />
      <Proximamente fase={3} />
    </>
  );
}
