//const favicon = require('serve-favicon');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var nodemailer = require('nodemailer');
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
var visits;
var uniqueVisitors;
const urlencodedParser = bodyParser.urlencoded({extended: false});
fs.readFile('totalVisits.txt', function(err, data) {
    visits = data.toString();
	
});
fs.readFile('uniqueVisits.txt', function(err, data) {
    uniqueVisitors = data.toString();
});
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'usm.bcu@gmail.com',
    pass: 'sfd12345'
  }
});
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
	app.use(cookieParser());
	app.use(session({
	name: "server-session-cookie-id",
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: false,
	cookie: { secure: true }
	}));
	app.use(function (req, res, next) {
  // check if client sent cookie
  var cookie = req.cookies.cookieName;
  if (cookie === undefined)
  {
    // no: set a new cookie
    var randomNumber=Math.random().toString();
    randomNumber=randomNumber.substring(2,randomNumber.length);
    res.cookie('cookieName',randomNumber, { maxAge: 900000, httpOnly: true });
	var buff = uniqueVisitors++;
	fs.writeFile('uniqueVisits.txt', buff, function (err) {
	if (err) throw err;
	console.log('Replaced!');
	});
	
    console.log('cookie created successfully');
	
  } 
  else
  {

    // yes, cookie was already present 
    //console.log('cookie exists', cookie);
  } 
  next(); // <-- important!
});
    // site routes

app.get('/', (request, response) => {
	//base query
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	
	fs.writeFile('totalVisits.txt', visits++, function (err) {
	if (err) throw err;
	});
	
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
	
	client.query('SELECT *, to_char( time, \'DD/MM/YYYY\') as re_format from news order by time desc', [], function (err, result) {
		done()
    if (err) {
      return console.error('error happened during query', err)
    }
	
    response.render('home',{
		contents: result.rows,
		baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits
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
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: 'none'
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
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: 'none'
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
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits
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
		achizitiiinfo: achizitiiDetail,
		visits: uniqueVisitors,
		visitstotal: visits
	})
	})
})
    
})

app.post("/book-order", urlencodedParser, function (request, response) {
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
    if(!request.body) return response.sendStatus(400);
	var mailOptions = {
	from: 'usm.bcu@gmail.com',
	to: 'dulger_1996_96@mail.ru',
	subject: 'Propuneri pentru achiziţii (BCU)',
	text: 'Titlul: '+request.body.titlul+'\nAutorul: '+request.body.autorul+'\nAnul: '
					+request.body.anul+'\nEditura: '+request.body.editura+'\nLocul: '
					+request.body.locul+'\nISBN/ISNN: '+request.body.isbn+'\nNume: '
					+request.body.nume+'\nFacultate: '+request.body.facultate+'\nCatedra: '
					+request.body.catedra+'\nStatut: '+request.body.statut
	};
	
	transporter.sendMail(mailOptions, function(error, info){
	if (error) {
    console.log(error);
	} else {
    
	}
	});
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
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: ''
    })
	  })
	});
	
	
});

app.post("/feedback", urlencodedParser, function (request, response) {
	
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
    if(!request.body) return response.sendStatus(400);
    
	var mailOptions = {
	from: 'usm.bcu@gmail.com',
	to: 'dulger_1996_96@mail.ru',
	subject: 'FeedBack (BCU)',
	text: 'Nume: '+request.body.name+'\nEmail: '+request.body.email+'\nStatut: '
				  +request.body.statut+'\nMessage: '+request.body.message
	};
	
	transporter.sendMail(mailOptions, function(error, info){
	if (error) {
    console.log(error);
	} else {
    
	}
	});
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
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: ''
    })
})
});
});


	
	
    // site server
    app.listen(3000, function () {
        console.log('My awesome site listening on port 3000');
    });
});
//app.listen(3000)




 

