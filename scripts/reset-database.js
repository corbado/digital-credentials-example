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

async function resetDatabase() {
  let connection;

  try {
    console.log("🔗 Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database successfully");

    // Get current timestamp for logging
    const now = new Date();
    console.log(`\n🕒 Starting database reset at: ${now.toISOString()}`);

    // Tables to reset (in order to respect foreign key constraints)
    const tables = [
      "verified_credentials",
      "issued_credentials",
      "issuance_sessions",
      "authorization_codes",
      "verification_sessions",
      "challenges",
      "issuer_keys",
      // Note: issuer_keys is now included for complete cleanup
    ];

    console.log("\n🗑️  Resetting database tables...");

    for (const table of tables) {
      console.log(`   🧹 Clearing table: ${table}`);
      const [result] = await connection.execute(`DELETE FROM ${table}`);
      console.log(`   ✅ Cleared ${result.affectedRows} records from ${table}`);
    }

    // Show final table statistics
    console.log("\n📊 Final database statistics:");

    const allTables = [
      "challenges",
      "verification_sessions",
      "verified_credentials",
      "authorization_codes",
      "issuance_sessions",
      "issued_credentials",
      "issuer_keys",
    ];

    for (const table of allTables) {
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      console.log(`   ${table}: ${countResult[0].count} records`);
    }

    console.log("\n✅ Database reset completed successfully!");
    console.log("💡 Note: All tables including issuer_keys have been cleared");
  } catch (error) {
    console.error("❌ Error during database reset:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run reset if this script is executed directly
if (require.main === module) {
  // Add a safety prompt
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "⚠️  WARNING: This will delete ALL data from the database. Are you sure? (yes/no): ",
    (answer) => {
      if (answer.toLowerCase() === "yes") {
        rl.close();
        resetDatabase();
      } else {
        console.log("❌ Database reset cancelled.");
        rl.close();
        process.exit(0);
      }
    }
  );
}

module.exports = { resetDatabase };
