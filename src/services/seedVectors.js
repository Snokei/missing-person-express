/**
 * Vector Store Seed Script
 *
 * Run this script to bulk-ingest all existing MissingPerson records
 * into the vector store. This is useful when setting up the RAG system
 * for the first time, or after enabling vector search on an existing database.
 *
 * Usage:
 *   node src/services/seedVectors.js
 */
const { sequelize, MissingPerson } = require("../../models");
const { ingestMissingPerson } = require("./vectorStoreService");

async function seedAllVectors() {
  console.log("🔄 Starting vector seeding for all missing persons...");

  try {
    // Fetch all missing person records
    const persons = await MissingPerson.findAll({ raw: true });
    console.log(`📊 Found ${persons.length} missing person records.`);

    if (persons.length === 0) {
      console.log("✅ No records to process. Exiting.");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const person of persons) {
      try {
        await ingestMissingPerson(person.id);
        successCount++;
        console.log(`✅ [${successCount}/${persons.length}] Ingested ID ${person.id}: ${person.first_name} ${person.last_name || ""}`);
      } catch (err) {
        failCount++;
        console.error(`❌ Failed to ingest ID ${person.id}: ${err.message}`);
      }
    }

    console.log("\n═══════════════════════════════════");
    console.log(`🎉 Seeding complete!`);
    console.log(`   ✅ Successfully ingested: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log("═══════════════════════════════════\n");
  } catch (error) {
    console.error("💥 Fatal error during seeding:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

seedAllVectors();