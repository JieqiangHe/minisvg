# minisvgbench

轻量 SVG 文件操作器：单个 `index.html`，原生 JS，离线可用。用 Chrome / Edge 直接打开即可（Firefox、Safari 未测试）。
面向 ggplot2/svglite 导出、Inkscape 保存过的科研图：改文字、移动缩放、调样式、多图拼版、导出。路径节点编辑等重活仍交给 Inkscape。

## 操作

| 操作 | 方式 |
|---|---|
| 打开 / 导入 | 按钮或拖入窗口（已有内容时询问导入还是打开）；Ctrl+O / Ctrl+I |
| 新建画布 | A4、单栏 85 mm、双栏 180 mm 或自定义（mm） |
| 缩放 / 平移 / 适应 | 滚轮 / 空格+拖动（或中键） / 5 |
| 选择 | 单击选最外层组；双击进入组；Esc 退出一层；Shift 加选；空白处拖框（Shift+拖动总是拖框）；Ctrl+单击直接选组内对象；Ctrl+A 全选当前层级 |
| 变换 | 拖动移动（Ctrl 锁定水平/垂直）；方向键 0.1 mm，Shift+方向键 1 mm；角点等比缩放，Shift 自由缩放；橙色圆点旋转（Ctrl 15° 步进）；右侧 X/Y/W/H（mm）与旋转角 |
| 层序 / 组合 | Home 置顶、End 置底、PageUp/PageDown 上移/下移；Ctrl+G / Ctrl+Shift+G |
| 编辑 | Ctrl+C / Ctrl+X / Ctrl+V（粘贴到鼠标处）/ Ctrl+D（原位复制）/ Delete；Ctrl+Z / Ctrl+Shift+Z |
| 文字 | 双击就地编辑（Enter 确认，Esc 取消）；T 工具点击新建（8 pt Arial）；编辑时选中字符点 X² / X₂ |
| 图形 | R 矩形、L 直线、A 箭头（Shift 锁 45°），线宽默认 0.5 pt；“标签”按选中面板左上角放置 A/B/C（10 pt 粗体） |
| 导出 | SVG：`原名_YYMMDD.svg`；PNG 300/600 dpi（白底，写入 pHYs 分辨率） |

- 所有变换都写入 `transform` 属性（父级 transform 已换算），被 clip 的对象包围盒按 clip 区域计算。
- 未操作的元素原样输出；修改过的数值：矩阵系数 8 位有效数字，坐标 1e-5，字号/线宽 6 位有效数字（与 Inkscape 相同，字号以 px 即用户单位写入）。
- 导入时所有 id 加 `iN_` 前缀并同步更新 `url(#…)` / `href` 引用，defs 合并到文档 defs，图层降为普通组。

## 测试

`test/` 下的脚本需要 Node + `playwright`（Chromium），`inkcheck.mjs` 还需要 `inkscape` 命令。

```sh
python3 test/make_volcano.py volcano.svg                     # 生成与描述一致的替身 volcano.svg（真实文件不在仓库中）
node test/accept.mjs                                         # 验收 1、2：全程通过界面操作，输出到 test/out/
python3 test/svgdiff.py volcano.svg test/out/volcano_*.svg    # 逐元素比对属性
python3 test/svgdiff.py volcano.svg test/out/figure_*.svg --prefix i1_   # 比对导入的副本
node test/inkcheck.mjs test/out/volcano_*.svg g8 text117     # Inkscape 包围盒与渲染 vs 网页
node test/features.mjs                                       # 其余功能回归测试
```

## 已知问题

- 拖动 8 万节点的大组：开始和松手时各有一次重排重绘停顿（测试环境约 0.7–0.9 s 和 0.5 s），拖动过程中每帧约 17 ms。滚轮缩放停止后有一次清晰重绘（约 0.35 s）。
- 24 MB 文件的 XML 解析约 0.8–1.7 s，是浏览器解析器的下限。
- 取消组合带 clip-path 的大组（如 4 万点的面板）会给每个子元素加 clip-path（与 Inkscape 相同），之后渲染变慢。mask / filter 在取消组合时不下放。
- 上下标写作 `font-size:65%;baseline-shift:super|sub`（Inkscape 原生写法），Chrome 与 Inkscape 对 sub 的下移量略有差异。
- 修改文字内容、字号或字体时会删除 svglite 写入的 `textLength`/`lengthAdjust`，否则字形会被拉伸。
- 多行文字（多个 `sodipodi:role="line"`）双击时编辑被点中的那一行。
- 包围盒为几何包围盒（不含描边宽度），Inkscape 默认用可视包围盒，对齐结果可能相差半个线宽；`clipPathUnits="objectBoundingBox"` 的裁剪和 mask 不参与包围盒计算。
- 拖动预览时暂不应用祖先组的 clip-path（松手后正常）。
- 与 Inkscape 的一致性在 Inkscape 1.2.2 上验证（1.4 未测）。
