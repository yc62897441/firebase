const admin = require('firebase-admin')
const serviceAccount = require('../trypwafirebasenativemod-firebase-adminsdk-h159z-3ba405c02d.json') // Firebase Admin SDK
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

const functions = require('firebase-functions')

// // Create and deploy your first functions
// // https://firebase.google.com/docs/functions/get-started
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// server可以push messages到瀏覽器供應商的push server
const webpush = require('web-push')
exports.storePostData = functions.https.onRequest((request, response) => {
    cors(request, response, function () {
        admin
            .database()
            .ref('posts')
            .push({
                id: request.body.id,
                title: request.body.title,
                location: request.body.location,
                image: request.body.image,
            })
            .then(function () {
                // 來設定server的金鑰資訊
                webpush.setVapidDetails(
                    'mailto:j84077200345@gmail.com', // server 的對外信箱
                    'BDIOql6aKK-00AGzVKggeN9LSpjGd2golLzuiCvmUG0NAIa3wi-FmG17HElLHhXtzQBQQ9faZmJ2MWW87VI8bgg', // 公鑰
                    'JxB633wEwprQT3hahwrNPoimHshPRj0Kd9OK11IXlQ8' // 私鑰
                )
                return admin.database().ref('subscriptions').once('value') // 從資料庫裡獲取目前所有訂閱用戶的資訊
            })
            .then(function (subscriptions) {
                subscriptions.forEach(function (sub) {
                    const pushConfig = {
                        endpoint: sub.val().endpoint,
                        keys: {
                            auth: sub.val().keys.auth,
                            p256dh: sub.val().keys.p256dh,
                        },
                    }

                    // push到瀏覽器供應商的push server
                    webpush
                        .sendNotification(
                            pushConfig, // 資料庫中的每一筆用戶訂閱資訊(endpoint+keys)
                            JSON.stringify({ title: '新貼文', content: '有新增的貼文!!' }) // 要推送的訊息(json format)
                        )
                        .catch(function (err) {
                            console.log(err)
                        })
                })
                response.status(201).json({ message: 'Data Stored', id: request.body.id })
            })
            .catch(function (err) {
                response.status(500).json({ error: err })
            })
    })
})
