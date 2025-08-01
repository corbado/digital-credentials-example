const mysql = require("mysql2/promise");

// Database connection configuration
const dbConfig = {
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER || "app_user",
  password: process.env.DATABASE_PASSWORD || "app_password",
  database: process.env.DATABASE_NAME || "digital_credentials",
  timezone: "+00:00",
};

async function showDatabaseStatus() {
  let connection;

  try {
    console.log("🔗 Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database successfully");

    console.log("\n📊 Database Status Report");
    console.log("========================");

    // Get current timestamp
    const now = new Date();
    console.log(`\n🕒 Report generated at: ${now.toISOString()}`);

    // Table statistics
    const tables = [
      { name: "challenges", description: "Verification challenges" },
      { name: "verification_sessions", description: "Verification sessions" },
      {
        name: "verified_credentials",
        description: "Verified credentials data",
      },
      { name: "authorization_codes", description: "OAuth authorization codes" },
      {
        name: "issuance_sessions",
        description: "Credential issuance sessions",
      },
      { name: "issued_credentials", description: "Issued credentials" },
      { name: "issuer_keys", description: "Cryptographic keys" },
    ];

    console.log("\n📋 Table Statistics:");
    console.log("-------------------");

    for (const table of tables) {
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${table.name}`
      );
      const count = countResult[0].count;

      // Get additional info for certain tables
      let additionalInfo = "";

      if (table.name === "challenges") {
        const [expiredResult] = await connection.execute(
          "SELECT COUNT(*) as count FROM challenges WHERE expires_at < NOW()"
        );
        const expiredCount = expiredResult[0].count;
        additionalInfo = ` (${expiredCount} expired)`;
      }

      if (table.name === "verification_sessions") {
        const [statusResult] = await connection.execute(
          "SELECT status, COUNT(*) as count FROM verification_sessions GROUP BY status"
        );
        const statusCounts = statusResult
          .map((row) => `${row.status}: ${row.count}`)
          .join(", ");
        additionalInfo = ` (${statusCounts})`;
      }

      if (table.name === "issuance_sessions") {
        const [statusResult] = await connection.execute(
          "SELECT status, COUNT(*) as count FROM issuance_sessions GROUP BY status"
        );
        const statusCounts = statusResult
          .map((row) => `${row.status}: ${row.count}`)
          .join(", ");
        additionalInfo = ` (${statusCounts})`;
      }

      if (table.name === "issued_credentials") {
        const [revokedResult] = await connection.execute(
          "SELECT COUNT(*) as count FROM issued_credentials WHERE revoked = TRUE"
        );
        const revokedCount = revokedResult[0].count;
        additionalInfo = ` (${revokedCount} revoked)`;
      }

      console.log(
        `   ${table.name.padEnd(25)} ${count
          .toString()
          .padStart(5)} records${additionalInfo}`
      );
      console.log(`   ${" ".repeat(25)} ${table.description}`);
    }

    // Show recent activity
    console.log("\n🕒 Recent Activity (last 24 hours):");
    console.log("--------------------------------");

    const [recentChallenges] = await connection.execute(
      "SELECT COUNT(*) as count FROM challenges WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );
    console.log(`   New challenges: ${recentChallenges[0].count}`);

    const [recentSessions] = await connection.execute(
      "SELECT COUNT(*) as count FROM verification_sessions WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );
    console.log(`   New verification sessions: ${recentSessions[0].count}`);

    const [recentIssuance] = await connection.execute(
      "SELECT COUNT(*) as count FROM issuance_sessions WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );
    console.log(`   New issuance sessions: ${recentIssuance[0].count}`);

    const [recentCredentials] = await connection.execute(
      "SELECT COUNT(*) as count FROM issued_credentials WHERE issued_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)"
    );
    console.log(`   New issued credentials: ${recentCredentials[0].count}`);

    // Show oldest records
    console.log("\n📅 Oldest Records:");
    console.log("-----------------");

    const [oldestChallenge] = await connection.execute(
      "SELECT created_at FROM challenges ORDER BY created_at ASC LIMIT 1"
    );
    if (oldestChallenge.length > 0) {
      console.log(`   Oldest challenge: ${oldestChallenge[0].created_at}`);
    }

    const [oldestSession] = await connection.execute(
      "SELECT created_at FROM verification_sessions ORDER BY created_at ASC LIMIT 1"
    );
    if (oldestSession.length > 0) {
      console.log(
        `   Oldest verification session: ${oldestSession[0].created_at}`
      );
    }

    const [oldestCredential] = await connection.execute(
      "SELECT issued_at FROM issued_credentials ORDER BY issued_at ASC LIMIT 1"
    );
    if (oldestCredential.length > 0) {
      console.log(
        `   Oldest issued credential: ${oldestCredential[0].issued_at}`
      );
    }

    console.log("\n✅ Database status report completed!");
  } catch (error) {
    console.error("❌ Error getting database status:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run status check if this script is executed directly
if (require.main === module) {
  showDatabaseStatus();
}

module.exports = { showDatabaseStatus };
