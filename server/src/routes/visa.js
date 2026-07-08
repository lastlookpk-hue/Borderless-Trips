const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticate, adminOnly } = require('../middleware/auth');

function generateAppRef() {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `VA-${num}`;
}

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

// POST /api/visa/apply - Create a visa application
router.post('/apply', (req, res) => {
  const { name, email, country, nationality, purpose, assessment, documents, travelers, paymentInfo } = req.body;
  
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
    } catch (e) {
      // Ignore token errors, guest booking
    }
  }

  if (!name || !email || !country || !nationality) {
    return res.status(400).json({ error: 'Name, email, country, and nationality are required.' });
  }

  try {
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
        ).run(name, emailLower, hash, '', 'customer', '');
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

    const appRef = generateAppRef();
    const resolvedTravelers = resolveAndLinkTravelers(travelers || []);

    db.prepare(`
      INSERT INTO visa_applications (
        app_ref, user_id, customer_name, customer_email, country, nationality,
        purpose, status, assessment_json, documents_json, notes,
        travelers_json, payment_info_json, payment_proof, comments_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?, ?, '', ?, ?, '', '[]')
    `).run(
      appRef,
      userId,
      name,
      emailLower,
      country,
      nationality,
      purpose || 'tourism',
      JSON.stringify(assessment || {}),
      JSON.stringify(documents || []),
      JSON.stringify(resolvedTravelers),
      JSON.stringify(paymentInfo || {})
    );

    const application = db.prepare('SELECT * FROM visa_applications WHERE app_ref = ?').get(appRef);

    res.status(201).json({
      message: 'Visa application submitted successfully.',
      application: {
        ...application,
        assessment_json: JSON.parse(application.assessment_json || '{}'),
        documents_json: JSON.parse(application.documents_json || '[]'),
        travelers_json: JSON.parse(application.travelers_json || '[]'),
        payment_info_json: JSON.parse(application.payment_info_json || '{}'),
        comments_json: JSON.parse(application.comments_json || '[]')
      },
      autoCreated,
      email: emailLower,
      tempPassword,
      token,
      userExists
    });
  } catch (error) {
    console.error('Apply visa error:', error);
    res.status(500).json({ error: 'Server error. Failed to submit visa application.' });
  }
});

