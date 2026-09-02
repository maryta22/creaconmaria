import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Crea con María — Bisutería personalizada",
    template: "%s · Crea con María",
  },
  description:
    "Pulseras, collares, colgadores de mochila y carteras de cuentas hechos a mano, pieza por pieza.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
