/* ============================================================
 *  前台读取 Supabase 的配置
 *  说明：anon key 是「公开读」密钥，可安全地放在前端代码里；
 *        写权限由 Supabase 行级安全策略(RLS)限制为登录管理员。
 *  部署前请把下面两处替换成你 Supabase 项目里的真实值
 *  （Supabase Dashboard → Project Settings → API）。
 * ============================================================ */
window.SUPABASE_CONFIG = {
  url: "https://envnuwpiqolslhghudef.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVudm51d3BpcW9sc2xoZ2h1ZGVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyMjM1MTAsImV4cCI6MjEwMjc5OTUxMH0.O0ohAAfg4vY1glFU_Q_ez5R-ZwG502Sb4RswlnUOJKI"
};
