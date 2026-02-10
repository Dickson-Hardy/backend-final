const mongoose = require('mongoose');
require('dotenv').config();

const volumeSchema = new mongoose.Schema({}, { strict: false });
const Volume = mongoose.model('Volume', volumeSchema);

async function checkVolumes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const volumes = await Volume.find({}).sort({ volume: 1 });
    
    console.log('\n📚 VOLUMES IN DATABASE:\n');
    console.log(`Total volumes: ${volumes.length}\n`);
    
    volumes.forEach((vol, index) => {
      console.log(`${index + 1}. Volume ${vol.volume}${vol.issue ? ` Issue ${vol.issue}` : ''}`);
      console.log(`   _id: ${vol._id}`);
      console.log(`   Title: ${vol.title}`);
      console.log(`   Year: ${vol.year}`);
      console.log(`   Status: ${vol.status}`);
      console.log(`   Articles: ${vol.articles?.length || 0}`);
      console.log(`   Publish Date: ${vol.publishDate || 'Not set'}`);
      console.log('');
    });
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkVolumes();
