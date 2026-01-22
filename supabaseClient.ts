import { createClient } from '@supabase/supabase-js';

// 读取环境变量
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('警告: 缺少 Supabase 环境变量，请检查 Vercel 设置');
}

// 创建并导出连接实例
export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
