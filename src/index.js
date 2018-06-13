const port = 1252;

// const filePath = __dirname + '/../test/dance.csv';
const filePath = __dirname + '/../test/rehearsal.csv';
// const filePath = __dirname + '/../test/VC Event Calendar w_ Room.csv';
const outputPath = __dirname + '/../test/VC Event Calendar w_ Room.json'
const outputRawPath = __dirname + '/../test/RAW-VC Event Calendar w_ Room.json';

const express = require('express');
const app = express();
const fs = require('fs-extra');
const { parse } = require('./parser');

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.use(express.static(__dirname + '/public'));

parse(filePath, (err, reservations, table) => {
	if (err) throw err;

	// console.log('reservations', reservations);

	fs.outputJson(outputRawPath, table, { spaces: '\t' }, err => {
		if (err) throw err;
		console.log('Success! Raw table written to path!');
	});

	fs.outputJson(outputPath, reservations, { spaces: '\t' }, err => {
		if (err) throw err;
		console.log('Success! Reservations written to path!');
	});

	app.get('/', (req, res) => {
		res.render('pages/index', {
			reservations,
			reservationKeys: Object.keys(reservations),
			table
		});
	});

	app.get('/raw', (req, res) => {
		res.json(table);
	});

	app.get('/reservations', (req, res) => {
		res.json(reservations);
	});
});

app.listen(port, () => console.log(`Server listening on *:${port}`));
