import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE = "cm_vendedora";

function clave() {
  return process.env.CLAVE_VENDEDORA ?? "maria2026";
}

/** Token = HMAC de la clave consigo misma. Suficiente para un panel de una persona. */
function token() {
  return createHmac("sha256", clave()).update("panel-vendedora").digest("hex");
}

export function claveCorrecta(intento: string) {
  const a = Buffer.from(intento);
  const b = Buffer.from(clave());
  return a.length === b.length && timingSafeEqual(a, b);
}

export function cookieDeSesion() {
  return {
    name: COOKIE,
    value: token(),
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  };
}

export const NOMBRE_COOKIE = COOKIE;

export async function haySesion() {
  const galleta = (await cookies()).get(COOKIE);
  return galleta?.value === token();
}
