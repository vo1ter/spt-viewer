const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const sptAkiHttpConfig = require('../Aki_Data/Server/configs/http.json');
const questsDB = require('./quests.json');

// Fetch
const app = express();
const port = 1337;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Get quests info from users profile
async function getQuestsInfo(profileId) {
    const filePath = `../user/profiles/${profileId}.json`;
    const fileContent = fs.readFileSync(filePath);
    const data = JSON.parse(fileContent).characters.pmc.Quests;
    const quests = {}

    await data.forEach(async (quest) => {
        questStatus = ""
        switch(quest.status) {
            case 1:
                questStatus = "Available";
                break;
            case 2:
                questStatus = "In progress";
                break;
            case 3:
                questStatus = "Finished, awaiting confirmation";
                break;
            case 4:
                questStatus = "Finished";
                break;
            case 4:
                questStatus = "Failed";
                break;
            default:
                questStatus = "Undefined";
                break;
        }

        const timers = {}
        for(const [key, value] of Object.entries(quest.statusTimers)) {
            let timerStatus = "";
            switch(key) {
                case "1":
                    timerStatus = "Became available";
                    break;
                case "2":
                    timerStatus = "In progress";
                    break;
                case "3":
                    timerStatus = "Awaiting confirmation";
                    break;
                case "4":
                    timerStatus = "Finished";
                    break;
                default:
                    timerStatus = "Undefined";
                    break;
            }
            timers[timerStatus] = value;
        }

        let questName = "";

        try {
            questName = questsDB[quest.qid].name;
        }
        catch (err) {
            questName = quest.qid;
        }

        quests[quest.qid] = {
            title: questName,
            startTime: quest.startTime,
            status: questStatus,
            statusTimers: timers
        };
    })

    return quests;
}

async function getHideoutInfo(profileId) {
    const filePath = `../user/profiles/${profileId}.json`;
    const fileContent = fs.readFileSync(filePath);
    const data = JSON.parse(fileContent).characters.pmc.Hideout.Areas;

    const hideoutAreasPath = './hideoutAreas.json';
    const hideoutAreasContent = fs.readFileSync(hideoutAreasPath);
    const hideoutAreas = JSON.parse(hideoutAreasContent);

    const response = {}
    for(const area in data) {
        response[data[area].type] = {
            name: (Object.keys(hideoutAreas)[data[area].type]),
            active: data[area].active,
            completingTime: data[area].completingTime,
            level: data[area].level,
            inventory: data[area].slots,
        }
    }
    return response;
}

// Get traders info from users profile
async function getTradersInfo(profileId) {
    const filePath = `../user/profiles/${profileId}.json`;
    const fileContent = fs.readFileSync(filePath);
    const data = JSON.parse(fileContent).characters.pmc.TradersInfo;

    const response = {}
    for (const traderId in data) {
        if(traderId == "ragfair") continue;
        let traderName;
        switch (traderId) {
            case '54cb50c76803fa8b248b4571':
                traderName = 'Prapor';
                break;
            case '54cb57776803fa99248b456e':
                traderName = 'Therapist';
                break;
            case '579dc571d53a0658a154fbec':
                traderName = 'Fence';
                break;
            case '58330581ace78e27b8b10cee':
                traderName = 'Skier';
                break;
            case '5935c25fb3acc3127c3d8cd9':
                traderName = 'Peacekeeper';
                break;
            case '5a7c2eca46aef81a7ca2145d':
                traderName = 'Mechanic';
                break;
            case '5ac3b934156ae10c4430e83c':
                traderName = 'Ragman';
                break;
            case '5c0647fdd443bc2504c2d371':
                traderName = 'Jaeger';
                break;
            case '638f541a29ffd1183d187f57':
                traderName = 'Lighthouse Keeper';
                break;
            case '656f0f98d80a697f855d34b1':
                traderName = 'BTR-82 Driver';
                break;
            default:
                traderName = 'Unknown Trader';
        }
        response[traderName] = {
            traderId: traderId,
            traderLevel: data[traderId].loyaltyLevel,
            reputation: data[traderId].standing,
            salesSum: data[traderId].salesSum,
        };
    }

    return response;
}

// Get item data by ID
async function getItemById(itemId) {
    const response = await fetch(`https://db.sp-tarkov.com/api/item?id=${itemId}&locale=en`);

    const data = await response.json();
    return data;
}

