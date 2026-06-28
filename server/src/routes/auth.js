const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/database');
const { authenticate, JWT_SECRET } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// POST /api/auth/register
router.post('/register', authLimiter, (req, res) => {
  const { name, email, password, phone, nationality } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password_hash, phone, nationality, role, sub_role) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(name, email.toLowerCase(), hash, phone || '', nationality || '', 'customer', '');

    const userId = result.lastInsertRowid;
    const token = jwt.sign({ id: userId, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { id: userId, name, email: email.toLowerCase(), phone: phone || '', nationality: nationality || '', role: 'customer', sub_role: '' }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to register user.' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(400).json({ error: 'Invalid email or password.' });
    if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended. Contact admin.' });

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id, name: user.name, email: user.email, phone: user.phone,
        nationality: user.nationality, role: user.role, sub_role: user.sub_role || '',
        profile_photo: user.profile_photo || ''
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to log in.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, (req, res) => {
  const { name, phone, nationality, profile_photo } = req.body;
  try {
    db.prepare(
      'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), nationality = COALESCE(?, nationality), profile_photo = COALESCE(?, profile_photo) WHERE id = ?'
    ).run(name, phone, nationality, profile_photo, req.user.id);
    const updatedUser = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.nationality, u.role, u.sub_role, u.profile_photo, u.created_at, u.assigned_to,
        a.name as assigned_name
      FROM users u
      LEFT JOIN users a ON u.assigned_to = a.id
      WHERE u.id = ?
    `).get(req.user.id);
    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to update profile.' });
  }
});

// GET /api/auth/customers - List all registered customers (Admin Only)
router.get('/customers', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  try {
    const customers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.nationality, u.status, u.profile_photo, u.created_at, u.assigned_to,
        a.name as assigned_name,
        (SELECT COUNT(*) FROM bookings WHERE user_id = u.id OR customer_email = u.email) as booking_count,
        (SELECT COUNT(*) FROM visa_applications WHERE user_id = u.id OR customer_email = u.email) as visa_count,
        (SELECT COUNT(*) FROM service_requests WHERE user_id = u.id OR email = u.email) as request_count
      FROM users u
      LEFT JOIN users a ON u.assigned_to = a.id
      WHERE u.role = 'customer' ORDER BY u.created_at DESC
    `).all();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to retrieve customers.' });
  }
});

// GET /api/auth/staff - List staff/admin users (Admin Only)
router.get('/staff', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  try {
    const staff = db.prepare(
      "SELECT id, name, email, phone, role, sub_role, status, profile_photo, created_at FROM users WHERE role = 'admin' ORDER BY created_at ASC"
    ).all();
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve staff.' });
  }
});

