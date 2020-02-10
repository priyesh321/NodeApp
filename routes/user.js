const express = require("express");
const { check, validationResult } = require("express-validator/check");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../model/User");
const Product = require("../model/Product")

// Registraton api
router.post(
  "/signup",
  [
    check("phoneNumber", "Please Enter a Valid phoneNumber")
      .not()
      .isEmpty()
    ,
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6
    }),
    check("address", "Please enter address")
      .not()
      .isEmpty(),
    check("dob", "Please enter dob")
      .not()
      .isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }
    const {
      phoneNumber,
      email,
      password,
      address,
      dob,
      securityQuestion,
      files,
      answer1,
      answer2,
      answer3,
      question1,
      question2,
      question3
    } = req.body;
    try {
      let user = await User.findOne({
        email
      });
      if (user) {
        return res.status(400).json({
          msg: "User Already Exists"
        });
      }
      user = new User({
        phoneNumber,
        email,
        password,
        address,
        dob,
        securityQuestion,
        files,
        answer1,
        answer2,
        answer3,
        question1,
        question2,
        question3
      });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      const data = user.save();
      await data
      const payload = {
        user: {
          id: user.id
        }
      };
      jwt.sign(payload, "randomString",
        {
          expiresIn: 10000
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token
          });
        }
      );
    } catch (err) {
      console.log(err.message);
      res.status(500).send("Error in Saving");
    }
  }
);


// Get user by id
router.get(
  '/getUser/:id',
  async (req, res) => {
    const id = req.params.id
    let user = await User.findOne({
      _id: id
    });
    if (!user)
      return res.status(400).json({
        message: "User Not Exist"
      });
    res.status(200).json({
      user
    });
  }
)


// Update user by id
router.put(
  '/updateUser/:id',
  async (req, res) => {
    const id = req.params.id
    let user_details = await User.findOne({
      _id: id
    })
    // Find id and update it with the request body
    User.findByIdAndUpdate(req.params.id, {
      phoneNumber: req.body.phoneNumber ? req.body.phoneNumber : user_details.phoneNumber,
      email: req.body.email ? req.body.email : user_details.email,
      dob: req.body.dob ? req.body.dob : user_details.dob,
      address: req.body.address ? req.body.address : user_details.address,
      files: req.body.files ? req.body.files : user_details.files,
      question1: req.body.question1 ? req.body.question1 : user_details.question1,
      question2: req.body.question2 ? req.body.question2 : user_details.question2,
      question3: req.body.question3 ? req.body.question3 : user_details.question3,
      answer1: req.body.answer1 ? req.body.answer1 : user_details.answer1,
      answer2: req.body.answer2 ? req.body.answer2 : user_details.answer2,
      answer3: req.body.answer3 ? req.body.answer3 : user_details.answer3,
    }, { new: true })
      .then(id => {
        if (!id) {
          return res.status(404).send({
            message: "Note not found with id " + req.params.id
          });
        }
        res.send(id);
      }).catch(err => {
        if (err.kind === 'ObjectId') {
          return res.status(404).send({
            message: "Note not found with id " + req.params.id
          });
        }
        return res.status(500).send({
          message: "Error updating note with id " + req.params.id
        });
      });
  }
)

// Reset password
router.put(
  "/reset-password/:id",
  async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const id = req.params.id
    try {
      User.findOne({
        _id: id
      }).then((user) => {
        if (!user) {
          return throwFailed(res, 'No user found with that id.')
        }
        else {
          bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
            if (err) {
              throw err
            } else if (!isMatch) {
            } else {
              const saltRounds = 10
              bcrypt.genSalt(saltRounds, (err, salt) => {
                if (err) {
                  throw err
                } else {
                  bcrypt.hash(newPassword, salt, (err, hash) => {
                    if (err) {
                      throw err
                    } else {
                      User.findByIdAndUpdate(req.params.id, {
                        password: hash,
                      }, { new: true })
                        .then(id => {
                          if (!id) {
                            return res.status(404).send({
                              message: "Note not found with id " + req.params.id
                            });
                          }
                          res.send(id);
                        }).catch(err => {
                          if (err.kind === 'ObjectId') {
                            return res.status(404).send({
                              message: "Note not found with id " + req.params.id
                            });
                          }
                          return res.status(500).send({
                            message: "Error updating note with id " + req.params.id
                          });
                        });
                    }
                  })
                }
              })
            }
          })
        }
      })
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }
  }
);


// Login api
router.post(
  "/login",
  [
    check("email", "Please enter a valid email").isEmail(),
    check("password", "Please enter a valid password").isLength({
      min: 6
    })
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array()
      });
    }

    const { email, password } = req.body;
    try {
      let user = await User.findOne({
        email
      });
      if (!user)
        return res.status(400).json({
          message: "User Not Exist"
        });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({
          message: "Incorrect Password!"
        });

      const payload = {
        user: {
          id: user.id
        }
      };
      jwt.sign(payload, "secret",
        {
          expiresIn: 3600
        },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({
            token,
            'email': email,
            'id': user.id
          });
        }
      );
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Server Error"
      });
    }
  }
);


//Create new Product
router.post(
  "/create-product",
  async (req, res) => {
    let reqBody = await req.body;
    if (Object.keys(reqBody).length === 0) {
      return res.status(400).send({
        message: "Product content can not be empty"
      })
    } else {
      const product = new Product({
        title: req.body.title || "No product title",
        description: req.body.description,
        price: req.body.price,
        company: req.body.company
      });
      product.save()
        .then(data => {
          res.send(data);
        }).catch(err => {
          res.status(500).send({
            message: err.message || "Something wrong while creating the product."
          });
        })
    }
  }
)


// Get all products
router.get(
  "/get-product",
  async (req, res) => {
    const pageNo = parseInt(req.query.pageNo)
    const size = parseInt(req.query.size)
    const query = {}
    if (pageNo < 0 || pageNo === 0) {
      response = { "error": true, "message": "invalid page number, should start with 1" };
      return res.json(response)
    }
    query.skip = size * (pageNo - 1)
    query.limit = size
    Product.count({}, (err, totalCount) => {
      if (err)
        return res.status(400).json({
          message: "Product Not Exist"
        });
      Product.find({}, {}, query, (err, data) => {
        // Mongo command to fetch all data from collection.
        if (err) {
          response = { "error": true, "message": "Error fetching data" };
        } else {
          const totalPages = Math.ceil(totalCount / size)
          response = {
            "error": false,
            "product": data,
            "pages": totalPages
          };
        }
        res.json(response);
      });
    })
  }
)


// Delete product by id
router.delete(
  "/delete-product/:productId",
  async (req, res) => {
    Product.findByIdAndRemove(req.params.productId)
      .then(product => {
        if (!product) {
          return res.status(404).send({
            message: "Product not found with id " + req.params.productId
          });
        }
        res.send({ message: "Product deleted successfully!" });
      }).catch(err => {
        if (err.kind === 'ObjectId' || err.name === 'NotFound') {
          return res.status(404).send({
            message: "Product not found with id " + req.params.productId
          });
        }
        return res.status(500).send({
          message: "Could not delete product with id " + req.params.productId
        });
      });
  }
)

module.exports = router;