import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// انتظر حتى يتم تحميل الصفحة بالكامل
window.addEventListener('load', () => {
  const splash = document.getElementById('splash');
  
  if (splash) {
    // الانتظار لمدة 5 ثواني (5000 ميلي ثانية)
    setTimeout(() => {
      // إضافة تأثير تلاشي بسيط لجعل الاختفاء ناعماً
      splash.style.opacity = '0';
      splash.style.transition = 'opacity 0.8s ease';
      
      // حذف العنصر تماماً بعد انتهاء تأثير التلاشي
      setTimeout(() => {
        splash.remove();
      }, 800); 
    }, 3000); 
  }
});