const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("./secure.json");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://feathers-c926c-default-rtdb.firebaseio.com",
});

const runFunc = () => {
  admin.database(app).ref(`/endedCampaigns`).remove();
  // const nowUTCEpochTimeInMilliSec = new Date(Date.now()).getTime();

  // admin
  //   .database(app)
  //   .ref("/endedCampaigns")
  //   .once("value", (snapshot) => {
  //     snapshot.forEach((allRunningCampaigns) => {
  //       const singularCampaignObj = allRunningCampaigns.val();

  //       if (
  //         Date.parse(`${singularCampaignObj.lastRoll}Z`) +
  //           singularCampaignObj.loopTimeSeconds * 1000 -
  //           nowUTCEpochTimeInMilliSec >
  //         0
  //       ) {
  //       }
  //     });
  //   });
};

exports.scheduledDelete = functions.pubsub
  .schedule("59 23 * * *")
  .onRun((context) => {
    runFunc();
  });
