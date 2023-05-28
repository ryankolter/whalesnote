
<div align="center">
  <img src="public/icon.png" height="128">
  <h1>Whalesnote (桌面版)</h1>
  <p>markdown本地笔记软件，支持win、mac和linux. 轻松存储分类上万篇笔记</p>
</div>

<br>

## 特点

1. **隐私第一**: 代码开源，不联网，笔记以md格式全部存放在本地文件夹
2. **支持Markdown**: 额外提供预览模式和双排模式
3. **为大量笔记开发**: 三层目录结构，最少能存储 100个资料库 * 50个分类 * 60篇笔记 = 30万 篇笔记
4. **软件秒开**: 不管有多少篇笔记，都是直接打开，因为使用了无需启动时全部载入的分词搜索引擎

5. 其他
    - 完美的快捷键支持：像 Vimium C，你可以用键盘快速地在笔记之间切换（需要激活快捷模式，按ctrl/command + , ）
    - 导出支持：允许单独导出或按分类批量导出，支持html和md格式
    - 两种主题模式：白天或黑夜，随你喜欢
    - 支持记忆功能：会记住你上次离开这个笔记所在的位置

<br>

## 截图展示

### 黑夜模式

![note111](https://user-images.githubusercontent.com/44566054/205487966-53889309-bfce-4775-8d73-e47346515475.PNG)

<br>

### 快捷键支持(像谷歌浏览器的 Vimium C 插件)

![note222](https://user-images.githubusercontent.com/44566054/205487983-a7b4ccbb-3c61-4fce-929c-2a07948d6e7b.PNG)

<br>

### 白天模式

![light_mode](https://github.com/ryankolter/whalesnote/assets/44566054/faa3d3e3-eb0a-4b9f-b5bb-5b19ddbfbe20)

<br>

## 开发

```bash
git clone git@github.com/ryankolter/whalesnote.git
npm install
npm run start
```
- web服务器会启动在3005端口

- 然后打开另一个终端

```bash
cd app
npm install
npm run electron
```

<br>

Q: 两个目录的结构有什么好处？

A: 把 app/node_modules 从 node_modules中分离出来，然后js直接构建到app目录中，可以极大地减少electron-builder打包出来的体积。

<br>

## 开源许可证

请查看文件[LICENSE.md](./LICENSE.md)
