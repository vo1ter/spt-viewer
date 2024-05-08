function popualteProfiles(profiles) {
    let profilesContainer = document.querySelector(".profiles");

    for (const [key, value] of Object.entries(profiles)) {
        let date = new Date(value.PMCInfo.lastSession * 1000);
        let dateString = date.toLocaleString("en-GB", {timeZone: "Europe/London"});
        let imageNumber = hashString(value.profileInfo.profileId) % 146 + 1;
        profilesContainer.innerHTML += `
            <a href="profile.html?profileId=${value.profileInfo.profileId}" class="profile" draggable="false" style="background-image: url(img/background-images/${imageNumber}.png);">
                <div class="profile-info" style="flex-direction:row;">
                    <img draggable="false" class="user_img" src="./img/side_${String(value.PMCInfo.side).toLowerCase()}.png" alt="" height="20px" width="20px">
                    <div style="text-shadow: 2px 2px 5px black;">
                        <p>Profile name: ${value.profileInfo.profileName} </p>
                        <p>Profile ID: ${value.profileInfo.profileId} </p>
                        <p>Last Session: ${dateString}</p>
                    </div>
                </div>
            </a>`
    }
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += str.charCodeAt(i);
    }
    return hash;
}

fetch('./config.json')
    .then(response => response.json())
    .then(CONFIG => {
    fetch(`http://${CONFIG.ip}:${CONFIG.port}/profiles/get/everyone`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        })
    })
    .then(response => response.json())
    .then(data => 
        popualteProfiles(data))
    .catch(error => console.error('Error:', error));
    })
    .catch(error => console.error('Error:', error));