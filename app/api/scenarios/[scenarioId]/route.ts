import { NextResponse } from 'next/server';
import { loadScenario } from '@/lib/scenarios';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ scenarioId: string }> }
) {
  try {
    const { scenarioId } = await params;
    const scenario = loadScenario(scenarioId);

    if (!scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(scenario);
  } catch (error) {
    console.error('Error loading scenario:', error);
    return NextResponse.json(
      { error: 'Failed to load scenario' },
      { status: 500 }
    );
  }
}
