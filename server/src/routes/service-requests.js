const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

function generateRef() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `SR-${num}`;
}

// POST /api/service-requests - Create a service request (public or auth)
router.post('/', (req, res) => {
  const { name, email, phone, service_type, country, details, create_account, password } = req.body;

  if (!name || !email || !service_type) {
    return res.status(400).json({ error: 'Name, email, and service type are required.' });
  }

  const validTypes = ['visa', 'holiday_package', 'flight', 'hotel', 'consultation', 'other'];
  if (!validTypes.includes(service_type)) {
    return res.status(400).json({ error: 'Invalid service type.' });
  }

  let userId = null;
  let autoCreated = false;
  let tempPassword = '';
  let token = '';

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const tokenStr = authHeader.split(' ')[1];
    try {
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth');
      const decoded = jwt.verify(tokenStr, JWT_SECRET);
      userId = decoded.id;
      if (decoded.role === 'admin' && (req.body.userId || req.body.user_id)) {
        userId = req.body.userId || req.body.user_id;
      }
    } catch (e) { /* guest request */ }
  }

  try {
    const existingUser = db.prepare('SELECT id, role FROM users WHERE email = ?').get(email.toLowerCase());
    
    if (existingUser) {
      if (!userId) {
        userId = existingUser.id;
      }
    } else if (create_account) {
      // Auto-create account
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');
      const { JWT_SECRET } = require('../middleware/auth');
      
      tempPassword = password || `BT-${Math.floor(100000 + Math.random() * 900000)}`;
      const hash = bcrypt.hashSync(tempPassword, 10);
      
      const userResult = db.prepare(
        'INSERT INTO users (name, email, password_hash, phone, nationality, role, sub_role) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).run(name, email.toLowerCase(), hash, phone || '', '', 'customer', '');
      
      userId = userResult.lastInsertRowid;
      autoCreated = true;
      token = jwt.sign({ id: userId, role: 'customer' }, JWT_SECRET, { expiresIn: '7d' });
    }

    const ref = generateRef();
    db.prepare(`
      INSERT INTO service_requests (ref, user_id, name, email, phone, service_type, country, details_json, status, priority, admin_notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', 'normal', '')
    `).run(ref, userId, name, email.toLowerCase(), phone || '', service_type, country || '', JSON.stringify(details || {}));

    const request = db.prepare('SELECT * FROM service_requests WHERE ref = ?').get(ref);
    
    // Send email notifications asynchronously
    const { sendWelcomeEmail, sendRequestConfirmation, sendAdminAlert } = require('../utils/mailer');
    if (autoCreated) {
      sendWelcomeEmail({ email, name, tempPassword: tempPassword || password }).catch(err => console.error('Welcome email failed:', err));
    }
    sendRequestConfirmation({ email, name, ref, serviceType: service_type, country }).catch(err => console.error('Confirmation email failed:', err));
    sendAdminAlert({ ref, name, email, serviceType: service_type, country }).catch(err => console.error('Admin alert email failed:', err));

    res.status(201).json({
      message: 'Service request submitted successfully.',
      request: { ...request, details_json: JSON.parse(request.details_json || '{}') },
      autoCreated,
      tempPassword: autoCreated ? tempPassword : '',
      token: autoCreated ? token : ''
    });
  } catch (error) {
    console.error('Service request error:', error);
    res.status(500).json({ error: 'Failed to submit service request.' });
  }
});

