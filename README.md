# 尼采纪念网页

一个完全静态、可离线运行的中文纪念网站。视觉以“深渊、星图、手稿与循环”为主题，包含五个内容分页：

- `回声`：主视觉、纪念引言与核心线索
- `生平`：六段人生节点与历史档案
- `著作`：12 部作品筛选、详情档案与出版说明
- `思想`：可交互的思想星图与随机思想签
- `余震`：后世影响、误读提示、阅读方法与资料来源

## 本地预览

首次打开必须由用户点击“开启声音，进入”后，浏览器才会播放音乐；这是浏览器的自动播放安全限制。

最简单的方式：

1. 双击 `index.html`，使用 Edge、Chrome、Firefox 或 Safari 打开。
2. 若浏览器对本地音频或字体策略较严格，可在本目录打开终端并运行：

```powershell
python -m http.server 8080
```

3. 在浏览器访问 `http://localhost:8080/`。

## 文件结构

```text
尼采纪念网页/
├── index.html
├── styles.css
├── app.js
├── assets/
│   ├── audio/
│   │   └── turiner-nacht-ambient.wav
│   └── images/
│       ├── hero-1882.webp
│       ├── munch-nietzsche.webp
│       ├── archive-room.webp
│       ├── antichrist-manuscript.webp
│       └── nice-plaque.webp
├── docs/
│   ├── 发布教程.md
│   └── 素材与来源.md
└── README.md
```

## 修改内容

- 著作资料与思想星图内容位于 `app.js` 顶部的 `books`、`ideas` 和 `aphorisms` 对象中。
- 页面正文位于 `index.html`。
- 颜色、字号、间距与响应式断点位于 `styles.css` 顶部的 CSS 变量和媒体查询中。
- 背景音乐为 50 秒 WAV 循环文件；替换时请保持文件名，或同步修改 `index.html` 中 `<audio>` 标签的 `src`。

## 浏览器支持

建议使用最新版 Edge、Chrome、Firefox 或 Safari。WAV 音频在现代浏览器中具有广泛支持；网站主要的筛选、分页、弹窗与动画依赖原生 JavaScript 和 CSS。

## 授权

代码与原创中文编辑内容可用于个人或非商业纪念展示。历史图片的授权信息见 [素材与来源.md](docs/素材与来源.md)。如用于商业项目，请重新核验所有外部资料，并替换或补充适合商业场景的素材与文字。
