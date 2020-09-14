require("dotenv").config();

const request = require("request");
const Trello = require("trello-node-api")(process.env.TRELLO_API_KEY, process.env.OAUTH_TOKEN)

const then = new Date().getTime();

console.log("[APP] Initialized!")

console.log("[BAKALARI] Sending POST request to /api/login")

request.post({
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    url: 'https://bakalari.SCHOOL.cz/api/login',
    body: `client_id=ANDR&grant_type=password&username=USERNAME&password=PASSWORD`
}, function (error, response, body) {
    console.log("[BAKALARI] Received a response from /api/login")

    let bakaResponse = JSON.parse(body);
    let token = bakaResponse["access_token"];

    console.log("[BAKALARI] Sending GET to /api/3/homeworks")
    request.get({
        headers: { 'content-type': 'application/x-www-form-urlencoded',
                    'authorization': `Bearer ${token}` },
        url: 'https://bakalari.SHCOOL.cz/api/3/homeworks',
        body: 'from=2020-09-01'
    }, function (error, response, body) {
        console.log("[BAKALARI] Received a response from /api/3/homeworks")

        bakaResponse = JSON.parse(body);

        console.log("[BAKALARI] Homework count: " + bakaResponse["Homeworks"].length)

        for (let i = 0; i < (bakaResponse["Homeworks"].length); i++) {
            console.log("[BAKALARI] " + bakaResponse["Homeworks"][i]["ID"] + ": " + bakaResponse["Homeworks"][i]["Content"].replace(/\r?\n|\r/, ", "))

            console.log("[TRELLO] Searching trello for " + bakaResponse["Homeworks"][i]["Content"].replace(/\r?\n|\r/, ", "))

            Trello.board.searchCardsFilter("BOARD_ID", "open").then(function (trelloResponse) {
                for (let j = 0; j < trelloResponse.length; j++) {
                    if (bakaResponse["Homeworks"][i]["Content"].replace(/\r?\n|\r/, ", ") === trelloResponse[j]["name"]) {
                        console.log("[TRELLO] Duplicate homework found! Homework: " + trelloResponse[j]["name"] + ". Skipping!")
                        return;
                    }
                }

                console.log("[TRELLO] New homework found! Homework: " + bakaResponse["Homeworks"][i]["Content"].replace(/\r?\n|\r/, ", "))
                console.log("[TRELLO] Adding " + bakaResponse["Homeworks"][i]["Content"].replace(/\r?\n|\r/, ", ") + "to Trello")

                let data = {
                    name: bakaResponse["Homeworks"][i]["Content"].replace(/\r?\n|\r/, ", "),
                    idList: 'LIST_ID',
                    pos: 'top'
                };

                Trello.card.create(data).catch(function (error) {
                    console.log(error);
                })

                console.log("[TRELLO] Homework successfully added!")
            }).catch(function (error) {
                console.log(error);
            }).then(() => {
                const now = new Date().getTime();
                const time = now - then;

                console.log("[APP] App finished after " + time + "ms");
            });
        }
    })
});
