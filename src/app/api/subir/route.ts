import { NextResponse } from "next/server";
import { writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { randomUUID } from "node:crypto";
import { haySesion } from "@/lib/sesion";

const EXTENSIONES = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const MAXIMO = 8 * 1024 * 1024; // 8 MB

export async function POST(req: Request) {
  if (!(await haySesion())) {
    return NextResponse.json({ error: "No autorizada" }, { status: 401 });
  }

  const formulario = await req.formData();
  const archivo = formulario.get("archivo");
  if (!(archivo instanceof File)) {
    return NextResponse.json({ error: "No llegó ningún archivo" }, { status: 400 });
  }
  if (archivo.size > MAXIMO) {
    return NextResponse.json({ error: "La foto pesa más de 8 MB" }, { status: 400 });
  }

  const extension = extname(archivo.name).toLowerCase();
  if (!EXTENSIONES.has(extension)) {
    return NextResponse.json({ error: "Formato no soportado" }, { status: 400 });
  }

  const nombre = `${randomUUID()}${extension}`;
  const bytes = Buffer.from(await archivo.arrayBuffer());
  await writeFile(join(process.cwd(), "public", "uploads", nombre), bytes);

  return NextResponse.json({ url: `/uploads/${nombre}` });
}
