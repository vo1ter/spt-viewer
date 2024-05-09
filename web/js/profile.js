let socketIp, socketPort;

function calculateColor(value, maxValue) {
    const maxRed = 0; // The red value at the highest value
    const maxGreen = 200; // The green value at the highest value
    const maxBlue = 0; // The blue value at the highest value
    const minRed = 255; // The red value at the lowest value
    const minGreen = 0; // The green value at the lowest value
    const minBlue = 0; // The blue value at the lowest value

    const red = Math.round(((maxRed - minRed) * (value - 0)) / (maxValue - 0)) + minRed;
    const green = Math.round(((maxGreen - minGreen) * (value - 0)) / (maxValue - 0)) + minGreen;
    const blue = Math.round(((maxBlue - minBlue) * (value - 0)) / (maxValue - 0)) + minBlue;

    return `rgb(${red}, ${green}, ${blue})`;
}

async function traderTemplate(data) {
    let template = ""
    
    for(const [key, value] of Object.entries(data)) {
        // if (key == "Unknown Trader") continue;
        let money = "₽";

        if (key == "Peacekeeper") money = "$";
        template += `
        <div class="template-background">
            <p>${key}</p>
            <p><img src="./img/traders/${value.traderId}.png" /></p>
            Trader LVL: ${value.traderLevel}<br>
            Trader reputation: ${value.reputation}<br>
            Trader total sales: ${money}${formatNumber(value.salesSum)}<br>
        </div>
        `
    }
    return `
    ${template}
    `
}

async function questTemplate(data) {
    let template = ""
    for(const [key, value] of Object.entries(data)) {
        if (value.title == null) continue;
        let date = new Date(value.startTime * 1000);
        let dateString = date.toLocaleString("en-GB", {timeZone: "Europe/London"});
        let timings = ""
        for(const [timingKey, timingValue] of Object.entries(value.statusTimers)) {
            let date = new Date(timingValue * 1000);
            let dateString = date.toLocaleString("en-GB", {timeZone: "Europe/London"});
            timings += `${timingKey}: ${dateString}<br>`
        }
        let questImg = await fetch(`img/quests/get/${key}`).then(async (res) => {
            return await res.text()
        });
        let background = value.status == 
        "Finished" ? "background-color: #074e23;" : value.status == 
        "Awaiting confirmation" ? "background-color: #0d9142;" : value.status == 
        "In progress" ? "background-color: #4e4307;" : "background-color: #0000ff;"
        template += `
        <div class="template-background" style="${background}">
            <div>
                <img src="./img/quests/${questImg}" />
            </div>
            <div>
                <p>${value.title ? value.title : key}</p><br>
                <a href="https://escapefromtarkov.fandom.com/wiki/${value.title}" style="text-decoration: underline;">Wiki Page</a>
                <p>Start time: ${dateString}</p>
                <p>Quest status: ${value.status}</p>
                <p>Status timings:<br>${timings}</p>
            </div>
        </div>
        `
    }
    return `
    ${template}
    `
}

async function loadTraders(profileId, state) {
    let button = document.querySelector("#traderButton");
    if(state == 0) {
        const data = await fetch(`http://${socketIp}:${socketPort}/profiles/get/traders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profileId: profileId
            })
        })
        .then(async (response) => {
            return await response.json()
        })
        .catch(error => {
            console.error('Error:', error);
        });
        
        button.setAttribute("onClick", `loadTraders('${profileId}', 1)`)
        button.innerHTML = `Unload ${button.innerHTML.split(" ")[1]}`
        return document.querySelector(".profile-info").innerHTML += `<div id="traders" class="grid-container">${await traderTemplate(data)}</div>`;
    }
    else if(state == 1) {
        button.setAttribute("onClick", `loadTraders('${profileId}', 0)`)
        button.innerHTML = `Load ${button.innerHTML.split(" ")[1]}`
        return document.querySelector("#traders").remove();
    }
}

async function loadQuests(profileId, state) {
    let button = document.querySelector("#questButton");
    if(state == 0) {
        const data = await fetch(`http://${socketIp}:${socketPort}/profiles/get/quests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                profileId: profileId
            })
        })
        .then(async (response) => {
            return await response.json()
        })
        .catch(error => {
            console.error('Error:', error);
        });

        button.setAttribute("onClick", `loadQuests('${profileId}', 1)`)
        button.innerHTML = `Unload ${button.innerHTML.split(" ")[1]}`
        return document.querySelector(".profile-info").innerHTML += `<div id="quests" class="grid-container">${await questTemplate(data)}</div>`;
    }
    else {
        button.setAttribute("onClick", `loadQuests('${profileId}', 0)`)
        button.innerHTML = `Load ${button.innerHTML.split(" ")[1]}`
        return document.querySelector("#quests").remove();
    }
}

