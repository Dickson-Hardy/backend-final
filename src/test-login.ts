async function testLoginEndpoint() {
  const loginUrl = 'http://localhost:3001/api/v1/auth/login'
  
  const credentials = {
    email: 'admin@amhsj.org',
    password: 'Admin@2025!'
  }

  try {
    console.log('🧪 Testing login endpoint...')
    console.log('📡 URL:', loginUrl)
    console.log('📧 Email:', credentials.email)
    console.log('🔑 Password:', credentials.password)
    console.log('')

    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅ Login successful!')
      console.log('📊 Status:', response.status)
      console.log('📄 Response data:')
      console.log(JSON.stringify(data, null, 2))
      
      if (data.access_token) {
        console.log('🎫 Access token received:', data.access_token.substring(0, 50) + '...')
      }
      
      if (data.user) {
        console.log('👤 User data:')
        console.log('  - ID:', data.user.id)
        console.log('  - Email:', data.user.email)
        console.log('  - Name:', data.user.firstName, data.user.lastName)
        console.log('  - Role:', data.user.role)
        console.log('  - Email Verified:', data.user.emailVerified)
      }
    } else {
      console.log('❌ Login failed!')
      console.log('📊 Status:', response.status)
      console.log('📄 Error data:', data)
    }

  } catch (error: any) {
    console.log('❌ Request failed!')
    console.log('⚠️ Error:', error.message)
  }
}

// Run the test
testLoginEndpoint()
  .then(() => {
    console.log('')
    console.log('✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.log('')
    console.log('❌ Test failed:', error.message)
    process.exit(1)
  })
