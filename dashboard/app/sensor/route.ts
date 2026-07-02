import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const API_BASE_URL = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:3001';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE_URL}/sensor`, {
      cache: 'no-store',
      headers: {
        'cache-control': 'no-store',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'API nicht erreichbar' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: {
        'cache-control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    });
  } catch {
    return NextResponse.json({ error: 'API nicht erreichbar' }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const response = await fetch(`${API_BASE_URL}/sensor`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : { status: response.ok ? 'ok' : 'error' };

    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Ungueltige Anfrage' }, { status: 400 });
  }
}
