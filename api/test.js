// Simple test endpoint to verify serverless function works
module.exports = async (req, res) => {
  try {
    console.log('[TEST] Function called');
    return res.status(200).json({
      success: true,
      message: 'Serverless function is working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel: process.env.VERCEL === '1'
    });
  } catch (error) {
    console.error('[TEST] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

