import { NextRequest, NextResponse } from 'next/server';

// PDF parser function - uses require to avoid Next.js bundling issues
async function parsePdf(buffer: Buffer): Promise<string> {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require('pdf-parse');
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error('PDF parse error:', error);
        throw new Error('Failed to parse PDF');
    }
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        const fileName = file.name.toLowerCase();
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let content = '';
        let fileType = 'text';

        if (fileName.endsWith('.pdf')) {
            // Parse PDF
            try {
                content = await parsePdf(buffer);
                fileType = 'pdf';
            } catch (pdfError) {
                console.error('PDF parsing error:', pdfError);
                return NextResponse.json(
                    { error: 'Failed to parse PDF. The file may be corrupted or password-protected.' },
                    { status: 400 }
                );
            }
        } else if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) {
            content = buffer.toString('utf-8');
            fileType = 'markdown';
        } else if (fileName.endsWith('.txt')) {
            content = buffer.toString('utf-8');
            fileType = 'text';
        } else if (fileName.endsWith('.json')) {
            content = buffer.toString('utf-8');
            fileType = 'json';
            // Pretty print JSON
            try {
                const parsed = JSON.parse(content);
                content = '```json\n' + JSON.stringify(parsed, null, 2) + '\n```';
            } catch {
                // Keep as-is if not valid JSON
            }
        } else {
            return NextResponse.json(
                { error: 'Unsupported file type' },
                { status: 400 }
            );
        }

        return NextResponse.json({
            content,
            fileType,
            fileName: file.name,
            fileSize: file.size
        });

    } catch (error) {
        console.error('Document parsing error:', error);
        return NextResponse.json(
            { error: 'Failed to parse document' },
            { status: 500 }
        );
    }
}