// Get profile info
async function getProfileInfo(profileId, origin) {
    const filePath = `../user/profiles/${profileId}.json`;
    const fileContent = fs.readFileSync(filePath);
    const info = JSON.parse(fileContent);

    let location = "Not in raid";
    if(info.inraid.location !== "none") {
        switch (info.inraid.location) {
            case "RezervBase":
                location = "Reserve";
                break;
            case "Woods":
                location = "Woods";
                break;
            case "Interchange":
                location = "Interchange";
                break;
            case "factory4_day" || "factory4_night": 
                location = "Factory";
                break;
            case "bigmap":
                location = "Customs";
                break;
            case "Shoreline":
                location = "Shoreline";
                break;
            default:
                location = "Unknown";
        }
    }

    origin = origin || "soloProfile";
    if(origin == "everyone") {
        return {
            profileInfo: {
                profileId: info.info.id,
                profileName: info.info.username,
            },
            PMCInfo: {
                side: info.characters.pmc.Info.Side,
                lastSession: Math.max(info.characters.pmc.Stats.Eft.LastSessionDate, info.characters.scav.Stats.Eft.LastSessionDate),
            },
            inRaid: {
                location: location,
                character: info.inraid.character,
            }
        };
    }

    const skillsInfo = {};
    info.characters.pmc.Skills.Common.forEach(skill => {
        skillsInfo[skill.Id] = {
            progress: skill.Progress,
            lvl: Math.floor((skill.Progress / 100) + 1),
        };
    })

    const masteringInfo = {};
    info.characters.pmc.Skills.Mastering.forEach(skill => {
        masteringInfo[skill.Id] = {
            progress: skill.Progress,
        };
    })

    const kills = {};
    const killPromises = info.characters.pmc.Stats.Eft.Victims.map(async (kill) => {
        let weaponName = await getItemById(kill.Weapon.split(" ")[0]).then(async (response) => { return await response.locale.ShortName })
        kills[kill.ProfileId] = {
            username: kill.Name,
            side: kill.Side,
            level: kill.Level,
            bodypart: kill.BodyPart,
            distance: `${Math.round(kill.Distance * 100) / 100}m`,
            weapon: weaponName
        };
        return kills;
    });
    await Promise.all(killPromises);

    const hideoutPromises = info.characters.pmc.Inventory.items
        .filter(item => item.slotId === "hideout")
        .map(async (item) => {
            const itemData = await getItemById(item._tpl);
            var height = itemData.item._props.Height;
            var width = itemData.item._props.Width;
            let isGun = false;
            if (item.upd && item.upd.FireMode) {
                isGun = true;
                let attachedModules = info.characters.pmc.Inventory.items.filter(parentItem => parentItem.parentId === item._id);
                for (let module of attachedModules) {
                    let moduleData = await getItemById(module._tpl);
                    height += moduleData.item._props.ExtraSizeDown;
                    width += moduleData.item._props.ExtraSizeRight;
                }
            }
            return {
                name: itemData.locale.ShortName,
                fullName: itemData.locale.Name,
                height: height,
                width: width,
                id: item._tpl,
                isGun: isGun,
                slotId: item.slotId,
                location: item.location,
                upd: item.upd,
                parentId: item.parentId,
            };
        });
    const hideout = await Promise.all(hideoutPromises);

    return {
        profileInfo: {
            profileId: info.info.id,
            profileName: info.info.username,
            profilePackage: String(info.characters.pmc.Info.GameVersion).replaceAll("_", " ").toUpperCase(),
            totalPlayTime: info.characters.pmc.Stats.Eft.OverallCounters.TotalInGameTime
        },
        PMCInfo: {
            side: info.characters.pmc.Info.Side,
            experience: info.characters.pmc.Info.Experience,
            level: info.characters.pmc.Info.Level,
            pmcName: info.characters.pmc.Info.Nickname,
            registrationDate: info.characters.pmc.Info.RegistrationDate,
            lastSession: Math.max(info.characters.pmc.Stats.Eft.LastSessionDate, info.characters.scav.Stats.Eft.LastSessionDate),
            health: {
                body: {
                    head: info.characters.pmc.Health.BodyParts.Head.Health.Current + "/" + info.characters.pmc.Health.BodyParts.Head.Health.Maximum,
                    chest: info.characters.pmc.Health.BodyParts.Chest.Health.Current + "/" + info.characters.pmc.Health.BodyParts.Chest.Health.Maximum,
                    stomach: info.characters.pmc.Health.BodyParts.Stomach.Health.Current + "/" + info.characters.pmc.Health.BodyParts.Stomach.Health.Maximum,
                    leftArm: info.characters.pmc.Health.BodyParts.LeftArm.Health.Current + "/" + info.characters.pmc.Health.BodyParts.LeftArm.Health.Maximum,
                    rightArm: info.characters.pmc.Health.BodyParts.RightArm.Health.Current + "/" + info.characters.pmc.Health.BodyParts.RightArm.Health.Maximum,
                    leftLeg: info.characters.pmc.Health.BodyParts.LeftLeg.Health.Current + "/" + info.characters.pmc.Health.BodyParts.LeftLeg.Health.Maximum,
                    rightLeg: info.characters.pmc.Health.BodyParts.RightLeg.Health.Current + "/" + info.characters.pmc.Health.BodyParts.RightLeg.Health.Maximum,
                },
                energy: info.characters.pmc.Health.Energy.Current + "/" + info.characters.pmc.Health.Energy.Maximum,
                hydration: info.characters.pmc.Health.Hydration.Current + "/" + info.characters.pmc.Health.Hydration.Maximum,
            },
            skills: {
                skillsInfo,
                masteringInfo
            },
        },
        SCAVInfo: {
            experience: info.characters.scav.Info.Experience,
            level: info.characters.scav.Info.Level,
            scavName: info.characters.scav.Info.Nickname,

        },
        lastRaid: {
            sessionDate: Math.max(info.characters.pmc.Stats.Eft.LastSessionDate, info.characters.scav.Stats.Eft.LastSessionDate),
            kills
        },
        inventory: {
            hideout
        },
        inRaid: {
            location: info.inraid.location ? info.inraid.location : "Not in raid",
            character: info.inraid.character ? info.inraid.character : "Not in raid",
        }
    };
}

