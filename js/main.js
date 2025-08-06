// 第一次播放音乐
var anzhiyu_musicFirst = false;
// 快捷键
var anzhiyu_keyboard = null;
// 音乐播放状态
var anzhiyu_musicPlaying = false;
var $bodyWrap = document.getElementById("body-wrap");
var anzhiyu_intype = false;
var anzhiyu_keyUpEvent_timeoutId = null;
var anzhiyu_keyUpShiftDelayEvent_timeoutId = null;

// 右键菜单对象
var rm = null;

var popupWindowTimer = null;

var adjectives = [
  "可爱",
  "美丽",
  "温柔",
  "善良",
  "聪明",
  "勇敢",
  "幽默",
  "开朗",
  "真诚",
  "活泼",
  "优雅",
  "文静",
  "可靠",
  "热情",
  "积极",
  "阳光",
  "友善",
  "诚实",
  "乐观",
  "快乐",
  "善解人意",
  "贴心",
  "温暖",
  "体贴",
  "亲切",
  "大方",
  "干净",
  "自然",
  "朴素",
  "率真",
  "纯真",
  "可人",
  "可爱",
  "温柔",
  "甜美",
  "可人",
  "漂亮",
  "迷人",
  "随和",
  "善解人意",
  "有礼貌",
  "谦虚",
  "谦和",
  "谦让",
  "文雅",
  "文静",
  "文艺",
  "温文尔雅",
  "温文",
  "儒雅",
  "斯文",
  "优秀",
  "俊秀",
  "英俊潇洒",
  "风度翩翩",
  "气质不凡",
  "风流倜傥",
  "玉树临风",
  "才华横溢",
  "才高八斗",
  "博学多才",
  "学富五车",
  "博古通今",
  "见多识广",
  "学识渊博",
  "知识丰富",
  "聪明睿智",
  "聪明伶俐",
  "聪明过人",
  "聪明绝顶",
  "聪明机智",
  "聪明能干",
  "反应敏捷",
  "思维敏捷",
  "思维活跃",
  "思维灵活",
  "思维清晰",
  "思维缜密",
  "思维开阔",
  "思维活跃",
  "思维敏锐",
  "思维清晰",
  "思维缜密",
  "思维开阔",
  "思维深刻",
  "思维独到",
  "思维严谨",
  "思维广阔",
  "思维活跃",
  "思维敏锐",
  "思维清晰",
  "思维缜密",
  "思维开阔",
  "思维深刻",
  "思维独到",
  "思维严谨",
  "思维广阔",
  "思维活跃",
  "思维敏锐",
  "思维清晰",
  "思维缜密",
];
var vegetablesAndFruits = [
  "苹果",
  "香蕉",
  "橙子",
  "柠檬",
  "西瓜",
  "哈密瓜",
  "草莓",
  "蓝莓",
  "葡萄",
  "樱桃",
  "桃子",
  "菠萝",
  "芒果",
  "梨子",
  "蓝莓",
  "柚子",
  "柿子",
  "山竹",
  "榴莲",
  "西红柿",
  "黄瓜",
  "茄子",
  "胡萝卜",
  "土豆",
  "白菜",
  "青菜",
  "菠菜",
  "花菜",
  "豆芽",
  "豆角",
  "豌豆",
  "玉米",
  "南瓜",
  "洋葱",
  "生姜",
  "大蒜",
  "芹菜",
  "韭菜",
  "莴笋",
  "茴香",
];

// 随机选择歌曲的数组
var selectRandomSong = [];
// 音乐播放器的音量大小
var musicVolume = 0.8;
// 当前音乐列表是否已更改标志
var changeMusicListFlag = false;
// 默认播放音乐列表
var defaultPlayMusicList = [];
var themeColorMeta, pageHeaderEl, navMusicEl;
let consoleEl;

