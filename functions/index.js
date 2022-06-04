const functions = require("firebase-functions");
const admin = require("firebase-admin");
const serviceAccount = require("./secure.json");
const { default: axios } = require("axios");

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://feathers-c926c-default-rtdb.firebaseio.com",
});

const runFunc = () => {
  const nowUTCEpochTimeInMilliSec = new Date(Date.now()).getTime();

  admin
    .database(app)
    .ref("/campaigns")
    .once("value", (snapshot) => {
      snapshot.forEach((allRunningCampaigns) => {
        const singularCampaignObj = allRunningCampaigns
          .child("runningCampaign")
          .val();

        if (
          Date.parse(`${singularCampaignObj.lastRoll}Z`) +
            singularCampaignObj.loopTimeSeconds * 1000 -
            nowUTCEpochTimeInMilliSec >
          0
        ) {
          admin
            .database(app)
            .ref(`/campaigns/${singularCampaignObj?.assetId}`)
            .remove();
        }
      });
    });
};

exports.scheduledDelete = functions.pubsub
  .schedule("59 23 * * *")
  .onRun((context) => {
    runFunc();
  });
