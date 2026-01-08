import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import mammoth from 'mammoth';

export async function POST(req: NextRequest) {
    console.log("Upload request received");

    // 1. Auth Check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log("Processing file:", file.name, file.type, file.size);

        // 2. Upload to Supabase Storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase
            .storage
            .from('project_files')
            .upload(fileName, file);

        if (uploadError) {
            console.error("Storage upload error:", uploadError);
            return NextResponse.json({ error: "Failed to upload file to storage" }, { status: 500 });
        }

        // 3. Extract Text (Server-side Parsing)
        let extractedText = "";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === "application/pdf") {
            // For PDFs in serverless, we'll provide a placeholder
            // Users can still upload PDFs, but text extraction is limited
            extractedText = `PDF Document: ${file.name}\n\nNote: Full PDF text extraction is not available in the current deployment. The document has been uploaded successfully and can be downloaded for reference.`;
        } else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            try {
                const result = await mammoth.extractRawText({ buffer: buffer });
                extractedText = result.value;
            } catch (e) {
                console.error("DOCX Parse Error", e);
                extractedText = "Error parsing DOCX content.";
            }
        } else {
            // Text file fallback
            try {
                extractedText = buffer.toString('utf-8');
            } catch (e) {
                extractedText = `File uploaded: ${file.name}`;
            }
        }

        // Limit text length to avoid DB overflow
        const TRUNCATE_LIMIT = 50000;
        if (extractedText.length > TRUNCATE_LIMIT) {
            extractedText = extractedText.substring(0, TRUNCATE_LIMIT) + "... [Truncated]";
        }

        return NextResponse.json({
            success: true,
            filePath: fileName,
            extractedText: extractedText
        });

    } catch (err) {
        console.error("Upload handler error:", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
