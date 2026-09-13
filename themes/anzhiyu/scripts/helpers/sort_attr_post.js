// 显式推荐按权重排序，不足时用最新文章补齐，保持列表去重和数量上限。
hexo.extend.helper.register('sort_attr_post', function (type) {
  const field = type === 'swiper_list' ? 'swiper_index' : type === 'top_group_list' ? 'top_group_index' : null;
  if (!field) return [];
  const posts = hexo.locals.get('posts').sort('date', -1).toArray();
  const limit = hexo.theme.config.home_top.swiper.enable ? 4 : 6;
  const featured = posts.filter(post => post[field] !== undefined && post[field] !== null && Number.isFinite(Number(post[field])))
    .sort((a, b) => Number(b[field]) - Number(a[field]));
  const selected = new Set(featured);
  return featured.concat(posts.filter(post => !selected.has(post))).slice(0, limit);
});
