import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col md:flex-row">
      {/* Marca: logo grande sobre el verde oliva */}
      <section className="flex items-center justify-center bg-verde-oliva px-6 py-10 md:w-1/2 md:py-0">
        {/* El logo trae mucho margen verde: se recorta con un zoom suave */}
        <div className="relative size-60 overflow-hidden md:size-[26rem]">
          <Image
            src="/logo-kynesia.jpeg"
            alt="Kynesia Spa"
            fill
            priority
            sizes="(min-width: 768px) 26rem, 15rem"
            className="scale-[1.6] object-cover"
          />
        </div>
      </section>

      {/* Formulario */}
      <section className="flex flex-1 items-center justify-center bg-crema px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 border-b border-dorado/40 pb-6">
            <h1 className="text-4xl text-verde-oliva">Iniciar sesión</h1>
            <p className="mt-2 text-sm text-texto-suave">
              Ingresá para ver la agenda del spa.
            </p>
          </div>
          <LoginForm />
          <p className="mt-8 text-xs text-texto-suave">
            Las cuentas se crean por invitación. Si no tenés acceso, pedíselo a la
            administración.
          </p>
        </div>
      </section>
    </main>
  );
}
