const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const config = require('./config.json');

const app = express();
const port = 1337;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/profiles/get/', (req, res) => {
    if(!req.body.profileId) res.send("Error. Specify profileId");
    try {
        fs.readdirSync("./user/profiles").forEach(file => {
            if(file == (req.body.profileId + ".json")) {
                try {
                    let info = JSON.parse(fs.readFileSync(`./user/profiles/${file}`));
                    res.send({
                        profileInfo: {
                            profileId: info.info.id,
                            profileName: info.info.username,
                        },
                        PMCInfo: {
                            lastSession: info.characters.pmc.Stats.Eft.LastSessionDate < info.characters.scav.Stats.Eft.LastSessionDate ? info.characters.scav.Stats.Eft.LastSessionDate : info.characters.pmc.Stats.Eft.LastSessionDate
                        }
                    });
                }
                catch (err) {
                    console.log(err)
                }
            }
            else {
                res.send(`no profiles found`);
            }
        })
        
    }
    catch (err) {
        console.log(err)
    }
});

app.post('/profiles/get/everyone', (req, res) => {
    try {
        let profilesFileList = []

        fs.readdirSync("./user/profiles").forEach(file => {
            if(file.endsWith(".json")) profilesFileList.push(file);
        })

        let profiles = {};

        if(profilesFileList.length > 0) {
            profilesFileList.forEach(profile => {
                try {
                    let info = JSON.parse(fs.readFileSync(`./user/profiles/${profile}`));
                    profiles[profile.replace(".json", "")] = {
                        profileInfo: {
                            profileId: info.info.id,
                            profileName: info.info.username,
                        },
                        PMCInfo: {
                            lastSession: info.characters.pmc.Stats.Eft.LastSessionDate < info.characters.scav.Stats.Eft.LastSessionDate ? info.characters.scav.Stats.Eft.LastSessionDate : info.characters.pmc.Stats.Eft.LastSessionDate
                        }

                    };
                }
                catch (err) {
                    console.log(err)
                }
            })
            res.send(profiles)
        }
        else {
            res.send(`no profiles found`);
        }
    }
    catch (err) {
        console.log(err)
    }
});

app.listen(port, config.IP_ADDRESS, () => {
    console.log(`Server is running on http://${config.IP_ADDRESS}:${port}`);
});