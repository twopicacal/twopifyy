const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(fileUpload());
app.use(express.json());
app.use(express.static('temp')); // Serve uploaded files

let playlists = {}; // Store playlists and their songs
let uploadedFiles = {}; // Temporarily store uploaded MP3s

if (!fs.existsSync('temp')) {
    fs.mkdirSync('temp');
}

app.post('/upload', (req, res) => {
    if (!req.files || !req.files.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const file = req.files.file;
    if (path.extname(file.name) !== '.mp3') {
        return res.status(400).json({ error: 'Only MP3 files are allowed' });
    }
    
    const filePath = `temp/${Date.now()}-${file.name}`;
    file.mv(filePath, (err) => {
        if (err) {
            return res.status(500).json({ error: 'File upload failed' });
        }
        uploadedFiles[file.name] = filePath;
        res.json({ success: true, fileName: file.name, filePath });
    });
});

app.post('/create-playlist', (req, res) => {
    const { playlistName } = req.body;
    if (!playlistName || playlists[playlistName]) {
        return res.status(400).json({ error: 'Invalid or duplicate playlist name' });
    }
    playlists[playlistName] = [];
    res.json({ success: true, message: `Playlist '${playlistName}' created` });
});

app.post('/add-to-playlist', (req, res) => {
    const { playlistName, fileName } = req.body;
    if (!playlists[playlistName]) {
        return res.status(400).json({ error: 'Playlist does not exist' });
    }
    if (!uploadedFiles[fileName]) {
        return res.status(400).json({ error: 'File not found' });
    }
    playlists[playlistName].push(uploadedFiles[fileName]);
    res.json({ success: true, message: `Added '${fileName}' to '${playlistName}'` });
});

app.get('/playlists', (req, res) => {
    res.json(playlists);
});

app.get('/playlist/:playlistName', (req, res) => {
    const { playlistName } = req.params;
    if (!playlists[playlistName]) {
        return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json({ playlist: playlists[playlistName] });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
