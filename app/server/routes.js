var AM = require('./modules/account-manager');
var ML = require('./modules/major-list');
var AL = require('./modules/age-list');
var GL = require('./modules/gender-list');
var SL = require('./modules/state-list');
var EM = require('./modules/email-dispatcher');

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

    app.post('/lost-password', function(req, res){
		let email = req.body['email'];
		AM.generatePasswordKey(email, req.ip, function(e, account){
			if (e){
				res.status(400).send(e);
			}	else{
				EM.dispatchResetPasswordLink(account, function(e, m){
			// TODO this callback takes a moment to return, add a loader to give user feedback //
					if (!e){
						res.status(200).send('ok');
					}	else{
						for (k in e) console.log('ERROR : ', k, e[k]);
						res.status(400).send('unable to dispatch password reset');
					}
				});
			}
		});
	});

	app.get('/reset-password', function(req, res) {
		AM.validatePasswordKey(req.query['key'], req.ip, function(e, o){
			if (e || o == null){
				res.redirect('/');
			} else{
				req.session.passKey = req.query['key'];
				res.render('reset', { title : 'Reset Password' });
			}
		})
	});

	app.post('/reset-password', function(req, res) {
		let newPass = req.body['pass'];
		let passKey = req.session.passKey;
	// destory the session immediately after retrieving the stored passkey //
		req.session.destroy();
		AM.updatePassword(passKey, newPass, function(e, o){
			if (o){
				res.status(200).send('ok');
			}	else{
				res.status(400).send('unable to update password');
			}
		})
	});

    app.get('/print', function(req, res) {
		AM.getAllRecords( function(e, accounts){
			res.render('print', { title : 'Account List', accts : accounts });
		})
	});

	app.post('/delete', function(req, res){
		AM.deleteAccount(req.session.user._id, function(e, obj){
			if (!e){
				res.clearCookie('login');
				req.session.destroy(function(e){ res.status(200).send('ok'); });
			}	else{
				res.status(400).send('record not found');
			}
		});
	});

	app.get('/reset', function(req, res) {
		AM.deleteAllAccounts(function(){
			res.redirect('/print');
		});
	});

	app.get('*', function(req, res) { res.render('404', { title: 'Page Not Found'}); });
};
