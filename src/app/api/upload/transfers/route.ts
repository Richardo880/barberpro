import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth-mobile";
import { supabase, STORAGE_BUCKETS, getPublicUrl } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No se envió archivo" },
        { status: 400 }
      );
    }

    // Validar tipo de archivo (solo imágenes)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Solo se permiten archivos de imagen" },
        { status: 400 }
      );
    }

    // Limitar tamaño a 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "El archivo no puede superar 5MB" },
        { status: 400 }
      );
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split(".").pop() || "jpg";
    const uniqueFileName = `${timestamp}-${randomStr}.${extension}`;

    // Ruta en storage: userId/filename
    const storagePath = `${session.user.id}/${uniqueFileName}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.TRANSFERS)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error al subir comprobante a Supabase:", uploadError);
      return NextResponse.json(
        {
          error: "No se pudo subir el archivo",
          details: uploadError.message,
          hint: uploadError.message.includes("not found")
            ? "El bucket 'transfers' no existe. Crealo en Supabase Dashboard > Storage."
            : undefined,
        },
        { status: 400 }
      );
    }

    const publicUrl = getPublicUrl(STORAGE_BUCKETS.TRANSFERS, storagePath);

    return NextResponse.json({
      message: "Comprobante subido exitosamente",
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error al subir comprobante:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: String(error) },
      { status: 500 }
    );
  }
}
