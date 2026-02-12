require('dotenv').config()
const mongoose = require('mongoose')

const articleSchema = new mongoose.Schema({
  title: String,
  articleNumber: String,
  status: String,
  volume: { type: mongoose.Schema.Types.ObjectId, ref: 'Volume' }
}, { timestamps: true })

const volumeSchema = new mongoose.Schema({
  volume: Number,
  title: String,
  year: Number,
  status: String
}, { timestamps: true })

const Article = mongoose.model('Article', articleSchema)
const Volume = mongoose.model('Volume', volumeSchema)

async function checkVolume2Articles() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB\n')

    // Find volume 2
    const volume2 = await Volume.findOne({ volume: 2 })
    
    if (!volume2) {
      console.log('❌ Volume 2 not found!')
      return
    }
    
    console.log('📚 Volume 2 Details:')
    console.log(`   _id: ${volume2._id}`)
    console.log(`   volume: ${volume2.volume}`)
    console.log(`   title: ${volume2.title}`)
    console.log(`   year: ${volume2.year}\n`)
    
    // Find all articles in volume 2
    const articles = await Article.find({ volume: volume2._id }).sort({ articleNumber: 1 })
    
    console.log(`📄 Articles in Volume 2: ${articles.length}\n`)
    
    articles.forEach((article, index) => {
      console.log(`${index + 1}. Article:`)
      console.log(`   _id: ${article._id}`)
      console.log(`   articleNumber: "${article.articleNumber}"`)
      console.log(`   title: ${article.title.substring(0, 60)}...`)
      console.log(`   status: ${article.status}`)
      console.log(`   volume: ${article.volume}\n`)
    })
    
    // Test finding article 001
    console.log('🔍 Testing query for article 001:')
    const article001 = await Article.findOne({
      articleNumber: '001',
      volume: volume2._id
    })
    
    if (article001) {
      console.log('✅ Found article 001!')
      console.log(`   Title: ${article001.title}`)
    } else {
      console.log('❌ Article 001 not found!')
      
      // Try alternative queries
      console.log('\n🔍 Trying alternative queries...')
      
      const byArticleNumberOnly = await Article.findOne({ articleNumber: '001' })
      console.log(`   By articleNumber only: ${byArticleNumberOnly ? 'Found' : 'Not found'}`)
      if (byArticleNumberOnly) {
        console.log(`     - Title: ${byArticleNumberOnly.title.substring(0, 60)}`)
        console.log(`     - Volume ID: ${byArticleNumberOnly.volume}`)
        console.log(`     - Volume 2 ID: ${volume2._id}`)
        console.log(`     - Match: ${byArticleNumberOnly.volume.toString() === volume2._id.toString()}`)
      }
      
      const byVolumeOnly = await Article.find({ volume: volume2._id }).limit(1)
      console.log(`   Articles with volume ID: ${byVolumeOnly.length}`)
      
      // Find ALL articles to see what's there
      const allArticles = await Article.find({}).select('articleNumber volume')
      console.log(`\n📋 All articles in database: ${allArticles.length}`)
      allArticles.forEach(a => {
        console.log(`   - Article ${a.articleNumber}: volume = ${a.volume} (type: ${typeof a.volume})`)
      })
      
      // Try querying with string comparison
      console.log('\n🔍 Testing query with string volume ID:')
      const withString = await Article.findOne({
        articleNumber: '001',
        volume: '698adeb65ff895ad8456196f'
      })
      console.log(`   Direct string match: ${withString ? 'Found!' : 'Not found'}`)
      
      // Try with new ObjectId
      console.log('\n🔍 Testing query with ObjectId:')
      const withObjectId = await Article.findOne({
        articleNumber: '001',
        volume: new mongoose.Types.ObjectId('698adeb65ff895ad8456196f')
      })
      console.log(`   ObjectId match: ${withObjectId ? 'Found!' : 'Not found'}`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Disconnected from MongoDB')
  }
}

checkVolume2Articles()
