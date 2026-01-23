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

  // 核心修改：不再给 AdminDashboard 传任何参数
  // 因为 AdminDashboard 现在已经能够自己获取数据了
  return (
    <div className="antialiased text-gray-900 bg-gray-100 min-h-screen">
      {session ? <AdminDashboard /> : <AdminLogin />}
    </div>
  );
}

export default AdminApp;
