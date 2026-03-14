import React from 'react';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-dark-200 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-primary mb-4">MESHBOOK</h1>
        <p className="text-gray-400 mb-8">نسخة الويب - لاستخدام التطبيق، حمل تطبيق الموبايل</p>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-dark-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">مميزات المنصة</h2>
            <ul className="space-y-2 text-gray-300">
              <li>✓ شبكة اجتماعية لا مركزية</li>
              <li>✓ تعمل بدون إنترنت</li>
              <li>✓ دفع عبر فودافون كاش</li>
              <li>✓ مكافآت يومية للمستخدمين النشطين</li>
            </ul>
          </div>
          
          <div className="bg-dark-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">معلومات المطور</h2>
            <p className="text-gray-300">المطور: Omar Abdo</p>
            <p className="text-primary font-bold mt-2">01289411976</p>
            <p className="text-secondary font-bold mt-4">رقم فودافون كاش: 01069195481</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
