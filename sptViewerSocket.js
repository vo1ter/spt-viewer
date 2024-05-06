const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const sptAkiHttpConfig = require('../Aki_Data/Server/configs/http.json');
const questsDB = require('./quests.json');

const app = express();
const port = 1337;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});


async function getItemById(itemId) {
    const response = await fetch(`https://db.sp-tarkov.com/api/item?id=${itemId}&locale=en`);

    const data = await response.json();
    return data;
}

async function getProfileInfo(profileId, origin) {
    const filePath = `../user/profiles/${profileId}.json`;
    const fileContent = fs.readFileSync(filePath);
    const info = JSON.parse(fileContent);

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
            }
        };
    }

    const tradersInfo = {};
    for (const traderId in info.characters.pmc.TradersInfo) {
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
            default:
                traderName = 'Unknown Trader';
        }
        tradersInfo[traderName] = {
            traderId: traderId,
            traderLevel: info.characters.pmc.TradersInfo[traderId].loyaltyLevel,
            reputation: info.characters.pmc.TradersInfo[traderId].standing,
            salesSum: info.characters.pmc.TradersInfo[traderId].salesSum,
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

    const quests = {}

    await Promise.all(killPromises);

    await info.characters.pmc.Quests.forEach(async (quest) => {
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
                    timerStatus = "Started";
                    break;
                case "2":
                    timerStatus = "In progress";
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

        quests[quest.qid] = {
            title: questsDB[quest.qid],
            startTime: quest.startTime,
            status: questStatus,
            statusTimers: timers
        };
    })

    return {
        profileInfo: {
            profileId: info.info.id,
            profileName: info.info.username,
            profilePackage: String(info.characters.pmc.Info.GameVersion).replaceAll("_", " ").toUpperCase()
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
            quests
        },
        SCAVInfo: {
            experience: info.characters.scav.Info.Experience,
            level: info.characters.scav.Info.Level,
            scavName: info.characters.scav.Info.Nickname,

        },
        tradersInfo: tradersInfo,
        lastRaid: {
            sessionDate: Math.max(info.characters.pmc.Stats.Eft.LastSessionDate, info.characters.scav.Stats.Eft.LastSessionDate),
            kills
        }
    };
}

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


app.listen(port, sptAkiHttpConfig.ip, () => { // config.IP_ADDRESS
    console.log(`Server is running on http://${sptAkiHttpConfig.ip}:${port}`);
});