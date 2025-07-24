const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".env.local" });

async function testDatabase() {
  const config = {
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "3306"),
    user: process.env.DATABASE_USER || "app_user",
    password: process.env.DATABASE_PASSWORD || "app_password",
    database: process.env.DATABASE_NAME || "digital_credentials",
  };

  console.log("Testing database connection...");
  console.log("Config:", { ...config, password: "***" });

  try {
    const connection = await mysql.createConnection(config);
    console.log("✅ Database connection successful!");

    // Test tables exist
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(
      "📋 Tables found:",
      tables.map((t) => Object.values(t)[0])
    );

    // Test challenge operations
    const challengeId = "test-" + Date.now();
    const challenge = "challenge-" + Date.now();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Insert test challenge
    await connection.execute(
      "INSERT INTO challenges (id, challenge, expires_at) VALUES (?, ?, ?)",
      [challengeId, challenge, expiresAt]
    );
    console.log("✅ Test challenge created");

    // Retrieve challenge
    const [rows] = await connection.execute(
      "SELECT * FROM challenges WHERE challenge = ?",
      [challenge]
    );
    console.log("✅ Challenge retrieved:", rows[0]?.challenge);

    // Clean up test data
    await connection.execute("DELETE FROM challenges WHERE id = ?", [
      challengeId,
    ]);
    console.log("✅ Test data cleaned up");

    await connection.end();
    console.log("🎉 All database tests passed!");
  } catch (error) {
    console.error("❌ Database test failed:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log(
        "\n💡 Tip: Make sure MySQL is running with: docker-compose up -d"
      );
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.log("\n💡 Tip: Check your database credentials in .env.local");
    }

    process.exit(1);
  }
}

testDatabase();
