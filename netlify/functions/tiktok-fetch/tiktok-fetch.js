const fetch = require('node-fetch');

exports.handler = async (event) => {
  const username = event.queryStringParameters.username;
  if (!username) return { statusCode: 400, body: 'Missing username' };

  const url = `https://www.tiktok.com/@${username}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1'
  };

  try {
    const response = await fetch(url, { headers });
    const html = await response.text();

    // Extract JSON (2025 regex from Scrapfly)
    const jsonMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">({[\s\S]*?})<\/script>/s);
    if (!jsonMatch) return { statusCode: 404, body: 'Profile data not found' };

    const data = JSON.parse(jsonMatch[1]);
    const user = data.__DEFAULT_SCOPE__?.webapp?.['user-detail']?.userInfo?.user || {};
    const posts = data.__DEFAULT_SCOPE__?.webapp?.['user-post']?.itemList || [];

    const result = {
      user: {
        name: user.nickname || username,
        followers: user.followerCount || 0,
        bio: user.signature || 'No bio',
        verified: user.verified || false
      },
      videos: posts.slice(0, 12).map(post => ({
        id: post.id,
        desc: post.desc || 'No description',
        cover: post.video.cover?.[0] || '',
        playUrl: post.video.playAddr?.[0] || '',
        downloadUrl: post.video.playAddr?.[0].replace(/playwm/gi, 'play')
      }))
    };

    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify(result)
    };
  } catch (error) {
    return { statusCode: 500, body: error.message };
  }
};
