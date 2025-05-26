import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bodyParser from 'body-parser';
import expressLayouts from 'express-ejs-layouts';

const app = express();
const port = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataFilePath = path.join(__dirname, 'data.json');
let posts = [];

if (fs.existsSync(dataFilePath)) {
  const rawData = fs.readFileSync(dataFilePath);
  posts = JSON.parse(rawData);
}

function savePostsToFile() {
  fs.writeFileSync(dataFilePath, JSON.stringify(posts, null, 2));
}

function linkify(text) {
  const urlRegex = /(\bhttps?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

// Middleware
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
  res.render('home', { posts });
});

app.get('/compose', (req, res) => {
  res.render('compose');
});

app.post('/compose', (req, res) => {
  const post = {
    title: req.body.title,
    content: req.body.content
  };
  posts.push(post);
  savePostsToFile();
  res.redirect('/');
});

app.get('/posts/:index', (req, res) => {
  const post = posts[req.params.index];
  if (post) {
    const linkedContent = linkify(post.content);
    res.render('post', { post: { ...post, content: linkedContent }, index: req.params.index });
  } else {
    res.status(404).send('Post not found');
  }
});

app.get('/edit/:index', (req, res) => {
  const post = posts[req.params.index];
  if (post) {
    res.render('edit', { post, index: req.params.index });
  } else {
    res.status(404).send('Post not found');
  }
});

app.post('/edit/:index', (req, res) => {
  const index = req.params.index;
  posts[index] = {
    title: req.body.title,
    content: req.body.content
  };
  savePostsToFile();
  res.redirect('/');
});

app.post('/delete/:index', (req, res) => {
  posts.splice(req.params.index, 1);
  savePostsToFile();
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
