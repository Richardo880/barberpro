import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabase, STORAGE_BUCKETS, getPublicUrl } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo ADMIN y STAFF pueden subir fotos de servicios
    if (session.user.role === "CLIENT") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { error: "No se envió ningún archivo" },
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

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'jpg';
    const uniqueFileName = `${timestamp}-${randomStr}.${extension}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Subir a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.SERVICES)
      .upload(uniqueFileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Error al subir archivo a Supabase:", uploadError);
      return NextResponse.json(
        { error: "Error al subir el archivo" },
        { status: 500 }
      );
    }

    // Obtener URL pública
    const publicUrl = getPublicUrl(STORAGE_BUCKETS.SERVICES, uniqueFileName);

    return NextResponse.json({
      message: "Archivo subido exitosamente",
      url: publicUrl,
    });
  } catch (error) {
    console.error("Error al subir archivo:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
