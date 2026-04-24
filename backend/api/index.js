const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

let isConnected;

const connectDB = async () => {
  if (isConnected) return;
  if (!process.env.MONGODB_URI) {
    console.log('MONGODB_URI not set. Running without DB.');
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Models (Defined inline or require them)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: String,
  seen: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const SettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  chatUnlocked: { type: Boolean, default: false },
  theme: { type: String, default: 'light' }
});

// Try getting models, if not defined, compile them
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
const Settings = mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);

// Basic health check route
app.get('/api/health', (req, res) => res.json({ status: 'ok', db: !!isConnected }));

// Authentication
app.post('/api/login', async (req, res) => {
  const { username, passwordHash } = req.body;
  if (!isConnected) return res.status(500).json({ error: 'DB not connected' });
  
  try {
    let user = await User.findOne({ username });
    if (user) {
      // Existing user — validate password
      if (user.passwordHash !== passwordHash) {
        return res.status(401).json({ error: 'Incorrect password' });
      }
    } else {
      // New user — enforce 2-user limit
      const userCount = await User.countDocuments();
      if (userCount >= 2) {
        return res.status(403).json({ error: 'Maximum 2 users allowed. Contact the owner.' });
      }
      user = new User({ username, passwordHash });
      await user.save();
    }
    res.json({ userId: user._id, username: user.username });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get the other chat user (for private 2-person chat)
app.get('/api/users', async (req, res) => {
  const { excludeId } = req.query;
  if (!isConnected) return res.status(500).json({ error: 'DB not connected' });

  try {
    const user = await User.findOne({ _id: { $ne: excludeId } }).select('_id username');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Chat Endpoints
app.post('/api/messages', async (req, res) => {
  const { senderId, receiverId, message } = req.body;
  if (!isConnected) return res.status(500).json({ error: 'DB not connected' });
  
  try {
    const newMessage = new Message({ senderId, receiverId, message });
    await newMessage.save();
    res.json({ success: true, message: newMessage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/messages', async (req, res) => {
  const { userId, otherId, after, page, limit } = req.query;
  if (!isConnected) return res.status(500).json({ error: 'DB not connected' });

  try {
    let query = {
      $or: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId }
      ]
    };

    // If 'after' is provided, return only new messages (for polling)
    if (after) {
      query.createdAt = { $gt: new Date(after) };
      const messages = await Message.find(query).sort({ createdAt: 1 });
      return res.json({ messages, hasMore: false });
    }

    // Paginated loading (newest first, then reversed on client)
    const pageNum = parseInt(page) || 1;
    const pageLimit = parseInt(limit) || 30;
    const skip = (pageNum - 1) * pageLimit;

    const total = await Message.countDocuments(query);
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })  // newest first
      .skip(skip)
      .limit(pageLimit);

    // Reverse so oldest is first in the batch (for display order)
    messages.reverse();

    res.json({
      messages,
      hasMore: skip + pageLimit < total,
      total,
      page: pageNum
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings
app.post('/api/settings/unlock', async (req, res) => {
  const { userId } = req.body;
  if (!isConnected) return res.status(500).json({ error: 'DB not connected' });

  try {
    let settings = await Settings.findOne({ userId });
    if (!settings) {
      settings = new Settings({ userId, chatUnlocked: true });
    } else {
      settings.chatUnlocked = true;
    }
    await settings.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/settings', async (req, res) => {
  const { userId } = req.query;
  if (!isConnected) return res.status(500).json({ error: 'DB not connected' });
  
  try {
    const settings = await Settings.findOne({ userId });
    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notification Polling Endpoint
app.get('/api/notifications', async (req, res) => {
  const { userId } = req.query;
  if (!isConnected) return res.status(500).json({ error: 'DB not connected' });

  try {
    // Just an example: return unread message count
    const count = await Message.countDocuments({ receiverId: userId, seen: false });
    res.json({ hasNotifications: count > 0, type: count > 0 ? 'NEW_MESSAGE' : null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark messages as seen
app.post('/api/messages/seen', async (req, res) => {
  const { receiverId, senderId } = req.body;
  if (!isConnected) return res.status(500).json({ error: 'DB not connected' });
  
  try {
    await Message.updateMany(
      { receiverId, senderId, seen: false },
      { $set: { seen: true } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Server running locally on port ${PORT}`);
  });
}

module.exports = app;
