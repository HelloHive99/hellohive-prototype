import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Response contract (always HTTP 200 JSON)
type TranscribeResponse =
  | { text: string; fallback: false }
  | { text: null; fallback: true; error?: string };

export async function POST(request: NextRequest): Promise<NextResponse<TranscribeResponse>> {
  try {
    // Check Content-Length header
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5_242_880) {
      return NextResponse.json({
        text: null,
        fallback: true,
        error: 'File too large'
      });
    }

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        text: null,
        fallback: true,
        error: 'No API key configured'
      });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({
        text: null,
        fallback: true,
        error: 'No file provided'
      });
    }

    // Check file size after parsing
    if (file.size > 5_242_880) {
      return NextResponse.json({
        text: null,
        fallback: true,
        error: 'File too large'
      });
    }

    // Create OpenAI client
    const openai = new OpenAI({ apiKey });

    // Create AbortController for 10-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      // Convert Blob to File for OpenAI API
      const audioFile = new File([file], 'audio.webm', { type: file.type });

      // Call Whisper API
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      }, {
        signal: controller.signal as AbortSignal,
      });

      clearTimeout(timeoutId);

      return NextResponse.json({
        text: transcription.text,
        fallback: false
      });
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if error is due to timeout
      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({
          text: null,
          fallback: true,
          error: 'Transcription timeout'
        });
      }

      // Any other error (network, 401, parse error, etc.)
      return NextResponse.json({
        text: null,
        fallback: true,
        error: error instanceof Error ? error.message : 'Transcription failed'
      });
    }
  } catch (error) {
    // Catch any errors in the outer try block (formData parsing, etc.)
    return NextResponse.json({
      text: null,
      fallback: true,
      error: error instanceof Error ? error.message : 'Request failed'
    });
  }
}
