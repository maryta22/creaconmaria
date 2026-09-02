import { NextResponse } from "next/server";
import { claveCorrecta, cookieDeSesion } from "@/lib/sesion";

export async function POST(req: Request) {
  const { clave } = (await req.json()) as { clave?: string };
  if (!clave || !claveCorrecta(clave)) {
    return NextResponse.json({ error: "Clave incorrecta" }, { status: 401 });
  }
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set(cookieDeSesion());
  return respuesta;
}
