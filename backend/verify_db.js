require('dotenv').config();
const mongoose = require('mongoose');

async function verify() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set in .env");
    process.exit(1);
  }
  
  try {
    console.log("Connecting to:", process.env.MONGODB_URI.split('@')[1] || process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Successfully connected to MongoDB!");
    
    // Test writing and reading a quick dummy document
    const TestSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.models.Test || mongoose.model('Test', TestSchema);
    
    await TestModel.create({ test: "Connection works" });
    const count = await TestModel.countDocuments();
    console.log(`✅ Can read/write to DB. Documents in test collection: ${count}`);
    
    // Clean up
    await TestModel.deleteMany({});
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
}

verify();
