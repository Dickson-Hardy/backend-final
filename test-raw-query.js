require('dotenv').config()
const mongoose = require('mongoose')

async function testRawQuery() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    const db = mongoose.connection.db
    const articlesCollection = db.collection('articles')
    const volumesCollection = db.collection('volumes')
    
    // Get volume 2
    const volume2 = await volumesCollection.findOne({ volume: 2 })
    console.log('Volume 2:', volume2._id.toString())
    
    // Get all articles with articleNumber 001
    const articles = await articlesCollection.find({ articleNumber: '001' }).toArray()
    console.log(`\nFound ${articles.length} articles with number 001:\n`)
    
    articles.forEach((article, i) => {
      console.log(`${i + 1}. ${article.title.substring(0, 60)}`)
      console.log(`   _id: ${article._id}`)
      console.log(`   articleNumber: "${article.articleNumber}"`)
      console.log(`   volume: ${article.volume} (type: ${typeof article.volume})`)
      console.log(`   volume._bsontype: ${article.volume?._bsontype}`)
      console.log(`   Match: ${article.volume?.toString() === volume2._id.toString()}\n`)
    })
    
    // Try direct query
    console.log('🔍 Direct query with volume 2 ID:')
    const directQuery = await articlesCollection.findOne({
      articleNumber: '001',
      volume: volume2._id
    })
    console.log(`Result: ${directQuery ? 'Found!' : 'Not found'}`)
    if (directQuery) {
      console.log(`Title: ${directQuery.title}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

testRawQuery()
