require("dotenv").config()
const express = require("express")
const app= express()
const port = process.env.PORT || 3266;
const bodyparser = require("body-parser")
const cors = require("cors");
const { MongoClient, ObjectId } = require('mongodb');
const admin = require("firebase-admin");
const fileUpload = require("express-fileupload");


app.use(bodyparser.urlencoded({ extended: false }))
app.use(bodyparser.json())
app.use(cors())
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 },
}));

var serviceAccount = require("./volounteer-networt-firebase-adminsdk-x0gdg-e3ab79c916.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.USER_PASS}@cluster0.twfgu.mongodb.net/${process.env.USER_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {
    const publicCollection = client.db("volunteer").collection("public");
    const adminCollection = client.db("volunteer").collection("admin");
    
    app.get("/", (req, res) => {
        res.send(" server started successfully")
    })

    app.post("/addNwtwork",(req,res)=>{ 

        const receiveData= req.body
       publicCollection.insertOne(receiveData)
        .then(result=>{
            res.send(result.insertedId)
        })
    })

    app.get("/showWorkList",(req,res)=>{
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith("Bearer ")) {
            const idToken = bearer.split(' ')[1];

            admin.auth()
                .verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    if (tokenEmail === req.query.email) {
                        publicCollection.find({email: req.query.email})
                        .toArray((error,document)=>{
                            res.send(document)
                        })
                    }
                })
                .catch((error) => {
                    res.status(401).send("un-authorized access")
                });
        }
        else{
            ((error) => {
                res.status(401).send("un-authorized access")
                console.log(error.message)
            });
        } 
        
    })

    app.delete("/delete/:id",(req,res)=>{
        publicCollection.deleteOne({_id: ObjectId(req.params.id)})
        .then(result=>{
            res.send(result.deletedCount>0)
        })
    })

    app.get("/adminPage",(req,res)=>{
        if(req.query.email=='mishkat5826@gmail.com'){
            publicCollection.find({})
            .toArray((error, document) => {
                res.send(document)
            })
        }
    })
    
    app.post("/uploadEvent", (req,res)=>{
        const events= (req.body)
        adminCollection.insertOne(events)
        .then(result=>{
            res.send(result.insertedId)
        })
    })

    app.get("/eventLoad",(req,res)=>{
        adminCollection.find({})
        .toArray((err,document)=>{
            res.send(document)
        })
    })

    // client.close();
    console.log("load complite");   
});


app.listen(port, (req, res) => {
    console.log(`server is running at http://localhost:${port}`)
})