async function loadProfile(data) {
    let date = new Date(data.PMCInfo.lastSession * 1000);
    let dateString = date.toLocaleString("en-GB", {timeZone: "Europe/London"});
    // style="align-items: center; justify-content: center; text-align center:"
    return document.querySelector(".container").innerHTML += `
    <div class="profile">
        <div class="profile-info">
            <p style="display: flex; justify-content: center;">
                <img draggable="false" src="./img/ranks/rank${Math.floor(data.PMCInfo.level / 5) * 5}.png"/>
            </p>
            <p>Profile name: ${data.profileInfo.profileName}</p>
            <p>Profile ID: ${data.profileInfo.profileId}</p>
            <p>Package: ${data.profileInfo.profilePackage}</p>
            <p>Last Session: ${dateString}</p>
            <p></p>
            <h2>PMC Stats</h2>
            <p>Side: ${data.PMCInfo.side}</p>
            <p>Exprerience: ${data.PMCInfo.experience}</p>
            <p>Level: ${data.PMCInfo.level}</p>
            <p>Hydration: ${data.PMCInfo.health.hydration}</p>
            <p>Energy: ${data.PMCInfo.health.energy}</p>
            <h3>Health</h3>
            <div class="health-container">
                <div class="health-row">
                    <div class="progress" style="background-color: ${calculateColor((data.PMCInfo.health.body.head).split("/")[0], (data.PMCInfo.health.body.head).split("/")[1])}">
                        <p>${data.PMCInfo.health.body.head.split("/")[0]} / ${data.PMCInfo.health.body.head.split("/")[1]}</p>
                    </div>
                </div>
                <div class="health-row">
                    <div class="progress" style="background-color: ${calculateColor((data.PMCInfo.health.body.chest).split("/")[0], (data.PMCInfo.health.body.chest).split("/")[1])}; margin-right: 1em">
                        <p>${data.PMCInfo.health.body.chest}</p>
                    </div>
                    <div class="progress" style="background-color: ${calculateColor((data.PMCInfo.health.body.stomach).split("/")[0], (data.PMCInfo.health.body.stomach).split("/")[1])}">
                        <p>${data.PMCInfo.health.body.stomach}</p>
                    </div>
                    <div class="progress" style="background-color: ${calculateColor((data.PMCInfo.health.body.leftArm).split("/")[0], (data.PMCInfo.health.body.leftArm).split("/")[1])}; margin-left: 1em">
                        <p>${data.PMCInfo.health.body.leftArm}</p>
                    </div>
                </div>
                <div class="health-row">
                    <div class="progress" style="background-color: ${calculateColor((data.PMCInfo.health.body.rightArm).split("/")[0], (data.PMCInfo.health.body.rightArm).split("/")[1])}">
                        <p>${data.PMCInfo.health.body.rightArm}</p>
                    </div>
                </div>
                <div class="health-row">
                    <div class="progress" style="background-color: ${calculateColor((data.PMCInfo.health.body.leftLeg).split("/")[0], (data.PMCInfo.health.body.leftLeg).split("/")[1])}; margin-right: 1em">
                        <p>${data.PMCInfo.health.body.leftLeg}</p>
                    </div>
                    <div class="progress" style="background-color: ${calculateColor((data.PMCInfo.health.body.rightLeg).split("/")[0], (data.PMCInfo.health.body.rightLeg).split("/")[1])}; margin-left: 1em">
                        <p>${data.PMCInfo.health.body.rightLeg}</p>
                    </div>
                </div>
            </div>
            <div>
            <h3>Traders info</h3>
            <div class="profile-info horizontal">
                <div class="button" id="traderButton" onclick="loadTraders('${data.profileInfo.profileId}', 0)" style="width: 100%;">Load traders</div>
                <div class="button" id="questButton" onclick="loadQuests('${data.profileInfo.profileId}', 0)" style="width: 100%;">Load quests</div>
            </div>
        </div>
    </div>`
}


/*
<div class="grid-container">
    ${await traderTemplate(data.tradersInfo)}
</div>
<div class="grid-container">
    ${await questTemplate(data.PMCInfo.quests)}
</div>
*/
(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.size > 0) {
        fetch('./config.json')
        .then(response => response.json())
        .then(async (CONFIG) => {
            socketIp = CONFIG.ip;
            socketPort = CONFIG.port;
            if(!urlParams.get('profileId')) return window.location.href = './index.html';
            const data = await fetch(`http://${socketIp}:${socketPort}/profiles/get`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    profileId: urlParams.get('profileId')
                })
            })
            .then(async (response) => {
                return await response.json()
            })
            .catch(error => {
                console.error('Error:', error);
            });

            return loadProfile(data);
        })
    } else {
        return window.location.href = './index.html';
    }
})();