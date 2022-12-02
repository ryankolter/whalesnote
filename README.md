
<div align="center">
  <h1>Whalenote (desktop version)</h1>
  <p>A cross-platform desktop note-taking software. Easily classify and store tens of thousands of notes.</p>
</div>

<br>

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

[question]what is the benefit of two directory's structure?

<br>

[answer]By seperating app/node_modules from node_modules and building the js bundle file into app directory, we can minimize the packaging size of electron using electron-builder.

<br>
<br>

## dark mode

![note1](https://user-images.githubusercontent.com/44566054/205018801-4bd2c085-c3bd-407e-8684-b8f8685ad7a3.PNG)

you can switch to another white mode

<br>

### shortcut support(like Vimium C on Chrome)

![note3](https://user-images.githubusercontent.com/44566054/205018821-f6ebf053-efc4-46b3-a297-cd1ca4134c12.PNG)

