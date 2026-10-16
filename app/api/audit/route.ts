import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase';
import { checkRateLimit, validateApiKey } from '@/lib/apiSecurity';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
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

  // 3. Query parameter validation
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  // 4. Supabase DB query
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Database service not configured' },
      { status: 503 }
    );
  }

  try {
    let query = supabase
      .from('audit_logs')
      .select('id, user_id, score, band, features, flags, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (userId && userId.trim() && userId !== 'all' && userId !== '*') {
      query = query.eq('user_id', userId.trim());
    }

    const { data: logs, error } = await query;

    if (error) {
      console.error('Supabase audit logs fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to retrieve audit logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: logs || [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown internal error';
    console.error('Audit query error:', message);
    return NextResponse.json(
      { error: 'Internal server error retrieving audit records' },
      { status: 500 }
    );
  }
}
