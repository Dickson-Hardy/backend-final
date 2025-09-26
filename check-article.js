const mongoose = require('mongoose');

async function checkArticle() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/amhsj';
    console.log('Connecting to:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
    
    const Article = require('./dist/articles/schemas/article.schema.js').Article;
    
    // Find the specific article
    const article = await Article.findById('68d64d416993ed9820bf0847');
    if (article) {
      console.log('Article found:');
      console.log('Title:', article.title);
      console.log('Status:', article.status);
      console.log('Article Number:', article.articleNumber);
      console.log('Volume:', article.volume);
    } else {
      console.log('Article not found');
    }
    
    // Check all articles with article numbers
    const articlesWithNumbers = await Article.find({ 
      articleNumber: { $exists: true, $ne: null } 
    });
    console.log('\nArticles with numbers:');
    articlesWithNumbers.forEach(art => {
      console.log(`- ${art.title} (Status: ${art.status}, Number: ${art.articleNumber}, Volume: ${art.volume})`);
    });
    
    // Check all articles in general
    const allArticles = await Article.find({}).limit(5);
    console.log('\nAll articles (first 5):');
    allArticles.forEach(art => {
      console.log(`- ${art.title} (Status: ${art.status}, Number: ${art.articleNumber || 'none'}, Volume: ${art.volume || 'none'})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkArticle();
