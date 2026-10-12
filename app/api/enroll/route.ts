import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { checkRateLimit, validateApiKey } from '@/lib/apiSecurity';
import {
  validateNumericVector,
  arrayToRawVector,
  averageRawVectors,
  RawVector,
} from '@/app/demo/biometrics';

export const runtime = 'nodejs';

interface EnrollRequestBody {
  userId: string;
  vector: [number, number, number, number, number];
  consent: boolean;
}

export async function POST(req: NextRequest) {
  // 1. Rate limiting per IP
  const rateLimit = checkRateLimit(req);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again in 1 minute.' },
      { status: 429 }
    );
  }

  // 2. API key validation
  const apiKeyCheck = validateApiKey(req);
  if (!apiKeyCheck.valid) {
    return NextResponse.json(
      { error: apiKeyCheck.error },
      { status: 401 }
    );
  }

  // 3. Body parsing & validation
  let body: EnrollRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON request body' },
      { status: 400 }
    );
  }

  const { userId, vector, consent } = body;

  if (typeof userId !== 'string' || !userId.trim()) {
    return NextResponse.json(
      { error: 'userId must be a non-empty string' },
      { status: 400 }
    );
  }

  if (consent !== true) {
    return NextResponse.json(
      { error: 'Consent is required (consent must be true) to enroll a behavioral profile' },
      { status: 400 }
    );
  }

  const vectorValidation = validateNumericVector(vector);
  if (!vectorValidation.valid || !vectorValidation.vector) {
    return NextResponse.json(
      { error: vectorValidation.error || 'Invalid 5D vector' },
      { status: 400 }
    );
  }

  // Convert array to RawVector object
  const newSessionRaw: RawVector = arrayToRawVector(vectorValidation.vector);

  // 4. Supabase DB interaction
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database service not configured (missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)' },
      { status: 503 }
    );
  }

  try {
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Supabase fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Database query error during enrollment check' },
        { status: 500 }
      );
    }

    let sessionsCount = 1;
    let enrolled = false;

    if (!existingProfile) {
      // First enrollment session
      const baselinePayload = {
        sessions: [newSessionRaw],
        centroid: newSessionRaw,
      };

      const { error: insertError } = await supabase.from('profiles').insert({
        user_id: userId,
        baseline: baselinePayload,
        sessions_count: 1,
        consent: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return NextResponse.json(
          { error: 'Failed to record initial baseline session' },
          { status: 500 }
        );
      }

      sessionsCount = 1;
      enrolled = false;
    } else {
      // Profile exists: append session and recompute centroid
      const existingBaseline = existingProfile.baseline;
      const priorSessions: RawVector[] = Array.isArray(existingBaseline?.sessions)
        ? existingBaseline.sessions
        : [existingBaseline?.centroid || existingBaseline];

      const updatedSessions: RawVector[] = [...priorSessions, newSessionRaw];
      const updatedCentroid = averageRawVectors(updatedSessions);
      sessionsCount = updatedSessions.length;
      enrolled = sessionsCount >= 3;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          baseline: {
            sessions: updatedSessions,
            centroid: updatedCentroid,
          },
          sessions_count: sessionsCount,
          consent: true,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Supabase update error:', updateError);
        return NextResponse.json(
          { error: 'Failed to update baseline session in database' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      sessionsCount,
      enrolled,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown internal error';
    console.error('Enrollment route error:', message);
    return NextResponse.json(
      { error: 'Internal server error processing enrollment' },
      { status: 500 }
    );
  }
}
