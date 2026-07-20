// Basic authentication middleware
const basicAuth = require('basic-auth');

const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

module.exports = (req, res, next) => {
  const credentials = basicAuth(req);
  if (!credentials || credentials.name !== ADMIN_USER || credentials.pass !== ADMIN_PASS) {
    res.set('WWW-Authenticate', 'Basic realm="Admin Area"');
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  next();
};
