import { json } from '@sveltejs/kit';
import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';

interface Participant {
	id: string;
	name: string;
	plusOneName: string | null;
	response: 'yes' | 'yes+1' | 'no';
	timestamp: string;
}

function getDb() {
	if (!env.POSTGRES_URL) throw new Error('POSTGRES_URL not set');
	return neon(env.POSTGRES_URL);
}

async function ensureTable() {
	const sql = getDb();
	await sql`
		CREATE TABLE IF NOT EXISTS participants (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			plus_one_name TEXT,
			response TEXT NOT NULL,
			timestamp TIMESTAMPTZ NOT NULL
		)
	`;
}

export async function GET() {
	await ensureTable();
	const sql = getDb();
	const rows = await sql`SELECT * FROM participants ORDER BY timestamp ASC`;
	const participants: Participant[] = rows.map((r) => ({
		id: r.id,
		name: r.name,
		plusOneName: r.plus_one_name ?? null,
		response: r.response as Participant['response'],
		timestamp: r.timestamp instanceof Date ? r.timestamp.toISOString() : String(r.timestamp)
	}));
	return json(participants);
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

	await ensureTable();

	const sql = getDb();
	const id = crypto.randomUUID();
	const timestamp = new Date().toISOString();
	const trimmedName = name.trim();
	const trimmedPlusOne = plusOneName?.trim() || null;

	await sql`
		INSERT INTO participants (id, name, plus_one_name, response, timestamp)
		VALUES (${id}, ${trimmedName}, ${trimmedPlusOne}, ${response}, ${timestamp})
	`;

	const participant: Participant = {
		id,
		name: trimmedName,
		plusOneName: trimmedPlusOne,
		response,
		timestamp
	};

	return json({ success: true, participant });
}
