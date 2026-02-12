require('dotenv').config()
const mongoose = require('mongoose')

async function fixArticleVolumeIds() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    const db = mongoose.connection.db
    const articlesCollection = db.collection('articles')
    
    // Get all articles
    const articles = await articlesCollection.find({}).toArray()
    console.log(`Found ${articles.length} articles\n`)
    
    let fixed = 0
    let skipped = 0
    
    for (const article of articles) {
      // Check if volume is a string
      if (typeof article.volume === 'string') {
        // Convert string to ObjectId
        const volumeObjectId = new mongoose.Types.ObjectId(article.volume)
        
        await articlesCollection.updateOne(
          { _id: article._id },
          { $set: { volume: volumeObjectId } }
        )
        
        console.log(`✅ Fixed article ${article.articleNumber}: ${article.title.substring(0, 50)}`)
        console.log(`   Changed volume from string "${article.volume}" to ObjectId`)
        fixed++
      } else {
        skipped++
      }
    }
    
    console.log(`\n📊 Summary:`)
    console.log(`   Fixed: ${fixed}`)
    console.log(`   Skipped (already ObjectId): ${skipped}`)
    console.log(`   Total: ${articles.length}`)
    
    // Verify the fix
    console.log(`\n🔍 Verification:`)
    const volumesCollection = db.collection('volumes')
    const volume2 = await volumesCollection.findOne({ volume: 2 })
    
    const article001 = await articlesCollection.findOne({
      articleNumber: '001',
      volume: volume2._id
    })
    
    if (article001) {
      console.log(`✅ Successfully found article 001 in volume 2!`)
      console.log(`   Title: ${article001.title}`)
    } else {
      console.log(`❌ Still unable to find article 001 in volume 2`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

fixArticleVolumeIds()
