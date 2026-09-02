import { NextResponse } from "next/server";
import { NOMBRE_COOKIE } from "@/lib/sesion";

export async function POST() {
  const respuesta = NextResponse.json({ ok: true });
  respuesta.cookies.set({ name: NOMBRE_COOKIE, value: "", path: "/", maxAge: 0 });
  return respuesta;
}
