import mysql from "mysql2/promise";

// Database connection configuration
const dbConfig = {
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER || "app_user",
  password: process.env.DATABASE_PASSWORD || "app_password",
  database: process.env.DATABASE_NAME || "digital_credentials",
  timezone: "+00:00",
};

let connection: mysql.Connection | null = null;

export async function getConnection(): Promise<mysql.Connection> {
  if (!connection) {
    connection = await mysql.createConnection(dbConfig);
  }
  return connection;
}

export interface Challenge {
  id: string;
  challenge: string;
  expires_at: Date;
  created_at: Date;
  used: boolean;
}

export interface VerificationSession {
  id: string;
  challenge_id: string;
  status: "pending" | "verified" | "failed" | "expired";
  presentation_data?: any;
  verified_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Challenge operations
export async function createChallenge(
  id: string,
  challenge: string,
  expiresAt: Date
): Promise<void> {
  const conn = await getConnection();
  await conn.execute(
    "INSERT INTO challenges (id, challenge, expires_at) VALUES (?, ?, ?)",
    [id, challenge, expiresAt]
  );
}

export async function getChallenge(
  challenge: string
): Promise<Challenge | null> {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT * FROM challenges WHERE challenge = ? AND expires_at > NOW() AND used = FALSE",
    [challenge]
  );

  if (Array.isArray(rows) && rows.length > 0) {
    const row = rows[0] as any;
    return {
      id: row.id,
      challenge: row.challenge,
      expires_at: row.expires_at,
      created_at: row.created_at,
      used: row.used,
    };
  }

  return null;
}

export async function markChallengeAsUsed(challenge: string): Promise<void> {
  const conn = await getConnection();
  await conn.execute("UPDATE challenges SET used = TRUE WHERE challenge = ?", [
    challenge,
  ]);
}

export async function cleanupExpiredChallenges(): Promise<void> {
  const conn = await getConnection();
  await conn.execute("DELETE FROM challenges WHERE expires_at < NOW()");
}

// Verification session operations
export async function createVerificationSession(
  id: string,
  challengeId: string,
  status: string = "pending"
): Promise<void> {
  const conn = await getConnection();
  await conn.execute(
    "INSERT INTO verification_sessions (id, challenge_id, status) VALUES (?, ?, ?)",
    [id, challengeId, status]
  );
}

export async function updateVerificationSession(
  sessionId: string,
  status: string,
  presentationData?: any
): Promise<void> {
  const conn = await getConnection();
  const updates = ["status = ?"];
  const values = [status];

  if (presentationData) {
    updates.push("presentation_data = ?");
    values.push(JSON.stringify(presentationData));
  }

  if (status === "verified") {
    updates.push("verified_at = NOW()");
  }

  values.push(sessionId);

  await conn.execute(
    `UPDATE verification_sessions SET ${updates.join(
      ", "
    )}, updated_at = NOW() WHERE id = ?`,
    values
  );
}

export async function getVerificationSession(
  sessionId: string
): Promise<VerificationSession | null> {
  const conn = await getConnection();
  const [rows] = await conn.execute(
    "SELECT * FROM verification_sessions WHERE id = ?",
    [sessionId]
  );

  if (Array.isArray(rows) && rows.length > 0) {
    const row = rows[0] as any;
    return {
      id: row.id,
      challenge_id: row.challenge_id,
      status: row.status,
      presentation_data: row.presentation_data
        ? JSON.parse(row.presentation_data)
        : undefined,
      verified_at: row.verified_at,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  return null;
}
