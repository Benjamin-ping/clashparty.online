const escape = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function validateComments(config={}) {
  if(!config.enabled) return;
  if(!/^[\w-]+\/[\w.-]+$/.test(config.repo||'') || !/^[\w=-]+$/.test(config.repoId||'') || !/^[\w=-]+$/.test(config.categoryId||'') || !config.category?.trim()) throw Error('Comments enabled but GitHub Discussions configuration is incomplete');
}
export function commentsSection(config={}) {
  validateComments(config);
  const introduction='<h2 id="comments-title">交流与解决方法</h2><p>你是怎么解决的？欢迎分享操作系统、Clash Party 版本、遇到的问题和有效的处理步骤，帮助后来遇到同样问题的人。</p><p class="muted">评论公开可见，请勿提交订阅链接、令牌、密码或个人 IP。不同系统与版本的处理方式可能不同。</p>';
  if(!config.enabled) return `<section class="article-comments" id="comments" aria-labelledby="comments-title">${introduction}<p class="callout">评论暂未开放，开放后可使用 GitHub 账号登录参与讨论。</p></section>`;
  return `<section class="article-comments" id="comments" aria-labelledby="comments-title">${introduction}<p class="muted">使用 GitHub 账号登录后即可留言和回复。评论加载较慢时，也可<a href="https://github.com/${escape(config.repo)}/discussions" target="_blank" rel="noopener noreferrer">前往 GitHub 讨论区 ↗</a>。</p><div class="giscus"></div><script src="https://giscus.app/client.js" data-repo="${escape(config.repo)}" data-repo-id="${escape(config.repoId)}" data-category="${escape(config.category)}" data-category-id="${escape(config.categoryId)}" data-mapping="pathname" data-strict="1" data-reactions-enabled="1" data-emit-metadata="0" data-input-position="top" data-theme="light" data-lang="zh-CN" data-loading="lazy" crossorigin="anonymous" async></script><noscript>请启用 JavaScript，或前往 GitHub 讨论区参与交流。</noscript></section>`;
}
