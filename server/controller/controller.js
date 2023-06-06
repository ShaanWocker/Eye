const mongoose = require('mongoose');
const UserDB = require('../model/model');

exports.createUser = (req, res) => {
  const user = new UserDB({
    active: "yes",
    status: "0",
  });

  user
    .save()
    .then((data) => {
      res.send(data._id);
    })
    .catch((err) => {
      res.status(500).send({
        message: err.message || "Some error occurred while creating a user",
      });
    });
  };
  
  exports.leavingUserUpdate = (req, res) => {
    const userid = req.params.id;
    console.log(`Leaving user ID is: ${userid}`);
  
    UserDB.findByIdAndUpdate(
      userid,
      { $set: { active: "no", status: "0" } },
      { new: true } // This ensures the updated user object is returned
    )
      .then((data) => {
        if (!data) {
          res.status(404).send({
            message: `Cannot update user with ID ${userid}, it may be that the user cannot be found.`
          });
        } else {
          res.send(data); // Return the updated user object
        }
      })
      .catch((err) => {
        res.status(500).send({ message: "Error updating user information" });
      });
  };
  
  exports.newUserUpdate = (req, res) => {
    const userid = req.params.id;
    console.log(`New user ID is: ${userid}`);
  
    UserDB.findByIdAndUpdate(
      userid,
      { $set: { active: "yes" } },
      { new: true } // This ensures the updated user object is returned
    )
      .then((data) => {
        if (!data) {
          res.status(404).send({
            message: `Cannot update user with ID ${userid}, it may be that the user cannot be found.`
          });
        } else {
          res.send(data); // Return the updated user object
        }
      })
      .catch((err) => {
        res.status(500).send({ message: "Error updating user information" });
      });
  };
  
  exports.updateOnEngagement = (req, res) => {
    const userid = req.params.id;
    console.log(`Updating engagement for user ID: ${userid}`);
  
    UserDB.findByIdAndUpdate(
      userid,
      { $set: { status: "1" } },
      { new: true } // This ensures the updated user object is returned
    )
      .then((data) => {
        if (!data) {
          res.status(404).send({
            message: `Cannot update user with ID ${userid}, it may be that the user cannot be found.`
          });
        } else {
          res.send(data); // Return the updated user object
        }
      })
      .catch((err) => {
        res.status(500).send({ message: "Error updating user information" });
      });
  };

  exports.updateOnNext = (req, res) => {
    const userid = req.params.id;
    console.log(`Updating engagement for user ID: ${userid}`);
  
    UserDB.findByIdAndUpdate(
      userid,
      { $set: { status: "0" } },
      { new: true } // This ensures the updated user object is returned
    )
      .then((data) => {
        if (!data) {
          res.status(404).send({
            message: `Cannot update user with ID ${userid}, it may be that the user cannot be found.`
          });
        } else {
          res.send(data); // Return the updated user object
        }
      })
      .catch((err) => {
        res.status(500).send({ message: "Error updating user information" });
      });
  };
  
exports.remoteUserFind = (req, res) => {
  const { eyeID } = req.body;
    if (!eyeID) {
      res.status(400).send({ message: "eyeID is required in the request body" });
      return;
    }


  UserDB.aggregate([
    {
      $match: {
        _id: {
          $ne: new mongoose.Types.ObjectId(eyeID),
        },
        active: "yes",
        status: "0"
      }
    },
    {$sample:{size:1}},
  ])
  .then((data) => {
    res.send(data);
  })
  .catch((err) => {
    res.status(500).send({
      message: 
        err.message || "Error occured while retreiving user information.",
    });
  });

}

exports.getNextUser = (req, res) => {
  const eyeID = req.body.eyeID;
  const remoteUser = req.body.remoteUser;

  let excludedIds = [
    eyeID,
    remoteUser
  ];

  UserDB.aggregate([
    {
      $match: {
        _id: { $nin: excludedIds },
        active: "yes",
        status: "0"
      }
    },
    { $sample: { size: 1 } },
  ])
  .then((data) => {
    if (data.length > 0) {
      res.send(data[0]._id); // Send the user ID property of the retrieved user
    } else {
      res.status(404).send({
        message: "No available users found."
      });
    }
  })
  .catch((err) => {
    res.status(500).send({
      message: err.message || "Error occurred while retrieving user information.",
    });
  });
};
