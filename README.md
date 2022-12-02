
<div align="center">
  ![icon](https://user-images.githubusercontent.com/44566054/205326811-3a3ac7a6-a0fd-4ae5-9ac9-646352959264.png)
  <h1>Whalenote (desktop version)</h1>
  <p>A cross-platform desktop note-taking software. Easily classify and store tens of thousands of notes.</p>
</div>

<br>

## Why Whalenote？

1. Privacy first: local open source software that is not connected to the Internet, giving you complete control over the data.
2. Super-capacity second brain: three-level directory structure can store at least 100 repositories * 50 categories * 60 notes = 300,000 notes !!!
3. Only takes one second to open: no matter how many notes you have, because it use segmentation based search system which won't load all notes at beginning.
4. Have memory: it remembers where the document left off last time.
5. Perfect shortcut support: like vimium C, you can quickly switch between notes with the keyboard( Activate with ctrl/command + , ).
6. Export support: allow batch export by notes or categories, with txt, html, md formats.
7. Markdown support: Provide preview mode and two-column mode.
8. Two mode support: light or dark, as you like.

## Development

```bash
git clone git@github.com/ryankolter/whalenote_desktop.git
npm install
npm run start
```
- the web server will run on port 3005

- then open another terminal

```bash
cd app
npm install
npm run electron
```

<br>

Q: What is the benefit of two directory's structure?

A: By seperating app/node_modules from node_modules and building the js bundle file into app directory, we can minimize the packaging size of electron using electron-builder.

<br>
<br>

## dark mode

![note1](https://user-images.githubusercontent.com/44566054/205018801-4bd2c085-c3bd-407e-8684-b8f8685ad7a3.PNG)

you can switch to another white mode

<br>

### shortcut support(like Vimium C on Chrome)

![note3](https://user-images.githubusercontent.com/44566054/205018821-f6ebf053-efc4-46b3-a297-cd1ca4134c12.PNG)