document.addEventListener("DOMContentLoaded", function () {
  consoleEl = document.getElementById("console");
  let headerContentWidth, $nav, $rightMenu;
  let mobileSidebarOpen = false;

  const adjustMenu = init => {
    const getAllWidth = ele => {
      return Array.from(ele).reduce((width, i) => width + i.offsetWidth, 0);
    };

    if (init) {
      const blogInfoWidth = getAllWidth(document.querySelector("#blog_name > a").children);
      const menusWidth = getAllWidth(document.getElementById("menus").children);
      headerContentWidth = blogInfoWidth + menusWidth;
      $nav = document.getElementById("nav");
    }

    const hideMenuIndex = window.innerWidth <= 768 || headerContentWidth > $nav.offsetWidth - 120;
    $nav.classList.toggle("hide-menu", hideMenuIndex);
  };

  // 初始化header
  const initAdjust = () => {
    adjustMenu(true);
    $nav.classList.add("show");
  };

  // sidebar menus
  const sidebarFn = {
    open: () => {
      anzhiyu.sidebarPaddingR();
      anzhiyu.animateIn(document.getElementById("menu-mask"), "to_show 0.5s");
      document.getElementById("sidebar-menus").classList.add("open");
      mobileSidebarOpen = true;
    },
    close: () => {
      const $body = document.body;
      $body.style.paddingRight = "";
      anzhiyu.animateOut(document.getElementById("menu-mask"), "to_hide 0.5s");
      document.getElementById("sidebar-menus").classList.remove("open");
      mobileSidebarOpen = false;
    },
  };

  /**
   * 检测top_img是否有图片
   */
  const scrollDownInIndex = () => {
    const handleScrollToDest = () => {
      const bbTimeList = document.getElementById("bbTimeList");
      if (bbTimeList) {
        anzhiyu.scrollToDest(bbTimeList.offsetTop - 62, 300);
      } else {
        anzhiyu.scrollToDest(document.getElementById("home_top").offsetTop - 60, 300);
      }
    };

    const $scrollDownEle = document.getElementById("scroll-down");
    $scrollDownEle && anzhiyu.addEventListenerPjax($scrollDownEle, "click", handleScrollToDest);
  };

// 将 addHighlightTool 函数移到全局作用域
window.addHighlightTool = function () {
    const highLight = GLOBAL_CONFIG.highlight;
    if (!highLight) {
      console.log('No highlight config found');
      return;
    }

    const { highlightCopy, highlightLang, highlightHeightLimit, plugin } = highLight;
    const isHighlightShrink = GLOBAL_CONFIG_SITE.isHighlightShrink;
    const isShowTool = highlightCopy || highlightLang || isHighlightShrink !== undefined;
    const $figureHighlight =
      plugin === "highlight.js"
        ? document.querySelectorAll("figure.highlight")
        : document.querySelectorAll('pre[class*="language-"]');

    console.log('Highlight config:', { highlightCopy, highlightLang, isHighlightShrink, plugin });
    console.log('isShowTool:', isShowTool);
    console.log('Found code blocks:', $figureHighlight.length);

    if (!((isShowTool || highlightHeightLimit) && $figureHighlight.length)) {
      console.log('Exiting addHighlightTool: conditions not met');
      return;
    }

    const isPrismjs = plugin === "prismjs";
    const highlightShrinkClass = isHighlightShrink === true ? "closed" : "";
    const highlightShrinkEle =
      isHighlightShrink !== undefined
        ? `<i class="anzhiyufont anzhiyu-icon-angle-down expand ${highlightShrinkClass}"></i>`
        : "";
    const highlightCopyEle = highlightCopy
      ? '<div class="copy-notice"></div><i class="anzhiyufont anzhiyu-icon-paste copy-button"></i>'
      : "";

    const alertInfo = (ele, text) => {
      if (GLOBAL_CONFIG.Snackbar !== undefined) {
        anzhiyu.snackbarShow(text);
      } else {
        const prevEle = ele.previousElementSibling;
        prevEle.textContent = text;
        prevEle.style.opacity = 1;
        setTimeout(() => {
          prevEle.style.opacity = 0;
        }, 800);
      }
    };

    const copy = ctx => {
      if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        document.execCommand("copy");
        alertInfo(ctx, GLOBAL_CONFIG.copy.success);
      } else {
        alertInfo(ctx, GLOBAL_CONFIG.copy.noSupport);
      }
    };

    // click events
    const highlightCopyFn = ele => {
      const $buttonParent = ele.parentNode;
      $buttonParent.classList.add("copy-true");
      const selection = window.getSelection();
      const range = document.createRange();
      const preCodeSelector = isPrismjs ? "pre code" : "table .code pre";
      range.selectNodeContents($buttonParent.querySelectorAll(`${preCodeSelector}`)[0]);
      selection.removeAllRanges();
      selection.addRange(range);
      copy(ele.lastChild);
      selection.removeAllRanges();
      $buttonParent.classList.remove("copy-true");
    };

    const highlightShrinkFn = ele => {
      ele.classList.toggle("closed");
    };

    const highlightToolsFn = function (e) {
      const $target = e.target.classList;
      if ($target.contains("expand")) highlightShrinkFn(this);
      else if ($target.contains("copy-button")) highlightCopyFn(this);
    };

    const expandCode = function () {
      this.classList.toggle("expand-done");
    };

    const createEle = (lang, item, service) => {
      const fragment = document.createDocumentFragment();

      if (isShowTool) {
        const hlTools = document.createElement("div");
        hlTools.className = `highlight-tools ${highlightShrinkClass}`;
        hlTools.innerHTML = highlightShrinkEle + lang + highlightCopyEle;
        anzhiyu.addEventListenerPjax(hlTools, "click", highlightToolsFn);
        fragment.appendChild(hlTools);
      }

      if (highlightHeightLimit && item.offsetHeight > highlightHeightLimit + 30) {
        const ele = document.createElement("div");
        ele.className = "code-expand-btn";
        ele.innerHTML = '<i class="anzhiyufont anzhiyu-icon-angle-double-down"></i>';
        anzhiyu.addEventListenerPjax(ele, "click", expandCode);
        fragment.appendChild(ele);
      }

      if (service === "hl") {
        item.insertBefore(fragment, item.firstChild);
      } else {
        item.parentNode.insertBefore(fragment, item);
      }
    };

    if (isPrismjs) {
      $figureHighlight.forEach(item => {
        if (highlightLang) {
          const langName = item.getAttribute("data-language") || "Code";
          const highlightLangEle = `<div class="code-lang">${langName}</div>`;
          anzhiyu.wrap(item, "figure", { class: "highlight" });
          createEle(highlightLangEle, item);
        } else {
          anzhiyu.wrap(item, "figure", { class: "highlight" });
          createEle("", item);
        }
      });
    } else {
      $figureHighlight.forEach(item => {
        if (highlightLang) {
          let langName = item.getAttribute("class").split(" ")[1];
          if (langName === "plain" || langName === undefined) langName = "Code";
          const highlightLangEle = `<div class="code-lang">${langName}</div>`;
          createEle(highlightLangEle, item, "hl");
        } else {
          createEle("", item, "hl");
        }
      });
    }
  };
  
  // 初始化代码块工具
  window.addHighlightTool();

  /**
   * PhotoFigcaption
   */
  function addPhotoFigcaption() {
    document.querySelectorAll("#article-container img").forEach(function (item) {
      const parentEle = item.parentNode;
      const altValue = item.title || item.alt;
      if (altValue && !parentEle.parentNode.classList.contains("justified-gallery")) {
        const ele = document.createElement("div");
        ele.className = "img-alt is-center";
        ele.textContent = altValue;
        parentEle.insertBefore(ele, item.nextSibling);
      }
    });
  }

  /**
   * Lightbox
   */
  const runLightbox = () => {
    anzhiyu.loadLightbox(document.querySelectorAll("#article-container img:not(.no-lightbox)"));
  };

  /**
   * justified-gallery 图库排版
   */
  const runJustifiedGallery = function (ele) {
    const htmlStr = arr => {
      let str = "";
      const replaceDq = str => str.replace(/"/g, "&quot;"); // replace double quotes to &quot;
      arr.forEach(i => {
        const alt = i.alt ? `alt="${replaceDq(i.alt)}"` : "";
        const title = i.title ? `title="${replaceDq(i.title)}"` : "";
        const address = i.address ? i.address : "";
        const galleryItem = `
         <div class="fj-gallery-item">
           ${address ? `<div class="tag-address">${address}</div>` : ""}
           <img src="${i.url}" ${alt + title}>
         </div>
       `;
        str += galleryItem;
      });

      return str;
    };

    const lazyloadFn = (i, arr, limit) => {
      const loadItem = Number(limit);
      const arrLength = arr.length;
      if (arrLength > loadItem) i.insertAdjacentHTML("beforeend", htmlStr(arr.splice(0, loadItem)));
      else {
        i.insertAdjacentHTML("beforeend", htmlStr(arr));
        i.classList.remove("lazyload");
      }
      window.lazyLoadInstance && window.lazyLoadInstance.update();
      return arrLength > loadItem ? loadItem : arrLength;
    };

    const fetchUrl = async url => {
      const response = await fetch(url);
      return await response.json();
    };

    const runJustifiedGallery = (item, arr) => {
      const limit = item.getAttribute("data-limit") ?? arr.length;
      if (!item.classList.contains("lazyload") || arr.length < limit) {
        // 不需要懒加载
        item.innerHTML = htmlStr(arr);
        item.nextElementSibling.style.display = "none";
      } else {
        if (!item.classList.contains("btn_album_detail_lazyload") || item.classList.contains("page_img_lazyload")) {
          // 滚动懒加载
          lazyloadFn(item, arr, limit);
          const clickBtnFn = () => {
            const lastItemLength = lazyloadFn(item, arr, limit);
            fjGallery(
              item,
              "appendImages",
              item.querySelectorAll(`.fj-gallery-item:nth-last-child(-n+${lastItemLength})`)
            );
            anzhiyu.loadLightbox(item.querySelectorAll("img"));
            if (lastItemLength < Number(limit)) {
              observer.unobserve(item.nextElementSibling);
            }
          };

          // 创建IntersectionObserver实例
          const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
              // 当按钮进入视口时触发加载
              if (entry.isIntersecting) {
                // 执行clickBtnFn函数
                setTimeout(clickBtnFn(), 100);
              }
            });
          });
          observer.observe(item.nextElementSibling);
        } else {
          // 相册详情 点击懒加载
          lazyloadFn(item, arr, limit);
          const clickBtnFn = () => {
            const lastItemLength = lazyloadFn(item, arr, limit);
            fjGallery(
              item,
              "appendImages",
              item.querySelectorAll(`.fj-gallery-item:nth-last-child(-n+${lastItemLength})`)
            );
            anzhiyu.loadLightbox(item.querySelectorAll("img"));
            lastItemLength < limit && item.nextElementSibling.removeEventListener("click", clickBtnFn);
          };
          item.nextElementSibling.addEventListener("click", clickBtnFn);
        }
      }

      anzhiyu.initJustifiedGallery(item);
      anzhiyu.loadLightbox(item.querySelectorAll("img"));
      window.lazyLoadInstance && window.lazyLoadInstance.update();
    };

    const addJustifiedGallery = () => {
      ele.forEach(item => {
        item.classList.contains("url")
          ? fetchUrl(item.textContent).then(res => {
              runJustifiedGallery(item, res);
            })
          : runJustifiedGallery(item, JSON.parse(item.textContent));
      });
    };

    if (window.fjGallery) {
      addJustifiedGallery();
      return;
    }

    getCSS(`${GLOBAL_CONFIG.source.justifiedGallery.css}`);
    getScript(`${GLOBAL_CONFIG.source.justifiedGallery.js}`).then(addJustifiedGallery);
  };

  /**
   * 滚动处理
   */
  const scrollFn = function () {
    const $rightside = document.getElementById("rightside");
    const innerHeight = window.innerHeight + 56;
    let lastScrollTop = 0;

    if (document.body.scrollHeight <= innerHeight) {
      $rightside.style.cssText = "opacity: 1; transform: translateX(-58px)";
    }

    // find the scroll direction
    function scrollDirection(currentTop) {
      const result = currentTop > initTop; // true is down & false is up
      initTop = currentTop;
      return result;
    }

    let initTop = 0;
    let isChatShow = true;
    const $header = document.getElementById("page-header");
    const $popupWindow = document.getElementById("popup-window");
    const isChatBtnHide = typeof chatBtnHide === "function";
    const isChatBtnShow = typeof chatBtnShow === "function";

    // 第一次滚动到底部标志
    let scrollBottomFirstFlag = false;
    // 缓存常用dom
    const musicDom = document.getElementById("nav-music"),
      footerDom = document.getElementById("footer"),
      waterfallDom = document.getElementById("waterfall"),
      $percentBtn = document.getElementById("percent"),
      $navTotop = document.getElementById("nav-totop"),
      $bodyWrap = document.getElementById("body-wrap");
    // 页面底部Dom缓存
    let pageBottomDomFlag = document.getElementById("post-comment") || document.getElementById("footer");

    function percentageScrollFn(currentTop) {
      // 处理滚动百分比
      let docHeight = $bodyWrap.clientHeight;
      const winHeight = document.documentElement.clientHeight;
      const contentMath =
        docHeight > winHeight ? docHeight - winHeight : document.documentElement.scrollHeight - winHeight;
      const scrollPercent = currentTop / contentMath;
      const scrollPercentRounded = Math.round(scrollPercent * 100);
      const percentage = scrollPercentRounded > 100 ? 100 : scrollPercentRounded <= 0 ? 1 : scrollPercentRounded;
      $percentBtn.textContent = percentage;

      function isInViewPortOfOneNoDis(el) {
        if (!el) return;
        const elDisplay = window.getComputedStyle(el).getPropertyValue("display");
        if (elDisplay == "none") {
          return;
        }
        const viewPortHeight =
          window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
        const offsetTop = el.offsetTop;
        const scrollTop = document.documentElement.scrollTop;
        const top = offsetTop - scrollTop;
        return top <= viewPortHeight;
      }

      if (isInViewPortOfOneNoDis(pageBottomDomFlag || percentage > 90) && currentTop > 20) {
        $navTotop.classList.add("long");
        $percentBtn.textContent = "返回顶部";
      } else {
        $navTotop.classList.remove("long");
        $percentBtn.textContent = percentage;
      }

      // 如果当前页面需要瀑布流，就处理瀑布流
      if (waterfallDom) {
        const waterfallResult = currentTop % document.documentElement.clientHeight; // 卷动一个视口
        if (!scrollBottomFirstFlag && waterfallResult + 100 >= document.documentElement.clientHeight) {
          console.info(waterfallResult, document.documentElement.clientHeight);
          setTimeout(() => {
            waterfall("#waterfall");
          }, 500);
        } else {
          setTimeout(() => {
            waterfallDom && waterfall("#waterfall");
          }, 500);
        }
      }
    }

    const scrollTask = anzhiyu.throttle(() => {
      const currentTop = window.scrollY || document.documentElement.scrollTop;
      const isDown = scrollDirection(currentTop);

      const delta = Math.abs(lastScrollTop - currentTop);
      if (currentTop > 60 && delta < 20 && delta != 0) {
        // ignore small scrolls
        return;
      }
      if (
        $popupWindow &&
        $popupWindow.classList.contains("show-popup-window") &&
        currentTop > 60 &&
        delta > 20 &&
        lastScrollTop != 0
      ) {
        // 滚动页面时隐藏弹窗
        anzhiyu.throttle(() => {
          if (popupWindowTimer) clearTimeout(popupWindowTimer);
          popupWindowTimer = setTimeout(() => {
            if (!$popupWindow.classList.contains("popup-hide")) {
              $popupWindow.classList.add("popup-hide");
            }
            setTimeout(() => {
              $popupWindow.classList.remove("popup-hide");
              $popupWindow.classList.remove("show-popup-window");
            }, 1000);
          }, 1000);
        }, 1000)();
      }
      lastScrollTop = currentTop;

      if (currentTop > 26) {
        if (isDown) {
          if ($header.classList.contains("nav-visible")) $header.classList.remove("nav-visible");
          if (isChatBtnShow && isChatShow === true) {
            chatBtnHide();
            isChatShow = false;
          }
        } else {
          if (!$header.classList.contains("nav-visible")) $header.classList.add("nav-visible");
          if (isChatBtnHide && isChatShow === false) {
            chatBtnShow();
            isChatShow = true;
          }
        }
        requestAnimationFrame(() => {
          anzhiyu.initThemeColor();
          $header.classList.add("nav-fixed");
        });
        if (window.getComputedStyle($rightside).getPropertyValue("opacity") === "0") {
          $rightside.style.cssText = "opacity: 0.8; transform: translateX(-58px)";
        }
      } else {
        if (currentTop <= 5) {
          requestAnimationFrame(() => {
            $header.classList.remove("nav-fixed");
            $header.classList.remove("nav-visible");
            // 修改顶栏颜色
            anzhiyu.initThemeColor();
          });
        }
        $rightside.style.cssText = "opacity: ''; transform: ''";
      }

      if (document.body.scrollHeight <= innerHeight) {
        $rightside.style.cssText = "opacity: 0.8; transform: translateX(-58px)";
      }

      percentageScrollFn(currentTop);
    }, 96);

    // 监听页面底部
    if (footerDom) {
      anzhiyu
        .intersectionObserver(
          () => {
            if (footerDom && musicDom && 768 < document.body.clientWidth) {
              musicDom.style.bottom = "-10px";
              musicDom.style.opacity = "0";
            }
            scrollBottomFirstFlag = true;
          },
          () => {
            if (footerDom && musicDom && 768 < document.body.clientWidth) {
              musicDom.style.bottom = "20px";
              musicDom.style.opacity = "1";
            }
          }
        )()
        .observe(footerDom);
    }

    scrollTask();
    anzhiyu.addEventListenerPjax(window, "scroll", scrollTask, { passive: true });
  };

  /**
   * toc,anchor
   */
  const scrollFnToDo = function () {
    const isToc = GLOBAL_CONFIG_SITE.isToc;
    const isAnchor = GLOBAL_CONFIG.isAnchor;
    const $article = document.getElementById("article-container");

    if (!($article && (isToc || isAnchor))) return;

    let $tocLink, $cardToc, autoScrollToc, isExpand;
    if (isToc) {
      const $cardTocLayout = document.getElementById("card-toc");
      $cardToc = $cardTocLayout.querySelector(".toc-content");
      $tocLink = $cardToc.querySelectorAll(".toc-link");
      isExpand = $cardToc.classList.contains("is-expand");

      // toc元素点击
      const tocItemClickFn = e => {
        const target = e.target.closest(".toc-link");
        if (!target) return;

        e.preventDefault();
        anzhiyu.scrollToDest(
          anzhiyu.getEleTop(document.getElementById(decodeURI(target.getAttribute("href")).replace("#", ""))) - 60,
          300
        );
        if (window.innerWidth < 900) {
          $cardTocLayout.classList.remove("open");
        }
      };

      anzhiyu.addEventListenerPjax($cardToc, "click", tocItemClickFn);

      autoScrollToc = item => {
        const activePosition = item.getBoundingClientRect().top;
        const sidebarScrollTop = $cardToc.scrollTop;
        if (activePosition > document.documentElement.clientHeight - 100) {
          $cardToc.scrollTop = sidebarScrollTop + 150;
        }
        if (activePosition < 100) {
          $cardToc.scrollTop = sidebarScrollTop - 150;
        }
      };
    }

    // find head position & add active class
    const list = $article.querySelectorAll("h1,h2,h3,h4,h5,h6");
    const filteredHeadings = Array.from(list).filter(heading => heading.id !== "CrawlerTitle");
    let detectItem = "";
    const findHeadPosition = function (top) {
      if (top === 0) {
        return false;
      }

      let currentId = "";
      let currentIndex = "";

      filteredHeadings.forEach(function (ele, index) {
        if (top > anzhiyu.getEleTop(ele) - 80) {
          const id = ele.id;
          currentId = id ? "#" + encodeURI(id) : "";
          currentIndex = index;
        }
      });
      if (detectItem === currentIndex) return;
      if (isAnchor) anzhiyu.updateAnchor(currentId);
      detectItem = currentIndex;
      if (isToc) {
        $cardToc.querySelectorAll(".active").forEach(i => {
          i.classList.remove("active");
        });

        if (currentId === "") {
          return;
        }
        const currentActive = $tocLink[currentIndex];
        currentActive.classList.add("active");

        setTimeout(() => {
          autoScrollToc(currentActive);
        }, 0);

        if (isExpand) return;
        let parent = currentActive.parentNode;

        for (; !parent.matches(".toc"); parent = parent.parentNode) {
          if (parent.matches("li")) parent.classList.add("active");
        }
      }
    };

    // main of scroll
    const tocScrollFn = anzhiyu.throttle(() => {
      const currentTop = window.scrollY || document.documentElement.scrollTop;
      findHeadPosition(currentTop);
    }, 100);

    anzhiyu.addEventListenerPjax(window, "scroll", tocScrollFn, { passive: true });
  };

  const autoChangeMode = () => {
    const now = new Date();
    const hour = now.getHours();
    const isNight = hour >= 19 || hour < 7;
    const userTheme = localStorage.getItem("theme");

    if (userTheme) {
      document.documentElement.setAttribute("data-theme", userTheme);
      return;
    }

    if (isNight) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  };
  autoChangeMode();

  const handleThemeChange = mode => {
    const globalFn = window.globalFn || {};
    const themeChange = globalFn.themeChange || {};
    if (!themeChange) {
      return;
    }

    Object.keys(themeChange).forEach(key => {
      const themeChangeFn = themeChange[key];
      themeChangeFn(mode);
    });

    rm && rm.hideRightMenu();

    const menuDarkmodeText = $rightMenu.querySelector(".menu-darkmode-text");
    if (mode === "light") {
      menuDarkmodeText.textContent = "深色模式";
    } else {
      menuDarkmodeText.textContent = "浅色模式";
    }

    if (!GLOBAL_CONFIG_SITE.isPost) {
      const root = document.querySelector(":root");
      root.style.setProperty("--anzhiyu-bar-background", "var(--anzhiyu-meta-theme-color)");
      requestAnimationFrame(() => {
        anzhiyu.initThemeColor();
      });

      // 修改顶栏颜色，开发者工具中可见
      document.documentElement.style.setProperty(
        "--anzhiyu-main",
        getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-theme")
      );
      document.documentElement.style.setProperty(
        "--anzhiyu-theme-op",
        getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-main") + "23"
      );
      document.documentElement.style.setProperty(
        "--anzhiyu-theme-op-deep",
        getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-main") + "dd"
      );
    }
  };

  /**
   * Rightside
   */
  const rightSideFn = {
    readmode: () => {
      // read mode
      const $body = document.body;
      $body.classList.add("read-mode");
      const newEle = document.createElement("button");
      newEle.type = "button";
      newEle.className = "anzhiyufont anzhiyu-icon-xmark exit-readmode";
      $body.appendChild(newEle);

      const clickFn = () => {
        $body.classList.remove("read-mode");
        newEle.remove();
        newEle.removeEventListener("click", clickFn);
      };

      newEle.addEventListener("click", clickFn);
    },
    darkmode: () => {
      // switch between light and dark mode
      const willChangeMode = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      if (willChangeMode === "dark") {
        activateDarkMode();
        GLOBAL_CONFIG.Snackbar !== undefined && anzhiyu.snackbarShow(GLOBAL_CONFIG.Snackbar.day_to_night);
      } else {
        activateLightMode();
        GLOBAL_CONFIG.Snackbar !== undefined && anzhiyu.snackbarShow(GLOBAL_CONFIG.Snackbar.night_to_day);
      }
      saveToLocal.set("theme", willChangeMode, 2);
      handleThemeChange(willChangeMode);
    },
    "rightside-config": item => {
      // Show or hide rightside-hide-btn
      const hideLayout = item.firstElementChild;
      if (hideLayout.classList.contains("show")) {
        hideLayout.classList.add("status");
        setTimeout(() => {
          hideLayout.classList.remove("status");
        }, 300);
      }

      hideLayout.classList.toggle("show");
    },
    "go-up": () => {
      // Back to top
      anzhiyu.scrollToDest(0, 500);
    },
    "hide-aside-btn": () => {
      // Hide aside
      const $htmlDom = document.documentElement.classList;
      const saveStatus = $htmlDom.contains("hide-aside") ? "show" : "hide";
      saveToLocal.set("aside-status", saveStatus, 2);
      $htmlDom.toggle("hide-aside");
    },
    "mobile-toc-button": item => {
      // Show mobile toc
      const tocEle = document.getElementById("card-toc");
      tocEle.style.transformOrigin = `right ${item.getBoundingClientRect().top + 17}px`;
      tocEle.style.transition = "transform 0.3s ease-in-out";
      tocEle.classList.toggle("open");
      tocEle.addEventListener(
        "transitionend",
        () => {
          tocEle.style.transition = "";
          tocEle.style.transformOrigin = "";
        },
        { once: true }
      );
    },
    "chat-btn": () => {
      // Show chat
      window.chatBtnFn();
    },
    translateLink: () => {
      // switch between traditional and simplified chinese
      window.translateFn.translatePage();
    },
  };

  document.getElementById("rightside").addEventListener("click", function (e) {
    const $target = e.target.closest("[id]");
    if ($target && rightSideFn[$target.id]) {
      rightSideFn[$target.id](this);
    }
  });

  //隐藏打赏中的支付宝
  document.addEventListener(
    "touchstart",
    e => {
      anzhiyu.removeRewardMask();
    },
    { passive: true }
  );

  /**
   * menu
   * 侧边栏sub-menu 展开/收缩
   */
  const clickFnOfSubMenu = () => {
    const handleClickOfSubMenu = e => {
      const target = e.target.closest(".site-page.group");
      if (!target) return;
      target.classList.toggle("hide");
    };

    document.querySelector("#sidebar-menus .menus_items") &&
      document.querySelector("#sidebar-menus .menus_items").addEventListener("click", handleClickOfSubMenu);
  };

  /**
   * 复制时加上版权信息
   */
  const addCopyright = () => {
    const { limitCount, languages, copy, copyrightEbable } = GLOBAL_CONFIG.copyright;

    const handleCopy = e => {
      if (copy) {
        anzhiyu.snackbarShow(languages.copySuccess);
      }
      if (copyrightEbable) {
        e.preventDefault();
        const copyFont = window.getSelection(0).toString();
        let textFont = copyFont;
        if (copyFont.length > limitCount) {
          textFont = `${copyFont}\n\n\n${languages.author}\n${languages.link}${window.location.href}\n${languages.source}\n${languages.info}`;
        }
        if (e.clipboardData) {
          return e.clipboardData.setData("text", textFont);
        } else {
          return window.clipboardData.setData("text", textFont);
        }
      }
    };

    document.body.addEventListener("copy", handleCopy);
  };

  /**
   * 网页运行时间
   */
  const addRuntime = () => {
    const $runtimeCount = document.getElementById("runtimeshow");
    if ($runtimeCount) {
      const publishDate = $runtimeCount.getAttribute("data-publishDate");
      $runtimeCount.textContent = `${anzhiyu.diffDate(publishDate)} ${GLOBAL_CONFIG.runtime}`;
    }
  };

  /**
   * 最后一次更新时间
   */
  const addLastPushDate = () => {
    const $lastPushDateItem = document.getElementById("last-push-date");
    if ($lastPushDateItem) {
      const lastPushDate = $lastPushDateItem.getAttribute("data-lastPushDate");
      $lastPushDateItem.textContent = anzhiyu.diffDate(lastPushDate, true);
    }
  };

  /**
   * table overflow
   */
  const addTableWrap = () => {
    const $table = document.querySelectorAll("#article-container table");
    if (!$table.length) return;

    $table.forEach(item => {
      if (!item.closest(".highlight")) {
        anzhiyu.wrap(item, "div", { class: "table-wrap" });
      }
    });
  };

  /**
   * tag-hide
   */
  const clickFnOfTagHide = () => {
    const hideButtons = document.querySelectorAll("#article-container .hide-button");
    if (!hideButtons.length) return;
    const handleClick = function (e) {
      const $this = this;
      $this.classList.add("open");
      const $fjGallery = $this.nextElementSibling.querySelectorAll(".gallery-container");
      $fjGallery.length && addJustifiedGallery($fjGallery);
    };

    hideButtons.forEach(item => {
      item.addEventListener("click", handleClick, { once: true });
    });
  };

  const tabsFn = () => {
    const navTabsElement = document.querySelectorAll("#article-container .tabs");
    if (!navTabsElement.length) return;

    const removeAndAddActiveClass = (elements, detect) => {
      Array.from(elements).forEach(element => {
        element.classList.remove("active");
        if (element === detect || element.id === detect) {
          element.classList.add("active");
        }
      });
    };

    const addTabNavEventListener = (item, isJustifiedGallery) => {
      const navClickHandler = function (e) {
        const target = e.target.closest("button");
        if (target.classList.contains("active")) return;
        removeAndAddActiveClass(this.children, target);
        this.classList.remove("no-default");
        const tabId = target.getAttribute("data-href");
        const tabContent = this.nextElementSibling;
        removeAndAddActiveClass(tabContent.children, tabId);
        if (isJustifiedGallery) {
          const $isTabJustifiedGallery = tabContent.querySelectorAll(`#${tabId} .fj-gallery`);
          if ($isTabJustifiedGallery.length > 0) {
            anzhiyu.initJustifiedGallery($isTabJustifiedGallery);
          }
        }
      };
      anzhiyu.addEventListenerPjax(item.firstElementChild, "click", navClickHandler);
    };

    const addTabToTopEventListener = item => {
      const btnClickHandler = e => {
        const target = e.target.closest("button");
        if (!target) return;
        anzhiyu.scrollToDest(anzhiyu.getEleTop(item), 300);
      };
      anzhiyu.addEventListenerPjax(item.lastElementChild, "click", btnClickHandler);
    };

    navTabsElement.forEach(item => {
      const isJustifiedGallery = !!item.querySelectorAll(".gallery-container");
      addTabNavEventListener(item, isJustifiedGallery);
      addTabToTopEventListener(item);
    });
  };

  const toggleCardCategory = () => {
    const cardCategory = document.querySelector("#aside-cat-list.expandBtn");
    if (!cardCategory) return;

    const handleToggleBtn = e => {
      const target = e.target;
      if (target.nodeName === "I") {
        e.preventDefault();
        target.parentNode.classList.toggle("expand");
      }
    };
    anzhiyu.addEventListenerPjax(cardCategory, "click", handleToggleBtn, true);
  };

  const switchComments = () => {
    const switchBtn = document.getElementById("switch-btn");
    if (!switchBtn) return;
    let switchDone = false;
    const commentContainer = document.getElementById("post-comment");
    const handleSwitchBtn = () => {
      commentContainer.classList.toggle("move");
      if (!switchDone && typeof loadOtherComment === "function") {
        switchDone = true;
        loadOtherComment();
      }
    };
    anzhiyu.addEventListenerPjax(switchBtn, "click", handleSwitchBtn);
  };

  const addPostOutdateNotice = function () {
    const data = GLOBAL_CONFIG.noticeOutdate;
    const diffDay = anzhiyu.diffDate(GLOBAL_CONFIG_SITE.postUpdate);
    if (diffDay >= data.limitDay) {
      const ele = document.createElement("div");
      ele.className = "post-outdate-notice";
      ele.textContent = data.messagePrev + " " + diffDay + " " + data.messageNext;
      const $targetEle = document.getElementById("article-container");
      if (data.position === "top") {
        $targetEle.insertBefore(ele, $targetEle.firstChild);
      } else {
        $targetEle.appendChild(ele);
      }
    }
  };

  const lazyloadImg = () => {
    window.lazyLoadInstance = new LazyLoad({
      elements_selector: "img",
      threshold: 0,
      data_src: "lazy-src",
    });
  };

  const relativeDate = function (selector) {
    selector.forEach(item => {
      const timeVal = item.getAttribute("datetime");
      item.textContent = anzhiyu.diffDate(timeVal, true);
      item.style.display = "inline";
    });
  };

  const mouseleaveHomeCard = function () {
    const topGroup = document.querySelector(".topGroup");
    if (!topGroup) return;
    //首页大卡片恢复显示
    topGroup.addEventListener("mouseleave", function () {
      document.getElementById("todayCard").classList.remove("hide");
      document.getElementById("todayCard").style.zIndex = 1;
    });
  };

  // 表情放大
  const owoBig = function () {
    let flag = 1, // 设置节流阀
      owo_time = "", // 设置计时器
      m = 3; // 设置放大倍数
    // 创建盒子
    let div = document.createElement("div");
    // 设置ID
    div.id = "owo-big";
    // 插入盒子
    let body = document.querySelector("body");
    body.appendChild(div);

    // 监听 post-comment 元素的子元素添加
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        const addedNodes = mutation.addedNodes;
        // 遍历每个新增的节点，检查是否包含 OwO-body 类名的元素
        for (let i = 0; i < addedNodes.length; i++) {
          const node = addedNodes[i];
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.classList.contains("OwO-body") &&
            !node.classList.contains("comment-barrage")
          ) {
            const owo_body = node;
            // 禁用右键（手机端长按会出现右键菜单，为了体验给禁用掉）
            owo_body.addEventListener("contextmenu", e => e.preventDefault());
            // 鼠标移入
            owo_body.addEventListener("mouseover", handleMouseOver);
            // 鼠标移出
            owo_body.addEventListener("mouseout", handleMouseOut);
          }
        }
      });
    });

    // 配置 MutationObserver 选项
    const config = { childList: true, subtree: true };

    // 开始观察
    observer.observe(document.getElementById("post-comment"), config);

    function handleMouseOver(e) {
      if (e.target.tagName == "IMG" && flag) {
        flag = 0;
        // 设置300毫秒的节流阀
        owo_time = setTimeout(() => {
          let height = e.target.clientHeight * m; // 放大后的高度
          let width = e.target.clientWidth * m; // 放大后的宽度
          let left = e.x - e.offsetX - (width - e.target.clientWidth) / 2; // 放大后的左偏移
          if (left + width > body.clientWidth) {
            left -= left + width - body.clientWidth + 10;
          } // 右边缘检测，防止超出屏幕
          if (left < 0) left = 10; // 左边缘检测，防止超出屏幕
          let top = e.y - e.offsetY; // 放大后的上偏移
          // 设置盒子样式
          div.style.height = height + "px";
          div.style.width = width + "px";
          div.style.left = left + "px";
          div.style.top = top + "px";
          div.style.display = "flex";
          // 在盒子中插入图片
          div.innerHTML = `<img src="${e.target.src}">`;
        }, 100);
      }
    }

    function handleMouseOut(e) {
      // 隐藏盒子
      div.style.display = "none";
      flag = 1;
      clearTimeout(owo_time);
    }
  };

  //封面纯色
  const coverColor = async () => {
    const root = document.querySelector(":root");
    const path = document.getElementById("post-top-bg")?.src;
    if (!path) {
      // 没有获取到封面，尝试获取默认的主题色
      root.style.setProperty("--anzhiyu-bar-background", "var(--anzhiyu-meta-theme-color)");
      requestAnimationFrame(() => {
        anzhiyu.initThemeColor();
      });

      // 修改顶栏颜色，开发者工具中可见
      document.documentElement.style.setProperty(
        "--anzhiyu-main",
        getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-theme")
      );
      document.documentElement.style.setProperty(
        "--anzhiyu-theme-op",
        getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-main") + "23"
      );
      document.documentElement.style.setProperty(
        "--anzhiyu-theme-op-deep",
        getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-main") + "dd"
      );

      return;
    }

    // 获取主色
    if (GLOBAL_CONFIG.mainTone) {
      if (GLOBAL_CONFIG_SITE.postMainColor) {
        let value = GLOBAL_CONFIG_SITE.postMainColor;
        if (getContrastYIQ(value) === "light") {
          value = LightenDarkenColor(colorHex(value), -40);
        }

        root.style.setProperty("--anzhiyu-bar-background", value);
        requestAnimationFrame(() => {
          anzhiyu.initThemeColor();
        });

        if (GLOBAL_CONFIG.mainTone.cover_change) {
          document.documentElement.style.setProperty("--anzhiyu-main", value);
          document.documentElement.style.setProperty(
            "--anzhiyu-theme-op",
            getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-main") + "23"
          );
          document.documentElement.style.setProperty(
            "--anzhiyu-theme-op-deep",
            getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-main") + "dd"
          );
        }
      } else {
        const fallbackValue = "var(--anzhiyu-theme)";
        let fetchPath = "";
        if (GLOBAL_CONFIG.mainTone.mode == "cdn" || GLOBAL_CONFIG.mainTone.mode == "both") {
          fetchPath = path + "?imageAve";
        } else if (GLOBAL_CONFIG.mainTone.mode == "api") {
          fetchPath = GLOBAL_CONFIG.mainTone.api + path;
        }
        // cdn/api获取主色
        try {
          const response = await fetch(fetchPath);
          if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
            const obj = await response.json();
            let value =
              GLOBAL_CONFIG.mainTone.mode == "cdn" || GLOBAL_CONFIG.mainTone.mode == "both"
                ? "#" + obj.RGB.slice(2)
                : obj.RGB;
            if (getContrastYIQ(value) === "light") {
              value = LightenDarkenColor(colorHex(value), -40);
            }

            root.style.setProperty("--anzhiyu-bar-background", value);
            requestAnimationFrame(() => {
              anzhiyu.initThemeColor();
            });

            if (GLOBAL_CONFIG.mainTone.cover_change) {
              document.documentElement.style.setProperty("--anzhiyu-main", value);
              document.documentElement.style.setProperty(
                "--anzhiyu-theme-op",
                getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-main") + "23"
              );
              document.documentElement.style.setProperty(
                "--anzhiyu-theme-op-deep",
                getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-main") + "dd"
              );
            }
          } else {
            if (GLOBAL_CONFIG.mainTone.mode == "both") {
              // both模式获取主色
              try {
                const response = await fetch(GLOBAL_CONFIG.mainTone.api + path);
                if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
                  const obj = await response.json();
                  let value = obj.RGB;

                  if (getContrastYIQ(value) === "light") {
                    value = LightenDarkenColor(colorHex(value), -40);
                  }

                  root.style.setProperty("--anzhiyu-bar-background", value);
                  requestAnimationFrame(() => {
                    anzhiyu.initThemeColor();
                  });

                  if (GLOBAL_CONFIG.mainTone.cover_change) {
                    document.documentElement.style.setProperty("--anzhiyu-main", value);
                    document.documentElement.style.setProperty(
                      "--anzhiyu-theme-op",
                      getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-main") + "23"
                    );
                    document.documentElement.style.setProperty(
                      "--anzhiyu-theme-op-deep",
                      getComputedStyle(document.documentElement).getPropertyValue("--anzhiyu-main") + "dd"
                    );
                  }
                } else {
                  root.style.setProperty("--anzhiyu-bar-background", fallbackValue);
                }
              } catch (error) {
                console.error("Error fetching image color in both mode:", error);
                root.style.setProperty("--anzhiyu-bar-background", fallbackValue);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching image color:", error);
          root.style.setProperty("--anzhiyu-bar-background", fallbackValue);
        }
      }
    }
  };

  // 初始化TOC激活功能
  scrollFnToDo();

  // 定义刷新函数，用于pjax导航后重新初始化
  window.refreshFn = function() {
    console.log('refreshFn called');
    // 重新初始化代码块工具
    window.addHighlightTool();
    // 重新初始化TOC激活功能
    scrollFnToDo();
  };
});

