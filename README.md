
<div align="center">
  <img src="public/icon.png" height="128">
  <h1>Whalesnote (desktop)</h1>
  <p>A markdown note-taking software that supports win, mac and linux. Easily store and categorize tens of thousands of notes.</p>
</div>

<br>

## Why whalesnote？

1. **Privacy first**: local open source software that is not connected to the Internet, giving you complete control over the data(save as .md format).
2. **Markdown support**: Additionally provide preview mode and two-column mode.
3. **Super-capacity** second brain: three-level directory structure can store at least 100 repositories * 50 categories * 60 notes = 300,000 notes.
4. Only takes **one second** to open: no matter how many notes you have, because it use segmentation based search system which won't load all notes at beginning.

5. Other
    - Perfect shortcut support: like Vimium C, you can quickly switch between notes with the keyboard( Activate with ctrl/command + , ).
    - Export support: allow batch export by notes or categories, with html and md formats.
    - Two mode support: light or dark, as you like.
    - Memory support: it remembers where the document left off last time.

<br>

## Screenshots

### dark mode

![note111](https://user-images.githubusercontent.com/44566054/205487966-53889309-bfce-4775-8d73-e47346515475.PNG)

<br>

### shortcut support(like Vimium C on Chrome)

![note222](https://user-images.githubusercontent.com/44566054/205487983-a7b4ccbb-3c61-4fce-929c-2a07948d6e7b.PNG)

<br>

### light mode

![light_mode](https://github.com/ryankolter/whalesnote/assets/44566054/445bbf5f-3e7f-4f3f-a5f8-cca8a766022f)

<br>

## Development

```bash
git clone git@github.com/ryankolter/whalesnote.git
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

## License

Look at the [LICENSE.md](./LICENSE.md) for details