// POST /api/auth/create-staff - Create staff account (Admin Only)
router.post('/create-staff', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  const { name, email, password, sub_role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required.' });

  try {
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (exists) return res.status(400).json({ error: 'Email already in use.' });

    const hash = bcrypt.hashSync(password, 10);
    const validRoles = ['manager', 'agent', 'viewer'];
    const role = validRoles.includes(sub_role) ? sub_role : 'agent';

    db.prepare('INSERT INTO users (name, email, password_hash, role, sub_role) VALUES (?, ?, ?, ?, ?)')
      .run(name, email.toLowerCase(), hash, 'admin', role);

    res.status(201).json({ message: `Staff account created: ${email}` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create staff account.' });
  }
});

// PUT /api/auth/users/:id/role - Update user role/status (Admin Only)
router.put('/users/:id/role', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  const { id } = req.params;
  const { sub_role, status } = req.body;

  try {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    db.prepare('UPDATE users SET sub_role = COALESCE(?, sub_role), status = COALESCE(?, status) WHERE id = ?')
      .run(sub_role, status, id);
    res.json({ message: 'User updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
});

// PUT /api/auth/users/:id/status - Update customer status (Admin Only)
router.put('/users/:id/status', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  const { id } = req.params;
  const { status } = req.body;

  try {
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, id);
    res.json({ message: 'Customer status updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer status.' });
  }
});

// POST /api/auth/customers - Create customer account (Admin Only)
router.post('/customers', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  const { name, email, phone, nationality, password, status, assigned_to } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    const tempPassword = password || 'welcome123';
    const hash = bcrypt.hashSync(tempPassword, 10);
    const userStatus = status || 'active';

    const result = db.prepare(`
      INSERT INTO users (name, email, password_hash, phone, nationality, role, sub_role, status, assigned_to)
      VALUES (?, ?, ?, ?, ?, 'customer', '', ?, ?)
    `).run(name, email.toLowerCase(), hash, phone || '', nationality || '', userStatus, assigned_to || null);

    res.status(201).json({
      message: 'Customer account created successfully.',
      customer: {
        id: result.lastInsertRowid,
        name,
        email: email.toLowerCase(),
        phone: phone || '',
        nationality: nationality || '',
        status: userStatus,
        role: 'customer',
        sub_role: '',
        assigned_to: assigned_to || null
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create customer account.' });
  }
});

// PUT /api/auth/customers/:id - Update customer account (Admin Only)
router.put('/customers/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  const { id } = req.params;
  const { name, email, phone, nationality, status, profile_photo, assigned_to } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    const customer = db.prepare('SELECT id FROM users WHERE id = ? AND role = "customer"').get(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Check email uniqueness if email is changing
    const emailCheck = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), id);
    if (emailCheck) {
      return res.status(400).json({ error: 'Email already in use by another user.' });
    }

    db.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        nationality = COALESCE(?, nationality),
        status = COALESCE(?, status),
        profile_photo = COALESCE(?, profile_photo),
        assigned_to = COALESCE(?, assigned_to)
      WHERE id = ?
    `).run(name, email.toLowerCase(), phone, nationality, status, profile_photo, assigned_to, id);

    res.json({ message: 'Customer account updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update customer account.' });
  }
});

// PUT /api/auth/staff/:id - Update staff account (Admin Only)
router.put('/staff/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  const { id } = req.params;
  const { name, email, password, sub_role, status } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    const existingStaff = db.prepare('SELECT id, password_hash FROM users WHERE id = ? AND role = "admin"').get(id);
    if (!existingStaff) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    // Check if email already used by another user
    const emailCheck = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email.toLowerCase(), id);
    if (emailCheck) {
      return res.status(400).json({ error: 'Email already in use.' });
    }

    let passwordHash = existingStaff.password_hash;
    if (password && password.trim() !== '') {
      passwordHash = bcrypt.hashSync(password, 10);
    }

    const validRoles = ['manager', 'agent', 'viewer'];
    const finalSubRole = validRoles.includes(sub_role) ? sub_role : 'agent';
    const finalStatus = ['active', 'suspended'].includes(status) ? status : 'active';

    db.prepare(`
      UPDATE users SET
        name = ?,
        email = ?,
        password_hash = ?,
        sub_role = ?,
        status = ?
      WHERE id = ?
    `).run(name, email.toLowerCase(), passwordHash, finalSubRole, finalStatus, id);

    res.json({ message: 'Staff member updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update staff member.' });
  }
});

// DELETE /api/auth/staff/:id - Delete staff account (Admin Only)
router.delete('/staff/:id', authenticate, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only.' });
  const { id } = req.params;

  // Prevent self-deletion
  if (req.user.id === parseInt(id)) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }

  try {
    const existingStaff = db.prepare('SELECT id FROM users WHERE id = ? AND role = "admin"').get(id);
    if (!existingStaff) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    // Perform deletions and updates inside a transaction
    const deleteTransaction = db.transaction(() => {
      db.prepare('UPDATE bookings SET assigned_to = NULL WHERE assigned_to = ?').run(id);
      db.prepare('UPDATE visa_applications SET assigned_to = NULL WHERE assigned_to = ?').run(id);
      db.prepare('UPDATE inquiries SET assigned_to = NULL WHERE assigned_to = ?').run(id);
      db.prepare('UPDATE flight_requests SET assigned_to = NULL WHERE assigned_to = ?').run(id);
      db.prepare('UPDATE service_requests SET assigned_to = NULL WHERE assigned_to = ?').run(id);
      db.prepare('UPDATE users SET assigned_to = NULL WHERE assigned_to = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
    });

    deleteTransaction();

    res.json({ message: 'Staff member deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete staff member.' });
  }
});

module.exports = router;

