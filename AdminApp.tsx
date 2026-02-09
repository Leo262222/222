import React, { useState, useEffect } from 'react';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { supabase } from './supabaseClient';

function AdminApp() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. 初始化时检查有没有登录
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. 监听登录状态变化 (登录/登出)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">
        Loading...
      </div>
    );
  }

  return (
    <div className="antialiased text-gray-900 bg-gray-100 min-h-screen">
      {session ? (
        <AdminDashboard />
      ) : (
        // ✅ 核心修复：添加 onLogin={() => {}} 
        // 这是一个空函数，纯粹为了满足 AdminLogin 的“胃口”，解决报错
        <AdminLogin onLogin={() => {}} />
      )}
    </div>
  );
}

export default AdminApp;
