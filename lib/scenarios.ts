import * as fs from 'fs';
import * as path from 'path';

export type InterviewMessage = {
  role: 'project_agent' | 'user_agent';
  content: string;
  timestamp: number;
};

export type InterviewScenario = {
  scenarioId: string;
  projectName: string;
  userName: string;
  messages: InterviewMessage[];
  result: {
    decision: 'PASSED' | 'FAILED';
    score: number;
    reasoning: string;
  };
};

export function loadScenario(scenarioId: string): InterviewScenario | null {
  try {
    const scenarioPath = path.join(
      process.cwd(),
      'src/data/scenarios',
      `${scenarioId}.json`
    );

    const scenarioData = fs.readFileSync(scenarioPath, 'utf-8');
    return JSON.parse(scenarioData);
  } catch (error) {
    console.error(`Failed to load scenario: ${scenarioId}`, error);
    return null;
  }
}

export function listScenarios(): string[] {
  try {
    const scenariosDir = path.join(process.cwd(), 'src/data/scenarios');
    const files = fs.readdirSync(scenariosDir);
    return files
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace('.json', ''));
  } catch (error) {
    console.error('Failed to list scenarios:', error);
    return [];
  }
}
