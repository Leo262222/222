import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 障眼法逻辑：自动补全后缀
      const finalEmail = username.includes('@') ? username : `${username}@admin.com`;

      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalEmail,
        password: password,
      });

      if (error) {
        alert('登录失败: ' + error.message);
      } else {
        onLogin();
      }
    } catch (error: any) {
      alert('系统错误: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-purple-900 p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">留子树洞</h2>
          <p className="text-purple-200 text-sm">管理员后台登录系统</p>
        </div>

        <form onSubmit={handleLogin} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">管理员账号</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              // ✅ 修改处：移除了具体的 ID 提示，改为通用提示
              placeholder="请输入管理员账号"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">密码</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
              placeholder="请输入密码"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-900 text-white font-bold py-3 rounded-lg hover:bg-purple-800 transition-colors disabled:opacity-50"
          >
            {loading ? '登录中...' : '安全登录'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
