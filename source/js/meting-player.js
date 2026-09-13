// 本地 Meting / APlayer 适配器。公开歌单请求有超时、失败提示及重试，兼容主题的 .aplayer 接口。
(function () {
  'use strict';
  if (customElements.get('meting-js')) return;
  const escapeText = value => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  function mediaURL(value) {
    if (!value) return '';
    try {
      const url = new URL(value, location.href);
      return ['https:', 'http:'].includes(url.protocol) ? url.href : '';
    } catch { return ''; }
  }

  class MetingPlayer extends HTMLElement {
    connectedCallback() {
      if (!this.aplayer && !this.request) this.load();
    }

    disconnectedCallback() {
      this.request?.abort();
      this.request = null;
      this.aplayer?.destroy();
      this.aplayer = null;
    }

    setState(state) {
      this.dataset.state = state;
      this.dispatchEvent(new CustomEvent('meting:statechange', { bubbles: true }));
    }

    status(message, retry = false) {
      const status = document.createElement('div');
      status.className = 'meting-status';
      status.setAttribute('role', 'status');
      const text = document.createElement('span');
      text.textContent = message;
      status.append(text);
      if (retry) {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = '重试';
        button.setAttribute('aria-label', '重新加载歌单');
        button.addEventListener('click', () => this.retry());
        status.append(button);
      }
      this.replaceChildren(status);
    }

    retry() {
      if (!this.request) return this.load();
    }

    async load() {
      const request = new AbortController();
      this.request = request;
      this.status('音乐加载中…');
      this.setState('loading');
      const timeout = setTimeout(() => request.abort(), 12000);
      try {
        if (!window.APlayer) throw new Error('播放器未加载');
        let tracks;
        if (this.getAttribute('url')) {
          tracks = [{ url: this.getAttribute('url'), name: this.getAttribute('name'), artist: this.getAttribute('artist'), pic: this.getAttribute('cover'), lrc: this.getAttribute('lrc') }];
        } else {
          const api = this.getAttribute('api') || window.meting_api || document.querySelector('#nav-music meting-js')?.getAttribute('api');
          if (!api) throw new Error('未配置歌单接口');
          const endpoint = api.replace(/:(server|type|id|auth)/g, (_, key) => encodeURIComponent(this.getAttribute(key) || ''));
          const response = await fetch(endpoint, { signal: request.signal, credentials: 'omit' });
          if (!response.ok) throw new Error(`歌单请求失败：${response.status}`);
          tracks = await response.json();
        }
        if (!Array.isArray(tracks)) throw new Error('歌单格式错误');
        const audio = tracks.map(track => ({
          name: escapeText(track.name || track.title || '未命名音乐'),
          artist: escapeText(track.artist || track.author),
          url: mediaURL(track.url),
          cover: mediaURL(track.pic || track.cover),
          lrc: mediaURL(track.lrc)
        })).filter(track => track.url);
        if (!audio.length) throw new Error('歌单为空');
        if (!this.isConnected || this.request !== request) return;
        const container = document.createElement('div');
        this.replaceChildren(container);
        this.aplayer = new APlayer({
          container, audio,
          mutex: this.getAttribute('mutex') !== 'false',
          autoplay: this.getAttribute('autoplay') === 'true',
          preload: this.getAttribute('preload') || 'none',
          order: this.getAttribute('order') || 'list',
          loop: this.getAttribute('loop') || 'all',
          volume: this.hasAttribute('volume') ? Number(this.getAttribute('volume')) : 0.7,
          theme: this.getAttribute('theme') || '#49b1f5',
          lrcType: Number(this.getAttribute('lrc-type') || 0),
          listMaxHeight: this.getAttribute('list-max-height') || '250px',
          storageName: 'metingjs'
        });
        this.setState('ready');
        this.dispatchEvent(new CustomEvent('aplayer:ready', { bubbles: true }));
      } catch (error) {
        if (!this.isConnected || this.request !== request) return;
        this.aplayer?.destroy();
        this.aplayer = null;
        this.status('音乐暂时无法加载', true);
        this.setState('error');
      } finally {
        clearTimeout(timeout);
        if (this.request === request) this.request = null;
      }
    }
  }
  customElements.define('meting-js', MetingPlayer);
})();
