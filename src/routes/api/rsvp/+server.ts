import { json } from '@sveltejs/kit';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const DATA_FILE = resolve('participants.json');

interface Participant {
	id: string;
	name: string;
	plusOneName: string | null;
	response: 'yes' | 'yes+1' | 'no';
	timestamp: string;
}

function readData(): Participant[] {
	if (!existsSync(DATA_FILE)) return [];
	try {
		return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
	} catch {
		return [];
	}
}

export async function GET() {
	return json(readData());
}

export async function POST({ request }) {
	const body = await request.json();
	const { name, plusOneName, response } = body;

	if (!name || typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Name is required' }, { status: 400 });
	}
	if (!['yes', 'yes+1', 'no'].includes(response)) {
		return json({ error: 'Invalid response' }, { status: 400 });
	}

	const data = readData();
	const entry: Participant = {
		id: crypto.randomUUID(),
		name: name.trim(),
		plusOneName: plusOneName?.trim() || null,
		response,
		timestamp: new Date().toISOString()
	};

	data.push(entry);
	writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
	return json({ success: true, participant: entry });
}
