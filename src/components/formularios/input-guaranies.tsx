"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { formatearEntradaGs, formatearMiles } from "@/lib/formato";

type Props = {
  id: string;
  name: string;
  valorInicial?: number;
  invalido?: boolean;
};

/** Campo de precio en guaraníes: se escribe "150000" y se ve "150.000". */
export function InputGuaranies({ id, name, valorInicial, invalido }: Props) {
  const [texto, setTexto] = useState(
    valorInicial === undefined ? "" : formatearMiles(valorInicial),
  );

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-texto-suave">
        Gs.
      </span>
      <Input
        id={id}
        name={name}
        inputMode="numeric"
        autoComplete="off"
        placeholder="0"
        value={texto}
        onChange={(evento) => setTexto(formatearEntradaGs(evento.target.value))}
        aria-invalid={invalido}
        aria-describedby={invalido ? `${id}-error` : undefined}
        className="h-10 bg-blanco pl-10"
      />
    </div>
  );
}
