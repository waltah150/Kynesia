/** Aviso provisorio para las secciones que todavía no se construyeron. */
export function Proximamente({ fase }: { fase: number }) {
  return (
    <div className="rounded-lg border border-border bg-blanco px-6 py-12 text-center">
      <p className="text-sm text-texto-suave">
        Esta sección se construye en la <span className="text-texto">Fase {fase}</span>.
      </p>
    </div>
  );
}
