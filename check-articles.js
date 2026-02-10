const mongoose = require('mongoose');
require('dotenv').config();

const articleSchema = new mongoose.Schema({}, { strict: false });
const Article = mongoose.model('Article', articleSchema);

async function checkArticles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const articles = await Article.find({}).sort({ createdAt: -1 });
    
    console.log('\n📄 ARTICLES IN DATABASE:\n');
    console.log(`Total articles: ${articles.length}\n`);
    
    articles.forEach((article, index) => {
      console.log(`${index + 1}. Article ${article.articleNumber || 'N/A'}`);
      console.log(`   Title: ${article.title?.substring(0, 60)}...`);
      console.log(`   Status: ${article.status}`);
      console.log(`   Volume: ${article.volume || 'Not assigned'}`);
      console.log(`   DOI: ${article.doi || 'N/A'}`);
      console.log('');
    });
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkArticles();
