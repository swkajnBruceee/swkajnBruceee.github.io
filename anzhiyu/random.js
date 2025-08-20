var posts=["2025/06/26/Hexo博客搭建踩坑记/","2025/06/26/Question-of-N-Queen/","2025/07/24/如何高效写博客/","2025/07/15/博客UI优化之旅/","2025/08/03/博客评论系统搭建指南/","2025/08/19/攻克Linux难题-全面解决Cursor-AppImage沙箱权限与桌面快捷方式创建/","2025/08/20/曲折之路：在无法科学上网的Ubuntu上安装Clash-Verge的实战记录/"];function toRandomPost(){
    pjax.loadUrl('/'+posts[Math.floor(Math.random() * posts.length)]);
  };