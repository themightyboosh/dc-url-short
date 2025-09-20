// Resume App API Integration Guide
// Update your Templates.tsx to connect directly to the URL shortener API

// Instead of calling: http://localhost:5179/api/process
// Call directly: https://go.monumental-i.com/api/v1/google-docs/webhook

// Example update for your Templates.tsx file:

const analyzeTemplate = async (templateData) => {
  try {
    // OLD CODE (causing the error):
    // const response = await axios.post('http://localhost:5179/api/process', templateData);
    
    // NEW CODE (direct API call):
    const response = await axios.post('https://go.monumental-i.com/api/v1/google-docs/webhook', {
      docName: templateData.name || 'Resume Template',
      docUrl: templateData.url || templateData.docUrl,
      createdBy: 'daniel@monumental-i.com',
      tags: ['resume', 'template', 'analysis'],
      emailAlerts: true
    });
    
    if (response.data.success) {
      const shortUrl = `https://go.monumental-i.com/${response.data.data.slug}`;
      console.log('Short URL created:', shortUrl);
      return {
        success: true,
        shortUrl: shortUrl,
        slug: response.data.data.slug,
        originalUrl: response.data.data.longUrl
      };
    } else {
      throw new Error(response.data.message || 'Failed to create short URL');
    }
  } catch (error) {
    console.error('Error creating short URL:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Alternative: If you want to keep using localhost:5179, 
// you can update your Vite config to proxy API calls:

// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://go.monumental-i.com/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
});

// Then your Templates.tsx can continue using:
// const response = await axios.post('/api/google-docs/webhook', templateData);

