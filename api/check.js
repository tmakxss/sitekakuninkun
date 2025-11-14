// Vercel Serverless Function
// CORS制限を回避してヘッダー情報を取得

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URLパラメータが必要です' });
  }

  try {
    // URLのバリデーション
    const targetUrl = new URL(url);
    
    // HEADリクエストでヘッダー情報を取得
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }).catch(() => 
      // HEADが失敗した場合はGETで試す
      fetch(url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
    );

    // レスポンスヘッダーを取得
    const headers = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    // SSL/TLS情報（制限付き）
    const sslInfo = {
      protocol: targetUrl.protocol,
      isHttps: targetUrl.protocol === 'https:',
      hostname: targetUrl.hostname
    };

    return res.status(200).json({
      success: true,
      url: url,
      statusCode: response.status,
      statusText: response.statusText,
      headers: headers,
      ssl: sslInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching URL:', error);
    return res.status(500).json({
      success: false,
      error: 'サイトの情報を取得できませんでした',
      message: error.message,
      url: url
    });
  }
}
