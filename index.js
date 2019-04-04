//const favicon = require('serve-favicon');
const parse = require('parse');
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
const {Pool} = require('pg');
var conString = '';
var emailservice;
var emaillogin;
var emailpass;
var transporter;
var toemail;
var configDB;
var pool;
var port;
fs.readFile('config.json', function(err, data) {
	
	var datObj = JSON.parse(data.toString());
	port = datObj.serviceport;
	emailservice = datObj.emailservice;
	emaillogin = datObj.emaillogin;
	emailpass = datObj.emailpassword;
	toemail = datObj.toemail;
	transporter = nodemailer.createTransport({
	  service: emailservice,
	  auth: {
		user: emaillogin,
		pass: emailpass
	  }
	});
	
	configDB = {
    user: datObj.postgreslogin,
    database: datObj.dbname,
    password: datObj.postgrespass,
    port: datObj.postgresport
	};
	pool = new pg.Pool(configDB);

});
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
var sql_achizitii_list = 'select *,to_char( time, \'Month YYYY\') as re_format from achizitii_recente';
var sql_program = 'select * from program';
var sql_proiecte = 'select * from proiecte';
var sql_contacte  = 'select * from contacte';
var sql_linkuri  = 'select * from linkuri';
var sql_servicii  = 'select * from servicii';
var sql_produse  = 'select * from produse';
var sql_resurse  = 'select * from resurse';
var sql_tutoriale  = 'select * from tutoriale';
var sql_despre_noi  = 'select * from despre_noi';
var sql_pentru_utilizatori  = 'select * from pentru_utilizatori';
var sql_header  = 'select * from header limit 1';



	
xAdmin.init(config, function (err, admin) {
    if (err) return console.log(err);
    // web site
    var app = express();
	pool.connect(function(err,client,done){
	if (err) {
		return console.error('error fetching client from pool', err)
	}
	app.set('client',client);
	app.set('done',done);
	});
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
	var header='';
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var program ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	fs.writeFile('totalVisits.txt', visits++, function (err) {
	if (err) throw err;
	});
	
	
    
	client.query(sql_left_block_slider, [], function (err, result) {
	
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
	
	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	})
		
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})
	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	
	if (err) {
		return console.error('error fetching client from pool', err)
	}
	
	client.query('SELECT *, to_char( time, \'DD/MM/YYYY\') as re_format from news order by time desc limit '+limit, [], function (err, result) {
		
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
		visitstotal: visits,
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
	})
	
  })
   
})
//feedback
app.get('/feedback', (request, response) => {
	var header='';
	var program ='';
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
	
	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})	
		
		
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})	
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})

	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	response.render('feedback', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: 'none',
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
    })
})

    
})
//book-order
app.get('/book-order', (request, response) => {
	var header='';
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var program ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	
	client.query(sql_left_block_slider, [], function (err, result) {
	
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
	
	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})
	
	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})	
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})

	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	
	
	response.render('book-order', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: 'none',
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
    })
	  })
	
    
})
//detali	
app.get('/detail', (request, response) => {
	var header='';
	var newsId = request.query.id;
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var program ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
	

	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})

	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	})
	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})
	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	
	client.query('select *,to_char( time, \'DD/MM/YYYY\') as re_format from news where id='+newsId, [], function (err, result) {
		
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
		visitstotal: visits,
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
	})
	
  })
    
})

	
//achizitii_recente
app.get('/achizitii', (request, response) => {
	var header='';
	var achizitiiId = request.query.id;
	var panorama;
	var sliderFull = [];
	var idAchiz;
	var achizitiiDetail;
	var displayFlagSlider = '';
	var program ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})
	
	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(aql_achizitii_detail+""+achizitiiId, [], function (err, result) {
	achizitiiDetail = result.rows;
	})

	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})
	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	
	client.query(sql_left_block_slider, [], function (err, result) {
	
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
	
	panorama = result.rows;
	
	
	response.render('achizitii', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		achizitiiinfo: achizitiiDetail,
		visits: uniqueVisitors,
		visitstotal: visits,
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
	})
	})

    
})

app.get('/achizitii-list', (request, response) => {
	var header='';
	var panorama;
	var sliderFull = [];
	var idAchiz;
	var achizitiiList;
	var displayFlagSlider = '';
	var program ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	

	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})
	
	
	
	client.query(sql_achizitii_list, [], function (err, result) {
	achizitiiList = result.rows;
	})

	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})
	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	
	client.query(sql_left_block_slider, [], function (err, result) {
	
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
	
	panorama = result.rows;
	
	
	response.render('achizitii-list', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		achizitiilist: achizitiiList,
		visits: uniqueVisitors,
		visitstotal: visits,
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
	})
	})

    
})




