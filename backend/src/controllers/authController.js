import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function signToken(user) {
  return jwt.sign({ sub: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// POST - register new user
async function signup(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    return res.status(201).json({ token: signToken(user) });
  } catch (e) {
    next(e);
  }
}

// POST - log in user
async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    return res.json({ token: signToken(user) });
  } catch (e) {
    next(e);
  }
}

// GET - find singel user
async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.userId).lean();
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (e) {
    next(e);
  }
}

// PUT - update user email
async function updateEmail(req, res, next) {
  try {
    const { email, currentPassword } = req.body || {};
    if (!email || !currentPassword)
      return res.status(400).json({ message: 'Email and currentPassword required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Not found' });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid password' });

    const exists = await User.findOne({ email, _id: { $ne: user._id } });
    if (exists) return res.status(409).json({ message: 'Email already in use' });

    user.email = email;
    await user.save();

    return res.json({ email: user.email, token: signToken(user) });
  } catch (e) {
    next(e);
  }
}

// PUT - update user password
async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'currentPassword and newPassword required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'Not found' });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid password' });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ ok: true, token: signToken(user) });
  } catch (e) {
    next(e);
  }
}

// DELETE - remove user
async function deleteMe(req, res, next) {
  try {
    await User.deleteOne({ _id: req.userId });
    return res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export default { signup, login, getMe, updateEmail, updatePassword, deleteMe };
