const express = require('express');
const connection = require('../db');
const { checkCustomer } = require('../middleware/auth');

const router = express.Router();

router.use(checkCustomer);

router.get('/dashboard', (req, res) => {
    const search = req.query.search || '';

    let sql = `
        SELECT *
        FROM dogs
        WHERE status = 'Available'
    `;
    let values = [];

    if (search) {
        sql += ' AND (name LIKE ? OR breed LIKE ?)';
        values = [`%${search}%`, `%${search}%`];
    }

    sql += ' ORDER BY dogId DESC';

    connection.query(sql, values, (error, results) => {
        if (error) {
            console.error('Customer dashboard error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve dogs.'
            });
        }

        res.render('customer/dashboard', {
            dogs: results,
            search: search
        });
    });
});

router.get('/dogs/:id', (req, res) => {
    const dogId = req.params.id;
    const userId = req.session.user.userId;
    const dogSql = `
        SELECT *
        FROM dogs
        WHERE dogId = ? AND status = 'Available'
    `;

    connection.query(dogSql, [dogId], (dogError, dogResults) => {
        if (dogError) {
            console.error('Dog details error:', dogError);
            return res.status(500).render('error', {
                message: 'Unable to retrieve dog details.'
            });
        }

        if (dogResults.length === 0) {
            return res.status(404).render('error', {
                message: 'Dog not found or no longer available.'
            });
        }

        const requestSql = `
            SELECT requestStatus
            FROM adoption_requests
            WHERE userId = ? AND dogId = ?
        `;

        connection.query(requestSql, [userId, dogId], (requestError, requestResults) => {
            if (requestError) {
                console.error('Request check error:', requestError);
                return res.status(500).render('error', {
                    message: 'Unable to check adoption request.'
                });
            }

            res.render('customer/dogDetails', {
                dog: dogResults[0],
                existingRequest: requestResults.length > 0 ? requestResults[0] : null
            });
        });
    });
});

router.post('/dogs/:id/adopt', (req, res) => {
    const dogId = req.params.id;
    const userId = req.session.user.userId;

    const dogSql = `
        SELECT dogId
        FROM dogs
        WHERE dogId = ? AND status = 'Available'
    `;

    connection.query(dogSql, [dogId], (dogError, dogResults) => {
        if (dogError) {
            console.error('Adoption dog check error:', dogError);
            req.flash('error', 'Unable to submit adoption request.');
            return res.redirect(`/customer/dogs/${dogId}`);
        }

        if (dogResults.length === 0) {
            req.flash('error', 'This dog is no longer available.');
            return res.redirect('/customer/dashboard');
        }

        const requestSql = `
            SELECT requestId
            FROM adoption_requests
            WHERE userId = ? AND dogId = ?
        `;

        connection.query(requestSql, [userId, dogId], (requestError, requestResults) => {
            if (requestError) {
                console.error('Duplicate request check error:', requestError);
                req.flash('error', 'Unable to submit adoption request.');
                return res.redirect(`/customer/dogs/${dogId}`);
            }

            if (requestResults.length > 0) {
                req.flash('error', 'You have already submitted a request for this dog.');
                return res.redirect(`/customer/dogs/${dogId}`);
            }

            const insertSql = `
                INSERT INTO adoption_requests (userId, dogId, requestStatus)
                VALUES (?, ?, 'Pending')
            `;

            connection.query(insertSql, [userId, dogId], (insertError) => {
                if (insertError) {
                    console.error('Adoption request error:', insertError);
                    req.flash('error', 'Unable to submit adoption request.');
                    return res.redirect(`/customer/dogs/${dogId}`);
                }

                req.flash(
                    'success',
                    'Your adoption request has been submitted. Please wait for our team to contact you.'
                );
                res.redirect(`/customer/dogs/${dogId}`);
            });
        });
    });
});

router.get('/requests', (req, res) => {
    const userId = req.session.user.userId;
    const sql = `
        SELECT
            adoption_requests.requestId,
            adoption_requests.requestStatus,
            adoption_requests.requestDate,
            dogs.dogId,
            dogs.name AS dogName,
            dogs.image
        FROM adoption_requests
        INNER JOIN dogs
            ON adoption_requests.dogId = dogs.dogId
        WHERE adoption_requests.userId = ?
        ORDER BY adoption_requests.requestDate DESC
    `;

    connection.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Request history error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve request history.'
            });
        }

        res.render('customer/requestHistory', {
            requests: results
        });
    });
});

module.exports = router;