app.post("/book-order", urlencodedParser, function (request, response) {
	var header='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var program ='';
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
    if(!request.body) return response.sendStatus(400);
	var client = request.app.get('client');
	var mailOptions = {
	from: emaillogin,
	to: toemail,
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
	
	client.query(sql_left_block_slider, [], function (err, result) {
	
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
	
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})


	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})
	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	
	
	response.render('book-order', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: '',
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
    })
	  })
	
	
	
});

app.post("/feedback", urlencodedParser, function (request, response) {
	var header='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var program ='';
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var client = request.app.get('client');
    if(!request.body) return response.sendStatus(400);
    
	var mailOptions = {
	from: emaillogin,
	to: toemail,
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
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
	
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})


	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})	
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})

	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	response.render('feedback', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: '',
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
		
    })
})

});

//servicii
app.get('/servicii', (request, response) => {
	var header='';
	var serviciiId = request.query.id;
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var program ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
		
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})

	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	})
	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})
	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	if (err) {
		return console.error('error fetching client from pool', err)
	}
	client.query('select * from servicii where id='+serviciiId, [], function (err, result) {
		
    if (err) {
      return console.error('error happened during query', err)
    }
    response.render('servicii',{
		serviciicontent: result.rows,
		baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
	})
	
  })
  
})



//produse
app.get('/produse', (request, response) => {
	var header='';
	var produseId = request.query.id;
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var program ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
		
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})

	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	})
	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})
	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	if (err) {
		return console.error('error fetching client from pool', err)
	}
	client.query('select * from produse where id='+produseId, [], function (err, result) {
		
    if (err) {
      return console.error('error happened during query', err)
    }
    response.render('produse',{
		produsecontent: result.rows,
		baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
	})
	
  })
    
})


//resurse
app.get('/resurse', (request, response) => {
	var header='';
	var resurseId = request.query.id;
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var program ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
		
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})

	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	})
	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})
	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	if (err) {
		return console.error('error fetching client from pool', err)
	}
	client.query('select * from resurse where id='+resurseId, [], function (err, result) {
		
    if (err) {
      return console.error('error happened during query', err)
    }
    response.render('resurse',{
		resursecontent: result.rows,
		baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
	})
	
  })
   
})



//resurse
app.get('/search', (request, response) => {
	var header='';
	var searchQuery = request.query.q;
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var program ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var news ='';
	var achizitii ='';
	var resurseresp='';
	var produseresp='';
	var serviciiresp='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
		
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})

	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	})
	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})
	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	
	//search query
	client.query('select *,to_char( time, \'DD/MM/YYYY\') as re_format from news where full_news like \'%'+searchQuery+'%\' union select *,to_char( time, \'DD/MM/YYYY\') as re_format from news where title like \'%'+searchQuery+'%\'', [], function (err, result) {
	
	news = result.rows
	
	})
	
	client.query('select *,to_char( time, \'DD/MM/YYYY\') as re_format from achizitii_recente where list like \'%'+searchQuery+'%\'', [], function (err, result) {
	
	achizitii=result.rows

	})
	
	client.query('select * from resurse where content like \'%'+searchQuery+'%\' union select * from resurse where link_title like \'%'+searchQuery+'%\'', [], function (err, result) {
	
	resurseresp=result.rows
	
	})
	
	
	client.query('select * from servicii where content like \'%'+searchQuery+'%\' union select * from servicii where link_title like \'%'+searchQuery+'%\'', [], function (err, result) {
	
	serviciiresp=result.rows
	})

	client.query('select * from produse where content like \'%'+searchQuery+'%\' union select * from produse where link_title like \'%'+searchQuery+'%\'', [], function (err, result) {
	
	produseresp=result.rows
	
	

	
	response.render('search',{
		baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		news: news,
		achizitii: achizitii,
		resurseresp: resurseresp,
		serviciiresp: serviciiresp,
		produseresp: produseresp,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
		
	})
	})  
})