// Get all quests images
app.get('/img/quests/', async (req, res) => {
    const imgPath = path.join(__dirname, 'web/img/quests/');
    const files = await fs.promises.readdir(imgPath);
    const fileNames = await Promise.all(files.map(async (file) => {
        return file;
    }));
    res.send(fileNames);
});

app.get('/img/cache/get/:key', async (req, res) => {
    try {
        const imgPath = path.join(__dirname, 'web/img/cache/');
        const files = await fs.promises.readdir(imgPath);
        if(files.includes(`${req.params.key}-grid-image.webp`)) return res.send(`http://${sptAkiHttpConfig.ip}:${port}/img/cache/${req.params.key}-grid-image.webp`);
    }
    catch (error) {
        console.log(error)
    }
    return res.sendStatus(404)
});

app.post('/img/cache/append/', async (req, res) => {
    if(!req.body.key || !req.body.imageUrl) return res.send('Error. Specify key');
    try {
        fs.appendFileSync()
    }
    catch(err) {
        res.sendStatus(500)
    }
    const imgPath = path.join(__dirname, 'web/img/cache/');
    const files = await fs.promises.readdir(imgPath);
    console.log(files)
    res.send("1")
    // const fileNames = await Promise.all(files.map(async (file) => {
    //     return file;
    // }));
    // res.send(fileNames);
});

app.get('/img/quests/get/:key', async (req, res) => {
    try {
        await fetch(`http://${sptAkiHttpConfig.ip}:${port}/img/quests/`).then(res => res.text()).then(data => {
            let images = (data.replaceAll(/\[|\]|\"/g, "").replaceAll(",", " ")).split(" ");
            for(let i = 0; i < images.length; i++) {
                if(images[i].includes(`${req.params.key}.webp`)) {
                    return res.send(images[i]);
                }
            }
            return res.send("default.jpg");
        });
    }
    catch (error) {
        console.log(error)
    }
});

// Get profile info
app.post('/profiles/get/', async (req, res) => {
    if(!req.body.profileId) return res.send('Error. Specify profileId');

    try {
        const profileInfo = await getProfileInfo(req.body.profileId);
        res.send(profileInfo);
    } 
    catch (err) {
        console.log(err);
        res.send('Error reading profile');
    }
});

// Get all traders
app.post('/profiles/get/traders', async (req, res) => {
    if(!req.body.profileId) return res.send('Error. Specify profileId');

    try {
        const tradersInfo = await getTradersInfo(req.body.profileId);
        res.send(tradersInfo);
    } 
    catch (err) {
        console.log(err);
        res.send('Error reading profile');
    }
});

app.post('/profiles/get/hideout', async (req, res) => {
    if(!req.body.profileId) return res.send('Error. Specify profileId');

    try {
        const hideoutInfo = await getHideoutInfo(req.body.profileId);
        res.send(hideoutInfo);
    } 
    catch (err) {
        console.log(err);
        res.send('Error reading profile');
    }
});

// Get all quests
app.post('/profiles/get/quests', async (req, res) => {
    if(!req.body.profileId) return res.send('Error. Specify profileId');

    try {
        const questsInfo = await getQuestsInfo(req.body.profileId);
        res.send(questsInfo);
    } 
    catch (err) {
        console.log(err);
        res.send('Error reading profile');
    }
});

// Get all profiles
app.post('/profiles/get/everyone', async (req, res) => {
    try {
        const profilesFileList = fs.readdirSync('../user/profiles').filter((file) => file.endsWith('.json'));

        const profiles = await Promise.all(profilesFileList.map(async (file) => {
            const profileId = file.replace('.json', '');
            try {
                const profileInfo = await getProfileInfo(profileId, "everyone");
                return { [profileId]: profileInfo };
            } 
            catch (err) {
                console.log(err);
                return null;
            }
        }));

        const filteredProfiles = profiles.filter(profile => profile !== null);

        if(filteredProfiles.length > 0) {
            const reducedProfiles = filteredProfiles.reduce((acc, profile) => {
                return { ...acc, ...profile };
            }, {});

            res.send(reducedProfiles);
        } 
        else {
            res.send('No profiles found');
        }
    }
    catch (err) {
        console.log(err);
        res.send('Error reading profiles');
    }
});

// Serving the web page
app.use(express.static(path.join(__dirname, 'web')));

// Handling errors 400, 403, 404, 408
app.use((_, res, next) => {
    res.status(400).sendFile(path.join(__dirname, 'web/response-status', '400.html'));
});

app.use((_, res, next) => {
    res.status(403).sendFile(path.join(__dirname, 'web/response-status', '403.html'));
});

app.use((_, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'web/response-status', '404.html'));
});

