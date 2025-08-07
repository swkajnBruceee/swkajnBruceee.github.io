// 简单的诊断版本
module.exports = async (req, res) => {
  try {
    // 检查环境变量
    const envCheck = {
      LEAN_ID: !!process.env.LEAN_ID,
      LEAN_KEY: !!process.env.LEAN_KEY,
      LEAN_MASTER_KEY: !!process.env.LEAN_MASTER_KEY,
      JWT_TOKEN: !!process.env.JWT_TOKEN
    };
    
    // 如果是根路径，返回诊断信息
    if (req.url === '/' || req.url === '/api') {
      res.status(200).json({
        status: 'ok',
        message: 'Waline 诊断模式',
        env: envCheck,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // 尝试加载 Waline
    const Waline = require('@waline/vercel');
    
    const walineHandler = Waline({
      LEAN_ID: process.env.LEAN_ID,
      LEAN_KEY: process.env.LEAN_KEY,
      LEAN_MASTER_KEY: process.env.LEAN_MASTER_KEY,
      JWT_TOKEN: process.env.JWT_TOKEN
    });
    
    return walineHandler(req, res);
    
  } catch (error) {
    console.error('Waline Error:', error);
    res.status(500).json({
      error: 'Waline 启动失败',
      message: error.message,
      stack: error.stack
    });
  }
};