app.get('/va-ofera', (request, response) => {
	var header='';
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var program ='';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var achizitii ='';
	var resurseresp='';
	var produseresp='';
	var serviciiresp='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
		
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})

	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	})
	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})
	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	
	//search query
	client.query('select * from resurse', [], function (err, result) {
	
	resurseresp=result.rows
	
	})
	
	
	client.query('select * from servicii', [], function (err, result) {
	
	serviciiresp=result.rows
	})

	client.query('select * from produse', [], function (err, result) {
	
	produseresp=result.rows
	
	

	
	response.render('servicii-resurse-produse',{
		baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		resurseresp: resurseresp,
		serviciiresp: serviciiresp,
		produseresp: produseresp,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		header: header
		
	})
	})  
})

app.get('/tutoriale', (request, response) => {
	var header='';
	var tutorialeId = request.query.id;
	var tutorialeContent='';
	var program ='';
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
	
	client.query(sql_tutoriale+" where id="+tutorialeId, [], function (err, result) {
	
	tutorialeContent = result.rows;
	})
		
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})	
		
	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})	
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})

	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	response.render('tutoriale', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: 'none',
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		tutorialecontent: tutorialeContent,
		header: header
    })
})    
})

app.get('/pentru-utilizatori', (request, response) => {
	var header='';
	var pentru_utilizatoriId = request.query.id;
	var pentru_utilizatoriContent='';
	var program ='';
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
	
	client.query(sql_pentru_utilizatori+" where id="+pentru_utilizatoriId, [], function (err, result) {
	
	pentru_utilizatoriContent = result.rows;
	})

	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})	
		
		
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})	
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})

	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	response.render('pentru-utilizatori', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: 'none',
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		pentruutilizatoricontent: pentru_utilizatoriContent,
		header: header
    })
})    
})

app.get('/despre-noi', (request, response) => {
	var header='';
	var despre_noiId = request.query.id;
	var despre_noiContent='';
	var program ='';
	var panorama;
	var sliderFull = [];
	var idAchiz = '';
	var displayFlagSlider = '';
	var proiecte ='';
	var contacte ='';
	var linkuri ='';
	var servicii ='';
	var resurse ='';
	var produse ='';
	var pentru_utilizatori='';
	var tutoriale='';
	var despre_noi='';
	var client = request.app.get('client');
	

	client.query(sql_left_block_slider, [], function (err, result) {
	
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
		
	client.query(sql_despre_noi+" where id="+despre_noiId, [], function (err, result) {
	
	despre_noiContent = result.rows;
	})	
		
		
	client.query(sql_tutoriale, [], function (err, result) {
	
	tutoriale = result.rows;
	})
	
	client.query(sql_despre_noi, [], function (err, result) {
	
	despre_noi = result.rows;
	})
	
	client.query(sql_pentru_utilizatori, [], function (err, result) {
	
	pentru_utilizatori = result.rows;
	})	
		
	client.query(sql_header, [], function (err, result) {
	header = result.rows;
	})
	
	client.query(sql_program, [], function (err, result) {
	
	program = result.rows;
	})	
	
	client.query(sql_proiecte, [], function (err, result) {
	
	proiecte = result.rows;
	})
	
	client.query(sql_contacte, [], function (err, result) {
	
	contacte = result.rows;
	})
	
	client.query(sql_linkuri, [], function (err, result) {
	
	linkuri = result.rows;
	})

	
	client.query(sql_servicii, [], function (err, result) {
	
	servicii = result.rows;
	})
	
	client.query(sql_resurse, [], function (err, result) {
	
	resurse = result.rows;
	})
	
	client.query(sql_produse, [], function (err, result) {
	
	produse = result.rows;
	})
	
	client.query(sql_panorama, [], function (err, result) {
	
	panorama = result.rows;
	response.render('despre-noi', {
        baseheaderimg: panorama,
		slider: sliderFull,
		idachizitii: idAchiz,
		displayachizitii: displayFlagSlider,
		visits: uniqueVisitors,
		visitstotal: visits,
		displayallert: 'none',
		program: program,
		proiecte: proiecte,
		contacte: contacte,
		linkuri: linkuri,
		resurse: resurse,
		servicii: servicii,
		produse: produse,
		desprenoi: despre_noi,
		pentruutilizatori: pentru_utilizatori,
		tutoriale: tutoriale,
		desprenoicontent: despre_noiContent,
		header: header
    })
})  
})	
	
    // site server
    app.listen(port, function () {
        console.log(`My awesome site listening on port ${port}`);
    });
});
//app.listen(3000)




 

