var AM = require('./modules/account-manager');
var ML = require('./modules/major-list');
var AL = require('./modules/age-list');
var GL = require('./modules/gender-list');
var SL = require('./modules/state-list');

module.exports = function(app) {

    /* Login */
    app.get('/', function(req, res) {
        if (req.cookies.login == undefined) {
            res.render('login', { title: 'Hello - Please Login To Your Account' });
        } else {
            AM.validateLoginKey(req.cookies.login, req.ip, function(e, o){
                if (o) {
                    AM.autoLogin(o.user, o.pass, function(o) {
                        req.session.user = o;
                        res.redirect('/home');
                    });
                } else {
                    res.render('login', { title: 'Hello - Please Login To Your Account' });
                }
            });
        }
    });

    app.post('/', function(req, res){
        AM.manualLogin(req.body['user'], req.body['pass'], function(e, o){
            if (!o){
                res.status(400).send(e);
            }	else{
                req.session.user = o;
                if (req.body['remember-me'] == 'false'){
                    res.status(200).send(o);
                }	else{
                    AM.generateLoginKey(o.user, req.ip, function(key){
                        res.cookie('login', key, { maxAge: 900000 });
                        res.status(200).send(o);
                    });
                }
            }
        });
    });

    app.post('/logout', function(req, res){
        res.clearCookie('login');
        req.session.destroy(function(e){ res.status(200).send('ok'); });
    })

    app.get('/signup', function(req, res) {
        res.render('signup', {  title: 'Signup', majors: ML, ages: AL, genders: GL, states: SL});
    });

    app.post('/signup', function(req, res){
        AM.addNewAccount({
        name 	: req.body['name'],
        email 	: req.body['email'],
        user 	: req.body['user'],
        pass	: req.body['pass'],
        major   : req.body['major'],
        age     : req.body['age'],
        street  : req.body['street'],
        city    : req.body['city'],
        zipcode : req.body['zipcode'],
        state   : req.body['state'],
        gender  : req.body['gender']
        }, function(e){
            if (e){
                res.status(400).send(e);
            }	else{
                res.status(200).send('ok');
            }
        });
    });
};
