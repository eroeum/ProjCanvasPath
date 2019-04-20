var AM = require('./modules/account-manager');

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
};
