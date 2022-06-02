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

        console.log(singularCampaignObj);

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

const setDataToDb = async () => {
  const responseFromPost = await axios.post(
    `https://wax.pink.gg/v1/chain/get_table_rows`,
    {
      json: true,
      code: "fortunebirds",
      scope: "fortunebirds",
      table: "campaigns",
      limit: 150,
    }
  );
  admin
    .database(app)
    .ref("/campaigns")
    .once("value", async (snapshot) => {
      try {
        for (let i = 0; i < responseFromPost.data?.rows?.length; i++) {
          const runningCampaigns = responseFromPost.data?.rows[i];

          if (
            runningCampaigns?.asset_ids?.length > 0 &&
            snapshot.hasChild(runningCampaigns?.asset_ids[0]) == false
          ) {
            const response = await axios.get(
              `https://wax.api.atomicassets.io/atomicassets/v1/assets/${runningCampaigns?.asset_ids[0]}`
            );
            const runningCampaign = {
              joinedAccounts: runningCampaigns?.accounts || [],
              assetId: response.data?.data?.asset_id,
              contractAccount: runningCampaigns?.contract_account,
              nftImgUrl: `https://ipfs.io/ipfs/${response?.data?.data?.data?.img}`,
              videoNftUrl: `https://ipfs.io/ipfs/${response?.data?.data?.template?.immutable_data?.video}`,
              isVideo:
                `https://ipfs.io/ipfs/${response?.data?.data?.data?.img}` ==
                true
                  ? false
                  : `https://ipfs.io/ipfs/${response?.data?.data?.data?.video}` !=
                    `https://ipfs.io/ipfs/undefined`
                  ? true
                  : false,
              campaignId: runningCampaigns?.id,
              creator: runningCampaigns?.authorized_account,
              entryCost: runningCampaigns?.entrycost,
              totalEntriesStart: runningCampaigns?.accounts?.length || 0,
              totalEntriesEnd: runningCampaigns?.max_users,
              loopTimeSeconds: runningCampaigns?.loop_time_seconds,
              lastRoll: runningCampaigns?.last_roll,
              totalEntriesEnd: runningCampaigns?.max_users,
            };

            admin
              .database(app)
              .ref(`/campaigns/${runningCampaigns?.asset_ids[0]}`)
              .set(runningCampaign);
          }
        }
      } catch (error) {
        console.log(error);
      }
    });
};

exports.addNewCampaign = functions.https.onCall((data, context) => {
  setDataToDb();
});
