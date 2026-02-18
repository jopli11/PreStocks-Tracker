import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://prestocks.com/api/prestocks', {
      next: { revalidate: 60 }, // Cache for 60 seconds
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch from PreStocks API: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('PreStocks API Proxy Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
