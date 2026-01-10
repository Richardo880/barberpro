import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Verificar variables de entorno
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        error: "Variables de entorno faltantes",
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseAnonKey,
      });
    }

    // Crear cliente
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Listar buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      return NextResponse.json({
        error: "Error al listar buckets",
        details: bucketsError.message,
        fullError: bucketsError,
      });
    }

    // Intentar subir un archivo de prueba a cada bucket
    const testResults: Record<string, any> = {};
    const testBuckets = ["records", "services", "staff"];

    for (const bucketName of testBuckets) {
      const bucketExists = buckets?.some(b => b.name === bucketName);

      if (!bucketExists) {
        testResults[bucketName] = { exists: false, error: "Bucket no existe" };
        continue;
      }

      // Intentar subir un archivo de prueba
      const testContent = new Uint8Array([0x89, 0x50, 0x4E, 0x47]); // PNG header
      const testFileName = `test-${Date.now()}.txt`;

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(testFileName, testContent, {
          contentType: "text/plain",
          upsert: true,
        });

      if (error) {
        testResults[bucketName] = {
          exists: true,
          canUpload: false,
          error: error.message,
          fullError: error,
        };
      } else {
        // Eliminar archivo de prueba
        await supabase.storage.from(bucketName).remove([testFileName]);
        testResults[bucketName] = {
          exists: true,
          canUpload: true,
        };
      }
    }

    return NextResponse.json({
      success: true,
      supabaseUrl,
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      testResults,
    });
  } catch (error) {
    return NextResponse.json({
      error: "Error interno",
      details: String(error),
    });
  }
}
