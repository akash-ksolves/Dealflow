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

      // Broadcast to specific lead room
      io.to(`lead-${data.leadId}`).emit('new-message', data);
      
      // Save to DB
      try {
        const stmt = db.prepare('INSERT INTO communications (lead_id, user_id, type, direction, content) VALUES (?, ?, ?, ?, ?)');
        stmt.run(data.leadId, data.userId || null, data.type || 'internal', 'outbound', data.content);
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

    const token = jwt.sign({ id: user.id, role: user.role, dealershipId: user.dealership_id }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, dealershipId: user.dealership_id, locationId: user.location_id } });
  });

  // Dealerships (Super Admin)
  app.get('/api/dealerships', authenticate, authorize(['super_admin']), (req, res) => {
    const dealerships = db.prepare('SELECT * FROM dealerships').all();
    res.json(dealerships);
  });

  app.post('/api/dealerships', authenticate, authorize(['super_admin']), (req, res) => {
    const { name, principalName, principalEmail, principalPassword } = req.body;
    
    const result = db.transaction(() => {
      const dealer = db.prepare('INSERT INTO dealerships (name) VALUES (?)').run(name);
      const dealerId = dealer.lastInsertRowid;

      const principalRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('principal') as any;
      const hash = bcrypt.hashSync(principalPassword, 10);
      
      db.prepare('INSERT INTO users (dealership_id, role_id, name, email, password) VALUES (?, ?, ?, ?, ?)')
        .run(dealerId, principalRole.id, principalName, principalEmail, hash);
      
      return dealerId;
    })();

    res.json({ id: result });
  });

  // Locations (Super Admin)
  app.get('/api/locations', authenticate, (req: any, res) => {
    let locations;
    if (req.user.role === 'super_admin') {
      locations = db.prepare('SELECT l.*, d.name as dealership_name FROM locations l JOIN dealerships d ON l.dealership_id = d.id').all();
    } else {
      locations = db.prepare('SELECT * FROM locations WHERE dealership_id = ?').all(req.user.dealershipId);
    }
    res.json(locations);
  });

  app.post('/api/locations', authenticate, authorize(['super_admin']), (req, res) => {
    const { dealershipId, name, address } = req.body;
    const result = db.prepare('INSERT INTO locations (dealership_id, name, address) VALUES (?, ?, ?)')
      .run(dealershipId, name, address);
    res.json({ id: result.lastInsertRowid });
  });

  // Users
  app.get('/api/users', authenticate, (req: any, res) => {
    if (req.user.role === 'super_admin') {
      const users = db.prepare('SELECT u.*, r.name as role, d.name as dealership_name FROM users u JOIN roles r ON u.role_id = r.id LEFT JOIN dealerships d ON u.dealership_id = d.id').all();
      return res.json(users);
    }
    const users = db.prepare('SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE dealership_id = ?').all(req.user.dealershipId);
    res.json(users);
  });

  app.post('/api/users', authenticate, authorize(['principal', 'admin']), (req: any, res) => {
    const { name, email, password, roleName, locationId } = req.body;
    
    // Check if role is allowed to be created by this user
    if (req.user.role === 'admin' && roleName === 'principal') {
      return res.status(403).json({ error: 'Admins cannot create Principals' });
    }

    const role = db.prepare('SELECT id FROM roles WHERE name = ?').get(roleName) as any;
    const hash = bcrypt.hashSync(password, 10);
    
    const result = db.prepare('INSERT INTO users (dealership_id, location_id, role_id, name, email, password) VALUES (?, ?, ?, ?, ?, ?)')
      .run(req.user.dealershipId, locationId, role.id, name, email, hash);
    
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/roles', authenticate, (req, res) => {
    const roles = db.prepare('SELECT * FROM roles').all();
    res.json(roles);
  });

  app.get('/api/leads/:id', authenticate, (req: any, res) => {
    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(req.params.id) as any;
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    
    // RBAC check
    if (req.user.role !== 'super_admin' && lead.dealership_id !== req.user.dealershipId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    res.json(lead);
  });

  app.get('/api/leads', authenticate, (req: any, res) => {
    let leads;
    if (req.user.role === 'super_admin') {
      leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    } else {
      leads = db.prepare('SELECT * FROM leads WHERE dealership_id = ? ORDER BY created_at DESC').all(req.user.dealershipId);
    }
    res.json(leads);
  });

  app.post('/api/leads', authenticate, (req: any, res) => {
    const { firstName, lastName, email, phone, source, vehicleInterest, locationId } = req.body;
    const stmt = db.prepare('INSERT INTO leads (dealership_id, location_id, first_name, last_name, email, phone, source, vehicle_interest) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const result = stmt.run(req.user.dealershipId, locationId, firstName, lastName, email, phone, source, vehicleInterest);
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/leads/:id/communications', authenticate, (req, res) => {
    const comms = db.prepare('SELECT * FROM communications WHERE lead_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json(comms);
  });

  // Dashboard Stats
  app.get('/api/stats', authenticate, (req: any, res) => {
    let totalLeads, activeDeals, unreadMessages;
    
    if (req.user.role === 'super_admin') {
      totalLeads = db.prepare('SELECT COUNT(*) as count FROM leads').get() as any;
      activeDeals = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status != 'closed'").get() as any;
      unreadMessages = db.prepare("SELECT COUNT(*) as count FROM communications WHERE direction = 'inbound'").get() as any;
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

  // Webhook for Lead Intake (ADF/XML or JSON)
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
