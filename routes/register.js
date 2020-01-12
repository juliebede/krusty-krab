const express = require('express');
const bcrypt = require('bcrypt');

module.exports = (db) => {
  const router = express.Router();
  const register = require('../models/register')(db)

  router.get("/", (req, res) => {
    // ensure that the user is not logged in.
    if (req.session.customer_id)
      res.redirect('/')

    let templateVars = {};
    res.render("register", templateVars);
  });

  router.post("/", (req, res) => {
    // import register from models to place user in db.
    const username = req.body.username
    const password = bcrypt.hashSync(req.body.password, 10)
    const sms      = req.body.cellNumber
    
    // call verify username from our models.
    register.verifyUsername(username)
      .then(result => {
        if (!result) {
          register.verifySMS(sms)
            .then(result => {
              if (result) {
                // add customer to db and re-route to orders.
                register.addCustomer(username, password, sms)
                  .then(result => {
                    if (result) {
                      res.redirect("orders")
                      return;
                    }
                    res.redirect('/')
                  })
                  .catch(err => res.send(err))
              } else {
                res.status(403).send("ERROR: SMS taken or bad input")
              }
            })
            .catch(err => res.send(err))
        } else {
          // tell user username/sms is already taken.
          res.status(403).send("ERROR: username already taken");
        }
      })
      .catch(err => res.send(err))
    return;
  });

  return router;
};