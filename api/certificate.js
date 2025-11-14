// SSL証明書情報を取得するServerless Function
const https = require('https');
const tls = require('tls');

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { hostname } = req.query;

  if (!hostname) {
    return res.status(400).json({ 
      success: false,
      error: 'hostnameパラメータが必要です' 
    });
  }

  try {
    // ホスト名からポート番号を除去
    const cleanHostname = hostname.replace(/:\d+$/, '');
    
    const certInfo = await new Promise((resolve, reject) => {
      const options = {
        host: cleanHostname,
        port: 443,
        method: 'GET',
        rejectUnauthorized: false, // 自己署名証明書もチェックできるように
        agent: false
      };

      const socket = tls.connect(options, () => {
        const cert = socket.getPeerCertificate(true);
        socket.end();
        
        if (!cert || Object.keys(cert).length === 0) {
          reject(new Error('証明書を取得できませんでした'));
          return;
        }

        // 証明書情報を整形
        const certData = {
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysRemaining: Math.floor((new Date(cert.valid_to) - new Date()) / (1000 * 60 * 60 * 24)),
          serialNumber: cert.serialNumber,
          fingerprint: cert.fingerprint,
          fingerprint256: cert.fingerprint256,
          keySize: cert.bits,
          algorithm: cert.signatureAlgorithm || cert.asn1Curve,
          subjectAltNames: cert.subjectaltname ? cert.subjectaltname.split(', ') : [],
          // 自己署名証明書かどうか
          isSelfSigned: cert.issuer && cert.subject && 
                        JSON.stringify(cert.issuer) === JSON.stringify(cert.subject),
          // 信頼できる認証局かどうかの判定
          isTrustedCA: checkTrustedCA(cert.issuer)
        };

        resolve(certData);
      });

      socket.on('error', (error) => {
        reject(error);
      });

      socket.setTimeout(10000, () => {
        socket.destroy();
        reject(new Error('接続タイムアウト'));
      });
    });

    // セキュリティ評価
    const securityIssues = [];
    const warnings = [];
    const goodPoints = [];

    // 証明書の有効期限チェック
    if (certInfo.daysRemaining < 0) {
      securityIssues.push('証明書の有効期限が切れています');
    } else if (certInfo.daysRemaining < 30) {
      warnings.push(`証明書の有効期限まで ${certInfo.daysRemaining} 日です`);
    } else {
      goodPoints.push(`証明書の有効期限まで ${certInfo.daysRemaining} 日あります`);
    }

    // 自己署名証明書チェック
    if (certInfo.isSelfSigned) {
      securityIssues.push('自己署名証明書（オレオレ証明書）です');
    } else if (certInfo.isTrustedCA) {
      goodPoints.push('信頼できる認証局から発行されています');
    } else {
      warnings.push('認証局の確認が必要です');
    }

    // 鍵のサイズチェック
    if (certInfo.keySize) {
      if (certInfo.keySize < 2048) {
        securityIssues.push(`鍵のサイズが小さすぎます（${certInfo.keySize}ビット）。2048ビット以上を推奨`);
      } else if (certInfo.keySize >= 2048 && certInfo.keySize < 4096) {
        goodPoints.push(`鍵のサイズは ${certInfo.keySize}ビットです（推奨レベル）`);
      } else {
        goodPoints.push(`鍵のサイズは ${certInfo.keySize}ビットです（強固）`);
      }
    }

    // アルゴリズムチェック
    const algorithm = certInfo.algorithm || '';
    if (algorithm.toLowerCase().includes('sha1')) {
      securityIssues.push('SHA-1アルゴリズムは非推奨です');
    } else if (algorithm.toLowerCase().includes('sha256') || algorithm.toLowerCase().includes('sha384') || algorithm.toLowerCase().includes('sha512')) {
      goodPoints.push(`署名アルゴリズム: ${algorithm}（安全）`);
    } else if (algorithm.toLowerCase().includes('ecdsa')) {
      goodPoints.push(`署名アルゴリズム: ${algorithm}（楕円曲線暗号、効率的）`);
    }

    return res.status(200).json({
      success: true,
      hostname: cleanHostname,
      certificate: certInfo,
      security: {
        issues: securityIssues,
        warnings: warnings,
        goodPoints: goodPoints
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching certificate:', error);
    return res.status(500).json({
      success: false,
      error: '証明書情報を取得できませんでした',
      message: error.message,
      hostname: hostname
    });
  }
};

// 信頼できる認証局かどうかをチェック
function checkTrustedCA(issuer) {
  if (!issuer || !issuer.O) return false;
  
  const trustedCAs = [
    "Let's Encrypt",
    "DigiCert",
    "GlobalSign",
    "GeoTrust",
    "Comodo",
    "Sectigo",
    "Entrust",
    "IdenTrust",
    "Amazon",
    "Google Trust Services",
    "Microsoft",
    "Cloudflare",
    "GoDaddy",
    "Thawte",
    "VeriSign",
    "Baltimore",
    "AddTrust"
  ];

  const issuerOrg = issuer.O;
  return trustedCAs.some(ca => issuerOrg.includes(ca));
}
