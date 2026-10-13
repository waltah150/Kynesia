type Props = {
  titulo: string;
  descripcion?: string;
};

/** Título de cada sección, con la línea dorada fina de la marca. */
export function EncabezadoSeccion({ titulo, descripcion }: Props) {
  return (
    <header className="mb-8 border-b border-dorado/40 pb-4">
      <h1 className="text-3xl text-verde-oliva md:text-4xl">{titulo}</h1>
      {descripcion && <p className="mt-1 text-sm text-texto-suave">{descripcion}</p>}
    </header>
  );
}
