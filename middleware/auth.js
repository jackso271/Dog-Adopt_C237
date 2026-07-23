function checkCustomer(req, res, next) {
    if (req.session.user && req.session.user.role === 'Customer') {
        return next();
    }

    return res.status(403).render('error', {
        message: 'Customer access only.'
    });
}

function checkStaff(req, res, next) {
    if (req.session.user && req.session.user.role === 'Staff') {
        return next();
    }

    return res.status(403).render('error', {
        message: 'Staff access only.'
    });
}

function checkAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'Admin') {
        return next();
    }

    return res.status(403).render('error', {
        message: 'Admin access only.'
    });
}

module.exports = {
    checkCustomer,
    checkStaff,
    checkAdmin
};
