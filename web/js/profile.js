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
        template += `
        <div>
            ${key}<br><br>
            Trader LVL: ${value.traderLevel}<br>
            Trader reputation: ${value.reputation}<br>
            Trader total sales: ${value.salesSum}<br>
        </div>
        `
    }
    return `
    ${template}
    `
}

// TODO: Make quests and traders expandable by user (request should only be made after it's container is expanded)
// TODO: Add mastering lvl. Also make those containers more pleaseful for the eye.

async function questTemplate(data) {
    let template = ""
    for(const [key, value] of Object.entries(data)) {
        let date = new Date(value.startTime * 1000);
        let dateString = date.toLocaleString("en-GB", {timeZone: "Europe/London"});
        let timings = ""
        for(const [timingKey, timingValue] of Object.entries(value.statusTimers)) {
            let date = new Date(timingValue * 1000);
            let dateString = date.toLocaleString("en-GB", {timeZone: "Europe/London"});
            timings += `${timingKey}: ${dateString}<br>`
        }
        template += `
        <div>
            ${value.title ? value.title : key}<br><br>
            Start time: ${dateString}<br>
            Quest status: ${value.status}<br>
            Status timings:<br>${timings}
        </div>
        `
    }
    return `
    ${template}
    `
}

async function loadProfile(data) {
    let date = new Date(data.PMCInfo.lastSession * 1000);
    let dateString = date.toLocaleString("en-GB", {timeZone: "Europe/London"});
    // style="align-items: center; justify-content: center; text-align center:"
    document.querySelector(".container").innerHTML += `<div class="profile">
        <div class="profile-info">
        <a style="display: flex; justify-content: center;"><img draggable="false" class="user_img" style="margin: 0;" src="./img/side_${String(data.PMCInfo.side).toLowerCase()}.png" alt="" height="20px" width="20px"></a>
        Profile name: ${data.profileInfo.profileName} <br>
        Profile ID: ${data.profileInfo.profileId} <br>
        Package: ${data.profileInfo.profilePackage} <br>
        Last Session: ${dateString} <br><br>
        <h2>PMC Stats</h2>
        Side: ${data.PMCInfo.side} <br>
        Exprerience: ${data.PMCInfo.experience} <br>
        Level: ${data.PMCInfo.level} <br>
        Hydration: ${data.PMCInfo.health.hydration} <br>
        Energy: ${data.PMCInfo.health.energy} <br>
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
        <div class="grid-container">
            ${await traderTemplate(data.tradersInfo)}
        </div>
        <div class="grid-container">
            ${await questTemplate(data.PMCInfo.quests)}
        </div>
        </div>
    </div>`
}

(async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.size > 0) {
        fetch('./config.json')
        .then(response => response.json())
        .then(async (CONFIG) => {
            if(!urlParams.get('profileId')) return window.location.href = './index.html';
            const data = await fetch(`http://${CONFIG.ip}:${CONFIG.port}/profiles/get`, {
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