// GET /api/visa/applications - List visa applications
router.get('/applications', authenticate, (req, res) => {
  try {
    let apps;
    if (req.user.role === 'admin') {
      if (req.user.sub_role === 'agent') {
        apps = db.prepare('SELECT * FROM visa_applications WHERE assigned_to = ? ORDER BY created_at DESC').all(req.user.id);
      } else {
        apps = db.prepare('SELECT * FROM visa_applications ORDER BY created_at DESC').all();
      }
    } else {
      const searchEmail = `%"email":"${req.user.email.toLowerCase()}"%`;
      const searchUserIdNum = `%"user_id":${req.user.id}%`;
      const searchUserIdStr = `%"user_id":"${req.user.id}"%`;
      apps = db.prepare(`
        SELECT * FROM visa_applications 
        WHERE user_id = ? 
           OR customer_email = ? 
           OR travelers_json LIKE ? 
           OR travelers_json LIKE ? 
           OR travelers_json LIKE ?
        ORDER BY created_at DESC
      `).all(req.user.id, req.user.email.toLowerCase(), searchEmail, searchUserIdNum, searchUserIdStr);
    }

    const formatted = apps.map(app => ({
      ...app,
      assessment_json: JSON.parse(app.assessment_json || '{}'),
      documents_json: JSON.parse(app.documents_json || '[]'),
      travelers_json: JSON.parse(app.travelers_json || '[]'),
      payment_info_json: JSON.parse(app.payment_info_json || '{}'),
      comments_json: JSON.parse(app.comments_json || '[]')
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to retrieve visa applications.' });
  }
});

// GET /api/visa/applications/:id - Get single application
router.get('/applications/:id', authenticate, (req, res) => {
  const { id } = req.params;
  try {
    const app = db.prepare('SELECT * FROM visa_applications WHERE id = ?').get(id);
    if (!app) {
      return res.status(404).json({ error: 'Visa application not found.' });
    }

    if (req.user.role === 'admin') {
      if (req.user.sub_role === 'agent' && app.assigned_to !== req.user.id) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    } else {
      let isCoTraveler = false;
      try {
        const travelers = JSON.parse(app.travelers_json || '[]');
        isCoTraveler = travelers.some(t => 
          (t.email && t.email.toLowerCase() === req.user.email.toLowerCase()) || 
          (t.user_id && String(t.user_id) === String(req.user.id))
        );
      } catch (e) {}

      if (app.user_id !== req.user.id && app.customer_email !== req.user.email && !isCoTraveler) {
        return res.status(403).json({ error: 'Access denied.' });
      }
    }

    res.json({
      ...app,
      assessment_json: JSON.parse(app.assessment_json || '{}'),
      documents_json: JSON.parse(app.documents_json || '[]'),
      travelers_json: JSON.parse(app.travelers_json || '[]'),
      payment_info_json: JSON.parse(app.payment_info_json || '{}'),
      comments_json: JSON.parse(app.comments_json || '[]')
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error. Failed to retrieve visa application.' });
  }
});

// PUT /api/visa/applications/:id - Update application status/documents
router.put('/applications/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const { status, notes, admin_notes, assigned_to, edit_unlocked, signature_link, signature_doc, signed_document_url, invoice_url } = req.body;
  const travelers = req.body.travelers !== undefined ? req.body.travelers : req.body.travelers_json;
  const paymentInfo = req.body.paymentInfo !== undefined ? req.body.paymentInfo : req.body.payment_info_json;
  const comments = req.body.comments !== undefined ? req.body.comments : req.body.comments_json;
  const documents = req.body.documents !== undefined ? req.body.documents : req.body.documents_json;
  const paymentProof = req.body.paymentProof !== undefined ? req.body.paymentProof : req.body.payment_proof;

  try {
    const app = db.prepare('SELECT * FROM visa_applications WHERE id = ?').get(id);
    if (!app) {
      return res.status(404).json({ error: 'Visa application not found.' });
    }

    if (req.user.role === 'admin') {
      if (req.user.sub_role === 'agent' && app.assigned_to !== req.user.id && req.body.assigned_to === undefined) {
         return res.status(403).json({ error: 'Access denied. Case not assigned to you.' });
      }
      
      let resolvedTravelers = null;
      if (travelers) {
        resolvedTravelers = resolveAndLinkTravelers(travelers);
      }

      db.prepare(`
        UPDATE visa_applications SET
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          admin_notes = COALESCE(?, admin_notes),
          documents_json = COALESCE(?, documents_json),
          travelers_json = COALESCE(?, travelers_json),
          payment_info_json = COALESCE(?, payment_info_json),
          payment_proof = COALESCE(?, payment_proof),
          comments_json = COALESCE(?, comments_json),
          assigned_to = COALESCE(?, assigned_to),
          edit_unlocked = COALESCE(?, edit_unlocked),
          signature_link = COALESCE(?, signature_link),
          signature_doc = COALESCE(?, signature_doc),
          signed_document_url = COALESCE(?, signed_document_url),
          invoice_url = COALESCE(?, invoice_url),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        status,
        notes,
        admin_notes,
        documents ? JSON.stringify(documents) : null,
        resolvedTravelers ? JSON.stringify(resolvedTravelers) : null,
        paymentInfo ? JSON.stringify(paymentInfo) : null,
        paymentProof,
        comments ? JSON.stringify(comments) : null,
        assigned_to,
        edit_unlocked,
        signature_link,
        signature_doc,
        signed_document_url,
        invoice_url,
        id
      );

      // Notify customer via email on status change
      if (status && status !== app.status) {
        const { sendStatusUpdateEmail } = require('../utils/mailer');
        sendStatusUpdateEmail({
          email: app.customer_email,
          name: app.customer_name,
          type: 'visa',
          ref: app.app_ref,
          oldStatus: app.status,
          newStatus: status,
          notes: notes || admin_notes || ''
        }).catch(err => console.error('Visa status email failed:', err));
      }
    } else {
      let isCoTraveler = false;
      try {
        const travelersList = JSON.parse(app.travelers_json || '[]');
        isCoTraveler = travelersList.some(t => 
          (t.email && t.email.toLowerCase() === req.user.email.toLowerCase()) || 
          (t.user_id && String(t.user_id) === String(req.user.id))
        );
      } catch (e) {}

      if (app.user_id !== req.user.id && (!app.customer_email || app.customer_email.toLowerCase() !== req.user.email.toLowerCase()) && !isCoTraveler) {
        return res.status(403).json({ error: 'Access denied.' });
      }

      if (
        status !== undefined || notes !== undefined || admin_notes !== undefined ||
        assigned_to !== undefined || edit_unlocked !== undefined || signature_link !== undefined ||
        signature_doc !== undefined || invoice_url !== undefined || paymentInfo !== undefined
      ) {
        return res.status(403).json({ error: 'Only administrators can modify status and administration notes.' });
      }

      const isLocked = app.status !== 'submitted' && app.edit_unlocked !== 1;
      if (isLocked) {
        if (travelers !== undefined || documents !== undefined || req.body.signed_document_url !== undefined) {
          return res.status(403).json({ error: 'Editing is locked for this application. Please contact an agent to unlock editing.' });
        }
      }

      if (documents) {
        db.prepare('UPDATE visa_applications SET documents_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(JSON.stringify(documents), id);
      }
      if (travelers) {
        const resolved = resolveAndLinkTravelers(travelers);
        db.prepare('UPDATE visa_applications SET travelers_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(JSON.stringify(resolved), id);
      }
      if (req.body.signed_document_url !== undefined) {
        db.prepare('UPDATE visa_applications SET signed_document_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
          .run(req.body.signed_document_url, id);
      }
      if (paymentProof) {
         db.prepare('UPDATE visa_applications SET payment_proof = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(paymentProof, id);
      }
      if (comments) {
         db.prepare('UPDATE visa_applications SET comments_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(JSON.stringify(comments), id);
      }
    }

    res.json({ message: 'Visa application updated successfully.' });
  } catch (error) {
    console.error('Update visa error:', error);
    res.status(500).json({ error: 'Server error. Failed to update visa application.' });
  }
});

module.exports = router;
