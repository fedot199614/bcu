//const favicon = require('serve-favicon');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
//const multer = require('multer');
//const errorHandler = require('errorhandler');
const validate = require('validate-schema');
const pgSchema = require('pg-schema');
const childProcess = require('child_process');
const fsPath = require('fs-path');
const fs = require('fs');
const startOffset  = 5;
const path = require('path');
const express = require('express');
const exphbs = require('express-handlebars');
const xAdmin = require('express-admin');
const session = require('express-session');
const pg = require('pg');
const conString = 'postgres://postgres:password@localhost/bcu-db';
var limit = 100;
const config = {
    dpath: './node_modules/express-admin/project/',
    config: require('./node_modules/express-admin/project/config.json'),
    settings: require('./node_modules/express-admin/project/settings.json'),
    custom: require('./node_modules/express-admin/project/custom.json'),
    users: require('./node_modules/express-admin/project/users.json'),
    // additionally you can pass your own session middleware to use
    session: session({name: 'express-admin', secret: 'very secret', saveUninitialized: true, resave: true})
};

	
var sql_panorama = 'select * from panorama';
var sql_left_block_slider = 'select id,imagespath from achizitii_recente order by time desc limit 1';
var aql_achizitii_detail = 'select *,to_char( time, \'Month YYYY\') as re_format from achizitii_recente  where id=';
xAdmin.init(config, function (err, admin) {
    if (err) return console.log(err);
    // web site
    var app = express();
	app.use('/admin', admin);
	app.engine('.hbs', exphbs({
    defaultLayout: 'main',
    extname: '.hbs',
    layoutsDir: path.join(__dirname, 'views/layouts')
}))
	app.use("/assets",express.static(__dirname + "/assets"));
	app.use("/node_modules/express-admin/public/upload",express.static(__dirname + "/node_modules/express-admin/public/upload"));
	app.use("/assets/css",express.static(__dirname + "/assets/css"));
	app.use("/assets/img",express.static(__dirname + "/assets/img"));
	app.use("/assets/js",express.static(__dirname + "/assets/js"));
	app.use("/assets/fonts",express.static(__dirname + "/assets/fonts"));
	app.use("/views",express.static("/views"));
	app.set('view engine', '.hbs');
	app.set('views', path.join(__dirname, 'views'));
    app.use(bodyParser.json());                        
    app.use(bodyParser.urlencoded({ extended: true }));
    // site routes
app.get('/', (request, response) => {
	//base query
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	
	pg.connect(conString, function (err, client, done) {
		
	client.query(sql_left_block_slider, [], function (err, result) {
	done()
	var slider; 
	if(typeof result.rows[0] != "undefined"){
		slider = result.rows[0].imagespath.split(",");
		idAchiz = result.rows[0].id;
	}else{
		slider = result.rows;
		displayFlagSlider = 'none';
	}
	
	for(var i in slider){
		var active = null;
		if(i == 0){
			active = "active";
		}
		sliderFull.push({"imgUrl":slider[i],"activeSt": active});
		
	}
	})
	
	
	client.query(sql_panorama, [], function (err, result) {
	done()
	panorama = result.rows;
	})
		
	
	if (err) {
		return console.error('error fetching client from pool', err)
	}
	
	client.query('SELECT *, to_char( time, \'DD/MM/YYYY\') as re_format from news order by id desc', [], function (err, result) {
		done()
    if (err) {
      return console.error('error happened during query', err)
    }
	
    response.render('home',{
		contents: result.rows,
		baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider
	})
	
  })
 })   
})
//feedback
app.get('/feedback', (request, response) => {
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	pg.connect(conString, function (err, client, done) {
		
	client.query(sql_left_block_slider, [], function (err, result) {
	done()
	var slider; 
	if(typeof result.rows[0] != "undefined"){
		slider = result.rows[0].imagespath.split(",");
		idAchiz = result.rows[0].id;
	}else{
		slider = result.rows;
		displayFlagSlider = 'none';
	}
	
	for(var i in slider){
		var active = null;
		if(i == 0){
			active = "active";
		}
		sliderFull.push({"imgUrl":slider[i],"activeSt": active});
		
	}
	})	
		
		
		
	client.query(sql_panorama, [], function (err, result) {
	done()
	panorama = result.rows;
	response.render('feedback', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider
    })
	})
	})
    
})
//book-order
app.get('/book-order', (request, response) => {
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	pg.connect(conString, function (err, client, done) {
		
	client.query(sql_left_block_slider, [], function (err, result) {
	done()
	var slider; 
	if(typeof result.rows[0] != "undefined"){
		slider = result.rows[0].imagespath.split(",");
		idAchiz = result.rows[0].id;
	}else{
		slider = result.rows;
		displayFlagSlider = 'none';
	}
	for(var i in slider){
		var active = null;
		if(i == 0){
			active = "active";
		}
		sliderFull.push({"imgUrl":slider[i],"activeSt": active});
		
	}
	})	
		
		
	client.query(sql_panorama, [], function (err, result) {
	done()
	panorama = result.rows;
	
	
	response.render('book-order', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider
    })
	  })
	})
    
})
//detali	
app.get('/detail', (request, response) => {
	
	var newsId = request.query.id;
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	pg.connect(conString, function (err, client, done) {
		
	client.query(sql_left_block_slider, [], function (err, result) {
	done()
	var slider; 
	if(typeof result.rows[0] != "undefined"){
		slider = result.rows[0].imagespath.split(",");
		idAchiz = result.rows[0].id;
	}else{
		slider = result.rows;
		displayFlagSlider = 'none';
	}
	for(var i in slider){
		var active = null;
		if(i == 0){
			active = "active";
		}
		sliderFull.push({"imgUrl":slider[i],"activeSt": active});
		
	}
	})	
		
		
	client.query(sql_panorama, [], function (err, result) {
	done()
	panorama = result.rows;
	})
	
	
	if (err) {
		return console.error('error fetching client from pool', err)
	}
	client.query('select *,to_char( time, \'DD/MM/YYYY\') as re_format from news where id='+newsId, [], function (err, result) {
		done()
    if (err) {
      return console.error('error happened during query', err)
    }
    response.render('detail',{
		contents: result.rows,
		baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider
	})
	
  })
 })   
})

	
//achizitii_recente
app.get('/achizitii', (request, response) => {
	var achizitiiId = request.query.id;
	var panorama;
	var sliderFull = [];
	var idAchiz;
	var achizitiiDetail;
	var displayFlagSlider = '';
	pg.connect(conString, function (err, client, done) {
	
	client.query(aql_achizitii_detail+""+achizitiiId, [], function (err, result) {
	done()
	
	achizitiiDetail = result.rows;
	})


	client.query(sql_left_block_slider, [], function (err, result) {
	done()
	var slider = result.rows[0].imagespath.split(",");
	idAchiz = result.rows[0].id;
	for(var i in slider){
		var active = null;
		if(i == 0){
			active = "active";
		}
		sliderFull.push({"imgUrl":slider[i],"activeSt": active});
		
	}
	})	
		
		
	client.query(sql_panorama, [], function (err, result) {
	done()
	panorama = result.rows;
	
	
	response.render('achizitii', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		achizitiiinfo: achizitiiDetail
	})
	})
})
    
})



	
	
    // site server
    app.listen(80, function () {
        console.log('My awesome site listening on port 80');
    });
});
//app.listen(3000)




 

