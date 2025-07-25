// Vercel serverless function for API proxying
// This ensures secure backend communication without CORS issues

const BACKEND_URL = 'https://zapscan-lw-backend-v2-250725-477154991805.asia-south2.run.app';

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(200).end();
    return;
  }

  const { path } = req.query;
  const targetUrl = `${BACKEND_URL}${path}`;
  
  try {
    // Forward the request to the backend
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers,
        // Remove host header to avoid conflicts
        host: undefined,
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    // Get response data
    const data = await response.json();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Return the response
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to proxy request to backend'
    });
  }
} 