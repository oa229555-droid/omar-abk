const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// معلومات المطور
const DEVELOPER = {
  name: "Omar Abdo",
  phone: "01289411976",
  vodafoneCash: "01069195481"
};

// تخزين مؤقت للمستخدمين النشطين
const activeUsers = new Map();

// API للتحقق من صحة الدفع
app.post('/api/verify-payment', (req, res) => {
  const { userId, amount, transactionId } = req.body;
  
  // هنا هيتكامل مع Paymob API
  res.json({ 
    success: true, 
    message: 'تم التحقق من الدفع',
    developer: DEVELOPER
  });
});

// API لطلبات السحب
app.post('/api/withdraw', (req, res) => {
  const { userId, phoneNumber, amount } = req.body;
  
  // هنا هيتكامل مع Vodafone Cash API
  res.json({ 
    success: true, 
    message: `تم تقديم طلب سحب ${amount} جنيه لمحفظة ${phoneNumber}`,
    developer: DEVELOPER
  });
});

// API للحصول على معلومات المطور
app.get('/api/developer', (req, res) => {
  res.json(DEVELOPER);
});

// WebSocket للاتصال المباشر (اختياري)
io.on('connection', (socket) => {
  console.log('مستخدم جديد متصل:', socket.id);
  
  socket.on('register-user', (userId) => {
    activeUsers.set(userId, socket.id);
    console.log(`المستخدم ${userId} مسجل`);
  });
  
  socket.on('disconnect', () => {
    console.log('مستخدم قطع الاتصال:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 سيرفر MESHBOOK شغال على http://localhost:${PORT}`);
  console.log(`👤 المطور: ${DEVELOPER.name}`);
  console.log(`📞 الهاتف: ${DEVELOPER.phone}`);
  console.log(`💰 فودافون كاش: ${DEVELOPER.vodafoneCash}`);
});
