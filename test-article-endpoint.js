// Test API endpoint for article lookup by volume and article number
const axios = require('axios')

const API_URL = 'https://octopus-app-3jhrw.ondigitalocean.app/api/v1'

async function testArticleEndpoint() {
  try {
    console.log('🔍 Testing article endpoint...\n')
    
    // Test getting article 001 from volume 2
    const response = await axios.get(`${API_URL}/articles/volume/2/article/001`)
    
    console.log('✅ Success!')
    console.log('Status:', response.status)
    console.log('\n📄 Article Details:')
    console.log('Title:', response.data.title)
    console.log('Article Number:', response.data.articleNumber)
    console.log('Status:', response.data.status)
    if (response.data.volume) {
      console.log('Volume:', response.data.volume.volume, '-', response.data.volume.title)
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ API Error:', error.response.status, error.response.data)
    } else {
      console.log('❌ Error:', error.message)
    }
  }
}

testArticleEndpoint()
