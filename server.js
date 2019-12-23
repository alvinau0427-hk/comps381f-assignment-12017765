const assert = require('assert');
const formidable = require('formidable');
const fs = require('fs');
const http = require('http'); 
const url = require('url');
const ExifImage = require('exif').ExifImage;
const express = require('express');
const app = express();

var photos = [];

app.set('view engine', 'ejs');

app.get('/', (req,res) => {
	photos = [];
    res.status(200).render('upload.ejs');
});

app.post('/fileupload', (req,res) => {
	let form = new formidable.IncomingForm();
	form.parse(req, (err, fields, files) => {
		console.log(JSON.stringify(files));
		if(files.photo.size == 0) {
			console.log(`Error: No file selected!`);
			res.status(500).end("Error: No file selected!");  
    	}

    	let newPhoto = {};
		let filename = files.photo.path;
		let mimetype = "image/jpeg";

		// Error checking for the submitted form
		if(fields.title) {
			var title = (fields.title.length > 0) ? fields.title : "untitled";
			console.log(`Data: title = ${title}`);
			newPhoto['title'] = title;
		}

		if(fields.description) {
			var description = (fields.description.length > 0) ? fields.description : "undescripted";
			console.log(`Data: description = ${description}`);
			newPhoto['description'] = description;
		}

		if (files.photo.type) {
			mimetype = files.photo.type;
			console.log(`Data: mimetype = ${mimetype}`);
			newPhoto['mimetype'] = mimetype;
		}

		if(!mimetype.match(/^image/)) {
			console.log(`Error: Selected file is not image!`);
			res.status(500).end("Error: Selected file is not image!");
			return;
		}

		// Perform node-exif and image base64 action
		try {
			new ExifImage({image:files.photo.path},(error, exifData) => {
				if(error) {
					console.log(`Error: Some error apper with the exif data!`);
					res.status(500).end('Error: Some error apper with the exif data!');
				}else {
					// exif : make
					if(exifData.image.Make != null) {
						var make = exifData.image.Make;
						console.log(`Data: make = ${make}`);
						newPhoto['make'] = make;
					}else {
						var make = "N/A";
						console.log(`Data: make = ${make}`);
						newPhoto['make'] = make;
					}

					// exif : model
					if(exifData.image.Model != null) {
						var model = exifData.image.Model;
						console.log(`Data: model = ${model}`);
						newPhoto['model'] = model;
					}else {
						var model = "N/A";
						console.log(`Data: model = ${model}`);
						newPhoto['model'] = model;
					}

					// exif : date
					if(exifData.exif.CreateDate != null) {
						var date = exifData.exif.CreateDate;
						console.log(`Data: date = ${date}`);
						newPhoto['date'] = date;
					}else {
						var date = "N/A";
						console.log(`Data: date = ${date}`);
						newPhoto['date'] = date;
					}

					// exif : gps
					if(exifData.gps.GPSLongitudeRef != null && exifData.gps.GPSLatitudeRef != null) {
						var gps = exifData.gps;
						console.log(`Data: gps = ${gps}`);
						newPhoto['gps'] = gps;

						// Calculate the longitude and latitude from gps
						var lon = 0.0;
						var lat = 0.0;
						if(exifData.gps.GPSLongitudeRef == 'W') {
							lon = -((exifData.gps.GPSLongitude[0]) + (exifData.gps.GPSLongitude[1] / 60) + (exifData.gps.GPSLongitude[2] / 3600));
						}else {
							lon = (exifData.gps.GPSLongitude[0]) + (exifData.gps.GPSLongitude[1] / 60) + (exifData.gps.GPSLongitude[2] / 3600);
						}
						console.log(`Data: lon = ${lon}`);
						newPhoto['lon'] = lon;

						if(exifData.gps.GPSLatitudeRef == 'S') {
							lat = -((exifData.gps.GPSLatitude[0]) + (exifData.gps.GPSLatitude[1] / 60) + (exifData.gps.GPSLatitude[2] / 3600));
						}else {
							lat = (exifData.gps.GPSLatitude[0]) + (exifData.gps.GPSLatitude[1] / 60) + (exifData.gps.GPSLatitude[2] / 3600);
						}
						console.log(`Data: lat = ${lat}`);
						newPhoto['lat'] = lat;
					}else {
						var gps = "N/A";
						console.log(`Data: gps = ${gps}`);
						newPhoto['gps'] = gps;
					}

					// Push the data of new photo into the original array
 					fs.readFile(filename, (err,data) => {
						newPhoto['photo'] = new Buffer.from(data).toString('base64');
						photos.push(newPhoto);
						console.log(photos[0].gps);
						res.status(200).render('detail.ejs', {photos,photos} );
					});
				}
			});
		}catch (error) {
			console.log(`Error: Some error apper with the exif data!`);
            res.status(500).end('Error: Some error apper with the exif data!');
        }		
	});  
});

app.get('/map', (req,res) => {
    res.status(200).render('map.ejs', { lon: req.query.lon, lat: req.query.lat, zoom: 13 });
});

const PORT = process.env.PORT || 8099;
app.listen(PORT, console.log(`Server started on port ${PORT}`));