app.use((_, res, next) => {
    res.status(408).sendFile(path.join(__dirname, 'web/response-status', '408.html'));
});

// Saves the configuration to a file and starts the server
app.listen(port, sptAkiHttpConfig.ip, () => {
    let rawConfig = fs.readFileSync('./web/config.json');
    let configInitial = JSON.parse(rawConfig);

    const config = {
        ip: sptAkiHttpConfig.ip,
        port: port,
        clientId: configInitial.clientId
    };
    const data = JSON.stringify(config, null, 2);
    fs.writeFile('web/config.json', data, (err) => {
        if (err) {
            console.error('Error writing file:', err);
        }
    });
    
    console.log(`Server is running on http://${sptAkiHttpConfig.ip}:${port}`);
    console.log(`You can view your website at http://${sptAkiHttpConfig.ip}:${port}/`);
});

// Discord RPC
// const RPC = require('discord-rpc');

// let rawConfig = fs.readFileSync('./web/config.json');
// let config = JSON.parse(rawConfig);
// const clientId = config.clientId;
// console.log(clientId);

// if (clientId != "YOUR_CLIENT_ID"){
//     const client = new RPC.Client({ transport: 'ipc', clientId: clientId });

//     client.on('ready', () => {
//     console.log(`Logged in as ${client.user.username}`);

//     // Side image
//     const filePath = `../user/profiles/662e3cdb0003f1b36e405e24.json`;
//     const fileContent = fs.readFileSync(filePath);
//     const info = JSON.parse(fileContent);
//     let side = info.characters.pmc.Info.Side;
//     let imgUrl = "";
//     if (side == "Usec") imgUrl = "https://dev.sp-tarkov.com/SPT-AKI/Server/raw/branch/master/project/assets/images/launcher/side_usec.png";
//     else if (side == "Bear") imgUrl = "https://dev.sp-tarkov.com/SPT-AKI/Server/src/branch/master/project/assets/images/launcher/side_bear.png";
//     else imgUrl = "https://dev.sp-tarkov.com/SPT-AKI/Server/src/branch/master/project/assets/images/launcher/scav.png";

//     client.setActivity({
//         details: "Playing SPT-AKI", // Replace with your game
//         startTimestamp: new Date(),
//         largeImageKey: 'https://dev.sp-tarkov.com/repo-avatars/661-81e984da30db7c62b13db369993fcb3f', // Replace with your image key
//         largeImageText: 'SPT-AKI', // Replace with your text
//         smallImageKey: `${imgUrl}`, // Replace with your small image key
//         smallImageText: `${side.toUpperCase()}`, // Replace with your small image text
//         instance: false,
//         });
//     });

//     const loginAttempts = 5;
//     let attempts = 0;
//         const login = () => {
//         client.login({ clientId }).catch((error) => {
//             console.error(error);
//             attempts++;
//             if (attempts < loginAttempts) {
//                 console.log(`Attempt ${attempts} failed. Retrying...`);
//                 setTimeout(login, 5000); // Retry after 5 seconds
//             } else {
//                 console.log("Failed to connect to Discord RPC after multiple attempts.");
//             }
//         });
//     };

//     login();
// } else {
//     console.log("Discord RPC is not specified.");
// }