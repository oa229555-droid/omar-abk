import SQLite from 'react-native-sqlite-storage';

// فتح قاعدة البيانات
const db = SQLite.openDatabase(
  {
    name: 'meshbook.db',
    location: 'default',
  },
  () => console.log('✅ قاعدة البيانات مفتوحة'),
  (error) => console.error('❌ فشل فتح قاعدة البيانات:', error)
);

// إنشاء الجداول
export const initDatabase = () => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      // جدول المستخدمين
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          phone TEXT UNIQUE,
          fullName TEXT,
          username TEXT,
          balance REAL DEFAULT 100,
          createdAt INTEGER
        )`,
        [],
        () => console.log('✅ جدول المستخدمين جاهز')
      );

      // جدول المنشورات
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          authorId TEXT,
          author TEXT,
          content TEXT,
          timestamp INTEGER,
          likes INTEGER DEFAULT 0,
          comments INTEGER DEFAULT 0,
          shares INTEGER DEFAULT 0,
          liked INTEGER DEFAULT 0,
          FOREIGN KEY (authorId) REFERENCES users (id)
        )`,
        [],
        () => console.log('✅ جدول المنشورات جاهز')
      );

      // جدول التفاعلات
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS interactions (
          id TEXT PRIMARY KEY,
          userId TEXT,
          postId TEXT,
          type TEXT,
          timestamp INTEGER
        )`,
        [],
        () => console.log('✅ جدول التفاعلات جاهز')
      );

      // جدول المعاملات المالية
      tx.executeSql(
        `CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          userId TEXT,
          amount REAL,
          type TEXT,
          method TEXT,
          status TEXT,
          date TEXT,
          timestamp INTEGER
        )`,
        [],
        () => {
          console.log('✅ جدول المعاملات جاهز');
          resolve();
        }
      );
    }, reject);
  });
};

// حفظ منشور
export const savePost = (post) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT OR REPLACE INTO posts 
         (id, authorId, author, content, timestamp, likes, comments, shares, liked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          post.id,
          post.authorId || 'local',
          post.author,
          post.content,
          post.timestamp,
          post.likes || 0,
          post.comments || 0,
          post.shares || 0,
          post.liked ? 1 : 0,
        ],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// جلب المنشورات
export const getPosts = (limit = 20) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM posts ORDER BY timestamp DESC LIMIT ?`,
        [limit],
        (_, { rows }) => resolve(rows.raw()),
        (_, error) => reject(error)
      );
    });
  });
};

// تحديث رصيد المستخدم
export const updateBalance = (userId, amount) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `UPDATE users SET balance = balance + ? WHERE id = ?`,
        [amount, userId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// تسجيل معاملة مالية
export const addTransaction = (transaction) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO transactions (id, userId, amount, type, method, status, date, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.userId,
          transaction.amount,
          transaction.type,
          transaction.method || 'internal',
          transaction.status || 'completed',
          transaction.date || new Date().toLocaleString(),
          transaction.timestamp || Date.now(),
        ],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// حذف منشور
export const deletePost = (postId) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `DELETE FROM posts WHERE id = ?`,
        [postId],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// تحديث منشور
export const updatePost = (postId, updates) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      let query = 'UPDATE posts SET ';
      const params = [];
      
      Object.keys(updates).forEach((key, index) => {
        if (index > 0) query += ', ';
        query += `${key} = ?`;
        params.push(updates[key]);
      });
      
      query += ' WHERE id = ?';
      params.push(postId);
      
      tx.executeSql(query, params, (_, result) => resolve(result), reject);
    });
  });
};
