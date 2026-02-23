import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './src/db/schema.ts';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/db/schema.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'dealflow-secret-key';

async function startServer() {
  initDb();
  
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  const authorize = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      next();
    };
  };

  // Socket.io connection
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-lead', (leadId) => {
      socket.join(`lead-${leadId}`);
    });

    socket.on('send-message', (data) => {
      if (!data.leadId || !data.content) return;

      const messageToEmit = {
        ...data,
        user_id: data.userId, // Normalize to user_id
        created_at: new Date().toISOString(),
        direction: 'outbound'
      };

      // Broadcast to specific lead room
      io.to(`lead-${data.leadId}`).emit('new-message', messageToEmit);
      
      // Save to DB
      try {
        const stmt = db.prepare('INSERT INTO communications (lead_id, user_id, type, direction, subject, content) VALUES (?, ?, ?, ?, ?, ?)');
        const result = stmt.run(data.leadId, data.userId || null, data.type || 'internal', 'outbound', data.subject || null, data.content);
        const commId = result.lastInsertRowid;

        // Handle Mentions
        if (data.mentions && Array.isArray(data.mentions)) {
          const mentionStmt = db.prepare('INSERT INTO mentions (communication_id, user_id) VALUES (?, ?)');
          data.mentions.forEach((mId: number) => {
            mentionStmt.run(commId, mId);
          });
        }
      } catch (err) {
        console.error('Failed to save communication:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // API Routes
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare('SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE email = ?').get(email) as any;
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const locations = db.prepare('SELECT location_id FROM user_locations WHERE user_id = ?').all(user.id) as any[];
    const locationIds = locations.map(l => l.location_id);

    const token = jwt.sign({ id: user.id, role: user.role, dealershipId: user.dealership_id, locationIds }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, dealershipId: user.dealership_id, locationIds } });
  });

  // Dealerships (Super Admin)
  app.get('/api/dealerships', authenticate, authorize(['super_admin']), (req, res) => {
    const dealerships = db.prepare("SELECT * FROM dealerships WHERE status = 'active'").all();
    res.json(dealerships);
  });

  app.post('/api/dealerships', authenticate, authorize(['super_admin']), (req, res) => {
    const { name, principalName, principalEmail, principalPassword, locationName, locationAddress } = req.body;
    
    const result = db.transaction(() => {
      const dealer = db.prepare('INSERT INTO dealerships (name) VALUES (?)').run(name);
      const dealerId = dealer.lastInsertRowid;

      // Create Location
      const loc = db.prepare('INSERT INTO locations (dealership_id, name, address, is_default) VALUES (?, ?, ?, 1)')
        .run(dealerId, locationName, locationAddress);
      const locationId = loc.lastInsertRowid;

      const principalRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('principal') as any;
      const hash = bcrypt.hashSync(principalPassword, 10);
      
      const user = db.prepare('INSERT INTO users (dealership_id, role_id, name, email, password) VALUES (?, ?, ?, ?, ?)')
        .run(dealerId, principalRole.id, principalName, principalEmail, hash);
      const userId = user.lastInsertRowid;

      // Link principal to the new location
      db.prepare('INSERT INTO user_locations (user_id, location_id) VALUES (?, ?)').run(userId, locationId);
      
      return dealerId;
    })();

    res.json({ id: result });
  });

  app.put('/api/dealerships/:id', authenticate, authorize(['super_admin']), (req, res) => {
    const { name } = req.body;
    db.prepare('UPDATE dealerships SET name = ? WHERE id = ?').run(name, req.params.id);
    res.json({ success: true });
  });

  app.delete('/api/dealerships/:id', authenticate, authorize(['super_admin']), (req, res) => {
    db.prepare("UPDATE dealerships SET status = 'deleted' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Locations
  app.get('/api/locations', authenticate, (req: any, res) => {
    let locations;
    if (req.user.role === 'super_admin') {
      locations = db.prepare("SELECT l.*, d.name as dealership_name FROM locations l JOIN dealerships d ON l.dealership_id = d.id WHERE l.status = 'active'").all();
    } else {
      locations = db.prepare("SELECT * FROM locations WHERE dealership_id = ? AND status = 'active'").all(req.user.dealershipId);
    }
    res.json(locations);
  });

  app.post('/api/locations', authenticate, authorize(['super_admin', 'principal']), (req: any, res) => {
    const { dealershipId, name, address, isDefault } = req.body;
    const dId = req.user.role === 'super_admin' ? dealershipId : req.user.dealershipId;
    
    db.transaction(() => {
      if (isDefault) {
        db.prepare('UPDATE locations SET is_default = 0 WHERE dealership_id = ?').run(dId);
      }
      const result = db.prepare('INSERT INTO locations (dealership_id, name, address, is_default) VALUES (?, ?, ?, ?)')
        .run(dId, name, address, isDefault ? 1 : 0);
      res.json({ id: result.lastInsertRowid });
    })();
  });

  app.put('/api/locations/:id', authenticate, authorize(['super_admin', 'principal']), (req: any, res) => {
    const { name, address, isDefault } = req.body;
    const location = db.prepare('SELECT dealership_id FROM locations WHERE id = ?').get(req.params.id) as any;
    
    db.transaction(() => {
      if (isDefault) {
        db.prepare('UPDATE locations SET is_default = 0 WHERE dealership_id = ?').run(location.dealership_id);
      }
      db.prepare('UPDATE locations SET name = ?, address = ?, is_default = ? WHERE id = ?')
        .run(name, address, isDefault ? 1 : 0, req.params.id);
      res.json({ success: true });
    })();
  });

  app.delete('/api/locations/:id', authenticate, authorize(['super_admin', 'principal']), (req, res) => {
    db.prepare("UPDATE locations SET status = 'deleted' WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Users
  app.get('/api/users', authenticate, (req: any, res) => {
    if (req.user.role === 'super_admin') {
      const users = db.prepare(`
        SELECT u.*, r.name as role, d.name as dealership_name,
               GROUP_CONCAT(l.name) as location_names,
               GROUP_CONCAT(l.id) as location_ids
        FROM users u 
        JOIN roles r ON u.role_id = r.id 
        LEFT JOIN dealerships d ON u.dealership_id = d.id 
        LEFT JOIN user_locations ul ON u.id = ul.user_id
        LEFT JOIN locations l ON ul.location_id = l.id
        WHERE u.status = 'active'
        GROUP BY u.id
      `).all();
      return res.json(users);
    }
    const users = db.prepare(`
      SELECT u.*, r.name as role,
             GROUP_CONCAT(l.name) as location_names,
             GROUP_CONCAT(l.id) as location_ids
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      LEFT JOIN user_locations ul ON u.id = ul.user_id
      LEFT JOIN locations l ON ul.location_id = l.id
      WHERE u.dealership_id = ? AND u.id != ? AND u.status = 'active'
      GROUP BY u.id
    `).all(req.user.dealershipId, req.user.id);
    res.json(users);
  });

  app.post('/api/users', authenticate, authorize(['principal']), (req: any, res) => {
    const { name, email, password, roleName, locationIds } = req.body;
    
    // Check for duplicate email
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND status = "active"').get(email);
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Enforce only 1 principal
    if (roleName === 'principal') {
      const existingPrincipal = db.prepare(`
        SELECT u.id FROM users u 
        JOIN roles r ON u.role_id = r.id 
        WHERE u.dealership_id = ? AND r.name = 'principal' AND u.status = 'active'
      `).get(req.user.dealershipId);
      if (existingPrincipal) {
        return res.status(400).json({ error: 'A dealership can only have one principal user.' });
      }
    }

    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as any;
    const hash = bcrypt.hashSync(password, 10);
    
    const result = db.transaction(() => {
      const user = db.prepare('INSERT INTO users (dealership_id, role_id, name, email, password) VALUES (?, ?, ?, ?, ?)')
        .run(req.user.dealershipId, role.id, name, email, hash);
      const userId = user.lastInsertRowid;

      if (locationIds && Array.isArray(locationIds)) {
        const stmt = db.prepare('INSERT INTO user_locations (user_id, location_id) VALUES (?, ?)');
        locationIds.forEach(lId => stmt.run(userId, lId));
      }
      return userId;
    })();
    
    res.json({ id: result });
  });

  app.put('/api/users/:id', authenticate, authorize(['principal']), (req: any, res) => {
    const { name, email, roleName, locationIds } = req.body;
    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as any;
    
    db.transaction(() => {
      db.prepare('UPDATE users SET name = ?, email = ?, role_id = ? WHERE id = ? AND dealership_id = ?')
        .run(name, email, role.id, req.params.id, req.user.dealershipId);
      
      db.prepare('DELETE FROM user_locations WHERE user_id = ?').run(req.params.id);
      if (locationIds && Array.isArray(locationIds)) {
        const stmt = db.prepare('INSERT INTO user_locations (user_id, location_id) VALUES (?, ?)');
        locationIds.forEach(lId => stmt.run(req.params.id, lId));
      }
    })();
    res.json({ success: true });
  });

  app.delete('/api/users/:id', authenticate, authorize(['principal']), (req: any, res) => {
    db.prepare("UPDATE users SET status = 'deleted' WHERE id = ? AND dealership_id = ?")
      .run(req.params.id, req.user.dealershipId);
    res.json({ success: true });
  });

  app.get('/api/roles', authenticate, (req, res) => {
    const roles = db.prepare('SELECT * FROM roles').all();
    res.json(roles);
  });

  app.get('/api/leads/:id', authenticate, authorize(['principal', 'admin', 'user']), (req: any, res) => {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id) as any;
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    
    // RBAC check
    if (lead.dealership_id !== req.user.dealershipId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json(lead);
  });

  app.get('/api/leads', authenticate, authorize(['principal', 'admin', 'user']), (req: any, res) => {
    const leads = db.prepare('SELECT * FROM leads WHERE dealership_id = ? ORDER BY created_at DESC').all(req.user.dealershipId);
    res.json(leads);
  });

  app.post('/api/leads', authenticate, authorize(['principal', 'admin', 'user']), (req: any, res) => {
    const { firstName, lastName, email, phone, source, vehicleInterest, locationId } = req.body;
    const stmt = db.prepare('INSERT INTO leads (dealership_id, location_id, first_name, last_name, email, phone, source, vehicle_interest) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(req.user.dealershipId, locationId, firstName, lastName, email, phone, source, vehicleInterest);
    res.json({ id: result.lastInsertRowid });
  });

  app.put('/api/leads/:id', authenticate, authorize(['principal', 'admin', 'user']), (req: any, res) => {
    const { email, phone, status } = req.body;
    db.prepare(`
      UPDATE leads 
      SET email = ?, phone = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND dealership_id = ?
    `).run(email, phone, status, req.params.id, req.user.dealershipId);
    res.json({ success: true });
  });

  app.get('/api/leads/:id/communications', authenticate, (req, res) => {
    const comms = db.prepare('SELECT * FROM communications WHERE lead_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json(comms);
  });

  // Dashboard Stats
  app.get('/api/stats', authenticate, (req: any, res) => {
    let totalLeads, activeDeals, unreadMessages;
    
    if (req.user.role === 'super_admin') {
      totalLeads = { count: 0 };
      activeDeals = { count: 0 };
      unreadMessages = { count: 0 };
    } else {
      totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads WHERE dealership_id = ?').get(req.user.dealershipId) as any;
      activeDeals = db.prepare("SELECT COUNT(*) as count FROM leads WHERE dealership_id = ? AND status != 'closed'").get(req.user.dealershipId) as any;
      unreadMessages = db.prepare("SELECT COUNT(*) as count FROM communications c JOIN leads l ON c.lead_id = l.id WHERE l.dealership_id = ? AND c.direction = 'inbound'").get(req.user.dealershipId) as any;
    }
    
    res.json({
      totalLeads: totalLeads.count,
      activeDeals: activeDeals.count,
      unreadMessages: unreadMessages.count,
      avgResponseTime: '12m'
    });
  });

  // Tasks
  app.get('/api/tasks', authenticate, (req: any, res) => {
    let tasks;
    if (req.user.role === 'super_admin') {
      tasks = db.prepare(`
        SELECT t.*, l.first_name, l.last_name 
        FROM tasks t 
        LEFT JOIN leads l ON t.lead_id = l.id 
        ORDER BY t.due_date ASC
      `).all();
    } else {
      tasks = db.prepare(`
        SELECT t.*, l.first_name, l.last_name 
        FROM tasks t 
        LEFT JOIN leads l ON t.lead_id = l.id 
        WHERE l.dealership_id = ? OR t.user_id = ?
        ORDER BY t.due_date ASC
      `).all(req.user.dealershipId, req.user.id);
    }
    res.json(tasks);
  });

  app.post('/api/tasks', authenticate, (req: any, res) => {
    const { leadId, title, description, dueDate } = req.body;
    const stmt = db.prepare('INSERT INTO tasks (lead_id, user_id, title, description, due_date) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(leadId, req.user.id, title, description, dueDate);
    res.json({ id: result.lastInsertRowid });
  });

  // Centralized Messages
  app.get('/api/messages', authenticate, (req: any, res) => {
    let messages;
    if (req.user.role === 'super_admin') {
      messages = db.prepare(`
        SELECT c.*, l.first_name, l.last_name, u.name as user_name
        FROM communications c
        JOIN leads l ON c.lead_id = l.id
        JOIN users u ON c.user_id = u.id
        ORDER BY c.created_at DESC
        LIMIT 50
      `).all();
    } else {
      messages = db.prepare(`
        SELECT c.*, l.first_name, l.last_name, u.name as user_name
        FROM communications c
        JOIN leads l ON c.lead_id = l.id
        JOIN users u ON c.user_id = u.id
        WHERE l.dealership_id = ?
        ORDER BY c.created_at DESC
        LIMIT 50
      `).all(req.user.dealershipId);
    }
    res.json(messages);
  });

  // Notifications
  app.get('/api/notifications', authenticate, (req: any, res) => {
    const notifications = db.prepare(`
      SELECT m.*, c.content, c.type, l.first_name, l.last_name, u.name as sender_name
      FROM mentions m
      JOIN communications c ON m.communication_id = c.id
      JOIN leads l ON c.lead_id = l.id
      JOIN users u ON c.user_id = u.id
      WHERE m.user_id = ?
      ORDER BY m.created_at DESC
      LIMIT 20
    `).all(req.user.id);
    res.json(notifications);
  });

  app.put('/api/notifications/:id/read', authenticate, (req, res) => {
    db.prepare('UPDATE mentions SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });
  app.post('/api/webhooks/leads', (req, res) => {
    const { firstName, lastName, email, phone, vehicleInterest, source } = req.body;
    // In a real app, we'd find the dealership based on an API key or ID in the payload
    const defaultDealer = db.prepare('SELECT id FROM dealerships LIMIT 1').get() as any;
    
    if (defaultDealer) {
      const stmt = db.prepare('INSERT INTO leads (dealership_id, first_name, last_name, email, phone, source, vehicle_interest) VALUES (?, ?, ?, ?, ?, ?, ?)');
      stmt.run(defaultDealer.id, firstName, lastName, email, phone, source || 'Webhook', vehicleInterest);
      res.status(201).json({ status: 'success' });
    } else {
      res.status(400).json({ error: 'No dealership configured' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist/index.html'));
    });
  }

  const PORT = 3000;
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
