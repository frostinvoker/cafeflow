import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

function signToken(userId, secret) {
  return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;
    if (!email || !name || !password) return res.status(400).json({ message: 'Missing fields' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const user = new User({ email, name });
    await user.setPassword(password);
    await user.save();

    return res.status(201).json({ message: 'Registered' });
  } catch (err) {
  if (err?.code === 121) {
    console.error('Validation details:', JSON.stringify(err.errInfo, null, 2));
    return res.status(400).json({ message: 'Document failed validation', details: err.errInfo });
  }
  console.error(err);
  return res.status(500).json({ message: 'Server error' });
}
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const { JWT_SECRET, COOKIE_NAME, COOKIE_SECURE } = process.env;

    const user = await User.findOne({ email });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({message: 'Invalid Email or Password' });
    }

    if (user.status !== 'active'){
      return res.status(401).json({message:"Account Disabled"}) 
    };

    const token = signToken(user._id.toString(), JWT_SECRET);

    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: COOKIE_SECURE === 'true',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const { COOKIE_NAME, COOKIE_SECURE } = process.env;
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE === 'true',
    path: '/'
  });
  return res.json({ message: 'Logged out' });
});

// GET /api/auth/me (auth check + current user)
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.userId).select('_id email name role');
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json({ user });
});

export default router;
