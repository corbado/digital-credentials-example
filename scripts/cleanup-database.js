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

async function cleanupDatabase() {
  let connection;

  try {
    console.log("🔗 Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("✅ Connected to database successfully");

    // Get current timestamp for logging
    const now = new Date();
    console.log(`\n🕒 Starting cleanup at: ${now.toISOString()}`);

    // 1. Clean up expired challenges
    console.log("\n🧹 Cleaning up expired challenges...");
    const [challengeResult] = await connection.execute(
      "DELETE FROM challenges WHERE expires_at < NOW()"
    );
    console.log(
      `   ✅ Removed ${challengeResult.affectedRows} expired challenges`
    );

    // 2. Clean up old verification sessions (older than 30 days)
    console.log("\n🧹 Cleaning up old verification sessions...");
    const [sessionResult] = await connection.execute(
      "DELETE FROM verification_sessions WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    console.log(
      `   ✅ Removed ${sessionResult.affectedRows} old verification sessions`
    );

    // 3. Clean up expired authorization codes
    console.log("\n🧹 Cleaning up expired authorization codes...");
    const [authCodeResult] = await connection.execute(
      "DELETE FROM authorization_codes WHERE expires_at < NOW()"
    );
    console.log(
      `   ✅ Removed ${authCodeResult.affectedRows} expired authorization codes`
    );

    // 4. Clean up old issuance sessions (older than 30 days)
    console.log("\n🧹 Cleaning up old issuance sessions...");
    const [issuanceResult] = await connection.execute(
      "DELETE FROM issuance_sessions WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)"
    );
    console.log(
      `   ✅ Removed ${issuanceResult.affectedRows} old issuance sessions`
    );

    // 5. Clean up old verified credentials data (older than 90 days)
    console.log("\n🧹 Cleaning up old verified credentials data...");
    const [verifiedCredResult] = await connection.execute(
      "DELETE FROM verified_credentials WHERE verified_at < DATE_SUB(NOW(), INTERVAL 90 DAY)"
    );
    console.log(
      `   ✅ Removed ${verifiedCredResult.affectedRows} old verified credentials records`
    );

    // 6. Clean up all issuer keys
    console.log("\n🧹 Cleaning up all issuer keys...");
    const [issuerKeysResult] = await connection.execute(
      "DELETE FROM issuer_keys"
    );
    console.log(`   ✅ Removed ${issuerKeysResult.affectedRows} issuer keys`);

    // 7. Optional: Clean up old issued credentials (older than 1 year)
    // Uncomment the following lines if you want to remove old issued credentials
    /*
    console.log('\n🧹 Cleaning up old issued credentials...');
    const [issuedCredResult] = await connection.execute(
      'DELETE FROM issued_credentials WHERE issued_at < DATE_SUB(NOW(), INTERVAL 1 YEAR)'
    );
    console.log(`   ✅ Removed ${issuedCredResult.affectedRows} old issued credentials`);
    */

    // 7. Show current table statistics
    console.log("\n📊 Current database statistics:");

    const tables = [
      "challenges",
      "verification_sessions",
      "verified_credentials",
      "authorization_codes",
      "issuance_sessions",
      "issued_credentials",
      "issuer_keys",
    ];

    for (const table of tables) {
      const [countResult] = await connection.execute(
        `SELECT COUNT(*) as count FROM ${table}`
      );
      console.log(`   ${table}: ${countResult[0].count} records`);
    }

    console.log("\n✅ Database cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during database cleanup:", error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupDatabase();
}

module.exports = { cleanupDatabase };
