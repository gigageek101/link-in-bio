// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = '8491965924:AAHBz28OuBgEKIXZywBENwl2xe-y1rVNQfk'
const TELEGRAM_CHAT_ID = '2108767741'

async function sendTelegramNotification(submission) {
  try {
    // Create a formatted message with emojis
    const message = `
🎉 *NEW BETA SIGNUP - SEARCHFORMYLINKS!* 🎉

👤 *Name:* ${submission.name}
📧 *Email:* ${submission.email}
📱 *Instagram:* ${submission.instagram}
📊 *Monthly Reach:* ${submission.reach}

💬 *Message:*
${submission.message}

⏰ *Received:* ${new Date(submission.timestamp).toLocaleString()}

🚀 _Reply within 24 hours to onboard this influencer!_
    `.trim()

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    
    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    })

    if (!response.ok) {
      console.error('Telegram API error:', await response.text())
      return false
    } else {
      console.log('Telegram notification sent successfully!')
      return true
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return false
  }
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, instagram, reach, message } = req.body

    // Validate required fields
    if (!name || !email || !message) {
      console.error('Missing required fields:', { name: !!name, email: !!email, message: !!message })
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Create submission object
    const submission = {
      id: Date.now().toString(),
      name,
      email,
      instagram: instagram || 'Not provided',
      reach: reach || 'Not provided',
      message,
      timestamp: new Date().toISOString(),
      status: 'new'
    }

    // Send Telegram notification
    const telegramSent = await sendTelegramNotification(submission)
    
    // Log for monitoring
    console.log('=== NEW BETA SIGNUP - SEARCHFORMYLINKS ===')
    console.log('ID:', submission.id)
    console.log('Name:', name)
    console.log('Email:', email)
    console.log('Instagram:', instagram)
    console.log('Reach:', reach)
    console.log('Message:', message)
    console.log('Timestamp:', submission.timestamp)
    console.log('Telegram sent:', telegramSent)
    console.log('===========================================')

    return res.status(200).json({
      success: true,
      id: submission.id,
      message: 'Thank you for signing up! We will get back to you within 24 hours.'
    })

  } catch (error) {
    console.error('Beta signup error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

