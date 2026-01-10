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

    // Solo ADMIN y STAFF pueden subir fotos
    if (session.user.role === "CLIENT") {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const clientName = formData.get("clientName") as string;

    if (!clientName) {
      return NextResponse.json(
        { error: "Nombre del cliente es requerido" },
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No se enviaron archivos" },
        { status: 400 }
      );
    }

    // Sanitizar el nombre del cliente para usar como carpeta
    const sanitizedClientName = clientName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^a-z0-9]/g, "-") // Reemplazar caracteres especiales con guiones
      .replace(/-+/g, "-") // Evitar guiones múltiples
      .replace(/^-|-$/g, ""); // Remover guiones al inicio/final

    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    // Procesar cada archivo
    for (const file of files) {
      if (file.size === 0) continue;

      // Validar tipo de archivo (solo imágenes)
      if (!file.type.startsWith("image/")) {
        continue;
      }

      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const extension = file.name.split('.').pop() || 'jpg';
      const uniqueFileName = `${timestamp}-${randomStr}.${extension}`;

      // Ruta en Supabase Storage: clientName/filename
      const storagePath = `${sanitizedClientName}/${uniqueFileName}`;

      // Convertir File a ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Subir a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.RECORDS)
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Error al subir archivo a Supabase:", uploadError);
        errors.push(uploadError.message);
        continue;
      }

      // Obtener URL pública
      const publicUrl = getPublicUrl(STORAGE_BUCKETS.RECORDS, storagePath);
      uploadedUrls.push(publicUrl);
    }

    if (uploadedUrls.length === 0) {
      const errorMessage = errors.length > 0 ? errors[0] : "Error desconocido";
      return NextResponse.json(
        {
          error: "No se pudieron subir los archivos",
          details: errorMessage,
          hint: errorMessage.includes("not found")
            ? "El bucket 'records' no existe. Créalo en Supabase Dashboard > Storage."
            : errorMessage.includes("security") || errorMessage.includes("policy")
            ? "Falta configurar políticas RLS en el bucket. Ve a Supabase Dashboard > Storage > records > Policies."
            : undefined
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Archivos subidos exitosamente",
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("Error al subir archivos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: String(error) },
      { status: 500 }
    );
  }
}