// GET /api/service-requests - List requests
router.get('/', authenticate, (req, res) => {
  try {
    const { status, service_type, priority, page = 1, limit = 25, search } = req.query;

    if (req.user.role === 'admin') {
      let query = 'SELECT sr.*, u.name as assigned_name FROM service_requests sr LEFT JOIN users u ON sr.assigned_to = u.id';
      const conditions = [];
      const params = [];

      if (status && status !== 'all') { conditions.push('sr.status = ?'); params.push(status); }
      if (service_type && service_type !== 'all') { conditions.push('sr.service_type = ?'); params.push(service_type); }
      if (priority && priority !== 'all') { conditions.push('sr.priority = ?'); params.push(priority); }
      if (req.user.sub_role === 'agent') { conditions.push('sr.assigned_to = ?'); params.push(req.user.id); }
      if (search) {
        conditions.push("(sr.name LIKE ? OR sr.email LIKE ? OR sr.ref LIKE ? OR sr.country LIKE ?)");
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }

      if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
      
      // Count total
      const countQuery = query.replace('SELECT sr.*, u.name as assigned_name', 'SELECT COUNT(*) as total');
      const total = db.prepare(countQuery).get(...params).total;

      query += ' ORDER BY sr.created_at DESC';
      const offset = (parseInt(page) - 1) * parseInt(limit);
      query += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

      const requests = db.prepare(query).all(...params);
      const formatted = requests.map(r => ({ ...r, details_json: JSON.parse(r.details_json || '{}') }));

      res.json({ requests: formatted, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
    } else {
      const requests = db.prepare(
        'SELECT * FROM service_requests WHERE user_id = ? OR email = ? ORDER BY created_at DESC'
      ).all(req.user.id, req.user.email);
      const formatted = requests.map(r => ({ ...r, details_json: JSON.parse(r.details_json || '{}') }));
      res.json(formatted);
    }
  } catch (error) {
    console.error('List service requests error:', error);
    res.status(500).json({ error: 'Failed to retrieve service requests.' });
  }
});

// GET /api/service-requests/stats - Dashboard stats for service requests
router.get('/stats', authenticate, adminOnly, (req, res) => {
  try {
    const isAgent = req.user.sub_role === 'agent';
    const agentId = req.user.id;
    
    const newQuery = isAgent 
      ? "SELECT COUNT(*) as c FROM service_requests WHERE status = 'new' AND assigned_to = ?" 
      : "SELECT COUNT(*) as c FROM service_requests WHERE status = 'new'";
    const acceptedQuery = isAgent 
      ? "SELECT COUNT(*) as c FROM service_requests WHERE status = 'accepted' AND assigned_to = ?" 
      : "SELECT COUNT(*) as c FROM service_requests WHERE status = 'accepted'";
    const inProgressQuery = isAgent 
      ? "SELECT COUNT(*) as c FROM service_requests WHERE status = 'in_progress' AND assigned_to = ?" 
      : "SELECT COUNT(*) as c FROM service_requests WHERE status = 'in_progress'";
    const completedQuery = isAgent 
      ? "SELECT COUNT(*) as c FROM service_requests WHERE status = 'completed' AND assigned_to = ?" 
      : "SELECT COUNT(*) as c FROM service_requests WHERE status = 'completed'";
    const rejectedQuery = isAgent 
      ? "SELECT COUNT(*) as c FROM service_requests WHERE status = 'rejected' AND assigned_to = ?" 
      : "SELECT COUNT(*) as c FROM service_requests WHERE status = 'rejected'";
    const totalQuery = isAgent 
      ? "SELECT COUNT(*) as c FROM service_requests WHERE assigned_to = ?" 
      : "SELECT COUNT(*) as c FROM service_requests";
    const todayQuery = isAgent 
      ? "SELECT COUNT(*) as c FROM service_requests WHERE DATE(created_at) = DATE('now') AND assigned_to = ?" 
      : "SELECT COUNT(*) as c FROM service_requests WHERE DATE(created_at) = DATE('now')";
    const thisWeekQuery = isAgent 
      ? "SELECT COUNT(*) as c FROM service_requests WHERE created_at >= DATE('now', '-7 days') AND assigned_to = ?" 
      : "SELECT COUNT(*) as c FROM service_requests WHERE created_at >= DATE('now', '-7 days')";
    const byTypeQuery = isAgent 
      ? "SELECT service_type, COUNT(*) as count FROM service_requests WHERE assigned_to = ? GROUP BY service_type" 
      : "SELECT service_type, COUNT(*) as count FROM service_requests GROUP BY service_type";
    const urgentQuery = isAgent 
      ? "SELECT COUNT(*) as c FROM service_requests WHERE priority = 'urgent' AND status NOT IN ('completed','rejected') AND assigned_to = ?" 
      : "SELECT COUNT(*) as c FROM service_requests WHERE priority = 'urgent' AND status NOT IN ('completed','rejected')";

    const params = isAgent ? [agentId] : [];
    const runQuery = (q) => db.prepare(q).get(...params).c;

    const stats = {
      new: runQuery(newQuery),
      accepted: runQuery(acceptedQuery),
      in_progress: runQuery(inProgressQuery),
      completed: runQuery(completedQuery),
      rejected: runQuery(rejectedQuery),
      total: runQuery(totalQuery),
      today: runQuery(todayQuery),
      thisWeek: runQuery(thisWeekQuery),
      byType: isAgent ? db.prepare(byTypeQuery).all(agentId) : db.prepare(byTypeQuery).all(),
      urgent: runQuery(urgentQuery),
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get service request stats.' });
  }
});

// PUT /api/service-requests/:id - Update service request (Admin)
router.put('/:id', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;
  const { status, priority, assigned_to, admin_notes } = req.body;

  try {
    const request = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(id);
    if (!request) return res.status(404).json({ error: 'Service request not found.' });

    if (req.user.sub_role === 'agent' && request.assigned_to !== req.user.id && req.body.assigned_to === undefined) {
      return res.status(403).json({ error: 'Access denied. Case not assigned to you.' });
    }

    db.prepare(`
      UPDATE service_requests SET
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        assigned_to = COALESCE(?, assigned_to),
        admin_notes = COALESCE(?, admin_notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, priority, assigned_to, admin_notes, id);

    // Create notification for customer when status changes
    if (status && request.user_id) {
      const statusLabels = { accepted: 'Accepted', in_progress: 'In Progress', completed: 'Completed', rejected: 'Rejected' };
      if (statusLabels[status]) {
        db.prepare(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)'
        ).run(
          request.user_id,
          `Service Request ${statusLabels[status]}`,
          `Your service request ${request.ref} (${request.service_type.replace('_', ' ')}) has been ${statusLabels[status].toLowerCase()}.`,
          status === 'rejected' ? 'warning' : 'success'
        );
      }
    }

    // Send email status update asynchronously
    if (status && status !== request.status) {
      const { sendStatusUpdateEmail } = require('../utils/mailer');
      sendStatusUpdateEmail({
        email: request.email,
        name: request.name,
        type: 'request',
        ref: request.ref,
        oldStatus: request.status,
        newStatus: status,
        notes: admin_notes || ''
      }).catch(err => console.error('Status update email failed:', err));
    }

    res.json({ message: 'Service request updated successfully.' });
  } catch (error) {
    console.error('Update service request error:', error);
    res.status(500).json({ error: 'Failed to update service request.' });
  }
});

// DELETE /api/service-requests/:id - Delete (Admin or Owner if pending)
router.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    const request = db.prepare('SELECT id, user_id, status FROM service_requests WHERE id = ?').get(id);
    if (!request) return res.status(404).json({ error: 'Service request not found.' });
    
    // Check permission: admin, or client owner when request is still pending
    const isOwner = request.user_id === req.user.id;
    const isPending = request.status === 'new';
    
    if (req.user.role !== 'admin' && !(isOwner && isPending)) {
      return res.status(403).json({ error: 'Access denied. You can only delete pending requests that you created.' });
    }
    
    db.prepare('DELETE FROM service_requests WHERE id = ?').run(id);
    res.json({ message: 'Service request deleted.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete service request.' });
  }
});

// POST /api/service-requests/:id/convert - Convert service request to booking or visa application (Admin Only)
router.post('/:id/convert', authenticate, adminOnly, (req, res) => {
  const { id } = req.params;

  try {
    const sr = db.prepare('SELECT * FROM service_requests WHERE id = ?').get(id);
    if (!sr) {
      return res.status(404).json({ error: 'Service request not found.' });
    }

    if (sr.status === 'completed') {
      return res.status(400).json({ error: 'Service request is already completed/converted.' });
    }

    // Check if the customer user exists or create a temp customer if needed
    let userId = sr.user_id;
    if (!userId) {
      const user = db.prepare('SELECT id FROM users WHERE email = ?').get(sr.email.toLowerCase());
      if (user) {
        userId = user.id;
      } else {
        // Create customer account
        const bcrypt = require('bcryptjs');
        const tempPassword = 'welcome' + Math.floor(1000 + Math.random() * 9000);
        const hash = bcrypt.hashSync(tempPassword, 10);
        const userInsert = db.prepare(`
          INSERT INTO users (name, email, password_hash, phone, role, status)
          VALUES (?, ?, ?, ?, 'customer', 'active')
        `).run(sr.name, sr.email.toLowerCase(), hash, sr.phone || '');
        userId = userInsert.lastInsertRowid;
      }
    }

    let resultMsg = '';
    let targetRef = '';

    if (sr.service_type === 'visa') {
      // Convert to Visa Application
      const appRef = 'VISA-' + Math.floor(100000 + Math.random() * 900000);
      targetRef = appRef;

      // Parse details if it contains specific fields
      let details = {};
      try {
        details = JSON.parse(sr.details_json || '{}');
      } catch (e) {}

      db.prepare(`
        INSERT INTO visa_applications (
          app_ref, user_id, customer_name, customer_email, customer_phone, country, nationality,
          purpose, status, assessment_json, documents_json, notes, admin_notes, assigned_to,
          travelers_json, payment_info_json, comments_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', '{}', '[]', ?, ?, ?, '[]', '{}', '[]')
      `).run(
        appRef,
        userId,
        sr.name,
        sr.email.toLowerCase(),
        sr.phone || '',
        sr.country || details.country || 'Schengen',
        details.nationality || '',
        details.purpose || 'tourism',
        details.notes || sr.admin_notes || 'Converted from Service Request ' + sr.ref,
        `Converted from Service Request ${sr.ref}. Initial notes: ${sr.admin_notes || ''}`,
        sr.assigned_to
      );

      resultMsg = `Successfully converted to Visa Application (${appRef})`;

    } else {
      // Convert to Booking (e.g. holiday_package, flight, hotel, consultation, other)
      const bookingRef = 'BKG-' + Math.floor(100000 + Math.random() * 900000);
      targetRef = bookingRef;

      let details = {};
      try {
        details = JSON.parse(sr.details_json || '{}');
      } catch (e) {}

      // Try to find package title or details
      let packageTitle = details.package_title || details.holiday_package || (sr.service_type.toUpperCase() + ' Booking');
      let packageId = details.package_id || null;
      let totalPrice = details.price || details.total_price || 0.0;
      let travelDate = details.travel_date || details.depart_date || '';
      let travelers = details.travelers || details.passengers || 1;

      db.prepare(`
        INSERT INTO bookings (
          booking_ref, user_id, package_id, package_title, customer_name, customer_email, customer_phone,
          travel_date, travelers, total_price, status, payment_status, notes, admin_notes, assigned_to
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'pending', ?, ?, ?)
      `).run(
        bookingRef,
        userId,
        packageId,
        packageTitle,
        sr.name,
        sr.email.toLowerCase(),
        sr.phone || '',
        travelDate,
        travelers,
        totalPrice,
        details.notes || sr.admin_notes || 'Converted from Service Request ' + sr.ref,
        `Converted from Service Request ${sr.ref}. Initial notes: ${sr.admin_notes || ''}`,
        sr.assigned_to
      );

      resultMsg = `Successfully converted to Booking (${bookingRef})`;
    }

    // Update the service request status to completed and log the conversion reference
    const updatedNotes = `${sr.admin_notes || ''}\n[System] Converted to ${targetRef} on ${new Date().toLocaleDateString()}`.trim();
    db.prepare("UPDATE service_requests SET status = 'completed', admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .run(updatedNotes, id);

    res.json({ message: resultMsg, targetRef, status: 'completed' });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: 'Failed to convert service request. ' + error.message });
  }
});

module.exports = router;

