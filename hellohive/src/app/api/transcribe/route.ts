import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { properties, vendors } from '@/data/seed-data';

export interface ParsedFields {
  title: string | null;
  priority: 'urgent' | 'high' | 'medium' | 'low' | null;
  category: 'MEP' | 'Electrical' | 'Janitorial' | 'Security' | 'AV/Broadcast' | null;
  propertyId: string | null;
  spaceId: string | null;
  suggestedVendorId: string | null;
}

type TranscribeResponse =
  | { text: string; fallback: false; parsed: ParsedFields }
  | { text: null; fallback: true; error?: string };

// Build Claude context once at module level (static seed data)
const FACILITIES_CONTEXT = properties.map((p) => ({
  id: p.id,
  name: p.name,
  spaces: p.spaces.map((s) => ({ id: s.id, name: s.name, type: s.type })),
}));

const VENDORS_CONTEXT = vendors.map((v) => ({
  id: v.id,
  name: v.name,
  category: v.category,
}));

const NULL_PARSED: ParsedFields = {
  title: null,
  priority: null,
  category: null,
  propertyId: null,
  spaceId: null,
  suggestedVendorId: null,
};

async function extractFields(transcriptText: string): Promise<ParsedFields> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) return NULL_PARSED;

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const prompt = `You are a facilities work-order intake assistant for a professional sports organization managing multiple venues.

Extract structured work order fields from this voice transcript.

Available facilities and spaces:
${JSON.stringify(FACILITIES_CONTEXT)}

Available vendors (match by category and issue type):
${JSON.stringify(VENDORS_CONTEXT)}

Valid categories: MEP, Electrical, Janitorial, Security, AV/Broadcast
Valid priorities:
- urgent: immediate safety or broadcast operations risk
- high: significant impact, needs same-day response
- medium: impacts operations but manageable
- low: routine maintenance, no immediate impact

Transcript: "${transcriptText}"

Return ONLY valid JSON (no markdown, no explanation):
{
  "title": "concise 5-10 word work order title, or null if unclear",
  "priority": "urgent|high|medium|low or null if truly unclear",
  "category": "one of the valid categories or null if unclear",
  "propertyId": "matched facility id from the available list or null",
  "spaceId": "matched space id from the available list or null",
  "suggestedVendorId": "best matching vendor id based on category and issue or null"
}`;

  try {
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';
    // Strip markdown code fences Claude sometimes adds despite instructions
    const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    return JSON.parse(text) as ParsedFields;
  } catch (err) {
    console.error('[extractFields] Claude extraction failed:', err);
    return NULL_PARSED;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<TranscribeResponse>> {
  try {
    // Check Content-Length header
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 5_242_880) {
      return NextResponse.json({ text: null, fallback: true, error: 'File too large' });
    }

    // Check for OpenAI API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ text: null, fallback: true, error: 'No API key configured' });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ text: null, fallback: true, error: 'No file provided' });
    }

    if (file.size > 5_242_880) {
      return NextResponse.json({ text: null, fallback: true, error: 'File too large' });
    }

    const openai = new OpenAI({ apiKey });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const audioFile = new File([file], 'audio.webm', { type: file.type });

      const transcription = await openai.audio.transcriptions.create(
        { file: audioFile, model: 'whisper-1' },
        { signal: controller.signal as AbortSignal }
      );

      clearTimeout(timeoutId);

      // Extract structured fields from the real transcript using Claude Haiku
      const parsed = await extractFields(transcription.text);

      return NextResponse.json({ text: transcription.text, fallback: false, parsed });
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        return NextResponse.json({ text: null, fallback: true, error: 'Transcription timeout' });
      }

      return NextResponse.json({
        text: null,
        fallback: true,
        error: error instanceof Error ? error.message : 'Transcription failed',
      });
    }
  } catch (error) {
    return NextResponse.json({
      text: null,
      fallback: true,
      error: error instanceof Error ? error.message : 'Request failed',
    });
  }
}
