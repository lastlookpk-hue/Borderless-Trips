const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

function generateBookingRef() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `BT-${num}`;
}

// POST /api/bookings - Create booking
router.post('/', (req, res) => {
  const packageId = req.body.packageId || req.body.package_id;
  const name = req.body.name || req.body.customer_name;
  const email = req.body.email || req.body.customer_email;
  const phone = req.body.phone || req.body.customer_phone;
  const travelDate = req.body.travelDate || req.body.travel_date || req.body.date;
  const travelers = req.body.travelers;
  const notes = req.body.notes;
  const travelersData = req.body.travelersData || [];
  const paymentInfo = req.body.paymentInfo || {};

  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth');
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.id;
      if (decoded.role === 'admin' && (req.body.userId || req.body.user_id)) {
        userId = req.body.userId || req.body.user_id;
      }
    } catch (e) { /* guest booking */ }
  }

  if (!packageId || !name || !email || !travelDate) {
    return res.status(400).json({ error: 'Package ID, customer name, email, and travel date are required.' });
  }

  try {
    const pkg = db.prepare('SELECT title, price FROM packages WHERE id = ?').get(packageId);
    if (!pkg) return res.status(404).json({ error: 'Package not found.' });

    let autoCreated = false;
    let tempPassword = '';
    let token = '';
    let userExists = false;
    const emailLower = email.toLowerCase().trim();

    if (!userId) {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
      if (existing) {
        userId = existing.id;
        userExists = true;
      } else {
        // Auto-create customer user
        const bcrypt = require('bcryptjs');
        tempPassword = 'welcome123';
        const hash = bcrypt.hashSync(tempPassword, 10);
        const result = db.prepare(
          'INSERT INTO users (name, email, password_hash, phone, role, sub_role) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(name, emailLower, hash, phone || '', 'customer', '');
        userId = result.lastInsertRowid;
        autoCreated = true;

        const jwt = require('jsonwebtoken');
        const { JWT_SECRET } = require('../middleware/auth');
        token = jwt.sign({ id: userId, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
      }
    } else {
      const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
      if (user && user.email.toLowerCase() === emailLower) {
        userExists = true;
      }
    }

    const bookingRef = generateBookingRef();
    const totalPrice = pkg.price * (parseInt(travelers) || 1);

    db.prepare(`
      INSERT INTO bookings (
        booking_ref, user_id, package_id, package_title, customer_name, customer_email, customer_phone, 
        travel_date, travelers, total_price, status, payment_status, notes, admin_notes, 
        travelers_json, payment_info_json, payment_proof, comments_json
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, '', ?, ?, '', '[]')
    `).run(
      bookingRef, userId, packageId, pkg.title, name, emailLower, phone || '', 
      travelDate, parseInt(travelers) || 1, totalPrice, notes || '',
      JSON.stringify(travelersData), JSON.stringify(paymentInfo)
    );

    const booking = db.prepare('SELECT * FROM bookings WHERE booking_ref = ?').get(bookingRef);
    res.status(201).json({
      message: 'Booking created successfully.',
      booking,
      autoCreated,
      email: emailLower,
      tempPassword,
      token,
      userExists
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking.' });
  }
});

function resolveAndLinkTravelers(travelersList) {
  if (!travelersList || !Array.isArray(travelersList)) return travelersList;
  const bcrypt = require('bcryptjs');
  return travelersList.map(t => {
    if (t.email && t.email.trim()) {
      const emailLower = t.email.trim().toLowerCase();
      try {
        const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
        if (existing) {
          t.user_id = existing.id;
        } else {
          // Auto-create customer user
          const tempPassword = 'welcome123';
          const hash = bcrypt.hashSync(tempPassword, 10);
          const name = t.name || 'Traveler';
          const phone = t.phone || '';
          const nationality = t.nationality || '';
          const result = db.prepare(
            'INSERT INTO users (name, email, password_hash, phone, nationality, role, sub_role) VALUES (?, ?, ?, ?, ?, ?, ?)'
          ).run(name, emailLower, hash, phone, nationality, 'customer', '');
          t.user_id = result.lastInsertRowid;
        }
      } catch (err) {
        console.error('Error auto-creating user for co-traveler:', err);
      }
    }
    return t;
  });
}

// GET /api/bookings - List bookings
router.get('/', authenticate, (req, res) => {
  try {
    let bookings;
    if (req.user.role === 'admin') {
      if (req.user.sub_role === 'agent') {
        bookings = db.prepare(`
          SELECT b.*, u.name as assigned_name 
          FROM bookings b LEFT JOIN users u ON b.assigned_to = u.id 
          WHERE b.assigned_to = ? ORDER BY b.created_at DESC
        `).all(req.user.id);
      } else {
        bookings = db.prepare(`
          SELECT b.*, u.name as assigned_name 
          FROM bookings b LEFT JOIN users u ON b.assigned_to = u.id 
          ORDER BY b.created_at DESC
        `).all();
      }
    } else {
      const searchEmail = `%"email":"${req.user.email.toLowerCase()}"%`;
      const searchUserIdNum = `%"user_id":${req.user.id}%`;
      const searchUserIdStr = `%"user_id":"${req.user.id}"%`;
      bookings = db.prepare(`
        SELECT * FROM bookings 
        WHERE user_id = ? 
           OR customer_email = ? 
           OR travelers_json LIKE ? 
           OR travelers_json LIKE ? 
           OR travelers_json LIKE ?
        ORDER BY created_at DESC
      `).all(req.user.id, req.user.email.toLowerCase(), searchEmail, searchUserIdNum, searchUserIdStr);
    }
    
    const formatted = bookings.map(b => ({
      ...b,
      travelers_json: JSON.parse(b.travelers_json || '[]'),
      payment_info_json: JSON.parse(b.payment_info_json || '{}'),
      comments_json: JSON.parse(b.comments_json || '[]')
    }));
    return res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve bookings.' });
  }
});

// POST /api/bookings/:id/payment - Submit payment reference
router.post('/:id/payment', authenticate, (req, res) => {
  const { id } = req.params;
  const { paymentRef } = req.body;
  if (!paymentRef) return res.status(400).json({ error: 'Payment reference required.' });

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    
    if (req.user.role !== 'admin') {
      let isCoTraveler = false;
      try {
        const travelers = JSON.parse(booking.travelers_json || '[]');
        isCoTraveler = travelers.some(t => 
          (t.email && t.email.toLowerCase() === req.user.email.toLowerCase()) || 
          (t.user_id && String(t.user_id) === String(req.user.id))
        );
      } catch (e) {}

      if (booking.user_id !== req.user.id && booking.customer_email !== req.user.email && !isCoTraveler) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    db.prepare('UPDATE bookings SET payment_ref = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(paymentRef, id);
    res.json({ message: 'Payment reference submitted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit payment reference.' });
  }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const {
    status, payment_status, payment_ref, notes, admin_notes, travel_date, travelers, assigned_to,
    edit_unlocked, signature_link, signature_doc, signed_document_url, invoice_url
  } = req.body;
  const travelersData = req.body.travelersData !== undefined ? req.body.travelersData : req.body.travelers_json;
  const paymentInfo = req.body.paymentInfo !== undefined ? req.body.paymentInfo : req.body.payment_info_json;
  const comments = req.body.comments !== undefined ? req.body.comments : req.body.comments_json;
  const paymentProof = req.body.paymentProof !== undefined ? req.body.paymentProof : req.body.payment_proof;

  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    if (req.user.role === 'admin') {
      if (req.user.sub_role === 'agent' && booking.assigned_to !== req.user.id && req.body.assigned_to === undefined) {
        return res.status(403).json({ error: 'Access denied. Case not assigned to you.' });
      }

      let resolvedTravelers = null;
      if (travelersData) {
        resolvedTravelers = resolveAndLinkTravelers(travelersData);
      }

      db.prepare(`
        UPDATE bookings SET
          status = COALESCE(?, status), payment_status = COALESCE(?, payment_status),
          payment_ref = COALESCE(?, payment_ref), notes = COALESCE(?, notes),
          admin_notes = COALESCE(?, admin_notes), travel_date = COALESCE(?, travel_date),
          travelers = COALESCE(?, travelers), assigned_to = COALESCE(?, assigned_to),
          travelers_json = COALESCE(?, travelers_json), payment_info_json = COALESCE(?, payment_info_json),
          payment_proof = COALESCE(?, payment_proof), comments_json = COALESCE(?, comments_json),
          edit_unlocked = COALESCE(?, edit_unlocked), signature_link = COALESCE(?, signature_link),
          signature_doc = COALESCE(?, signature_doc), signed_document_url = COALESCE(?, signed_document_url),
          invoice_url = COALESCE(?, invoice_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        status, payment_status, payment_ref, notes, admin_notes, travel_date, travelers, assigned_to,
        resolvedTravelers ? JSON.stringify(resolvedTravelers) : null,
        paymentInfo ? JSON.stringify(paymentInfo) : null,
        paymentProof,
        comments ? JSON.stringify(comments) : null,
        edit_unlocked, signature_link, signature_doc, signed_document_url, invoice_url,
        id
      );

      if (travelers && travelers !== booking.travelers) {
        const pkg = db.prepare('SELECT price FROM packages WHERE id = ?').get(booking.package_id);
        if (pkg) db.prepare('UPDATE bookings SET total_price = ? WHERE id = ?').run(pkg.price * travelers, id);
      }

      // Notify customer on status change
      if (status && booking.user_id && status !== booking.status) {
        const labels = { confirmed: 'Confirmed', cancelled: 'Cancelled', completed: 'Completed' };
        if (labels[status]) {
          db.prepare('INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)')
            .run(booking.user_id, `Booking ${labels[status]}`, `Your booking ${booking.booking_ref} has been ${labels[status].toLowerCase()}.`, status === 'cancelled' ? 'warning' : 'success');
        }
      }

      // Notify customer on status change via email
      if (status && status !== booking.status) {
        const { sendStatusUpdateEmail } = require('../utils/mailer');
        sendStatusUpdateEmail({
          email: booking.customer_email,
          name: booking.customer_name,
          type: 'booking',
          ref: booking.booking_ref,
          oldStatus: booking.status,
          newStatus: status,
          notes: admin_notes || ''
        }).catch(err => console.error('Booking status email failed:', err));
      }

      res.json({ message: 'Booking updated.' });
    } else {
      // Customer role updates
      let isCoTraveler = false;
      try {
        const travelersList = JSON.parse(booking.travelers_json || '[]');
        isCoTraveler = travelersList.some(t => 
          (t.email && t.email.toLowerCase() === req.user.email.toLowerCase()) || 
          (t.user_id && String(t.user_id) === String(req.user.id))
        );
      } catch (e) {}

      if (booking.user_id !== req.user.id && (!booking.customer_email || booking.customer_email.toLowerCase() !== req.user.email.toLowerCase()) && !isCoTraveler) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      if (
        status !== undefined || payment_status !== undefined || payment_ref !== undefined ||
        notes !== undefined || admin_notes !== undefined || travel_date !== undefined ||
        travelers !== undefined || assigned_to !== undefined || edit_unlocked !== undefined ||
        signature_link !== undefined || signature_doc !== undefined || invoice_url !== undefined ||
        paymentInfo !== undefined
      ) {
        return res.status(403).json({ error: 'Only administrators can update these fields.' });
      }

      const isLocked = booking.status !== 'pending' && booking.edit_unlocked !== 1;
      if (isLocked) {
        if (travelersData !== undefined || signed_document_url !== undefined) {
          return res.status(403).json({ error: 'Editing is locked for this booking. Please contact support.' });
        }
      }

      if (travelersData !== undefined) {
        const resolvedTravelers = resolveAndLinkTravelers(travelersData);
        db.prepare('UPDATE bookings SET travelers_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(JSON.stringify(resolvedTravelers), id);
      }
      if (signed_document_url !== undefined) {
        db.prepare('UPDATE bookings SET signed_document_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(signed_document_url, id);
      }
      if (paymentProof !== undefined) {
        db.prepare('UPDATE bookings SET payment_proof = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(paymentProof, id);
      }
      if (comments !== undefined) {
        db.prepare('UPDATE bookings SET comments_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(JSON.stringify(comments), id);
      }

      res.json({ message: 'Booking updated.' });
    }
  } catch (error) {
    console.error('Update booking error:', error);
    res.status(500).json({ error: 'Failed to update booking.' });
  }
});

// PUT /api/bookings/:id/cancel - Client cancel booking
router.put('/:id/cancel', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    
    if (req.user.role !== 'admin') {
      let isCoTraveler = false;
      try {
        const travelers = JSON.parse(booking.travelers_json || '[]');
        isCoTraveler = travelers.some(t => 
          (t.email && t.email.toLowerCase() === req.user.email.toLowerCase()) || 
          (t.user_id && String(t.user_id) === String(req.user.id))
        );
      } catch (e) {}

      if (booking.user_id !== req.user.id && booking.customer_email !== req.user.email && !isCoTraveler) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }
    
    if (booking.status === 'completed') return res.status(400).json({ error: 'Cannot cancel a completed booking.' });

    db.prepare("UPDATE bookings SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(id);

    // Notify client via email
    const { sendStatusUpdateEmail } = require('../utils/mailer');
    sendStatusUpdateEmail({
      email: booking.customer_email,
      name: booking.customer_name,
      type: 'booking',
      ref: booking.booking_ref,
      oldStatus: booking.status,
      newStatus: 'cancelled',
      notes: 'Cancelled by user.'
    }).catch(err => console.error('Booking status cancel email failed:', err));

    res.json({ message: 'Booking cancelled.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
});

// DELETE /api/bookings/:id - Delete booking (Admin Only)
router.delete('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  try {
    db.prepare('DELETE FROM bookings WHERE id = ?').run(id);
    res.json({ message: 'Booking deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking.' });
  }
});

module.exports = router;
