import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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

    // Sanitizar el nombre del cliente para usar como nombre de carpeta
    const sanitizedClientName = clientName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remover acentos
      .replace(/[^a-z0-9]/g, "-") // Reemplazar caracteres especiales con guiones
      .replace(/-+/g, "-") // Evitar guiones múltiples
      .replace(/^-|-$/g, ""); // Remover guiones al inicio/final

    // Crear la ruta de la carpeta del cliente
    const clientFolder = path.join(
      process.cwd(),
      "public",
      "images",
      "records",
      sanitizedClientName
    );

    // Crear la carpeta si no existe
    if (!existsSync(clientFolder)) {
      await mkdir(clientFolder, { recursive: true });
    }

    const uploadedUrls: string[] = [];

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
      const extension = path.extname(file.name);
      const uniqueFileName = `${timestamp}-${randomStr}${extension}`;

      // Guardar el archivo
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filePath = path.join(clientFolder, uniqueFileName);

      await writeFile(filePath, buffer);

      // Construir la URL pública
      const publicUrl = `/images/records/${sanitizedClientName}/${uniqueFileName}`;
      uploadedUrls.push(publicUrl);
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { error: "No se pudieron subir los archivos" },
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
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
